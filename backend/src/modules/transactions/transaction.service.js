const { query, transaction } = require('../../config/db');
const ROLES = require('../../constants/roles');
const ApiError = require('../../utils/apiError');

const transactionSelect = `
  SELECT t.id, t.transaction_no AS transactionNo, t.beneficiary_id AS beneficiaryId,
    b.full_name AS beneficiaryName, b.ration_card_number AS rationCardNumber,
    t.shop_id AS shopId, s.name AS shopName, t.status, t.total_units AS totalUnits,
    t.remarks, t.issued_by AS issuedBy, issuer.full_name AS issuedByName,
    t.issued_at AS issuedAt
  FROM transactions t
  JOIN users b ON b.id = t.beneficiary_id
  JOIN shops s ON s.id = t.shop_id
  LEFT JOIN users issuer ON issuer.id = t.issued_by
`;

function buildTransactionScope(actor) {
  if (actor.role === ROLES.ADMIN) return { where: [], params: [] };
  if (actor.role === ROLES.SHOP_OWNER) return { where: ['t.shop_id = ?'], params: [actor.shopId] };
  return { where: ['t.beneficiary_id = ?'], params: [actor.id] };
}

async function listTransactions(actor) {
  const scope = buildTransactionScope(actor);
  const whereSql = scope.where.length ? ` WHERE ${scope.where.join(' AND ')}` : '';
  return query(`${transactionSelect}${whereSql} ORDER BY t.issued_at DESC LIMIT 100`, scope.params);
}

async function getTransactionById(id, actor) {
  const scope = buildTransactionScope(actor);
  scope.where.unshift('t.id = ?');
  scope.params.unshift(id);

  const rows = await query(`${transactionSelect} WHERE ${scope.where.join(' AND ')} LIMIT 1`, scope.params);
  if (!rows.length) throw new ApiError(404, 'Transaction not found.');

  const items = await query(
    `SELECT ti.item_id AS itemId, ri.name AS itemName, ti.quantity, ti.unit
     FROM transaction_items ti
     JOIN ration_items ri ON ri.id = ti.item_id
     WHERE ti.transaction_id = ?
     ORDER BY ri.name`,
    [id]
  );

  return { ...rows[0], items };
}

function monthStart(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

async function createTransaction(payload, actor) {
  if (actor.role !== ROLES.SHOP_OWNER) {
    throw new ApiError(403, 'Only shop owners can issue ration.');
  }

  const shopId = actor.shopId;
  if (!shopId) throw new ApiError(422, 'Your account is not assigned to a shop.');
  const normalizedItems = Array.from(
    payload.items
      .reduce((items, item) => {
        const current = items.get(item.itemId) || 0;
        items.set(item.itemId, current + Number(item.quantity));
        return items;
      }, new Map())
      .entries()
  ).map(([itemId, quantity]) => ({ itemId, quantity }));

  const beneficiaryRows = await query(
    `SELECT id, shop_id AS shopId, status
     FROM users
     WHERE id = ? AND role = 'beneficiary'
     LIMIT 1`,
    [payload.beneficiaryId]
  );

  if (!beneficiaryRows.length || beneficiaryRows[0].status !== 'active') {
    throw new ApiError(404, 'Active beneficiary not found.');
  }

  if (beneficiaryRows[0].shopId !== actor.shopId) {
    throw new ApiError(403, 'Beneficiary is not assigned to your shop.');
  }

  const transactionId = await transaction(async (connection) => {
    const itemIds = normalizedItems.map((item) => item.itemId);
    const placeholders = itemIds.map(() => '?').join(', ');
    const [stockRows] = await connection.execute(
      `SELECT st.id, st.item_id AS itemId, st.quantity, ri.unit
       FROM stock st
       JOIN ration_items ri ON ri.id = st.item_id
       WHERE st.shop_id = ? AND st.item_id IN (${placeholders})
       FOR UPDATE`,
      [shopId, ...itemIds]
    );

    const stockByItem = new Map(stockRows.map((row) => [row.itemId, row]));
    for (const item of normalizedItems) {
      const stock = stockByItem.get(item.itemId);
      if (!stock) throw new ApiError(422, `Stock is not configured for item ${item.itemId}.`);
      if (Number(stock.quantity) < Number(item.quantity)) {
        throw new ApiError(409, `Insufficient stock for item ${item.itemId}.`);
      }
    }

    const transactionNo = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const totalUnits = normalizedItems.reduce((sum, item) => sum + Number(item.quantity), 0);
    const [txResult] = await connection.execute(
      `INSERT INTO transactions
        (transaction_no, beneficiary_id, shop_id, status, total_units, remarks, issued_by)
       VALUES (?, ?, ?, 'issued', ?, ?, ?)`,
      [transactionNo, payload.beneficiaryId, shopId, totalUnits, payload.remarks || null, actor.id]
    );

    for (const item of normalizedItems) {
      const stock = stockByItem.get(item.itemId);
      await connection.execute(
        `INSERT INTO transaction_items (transaction_id, item_id, quantity, unit)
         VALUES (?, ?, ?, ?)`,
        [txResult.insertId, item.itemId, item.quantity, stock.unit]
      );

      await connection.execute(
        'UPDATE stock SET quantity = quantity - ?, updated_by = ? WHERE id = ?',
        [item.quantity, actor.id, stock.id]
      );

      await connection.execute(
        `INSERT INTO stock_movements
          (stock_id, movement_type, quantity, reference_type, reference_id, note, created_by)
         VALUES (?, 'out', ?, 'transaction', ?, 'Ration issued', ?)`,
        [stock.id, item.quantity, txResult.insertId, actor.id]
      );

      await connection.execute(
        `INSERT INTO allocations
          (beneficiary_id, item_id, month_year, entitlement_quantity, issued_quantity, status)
         VALUES (?, ?, ?, 0, ?, 'partially_issued')
         ON DUPLICATE KEY UPDATE
          issued_quantity = issued_quantity + VALUES(issued_quantity),
          status = 'partially_issued'`,
        [payload.beneficiaryId, item.itemId, monthStart(), item.quantity]
      );
    }

    return txResult.insertId;
  });

  return getTransactionById(transactionId, actor);
}

module.exports = { listTransactions, getTransactionById, createTransaction };
