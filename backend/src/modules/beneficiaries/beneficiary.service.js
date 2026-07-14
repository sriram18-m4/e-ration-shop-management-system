const bcrypt = require('bcryptjs');
const { query, transaction } = require('../../config/db');
const ROLES = require('../../constants/roles');
const ApiError = require('../../utils/apiError');

const beneficiarySelect = `
  SELECT u.id, u.full_name AS fullName, u.email, u.phone, u.role,
    u.shop_id AS shopId, s.name AS shopName, u.ration_card_number AS rationCardNumber,
    u.aadhaar_last4 AS aadhaarLast4, u.status,
    bp.family_size AS familySize, bp.address, bp.income_category AS incomeCategory,
    bp.monthly_entitlement_kg AS monthlyEntitlementKg,
    u.created_at AS createdAt
  FROM users u
  LEFT JOIN shops s ON s.id = u.shop_id
  LEFT JOIN beneficiary_profiles bp ON bp.user_id = u.id
`;

function canAccessBeneficiary(actor, beneficiary) {
  if (actor.role === ROLES.ADMIN) return true;
  if (actor.role === ROLES.SHOP_OWNER) return beneficiary.shopId === actor.shopId;
  return beneficiary.id === actor.id;
}

async function listBeneficiaries(actor) {
  const where = ["u.role = 'beneficiary'"];
  const params = [];

  if (actor.role === ROLES.SHOP_OWNER) {
    where.push('u.shop_id = ?');
    params.push(actor.shopId);
  }

  if (actor.role === ROLES.BENEFICIARY) {
    where.push('u.id = ?');
    params.push(actor.id);
  }

  return query(`${beneficiarySelect} WHERE ${where.join(' AND ')} ORDER BY u.created_at DESC`, params);
}

async function getBeneficiaryById(id, actor) {
  const rows = await query(`${beneficiarySelect} WHERE u.id = ? AND u.role = 'beneficiary' LIMIT 1`, [id]);
  if (!rows.length) throw new ApiError(404, 'Beneficiary not found.');
  if (!canAccessBeneficiary(actor, rows[0])) throw new ApiError(403, 'Cannot access this beneficiary.');
  return rows[0];
}

async function createBeneficiary(payload, actor = { role: ROLES.ADMIN }) {
  const shopId = actor.role === ROLES.SHOP_OWNER ? actor.shopId : payload.shopId || null;
  const passwordHash = await bcrypt.hash(payload.password || 'Password@123', 12);

  const result = await transaction(async (connection) => {
    const [userResult] = await connection.execute(
      `INSERT INTO users
        (full_name, email, phone, password_hash, role, shop_id, ration_card_number, aadhaar_last4, status)
       VALUES (?, ?, ?, ?, 'beneficiary', ?, ?, ?, ?)`,
      [
        payload.fullName,
        payload.email,
        payload.phone || null,
        passwordHash,
        shopId,
        payload.rationCardNumber,
        payload.aadhaarLast4 || null,
        payload.status || 'active'
      ]
    );

    await connection.execute(
      `INSERT INTO beneficiary_profiles
        (user_id, family_size, address, income_category, monthly_entitlement_kg)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userResult.insertId,
        payload.familySize || 1,
        payload.address || null,
        payload.incomeCategory || null,
        payload.monthlyEntitlementKg || 0
      ]
    );

    return userResult.insertId;
  });

  const beneficiary = await getBeneficiaryById(result, { role: ROLES.ADMIN });
  return { user: beneficiary, beneficiary };
}

async function updateBeneficiary(id, payload, actor) {
  const existing = await getBeneficiaryById(id, actor);
  const shopId = actor.role === ROLES.SHOP_OWNER ? actor.shopId : payload.shopId ?? existing.shopId;
  const next = { ...existing, ...payload, shopId };

  await transaction(async (connection) => {
    await connection.execute(
      `UPDATE users
       SET full_name = ?, email = ?, phone = ?, shop_id = ?, ration_card_number = ?,
        aadhaar_last4 = ?, status = ?
       WHERE id = ?`,
      [
        next.fullName,
        next.email,
        next.phone || null,
        next.shopId || null,
        next.rationCardNumber,
        next.aadhaarLast4 || null,
        next.status || 'active',
        id
      ]
    );

    await connection.execute(
      `INSERT INTO beneficiary_profiles
        (user_id, family_size, address, income_category, monthly_entitlement_kg)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        family_size = VALUES(family_size),
        address = VALUES(address),
        income_category = VALUES(income_category),
        monthly_entitlement_kg = VALUES(monthly_entitlement_kg)`,
      [
        id,
        next.familySize || 1,
        next.address || null,
        next.incomeCategory || null,
        next.monthlyEntitlementKg || 0
      ]
    );
  });

  return getBeneficiaryById(id, actor);
}

module.exports = { listBeneficiaries, getBeneficiaryById, createBeneficiary, updateBeneficiary };

