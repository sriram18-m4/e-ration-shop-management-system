const { query } = require('../../config/db');
const ROLES = require('../../constants/roles');

function scopeFor(actor, tableAlias = '') {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  if (actor.role === ROLES.SHOP_OWNER) return { sql: `${prefix}shop_id = ?`, params: [actor.shopId] };
  if (actor.role === ROLES.BENEFICIARY) return { sql: `${prefix}beneficiary_id = ?`, params: [actor.id] };
  return { sql: '1 = 1', params: [] };
}

async function getSummary(actor) {
  const stockScope = actor.role === ROLES.ADMIN ? { sql: '1 = 1', params: [] } : { sql: 'st.shop_id = ?', params: [actor.shopId] };
  const txScope = scopeFor(actor, 't');
  const beneficiaryScope = actor.role === ROLES.ADMIN
    ? { sql: "u.role = 'beneficiary'", params: [] }
    : actor.role === ROLES.SHOP_OWNER
      ? { sql: "u.role = 'beneficiary' AND u.shop_id = ?", params: [actor.shopId] }
      : { sql: 'u.id = ?', params: [actor.id] };

  const [stockStats] = await query(
    `SELECT COALESCE(SUM(st.quantity), 0) AS totalStock,
      SUM(CASE WHEN st.quantity <= st.reorder_level THEN 1 ELSE 0 END) AS lowStockCount
     FROM stock st
     WHERE ${stockScope.sql}`,
    stockScope.params
  );

  const [beneficiaryStats] = await query(
    `SELECT COUNT(*) AS totalBeneficiaries
     FROM users u
     WHERE ${beneficiaryScope.sql}`,
    beneficiaryScope.params
  );

  const [transactionStats] = await query(
    `SELECT COUNT(*) AS totalTransactions, COALESCE(SUM(t.total_units), 0) AS issuedUnits
     FROM transactions t
     WHERE ${txScope.sql}`,
    txScope.params
  );

  const lowStock = await query(
    `SELECT st.id, s.name AS shopName, ri.name AS itemName, ri.unit, st.quantity, st.reorder_level AS reorderLevel
     FROM stock st
     JOIN shops s ON s.id = st.shop_id
     JOIN ration_items ri ON ri.id = st.item_id
     WHERE ${stockScope.sql} AND st.quantity <= st.reorder_level
     ORDER BY st.quantity ASC
     LIMIT 8`,
    stockScope.params
  );

  const recentTransactions = await query(
    `SELECT t.id, t.transaction_no AS transactionNo, b.full_name AS beneficiaryName,
      s.name AS shopName, t.total_units AS totalUnits, t.issued_at AS issuedAt
     FROM transactions t
     JOIN users b ON b.id = t.beneficiary_id
     JOIN shops s ON s.id = t.shop_id
     WHERE ${txScope.sql}
     ORDER BY t.issued_at DESC
     LIMIT 8`,
    txScope.params
  );

  return {
    totalStock: Number(stockStats.totalStock || 0),
    lowStockCount: Number(stockStats.lowStockCount || 0),
    totalBeneficiaries: Number(beneficiaryStats.totalBeneficiaries || 0),
    totalTransactions: Number(transactionStats.totalTransactions || 0),
    issuedUnits: Number(transactionStats.issuedUnits || 0),
    lowStock,
    recentTransactions
  };
}

module.exports = { getSummary };

