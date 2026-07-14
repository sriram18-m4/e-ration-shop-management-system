USE e_ration_shop;

INSERT INTO shops (id, code, name, address, district, contact_phone, status) VALUES
  (1, 'FPS-001', 'Central Fair Price Shop', 'Main Road, Ward 12', 'Hyderabad', '9000000001', 'active'),
  (2, 'FPS-002', 'North Zone Ration Shop', 'Market Street, Ward 3', 'Hyderabad', '9000000002', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO ration_items (id, sku, name, unit, monthly_quota_per_person, status) VALUES
  (1, 'RICE', 'Rice', 'kg', 5.00, 'active'),
  (2, 'WHEAT', 'Wheat', 'kg', 3.00, 'active'),
  (3, 'SUGAR', 'Sugar', 'kg', 1.00, 'active'),
  (4, 'KEROSENE', 'Kerosene', 'litre', 2.00, 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users
  (id, full_name, email, phone, password_hash, role, shop_id, ration_card_number, aadhaar_last4, status)
VALUES
  (1, 'System Admin', 'admin@eration.local', '9000000010', '$2a$12$OkXu3bkKrSHoFwE1aUHuXu6hjSdGw810/cJuD45Cf/FSPFXC/MBdK', 'admin', NULL, NULL, NULL, 'active'),
  (2, 'Central Shop Owner', 'owner.central@eration.local', '9000000011', '$2a$12$OkXu3bkKrSHoFwE1aUHuXu6hjSdGw810/cJuD45Cf/FSPFXC/MBdK', 'shop_owner', 1, NULL, NULL, 'active'),
  (3, 'Anita Beneficiary', 'beneficiary@eration.local', '9000000012', '$2a$12$OkXu3bkKrSHoFwE1aUHuXu6hjSdGw810/cJuD45Cf/FSPFXC/MBdK', 'beneficiary', 1, 'RC-10001', '1234', 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO beneficiary_profiles
  (user_id, family_size, address, income_category, monthly_entitlement_kg)
VALUES
  (3, 4, 'House 22, Main Road, Ward 12', 'BPL', 20.00)
ON DUPLICATE KEY UPDATE family_size = VALUES(family_size);

INSERT INTO stock (shop_id, item_id, quantity, reorder_level, updated_by) VALUES
  (1, 1, 750.00, 100.00, 1),
  (1, 2, 420.00, 80.00, 1),
  (1, 3, 90.00, 40.00, 1),
  (1, 4, 180.00, 40.00, 1),
  (2, 1, 520.00, 100.00, 1),
  (2, 2, 260.00, 80.00, 1)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), reorder_level = VALUES(reorder_level);
