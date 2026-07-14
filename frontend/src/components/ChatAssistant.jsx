import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const initialMessage = {
  role: 'assistant',
  content: 'Hi. What would you like to check?'
};

function MessageText({ content }) {
  return String(content)
    .split('\n')
    .map((line, index) => (
      <span key={`${line}-${index}`}>
        {line}
        {index < String(content).split('\n').length - 1 && <br />}
      </span>
    ));
}

export default function ChatAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([
    'Show low stock items',
    user.role === 'beneficiary' ? 'What is my ration card status?' : 'Show stock summary'
  ]);
  const inputRef = useRef(null);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(nextMessage) {
    const cleanMessage = nextMessage.trim();
    if (!cleanMessage || loading) return;

    const nextMessages = [...messages, { role: 'user', content: cleanMessage }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const history = nextMessages.slice(-8).map(({ role, content }) => ({ role, content }));
      const response = await api.post('/chat', { message: cleanMessage, history });
      setMessages((current) => [...current, { role: 'assistant', content: response.data.data.reply }]);
      setSuggestions(response.data.data.suggestions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="chat-assistant">
      {isOpen && (
        <section className="chat-window" aria-label="AI assistant">
          <header className="chat-header">
            <div>
              <Bot size={18} />
              <strong>Ration Assistant</strong>
            </div>
            <button className="chat-icon-button" type="button" title="Close assistant" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </header>

          <div className="chat-messages" ref={messagesRef} aria-live="polite">
            {messages.map((message, index) => (
              <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
                <MessageText content={message.content} />
              </div>
            ))}
            {loading && <div className="chat-message assistant">Checking...</div>}
          </div>

          {error && <div className="chat-error">{error}</div>}

          <div className="chat-suggestions">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question"
              maxLength="800"
            />
            <button className="chat-send-button" type="submit" title="Send message" disabled={loading}>
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      <button className="chat-launcher" type="button" title="Open assistant" onClick={() => setIsOpen((current) => !current)}>
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
