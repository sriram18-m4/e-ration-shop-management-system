const env = require('../../config/env');
const logger = require('../../utils/logger');
const { buildChatContext } = require('./chat.context');

const CHAT_SYSTEM_PROMPT = [
  'You are the E-Ration assistant inside a ration shop management system.',
  'Answer only from the JSON context provided by the backend.',
  'Respect the user role and never claim access to data outside the context.',
  'Keep answers short, practical, and clear.',
  'If the user asks to change data, explain the exact screen or action they should use instead of pretending to modify records.',
  'If the context does not contain the answer, say that the data is not available in this workspace.'
].join(' ');

function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

function listStockRows(rows) {
  if (!rows.length) return 'No stock records are available for your account.';
  return rows
    .slice(0, 8)
    .map((row) => `${row.itemName} at ${row.shopName}: ${formatNumber(row.quantity)} ${row.unit}`)
    .join('\n');
}

function listTransactions(rows) {
  if (!rows.length) return 'No ration distribution transactions are available yet.';
  return rows
    .slice(0, 6)
    .map((row) => `${row.transactionNo}: ${row.beneficiaryName}, ${formatNumber(row.totalUnits)} units, ${new Date(row.issuedAt).toLocaleString()}`)
    .join('\n');
}

function localAssistantReply(message, context) {
  const text = message.toLowerCase();
  const lowStock = context.stock.filter((row) => Number(row.isLowStock));
  const beneficiary = context.beneficiaries[0];
  const shop = context.shops[0];

  if (text.includes('low') || text.includes('shortage') || text.includes('reorder')) {
    if (!lowStock.length) return 'No low-stock items are currently visible for your account.';
    return `Low-stock items:\n${listStockRows(lowStock)}`;
  }

  if (text.includes('stock') || text.includes('available') || text.includes('inventory')) {
    return `Current visible stock:\n${listStockRows(context.stock)}`;
  }

  if (text.includes('transaction') || text.includes('history') || text.includes('issued') || text.includes('distribution')) {
    return `Recent ration transactions:\n${listTransactions(context.transactions)}`;
  }

  if (text.includes('beneficiar') || text.includes('ration card')) {
    if (context.user.role === 'beneficiary' && beneficiary) {
      return `Your ration card ${beneficiary.rationCardNumber} is ${beneficiary.status}. Family size: ${beneficiary.familySize}. Monthly entitlement: ${formatNumber(beneficiary.monthlyEntitlementKg)} kg.`;
    }
    return `You can access ${context.summary.totalBeneficiaries} beneficiary record(s). Open Beneficiaries to add, update, or view full records.`;
  }

  if (text.includes('eligible') || text.includes('entitlement') || text.includes('quota')) {
    if (!beneficiary) return 'No beneficiary entitlement record is available for your account.';
    return `Monthly entitlement for ${beneficiary.fullName}: ${formatNumber(beneficiary.monthlyEntitlementKg)} kg. Family size: ${beneficiary.familySize}.`;
  }

  if (text.includes('shop') || text.includes('address')) {
    if (!shop) return 'No shop record is linked to your account yet.';
    return `${shop.name} (${shop.code}) is in ${shop.district || 'district not set'}. Address: ${shop.address || 'not set'}. Contact: ${shop.contactPhone || 'not set'}.`;
  }

  if (text.includes('help')) {
    return 'You can ask about stock, low-stock items, beneficiary records, ration card status, entitlement, shop details, and recent transactions.';
  }

  return `Summary: ${formatNumber(context.summary.totalStock)} stock units, ${context.summary.lowStockCount} low-stock item(s), ${context.summary.totalBeneficiaries} beneficiary record(s), and ${context.summary.totalTransactions} transaction(s) are visible to your role.`;
}

function buildSuggestions(context) {
  const suggestions = ['Show low stock items', 'Show recent transactions'];

  if (context.user.role === 'beneficiary') {
    suggestions.push('What is my ration card status?');
    suggestions.push('What is my entitlement?');
  } else {
    suggestions.push('How many beneficiaries are registered?');
    suggestions.push('Show stock summary');
  }

  return suggestions.slice(0, 4);
}

function normalizeHistory(history = []) {
  return history
    .filter((item) => ['user', 'assistant'].includes(item.role) && item.content)
    .slice(-6)
    .map((item) => ({ role: item.role, content: String(item.content).slice(0, 800) }));
}

function extractGeminiText(data) {
  return data.candidates
    ?.flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

async function callGemini(message, context, history) {
  if (!env.geminiApiKey) return null;

  const contents = [
    ...normalizeHistory(history).map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }]
    })),
    {
      role: 'user',
      parts: [
        {
          text: `Context JSON:\n${JSON.stringify(context)}\n\nUser question:\n${message}`
        }
      ]
    }
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.geminiApiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: CHAT_SYSTEM_PROMPT }]
        },
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 500
        }
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed with ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return extractGeminiText(data);
}

async function callOpenAI(message, context, history) {
  if (!env.openaiApiKey) return null;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.openaiModel,
      input: [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        ...normalizeHistory(history),
        {
          role: 'user',
          content: `Context JSON:\n${JSON.stringify(context)}\n\nUser question:\n${message}`
        }
      ],
      max_output_tokens: 500
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed with ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.output_text || data.output?.[0]?.content?.[0]?.text || null;
}

async function askChatbot(message, actor, history = []) {
  const context = await buildChatContext(actor);
  let reply = null;
  let mode = 'local';

  try {
    reply = await callGemini(message, context, history);
    if (reply) mode = 'gemini';
  } catch (error) {
    logger.warn(`Gemini chatbot fallback used: ${error.message}`);
  }

  if (!reply) {
    try {
      reply = await callOpenAI(message, context, history);
      if (reply) mode = 'openai';
    } catch (error) {
      logger.warn(`OpenAI chatbot fallback used: ${error.message}`);
    }
  }

  if (!reply) {
    reply = localAssistantReply(message, context);
  }

  return {
    reply,
    mode,
    suggestions: buildSuggestions(context)
  };
}

module.exports = { askChatbot };
