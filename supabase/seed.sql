-- ==============================================================================
-- QR CODE CAFE & BEVERAGE ORDER SYSTEM - RICH SEED DATA
-- Store: The Cyber Coffee - SOC Station
-- 8 Tables, 4 Categories, 12 Beverages & Sample SIEM Security Logs
-- ==============================================================================

-- 1. Insert Sample Store
INSERT INTO public.stores (id, name, logo_url, vietqr_bank_id, vietqr_account_no, vietqr_account_name, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'The Cyber Coffee - SOC Station',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80',
  '970422',
  '0987654321',
  'THE CYBER COFFEE SOC',
  true
) ON CONFLICT DO NOTHING;

-- 2. Insert 8 Tables (Bàn 01 to Bàn 08)
INSERT INTO public.tables (id, store_id, table_number, qr_token, status)
VALUES
  ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-111111111111', 'Bàn 01', 'table-01-token', 'idle'),
  ('22222222-2222-2222-2222-000000000002', '11111111-1111-1111-1111-111111111111', 'Bàn 02', 'table-02-token', 'occupied'),
  ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-111111111111', 'Bàn 03', 'table-03-token', 'pending_pay_later'),
  ('22222222-2222-2222-2222-000000000004', '11111111-1111-1111-1111-111111111111', 'Bàn 04', 'table-04-token', 'idle'),
  ('22222222-2222-2222-2222-000000000005', '11111111-1111-1111-1111-111111111111', 'Bàn 05', 'table-05-token', 'idle'),
  ('22222222-2222-2222-2222-000000000006', '11111111-1111-1111-1111-111111111111', 'Bàn 06', 'table-06-token', 'idle'),
  ('22222222-2222-2222-2222-000000000007', '11111111-1111-1111-1111-111111111111', 'Bàn 07', 'table-07-token', 'idle'),
  ('22222222-2222-2222-2222-000000000008', '11111111-1111-1111-1111-111111111111', 'Bàn 08', 'table-08-token', 'idle')
ON CONFLICT DO NOTHING;

-- 3. Insert 4 Categories
INSERT INTO public.categories (id, store_id, name, sort_order)
VALUES
  ('33333333-3333-3333-3333-000000000001', '11111111-1111-1111-1111-111111111111', 'Cà Phê Đặc Sản', 10),
  ('33333333-3333-3333-3333-000000000002', '11111111-1111-1111-1111-111111111111', 'Trà Trái Cây Đào Cam Sả', 20),
  ('33333333-3333-3333-3333-000000000003', '11111111-1111-1111-1111-111111111111', 'Matcha & Đá Xay', 30),
  ('33333333-3333-3333-3333-000000000004', '11111111-1111-1111-1111-111111111111', 'Bánh Ngọt & Pastry', 40)
ON CONFLICT DO NOTHING;

-- 4. Insert 12 Beverages & Pastry Items
INSERT INTO public.products (id, store_id, category_id, name, description, price, image_url, is_available)
VALUES
  -- Category 1: Cà Phê Đặc Sản
  (
    '44444444-4444-4444-4444-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000001',
    'Cà Phê Muối Thượng Hạng',
    'Sự kết hợp hoàn hảo giữa cà phê đậm đà và kem muối béo ngậy chuẩn Huế.',
    45000,
    'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    '44444444-4444-4444-4444-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000001',
    'Bạc Xỉu Kem Muối Sài Gòn',
    'Sữa đặc ngọt dịu hòa quyện cà phê phin đậm chất đường phố Sài Gòn.',
    39000,
    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    '44444444-4444-4444-4444-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000001',
    'Espresso Double Shot',
    'Cà phê rang mộc nguyên chất chiết xuất áp suất cao chuẩn Ý.',
    35000,
    'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    '44444444-4444-4444-4444-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000001',
    'Cold Brew Cam Sả Đá',
    'Cà phê ủ lạnh 24 giờ pha chế với nước ép cam tươi và sả chanh thanh mát.',
    55000,
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    true
  ),

  -- Category 2: Trà Trái Cây Đào Cam Sả
  (
    '44444444-4444-4444-4444-000000000005',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000002',
    'Trà Đào Cam Sả Đặc Biệt',
    'Trà đen ủ ấm kết hợp đào giòn, cam lát tươi và sả thơm ngát.',
    48000,
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    '44444444-4444-4444-4444-000000000006',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000002',
    'Trà Vải Hoa Hồng Lạnh',
    'Vải tươi mọng nước trên nền trà nhài ướp hương hoa hồng thanh khiết.',
    49000,
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    '44444444-4444-4444-4444-000000000007',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000002',
    'Trà Ô Long Xoài Dứa',
    'Vị chua ngọt nhiệt đới từ xoài tươi và dứa kết hợp trà Ô long thượng hạng.',
    52000,
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    true
  ),

  -- Category 3: Matcha & Đá Xay
  (
    '44444444-4444-4444-4444-000000000008',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000003',
    'Matcha Latte Kyoto',
    'Bột trà xanh Uji cao cấp từ Kyoto pha cùng sữa tươi nguyên kem sữa chua dẻo.',
    55000,
    'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    '44444444-4444-4444-4444-000000000009',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000003',
    'Chocochip Frappuccino Đá Xay',
    'Sô-cô-la đen nguyên chất xay đá nhuyễn phủ lớp kem tươi béo mịn.',
    59000,
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    '44444444-4444-4444-4444-000000000010',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000003',
    'Caramel Macchiato Đá Xay',
    'Cà phê caramel ngọt lịm xay với đá lạnh và bọt sữa mềm mượt.',
    59000,
    'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
    true
  ),

  -- Category 4: Bánh Ngọt & Pastry
  (
    '44444444-4444-4444-4444-000000000011',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000004',
    'Tiramisu Italy Truyền Thống',
    'Bánh quy ngón tay tẩm cà phê và rượu rum phô mai Mascarpone.',
    49000,
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
    true
  ),
  (
    '44444444-4444-4444-4444-000000000012',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000004',
    'Croissant Bơ Pháp Nướng Nóng',
    'Bánh sừng bò ngàn lớp bơ Pháp nướng giòn rụm tan trong miệng.',
    38000,
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    true
  )
