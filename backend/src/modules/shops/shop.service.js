const { query } = require('../../config/db');
const ApiError = require('../../utils/apiError');

async function listShops(actor) {
  if (actor.role === 'shop_owner') {
    return query('SELECT * FROM shops WHERE id = ? ORDER BY name', [actor.shopId]);
  }
  return query('SELECT * FROM shops ORDER BY name');
}

async function createShop(payload) {
  const result = await query(
    `INSERT INTO shops (code, name, address, district, contact_phone, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      payload.code,
      payload.name,
      payload.address || null,
      payload.district || null,
      payload.contactPhone || null,
      payload.status || 'active'
    ]
  );
  return getShopById(result.insertId);
}

async function getShopById(id) {
  const rows = await query('SELECT * FROM shops WHERE id = ? LIMIT 1', [id]);
  if (!rows.length) throw new ApiError(404, 'Shop not found.');
  return rows[0];
}

async function updateShop(id, payload) {
  const existing = await getShopById(id);
  const next = { ...existing, ...payload };
  await query(
    `UPDATE shops SET code = ?, name = ?, address = ?, district = ?, contact_phone = ?, status = ?
     WHERE id = ?`,
    [
      next.code,
      next.name,
      next.address || null,
      next.district || null,
      next.contactPhone || next.contact_phone || null,
      next.status,
      id
    ]
  );
  return getShopById(id);
}

module.exports = { listShops, createShop, updateShop, getShopById };

