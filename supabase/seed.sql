-- ============================================================================
-- Seed data — QR Beverage Ordering System
-- ============================================================================
-- Run against a fresh database (supabase db reset, or paste into SQL Editor
-- once after the initial migration).
--
-- Notes:
--   * qr_token is NOT seeded. The database generates a 128-bit random token
--     per table. Read them back from the tables page after seeding; never
--     write them by hand, never derive them from the table number.
--   * Table count is a parameter, not a constant. Change TABLE_COUNT below.
--   * Sample security_logs exist so the SOC feed is not empty on first run.
--     Delete the final block before going live if you want a clean audit trail.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Store
-- ---------------------------------------------------------------------------
INSERT INTO public.stores (
  id, name, logo_url,
  vietqr_bank_id, vietqr_account_no, vietqr_account_name,
  is_active
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'The Cyber Coffee - SOC Station',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80',
  '970422',
  '0987654321',
  'THE CYBER COFFEE SOC',
  true
) ON CONFLICT (id) DO NOTHING;

-- webhook_secret is intentionally left NULL here. Set it from /admin/config
-- (or a one-off UPDATE) with the value SePay/Casso gives you — a secret in a
-- committed seed file is a secret that has already leaked.

-- ---------------------------------------------------------------------------
-- 2. Tables — change TABLE_COUNT to match the real cafe
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  TABLE_COUNT CONSTANT INT := 8;
BEGIN
  INSERT INTO public.tables (store_id, table_number, sort_order)
  SELECT
    '11111111-1111-1111-1111-111111111111',
    'Bàn ' || lpad(n::text, 2, '0'),
    n * 10
  FROM generate_series(1, TABLE_COUNT) AS n
  ON CONFLICT (store_id, table_number) DO NOTHING;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Categories
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (id, store_id, name, sort_order) VALUES
  ('33333333-3333-3333-3333-000000000001', '11111111-1111-1111-1111-111111111111', 'Cà Phê Đặc Sản', 10),
  ('33333333-3333-3333-3333-000000000002', '11111111-1111-1111-1111-111111111111', 'Trà Trái Cây Đào Cam Sả', 20),
  ('33333333-3333-3333-3333-000000000003', '11111111-1111-1111-1111-111111111111', 'Matcha & Đá Xay', 30),
  ('33333333-3333-3333-3333-000000000004', '11111111-1111-1111-1111-111111111111', 'Bánh Ngọt & Pastry', 40)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Products