ON CONFLICT DO NOTHING;

-- 5. Insert Sample Orders & Order Items
INSERT INTO public.orders (id, store_id, table_id, order_code, payment_method, status, total_amount, customer_name, customer_phone, is_paid)
VALUES
  (
    '55555555-5555-5555-5555-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-000000000002',
    'SOC-1001',
    'pay_now',
    'paid_preparing',
    93000,
    'Anh Long - SOC Ops',
    '0901234567',
    true
  ),
  (
    '55555555-5555-5555-5555-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-000000000003',
    'SOC-1002',
    'pay_later',
    'pending_approval',
    83000,
    'Chị Vy - Designer',
    '0912345678',
    false
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.order_items (id, order_id, product_id, product_name, price, quantity, note)
VALUES
  -- Items for SOC-1001
  ('66666666-6666-6666-6666-000000000001', '55555555-5555-5555-5555-000000000001', '44444444-4444-4444-4444-000000000001', 'Cà Phê Muối Thượng Hạng', 45000, 1, 'Ít đường, nhiều kem muối'),
  ('66666666-6666-6666-6666-000000000002', '55555555-5555-5555-5555-000000000001', '44444444-4444-4444-4444-000000000005', 'Trà Đào Cam Sả Đặc Biệt', 48000, 1, 'Đá riêng'),
  -- Items for SOC-1002
  ('66666666-6666-6666-6666-000000000003', '55555555-5555-5555-5555-000000000002', '44444444-4444-4444-4444-000000000008', 'Matcha Latte Kyoto', 55000, 1, 'Đường 50%'),
  ('66666666-6666-6666-6666-000000000004', '55555555-5555-5555-5555-000000000002', '44444444-4444-4444-4444-000000000012', 'Croissant Bơ Pháp Nướng Nóng', 38000, 1, 'Nướng giòn')
ON CONFLICT DO NOTHING;

-- 6. Insert Sample Security Logs (SIEM / SOC Telemetry)
INSERT INTO public.security_logs (id, store_id, table_id, event_type, severity, message, metadata)
VALUES
  (
    '77777777-7777-7777-7777-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-000000000002',
    'WEBHOOK_PAID',
    'INFO',
    'VietQR payment verified for Order #SOC-1001 (93,000 VND). Automated transition to preparing.',
    '{"bank": "MBBank", "transaction_ref": "FT2608021001", "amount": 93000}'
  ),
  (
    '77777777-7777-7777-7777-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-000000000003',
    'NEW_ORDER',
    'INFO',
    'Table 03 submitted Pay-Later Order #SOC-1002 (83,000 VND). Pending Staff Approval.',
    '{"order_code": "SOC-1002", "items": 2}'
  ),
  (
    '77777777-7777-7777-7777-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-000000000003',
    'UNPAID_CEILING_BLOCKED',
    'WARNING',
    'Table 03 blocked from creating 2nd Pay-Later order due to unpaid pending order #SOC-1002 (83,000 VND) exceeding unpaid ceiling.',
    '{"blocked_table": "Bàn 03", "unpaid_balance": 83000, "ceiling": 100000}'
  ),
  (
    '77777777-7777-7777-7777-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-000000000005',
    'RATE_LIMIT_BLOCKED',
    'CRITICAL',
    'Table 05 blocked from Pay-Later order: Rate limit exceeded (3 requests in 4 minutes). Anti-Spam protection active.',
    '{"blocked_table": "Bàn 05", "attempts_in_10m": 3}'
  )
ON CONFLICT DO NOTHING;
