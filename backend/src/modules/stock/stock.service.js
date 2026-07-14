const { query, transaction } = require('../../config/db');
const ROLES = require('../../constants/roles');
const ApiError = require('../../utils/apiError');

async function listItems() {
  return query(
    `SELECT id, sku, name, unit, monthly_quota_per_person AS monthlyQuotaPerPerson, status
     FROM ration_items
     ORDER BY name`
  );
}

async function createItem(payload) {
  const result = await query(
    `INSERT INTO ration_items (sku, name, unit, monthly_quota_per_person, status)
     VALUES (?, ?, ?, ?, ?)`,
    [payload.sku, payload.name, payload.unit, payload.monthlyQuotaPerPerson || 0, payload.status || 'active']
  );
  const rows = await query('SELECT * FROM ration_items WHERE id = ?', [result.insertId]);
  return rows[0];
}

function resolveShopId(actor, requestedShopId) {
  if (actor.role === ROLES.SHOP_OWNER) return actor.shopId;
  if (actor.role === ROLES.BENEFICIARY) return actor.shopId;
  return requestedShopId || null;
}

async function listStock(actor, requestedShopId) {
  const shopId = resolveShopId(actor, requestedShopId);
  const where = [];
  const params = [];

  if (shopId) {
    where.push('st.shop_id = ?');
    params.push(shopId);
  }

  return query(
    `SELECT st.id, st.shop_id AS shopId, s.name AS shopName, st.item_id AS itemId,
      ri.name AS itemName, ri.sku, ri.unit, st.quantity, st.reorder_level AS reorderLevel,
      CASE WHEN st.quantity <= st.reorder_level THEN 1 ELSE 0 END AS isLowStock,
      st.updated_at AS updatedAt
     FROM stock st
     JOIN shops s ON s.id = st.shop_id
     JOIN ration_items ri ON ri.id = st.item_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY s.name, ri.name`,
    params
  );
}

async function upsertStock(payload, actor) {
  if (actor.role !== ROLES.SHOP_OWNER) {
    throw new ApiError(403, 'Only shop owners can update shop stock.');
  }

  const shopId = actor.shopId;
  if (!shopId) throw new ApiError(422, 'Your account is not assigned to a shop.');

  const stockId = await transaction(async (connection) => {
    await connection.execute(
      `INSERT INTO stock (shop_id, item_id, quantity, reorder_level, updated_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        quantity = VALUES(quantity),
        reorder_level = VALUES(reorder_level),
        updated_by = VALUES(updated_by)`,
      [shopId, payload.itemId, payload.quantity, payload.reorderLevel || 0, actor.id]
    );

    const [rows] = await connection.execute(
      'SELECT id FROM stock WHERE shop_id = ? AND item_id = ? LIMIT 1',
      [shopId, payload.itemId]
    );

    await connection.execute(
      `INSERT INTO stock_movements
        (stock_id, movement_type, quantity, reference_type, note, created_by)
       VALUES (?, 'adjustment', ?, 'manual', ?, ?)`,
      [rows[0].id, payload.quantity, payload.note || 'Stock upsert', actor.id]
    );

    return rows[0].id;
  });

  const rows = await listStock({ role: ROLES.ADMIN }, shopId);
  return rows.find((row) => row.id === stockId);
}

async function updateStock(id, payload, actor) {
  if (actor.role !== ROLES.SHOP_OWNER) {
    throw new ApiError(403, 'Only shop owners can update shop stock.');
  }

  const rows = await query('SELECT * FROM stock WHERE id = ? LIMIT 1', [id]);
  if (!rows.length) throw new ApiError(404, 'Stock item not found.');
  if (rows[0].shop_id !== actor.shopId) {
    throw new ApiError(403, 'Cannot update stock outside your shop.');
  }

  await transaction(async (connection) => {
    await connection.execute(
      'UPDATE stock SET quantity = ?, reorder_level = ?, updated_by = ? WHERE id = ?',
      [payload.quantity, payload.reorderLevel ?? rows[0].reorder_level, actor.id, id]
    );

    await connection.execute(
      `INSERT INTO stock_movements
        (stock_id, movement_type, quantity, reference_type, note, created_by)
       VALUES (?, 'adjustment', ?, 'manual', ?, ?)`,
      [id, payload.quantity, payload.note || 'Manual stock adjustment', actor.id]
    );
  });

  const updated = await listStock({ role: ROLES.ADMIN }, rows[0].shop_id);
  return updated.find((row) => row.id === id);
}

module.exports = { listItems, createItem, listStock, upsertStock, updateStock };
