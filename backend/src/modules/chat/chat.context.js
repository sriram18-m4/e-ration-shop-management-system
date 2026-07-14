const { query } = require('../../config/db');
const ROLES = require('../../constants/roles');
const dashboardService = require('../dashboard/dashboard.service');

async function getStockContext(actor) {
  const params = [];
  let whereSql = '';

  if (actor.role !== ROLES.ADMIN) {
    whereSql = 'WHERE st.shop_id = ?';
    params.push(actor.shopId);
  }

  return query(
    `SELECT st.shop_id AS shopId, s.name AS shopName, ri.name AS itemName,
      ri.unit, st.quantity, st.reorder_level AS reorderLevel,
      CASE WHEN st.quantity <= st.reorder_level THEN 1 ELSE 0 END AS isLowStock
     FROM stock st
     JOIN shops s ON s.id = st.shop_id
     JOIN ration_items ri ON ri.id = st.item_id
     ${whereSql}
     ORDER BY isLowStock DESC, s.name, ri.name
     LIMIT 30`,
    params
  );
}

async function getTransactionContext(actor) {
  const params = [];
  const where = [];

  if (actor.role === ROLES.SHOP_OWNER) {
    where.push('t.shop_id = ?');
    params.push(actor.shopId);
  }

  if (actor.role === ROLES.BENEFICIARY) {
    where.push('t.beneficiary_id = ?');
    params.push(actor.id);
  }

  return query(
    `SELECT t.transaction_no AS transactionNo, b.full_name AS beneficiaryName,
      s.name AS shopName, t.total_units AS totalUnits, t.status, t.issued_at AS issuedAt
     FROM transactions t
     JOIN users b ON b.id = t.beneficiary_id
     JOIN shops s ON s.id = t.shop_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY t.issued_at DESC
     LIMIT 12`,
    params
  );
}

async function getBeneficiaryContext(actor) {
  const params = [];
  const where = ["u.role = 'beneficiary'"];

  if (actor.role === ROLES.SHOP_OWNER) {
    where.push('u.shop_id = ?');
    params.push(actor.shopId);
  }

  if (actor.role === ROLES.BENEFICIARY) {
    where.push('u.id = ?');
    params.push(actor.id);
  }

  return query(
    `SELECT u.id, u.full_name AS fullName, u.ration_card_number AS rationCardNumber,
      s.name AS shopName, bp.family_size AS familySize, bp.address,
      bp.income_category AS incomeCategory, bp.monthly_entitlement_kg AS monthlyEntitlementKg,
      u.status
     FROM users u
     LEFT JOIN shops s ON s.id = u.shop_id
     LEFT JOIN beneficiary_profiles bp ON bp.user_id = u.id
     WHERE ${where.join(' AND ')}
     ORDER BY u.created_at DESC
     LIMIT 20`,
    params
  );
}

async function getShopContext(actor) {
  if (actor.role === ROLES.BENEFICIARY && !actor.shopId) return [];

  if (actor.role !== ROLES.ADMIN) {
    return query(
      `SELECT id, code, name, address, district, contact_phone AS contactPhone, status
       FROM shops
       WHERE id = ?
       LIMIT 1`,
      [actor.shopId]
    );
  }

  return query(
    `SELECT id, code, name, address, district, contact_phone AS contactPhone, status
     FROM shops
     ORDER BY name
     LIMIT 20`
  );
}

async function buildChatContext(actor) {
  const [summary, stock, transactions, beneficiaries, shops] = await Promise.all([
    dashboardService.getSummary(actor),
    getStockContext(actor),
    getTransactionContext(actor),
    getBeneficiaryContext(actor),
    getShopContext(actor)
  ]);

  return {
    user: {
      id: actor.id,
      fullName: actor.fullName,
      role: actor.role,
      shopId: actor.shopId,
      rationCardNumber: actor.rationCardNumber
    },
    summary,
    stock,
    transactions,
    beneficiaries,
    shops
  };
}

module.exports = { buildChatContext };