-- ---------------------------------------------------------------------------
INSERT INTO public.products (id, store_id, category_id, name, description, price, image_url, is_available, sort_order) VALUES
  ('44444444-4444-4444-4444-000000000001', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000001', 'Cà Phê Muối Thượng Hạng',
   'Sự kết hợp hoàn hảo giữa cà phê đậm đà và kem muối béo ngậy chuẩn Huế.',
   45000, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80', true, 10),
  ('44444444-4444-4444-4444-000000000002', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000001', 'Bạc Xỉu Kem Muối Sài Gòn',
   'Sữa đặc ngọt dịu hòa quyện cà phê phin đậm chất đường phố Sài Gòn.',
   39000, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80', true, 20),
  ('44444444-4444-4444-4444-000000000003', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000001', 'Espresso Double Shot',
   'Cà phê rang mộc nguyên chất chiết xuất áp suất cao chuẩn Ý.',
   35000, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80', true, 30),
  ('44444444-4444-4444-4444-000000000004', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000001', 'Cold Brew Cam Sả Đá',
   'Cà phê ủ lạnh 24 giờ pha chế với nước ép cam tươi và sả chanh thanh mát.',
   55000, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80', true, 40),
  ('44444444-4444-4444-4444-000000000005', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000002', 'Trà Đào Cam Sả Đặc Biệt',
   'Trà đen ủ ấm kết hợp đào giòn, cam lát tươi và sả thơm ngát.',
   48000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', true, 50),
  ('44444444-4444-4444-4444-000000000006', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000002', 'Trà Vải Hoa Hồng Lạnh',
   'Vải tươi mọng nước trên nền trà nhài ướp hương hoa hồng thanh khiết.',
   49000, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80', true, 60),
  ('44444444-4444-4444-4444-000000000007', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000002', 'Trà Ô Long Xoài Dứa',
   'Vị chua ngọt nhiệt đới từ xoài tươi và dứa kết hợp trà Ô long thượng hạng.',
   52000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', true, 70),
  ('44444444-4444-4444-4444-000000000008', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000003', 'Matcha Latte Kyoto',
   'Bột trà xanh Uji cao cấp từ Kyoto pha cùng sữa tươi nguyên kem sữa chua dẻo.',
   55000, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80', true, 80),
  ('44444444-4444-4444-4444-000000000009', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000003', 'Chocochip Frappuccino Đá Xay',
   'Sô-cô-la đen nguyên chất xay đá nhuyễn phủ lớp kem tươi béo mịn.',
   59000, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80', true, 90),
  ('44444444-4444-4444-4444-000000000010', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000003', 'Caramel Macchiato Đá Xay',
   'Cà phê caramel ngọt lịm xay với đá lạnh và bọt sữa mềm mượt.',
   59000, 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80', true, 100),
  ('44444444-4444-4444-4444-000000000011', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000004', 'Tiramisu Italy Truyền Thống',
   'Bánh quy ngón tay tẩm cà phê và rượu rum phô mai Mascarpone.',
   49000, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80', true, 110),
  ('44444444-4444-4444-4444-000000000012', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-000000000004', 'Croissant Bơ Pháp Nướng Nóng',
   'Bánh sừng bò ngàn lớp bơ Pháp nướng giòn rụm tan trong miệng.',
   38000, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', true, 120)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Sample SOC events
-- ---------------------------------------------------------------------------
-- Table ids are looked up by number because they are generated, not fixed.
INSERT INTO public.security_logs
  (store_id, table_id, event_type, category, severity, message, ip_address, actor_type, metadata)
SELECT
  '11111111-1111-1111-1111-111111111111',
  t.id, v.event_type, v.category, v.severity, v.message, v.ip::inet, v.actor,
  v.metadata::jsonb
FROM (VALUES
  ('Bàn 03', 'RATE_LIMIT_ORDER_BLOCKED', 'SPAM', 'WARNING',
   'Bàn 03 bị chặn đơn Trả Sau: vượt ngưỡng 2 đơn trong 10 phút.',
   '113.161.44.21', 'guest',
   '{"attempts_in_window": 3, "max_allowed": 2, "rate_limit_window": "10m", "endpoint": "/checkout"}'),

  ('Bàn 05', 'PAY_LATER_CEILING_BLOCKED', 'FINANCE', 'WARNING',
   'Bàn 05 bị chặn: công nợ Trả Sau hiện tại 120.000đ vượt trần 100.000đ.',
   '113.161.44.98', 'guest',
   '{"current_debt": 120000, "attempted_order_amount": 45000, "ceiling_limit": 100000}'),

  ('Bàn 01', 'INVALID_QR_TOKEN_SCAN', 'SPAM', 'WARNING',
   'Phát hiện quét mã QR với token không tồn tại — dấu hiệu dò tìm token.',
   '45.117.80.13', 'guest',
   '{"provided_token": "table-09-token", "scan_source": "qr_landing"}'),

  ('Bàn 02', 'ORDER_PAID_SUCCESS', 'FINANCE', 'INFO',
   'Xác nhận thanh toán VietQR thành công cho đơn tại Bàn 02.',
   '203.113.131.7', 'webhook',
   '{"amount": 94000, "payment_method": "pay_now", "confirmed_by_webhook": true}'),

  ('Bàn 04', 'MENU_ITEM_STOCK_TOGGLED', 'INTEGRITY', 'INFO',
   'Nhân viên đánh dấu hết hàng: Matcha Latte Kyoto.',
   '192.168.1.24', 'staff',
   '{"item_name": "Matcha Latte Kyoto", "previous_status": true, "new_status": false}')
) AS v(table_number, event_type, category, severity, message, ip, actor, metadata)
JOIN public.tables t
  ON t.table_number = v.table_number
 AND t.store_id = '11111111-1111-1111-1111-111111111111';
