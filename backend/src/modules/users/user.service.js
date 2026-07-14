const bcrypt = require('bcryptjs');
const { query } = require('../../config/db');
const ApiError = require('../../utils/apiError');

const baseSelect = `
  SELECT u.id, u.full_name AS fullName, u.email, u.phone, u.role,
    u.shop_id AS shopId, s.name AS shopName, u.ration_card_number AS rationCardNumber,
    u.aadhaar_last4 AS aadhaarLast4, u.status, u.created_at AS createdAt
  FROM users u
  LEFT JOIN shops s ON s.id = u.shop_id
`;

async function listUsers(filters = {}, actor) {
  const where = [];
  const params = [];

  if (filters.role) {
    where.push('u.role = ?');
    params.push(filters.role);
  }

  if (actor.role === 'shop_owner') {
    where.push('u.shop_id = ?');
    params.push(actor.shopId);
  }

  const sql = `${baseSelect}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY u.created_at DESC`;
  return query(sql, params);
}

async function getUserById(id, actor) {
  const rows = await query(`${baseSelect} WHERE u.id = ? LIMIT 1`, [id]);
  if (!rows.length) throw new ApiError(404, 'User not found.');
  if (actor.role === 'shop_owner' && rows[0].shopId !== actor.shopId) {
    throw new ApiError(403, 'Cannot access users outside your shop.');
  }
  return rows[0];
}

async function createUser(payload) {
  const passwordHash = await bcrypt.hash(payload.password, 12);
  try {
    const result = await query(
      `INSERT INTO users
        (full_name, email, phone, password_hash, role, shop_id, ration_card_number, aadhaar_last4, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.fullName,
        payload.email,
        payload.phone || null,
        passwordHash,
        payload.role,
        payload.shopId || null,
        payload.rationCardNumber || null,
        payload.aadhaarLast4 || null,
        payload.status || 'active'
      ]
    );
    return getUserById(result.insertId, { role: 'admin' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const field = String(error.message).includes('ration_card_number') ? 'ration card number' : 'email address';
      throw new ApiError(409, `A user with this ${field} already exists.`);
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ApiError(422, 'The selected shop does not exist.');
    }
    throw error;
  }
}

async function updateUser(id, payload) {
  const existing = await getUserById(id, { role: 'admin' });
  const next = { ...existing, ...payload };

  await query(
    `UPDATE users
     SET full_name = ?, email = ?, phone = ?, role = ?, shop_id = ?,
      ration_card_number = ?, aadhaar_last4 = ?, status = ?
     WHERE id = ?`,
    [
      next.fullName,
      next.email,
      next.phone || null,
      next.role,
      next.shopId || null,
      next.rationCardNumber || null,
      next.aadhaarLast4 || null,
      next.status,
      id
    ]
  );

  return getUserById(id, { role: 'admin' });
}

async function deactivateUser(id) {
  await getUserById(id, { role: 'admin' });
  await query('UPDATE users SET status = ? WHERE id = ?', ['inactive', id]);
}

module.exports = { listUsers, getUserById, createUser, updateUser, deactivateUser };
