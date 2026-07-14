CREATE DATABASE IF NOT EXISTS e_ration_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE e_ration_shop;

CREATE TABLE IF NOT EXISTS shops (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(500) NULL,
  district VARCHAR(80) NULL,
  contact_phone VARCHAR(20) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shops_status (status),
  INDEX idx_shops_district (district)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'shop_owner', 'beneficiary') NOT NULL,
  shop_id BIGINT UNSIGNED NULL,
  ration_card_number VARCHAR(32) NULL UNIQUE,
  aadhaar_last4 CHAR(4) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL,
  INDEX idx_users_role (role),
  INDEX idx_users_shop_role (shop_id, role),
  INDEX idx_users_status (status)
);

CREATE TABLE IF NOT EXISTS beneficiary_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  family_size INT UNSIGNED NOT NULL DEFAULT 1,
  address VARCHAR(500) NULL,
  income_category VARCHAR(60) NULL,
  monthly_entitlement_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_beneficiary_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_beneficiary_income (income_category)
);

CREATE TABLE IF NOT EXISTS ration_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  monthly_quota_per_person DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ration_items_status (status)
);

CREATE TABLE IF NOT EXISTS stock (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  shop_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(12, 2) NOT NULL DEFAULT 0,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_item FOREIGN KEY (item_id) REFERENCES ration_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_stock_shop_item (shop_id, item_id),
  INDEX idx_stock_shop (shop_id),
  INDEX idx_stock_low (quantity, reorder_level)
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  transaction_no VARCHAR(64) NOT NULL UNIQUE,
  beneficiary_id BIGINT UNSIGNED NOT NULL,
  shop_id BIGINT UNSIGNED NOT NULL,
  status ENUM('issued', 'cancelled') NOT NULL DEFAULT 'issued',
  total_units DECIMAL(12, 2) NOT NULL DEFAULT 0,
  remarks VARCHAR(255) NULL,
  issued_by BIGINT UNSIGNED NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES users(id),
  CONSTRAINT fk_transactions_shop FOREIGN KEY (shop_id) REFERENCES shops(id),
  CONSTRAINT fk_transactions_issued_by FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_transactions_beneficiary (beneficiary_id, issued_at),
  INDEX idx_transactions_shop (shop_id, issued_at),
  INDEX idx_transactions_status (status)
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  transaction_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  CONSTRAINT fk_transaction_items_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_transaction_items_item FOREIGN KEY (item_id) REFERENCES ration_items(id),
  INDEX idx_transaction_items_transaction (transaction_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  stock_id BIGINT UNSIGNED NOT NULL,
  movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  reference_type VARCHAR(40) NULL,
  reference_id BIGINT UNSIGNED NULL,
  note VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_movements_stock FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_movements_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_stock_movements_stock (stock_id, created_at),
  INDEX idx_stock_movements_reference (reference_type, reference_id)
);

CREATE TABLE IF NOT EXISTS allocations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  beneficiary_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  month_year DATE NOT NULL,
  entitlement_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
  issued_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'partially_issued', 'issued') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_allocations_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_allocations_item FOREIGN KEY (item_id) REFERENCES ration_items(id),
  UNIQUE KEY uq_allocations_month_item (beneficiary_id, item_id, month_year),
  INDEX idx_allocations_month (month_year)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  actor_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_actor (actor_id, created_at)
);

