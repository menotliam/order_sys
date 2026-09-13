import {
  Store,
  CafeTable,
  Category,
  Product,
  Order,
  OrderItem,
  SecurityLog,
  CashflowDataPoint,
} from '@/types/database';

// Global Singleton Mock Store for Instant End-to-End Testing
class MockDatabase {
  public store: Store = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'The Cyber Coffee - SOC Station',
    logo_url:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80',
    vietqr_bank_id: '970422',
    vietqr_account_no: '0987654321',
    vietqr_account_name: 'THE CYBER COFFEE SOC',
    is_active: true,
    created_at: new Date().toISOString(),
    security_thresholds: {
      max_pay_later_per_window: 2,
      rate_limit_window_min: 10,
      unpaid_ceiling_vnd: 100000,
      audio_alert_enabled: true,
    },
  };

  public tables: CafeTable[] = [
    { id: '22222222-2222-2222-2222-000000000001', store_id: this.store.id, table_number: 'Bàn 01', qr_token: 'table-01-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000002', store_id: this.store.id, table_number: 'Bàn 02', qr_token: 'table-02-token', status: 'occupied', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000003', store_id: this.store.id, table_number: 'Bàn 03', qr_token: 'table-03-token', status: 'pending_pay_later', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000004', store_id: this.store.id, table_number: 'Bàn 04', qr_token: 'table-04-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000005', store_id: this.store.id, table_number: 'Bàn 05', qr_token: 'table-05-token', status: 'blocked_rate_limit', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000006', store_id: this.store.id, table_number: 'Bàn 06', qr_token: 'table-06-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000007', store_id: this.store.id, table_number: 'Bàn 07', qr_token: 'table-07-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000008', store_id: this.store.id, table_number: 'Bàn 08', qr_token: 'table-08-token', status: 'blocked_debt', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000009', store_id: this.store.id, table_number: 'Bàn 09', qr_token: 'table-09-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000010', store_id: this.store.id, table_number: 'Bàn 10', qr_token: 'table-10-token', status: 'occupied', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000011', store_id: this.store.id, table_number: 'Bàn 11', qr_token: 'table-11-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000012', store_id: this.store.id, table_number: 'Bàn 12', qr_token: 'table-12-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000013', store_id: this.store.id, table_number: 'Bàn 13', qr_token: 'table-13-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000014', store_id: this.store.id, table_number: 'Bàn 14', qr_token: 'table-14-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000015', store_id: this.store.id, table_number: 'Bàn 15', qr_token: 'table-15-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000016', store_id: this.store.id, table_number: 'Bàn 16', qr_token: 'table-16-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000017', store_id: this.store.id, table_number: 'Bàn 17', qr_token: 'table-17-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000018', store_id: this.store.id, table_number: 'Bàn 18', qr_token: 'table-18-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000019', store_id: this.store.id, table_number: 'Bàn 19', qr_token: 'table-19-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000020', store_id: this.store.id, table_number: 'Bàn 20', qr_token: 'table-20-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000021', store_id: this.store.id, table_number: 'Bàn 21', qr_token: 'table-21-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000022', store_id: this.store.id, table_number: 'Bàn 22', qr_token: 'table-22-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000023', store_id: this.store.id, table_number: 'Bàn 23', qr_token: 'table-23-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000024', store_id: this.store.id, table_number: 'Bàn 24', qr_token: 'table-24-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000025', store_id: this.store.id, table_number: 'Bàn 25', qr_token: 'table-25-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000026', store_id: this.store.id, table_number: 'Bàn 26', qr_token: 'table-26-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000027', store_id: this.store.id, table_number: 'Bàn 27', qr_token: 'table-27-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000028', store_id: this.store.id, table_number: 'Bàn 28', qr_token: 'table-28-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000029', store_id: this.store.id, table_number: 'Bàn 29', qr_token: 'table-29-token', status: 'idle', created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-000000000030', store_id: this.store.id, table_number: 'Bàn 30', qr_token: 'table-30-token', status: 'idle', created_at: new Date().toISOString() },
  ];

  public categories: Category[] = [
    { id: '33333333-3333-3333-3333-000000000001', store_id: this.store.id, name: 'Cà Phê Đặc Sản', sort_order: 10, created_at: new Date().toISOString() },
    { id: '33333333-3333-3333-3333-000000000002', store_id: this.store.id, name: 'Trà Trái Cây Đào Cam Sả', sort_order: 20, created_at: new Date().toISOString() },
    { id: '33333333-3333-3333-3333-000000000003', store_id: this.store.id, name: 'Matcha & Đá Xay', sort_order: 30, created_at: new Date().toISOString() },
    { id: '33333333-3333-3333-3333-000000000004', store_id: this.store.id, name: 'Bánh Ngọt & Pastry', sort_order: 40, created_at: new Date().toISOString() },
  ];

  public products: Product[] = [
    { id: '44444444-4444-4444-4444-000000000001', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000001', name: 'Cà Phê Muối Thượng Hạng', description: 'Sự kết hợp hoàn hảo giữa cà phê đậm đà và kem muối béo ngậy chuẩn Huế.', price: 45000, image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
    { id: '44444444-4444-4444-4444-000000000002', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000001', name: 'Bạc Xỉu Kem Muối Sài Gòn', description: 'Sữa đặc ngọt dịu hòa quyện cà phê phin đậm chất đường phố Sài Gòn.', price: 39000, image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
    { id: '44444444-4444-4444-4444-000000000003', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000001', name: 'Espresso Double Shot', description: 'Cà phê rang mộc nguyên chất chiết xuất áp suất cao chuẩn Ý.', price: 35000, image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
    { id: '44444444-4444-4444-4444-000000000004', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000001', name: 'Cold Brew Cam Sả Đá', description: 'Cà phê ủ lạnh 24 giờ pha chế với nước ép cam tươi và sả chanh thanh mát.', price: 55000, image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
    { id: '44444444-4444-4444-4444-000000000005', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000002', name: 'Trà Đào Cam Sả Đặc Biệt', description: 'Trà đen ủ ấm kết hợp đào giòn, cam lát tươi và sả thơm ngát.', price: 48000, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
    { id: '44444444-4444-4444-4444-000000000006', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000002', name: 'Trà Vải Hoa Hồng Lạnh', description: 'Vải tươi mọng nước trên nền trà nhài ướp hương hoa hồng thanh khiết.', price: 49000, image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
    { id: '44444444-4444-4444-4444-000000000007', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000002', name: 'Trà Ô Long Xoài Dứa', description: 'Vị chua ngọt nhiệt đới từ xoài tươi và dứa kết hợp trà Ô long thượng hạng.', price: 52000, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
    { id: '44444444-4444-4444-4444-000000000008', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000003', name: 'Matcha Latte Kyoto', description: 'Bột trà xanh Uji cao cấp từ Kyoto pha cùng sữa tươi nguyên kem sữa chua dẻo.', price: 55000, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
    { id: '44444444-4444-4444-4444-000000000009', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000003', name: 'Chocochip Frappuccino Đá Xay', description: 'Sô-cô-la đen nguyên chất xay đá nhuyễn phủ lớp kem tươi béo mịn.', price: 59000, image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
    { id: '44444444-4444-4444-4444-000000000010', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000003', name: 'Caramel Macchiato Đá Xay', description: 'Cà phê caramel ngọt lịm xay với đá lạnh và bọt sữa mềm mượt.', price: 59000, image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
    { id: '44444444-4444-4444-4444-000000000011', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000004', name: 'Tiramisu Italy Truyền Thống', description: 'Bánh quy ngón tay tẩm cà phê và rượu rum phô mai Mascarpone.', price: 49000, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
    { id: '44444444-4444-4444-4444-000000000012', store_id: this.store.id, category_id: '33333333-3333-3333-3333-000000000004', name: 'Croissant Bơ Pháp Nướng Nóng', description: 'Bánh sừng bò ngàn lớp bơ Pháp nướng giòn rụm tan trong miệng.', price: 38000, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', is_available: true, created_at: new Date().toISOString() },
  ];

  public orders: Order[] = [
    {
      id: '55555555-5555-5555-5555-000000000001',
      store_id: this.store.id,
      table_id: '22222222-2222-2222-2222-000000000002',
      order_code: 'SOC-1001',
      payment_method: 'pay_now',
      status: 'paid_preparing',
      total_amount: 93000,
      customer_name: 'Anh Long - SOC Ops',
      customer_phone: '0901234567',
      is_paid: true,
      created_at: new Date(Date.now() - 600000).toISOString(),
      updated_at: new Date(Date.now() - 300000).toISOString(),
      table_number: 'Bàn 02',
      items: [
        { id: '66666666-6666-6666-6666-000000000001', order_id: '55555555-5555-5555-5555-000000000001', product_id: '44444444-4444-4444-4444-000000000001', product_name: 'Cà Phê Muối Thượng Hạng', price: 45000, quantity: 1, note: 'Ít đường, nhiều kem muối', created_at: new Date().toISOString() },
        { id: '66666666-6666-6666-6666-000000000002', order_id: '55555555-5555-5555-5555-000000000001', product_id: '44444444-4444-4444-4444-000000000005', product_name: 'Trà Đào Cam Sả Đặc Biệt', price: 48000, quantity: 1, note: 'Đá riêng', created_at: new Date().toISOString() },
      ],
    },
    {
      id: '55555555-5555-5555-5555-000000000002',
      store_id: this.store.id,
      table_id: '22222222-2222-2222-2222-000000000003',
      order_code: 'SOC-1002',
      payment_method: 'pay_later',
      status: 'pending_approval',
      total_amount: 83000,
      customer_name: 'Chị Vy - Designer',
      customer_phone: '0912345678',
      is_paid: false,
      created_at: new Date(Date.now() - 180000).toISOString(),
      updated_at: new Date(Date.now() - 180000).toISOString(),
      table_number: 'Bàn 03',
      items: [
        { id: '66666666-6666-6666-6666-000000000003', order_id: '55555555-5555-5555-5555-000000000002', product_id: '44444444-4444-4444-4444-000000000008', product_name: 'Matcha Latte Kyoto', price: 55000, quantity: 1, note: 'Đường 50%', created_at: new Date().toISOString() },
        { id: '66666666-6666-6666-6666-000000000004', order_id: '55555555-5555-5555-5555-000000000002', product_id: '44444444-4444-4444-4444-000000000012', product_name: 'Croissant Bơ Pháp Nướng Nóng', price: 38000, quantity: 1, note: 'Nướng giòn', created_at: new Date().toISOString() },
      ],
    },
  ];

  // Cashflow time-series data for the last 12 hours
  public cashflow_series: CashflowDataPoint[] = (() => {
    const points: CashflowDataPoint[] = [];
    const now = new Date();
    const revenues = [0, 0, 45000, 138000, 285000, 410000, 523000, 618000, 730000, 812000, 890000, 930000];
    const orders = [0, 0, 1, 3, 6, 9, 11, 14, 16, 18, 20, 21];
    for (let i = 11; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 3600000);
      points.push({
        time: t.getHours().toString().padStart(2, '0') + ':00',
        revenue: revenues[11 - i],
        orderCount: orders[11 - i],
      });
    }
    return points;
  })();

  public security_logs: SecurityLog[] = [
    {
      id: '77777777-7777-7777-7777-000000000001',
      store_id: this.store.id,
      table_id: '22222222-2222-2222-2222-000000000002',
      event_type: 'WEBHOOK_PAID',
      severity: 'INFO',
      ip_address: '103.48.192.11',
      message: 'VietQR payment verified for Order #SOC-1001 (93,000 VND). Automated transition to preparing.',
      metadata: { bank: 'MBBank', transaction_ref: 'FT2608021001', amount: 93000, confirmed_by_webhook: true },
      created_at: new Date(Date.now() - 550000).toISOString(),
      table_number: 'Bàn 02',
    },
    {
      id: '77777777-7777-7777-7777-000000000002',
      store_id: this.store.id,
      table_id: '22222222-2222-2222-2222-000000000003',
      event_type: 'NEW_ORDER',
      severity: 'INFO',
      ip_address: '192.168.1.33',
      message: 'Table 03 submitted Pay-Later Order #SOC-1002 (83,000 VND). Pending Staff Approval.',
      metadata: { order_code: 'SOC-1002', items: 2, payment_method: 'pay_later' },
      created_at: new Date(Date.now() - 180000).toISOString(),
      table_number: 'Bàn 03',
    },
    {
      id: '77777777-7777-7777-7777-000000000003',
      store_id: this.store.id,
      table_id: '22222222-2222-2222-2222-000000000003',
      event_type: 'PAY_LATER_CEILING_BLOCKED',
      severity: 'WARNING',
      ip_address: '192.168.1.33',
      message: 'Table "Bàn 03" blocked from Pay-Later order: Unpaid pending balance of 83,000 VNĐ reaches ceiling limit (100,000 VNĐ).',
      metadata: { table_id: '22222222-2222-2222-2222-000000000003', current_debt: 83000, attempted_order_amount: 45000, ceiling_limit: 100000 },
      created_at: new Date(Date.now() - 120000).toISOString(),
      table_number: 'Bàn 03',
    },
    {
      id: '77777777-7777-7777-7777-000000000004',
      store_id: this.store.id,
      table_id: '22222222-2222-2222-2222-000000000005',
      event_type: 'RATE_LIMIT_ORDER_BLOCKED',
      severity: 'WARNING',
      ip_address: '10.0.0.45',
      message: 'Table "Bàn 05" blocked from Pay-Later order: Rate limit exceeded (3 orders in 4 minutes). Anti-Spam protection active.',
      metadata: { table_id: '22222222-2222-2222-2222-000000000005', rate_limit_window: '10m', request_count_attempted: 3, max_allowed: 2, endpoint: '/api/orders' },
      created_at: new Date(Date.now() - 60000).toISOString(),
      table_number: 'Bàn 05',
    },
    {
      id: '77777777-7777-7777-7777-000000000005',
      store_id: this.store.id,
      table_id: null,
      event_type: 'WEBHOOK_VERIFICATION_FAILED',
      severity: 'CRITICAL',
      ip_address: '85.234.12.99',
      message: 'CRITICAL: Webhook signature mismatch detected from SePay gateway. Possible HMAC tampering or replay attack.',
      metadata: { order_id: '55555555-5555-5555-5555-000000000001', webhook_source: 'SePay', provided_signature: 'sha256=abc...', raw_payload: { gateway: 'SePay', transactionAmount: 93000 }, user_agent: 'SePay-Webhook/2.1' },
      created_at: new Date(Date.now() - 900000).toISOString(),
      table_number: 'System',
    },
    {
      id: '77777777-7777-7777-7777-000000000006',
      store_id: this.store.id,
      table_id: null,
      event_type: 'SESSION_PRIVILEGE_ESCALATION',
      severity: 'CRITICAL',
      ip_address: '45.132.77.203',
      message: 'CRITICAL: Customer session token attempted to access Staff Dashboard API /api/orders/approve. Unauthorized role escalation blocked.',
      metadata: { attempted_endpoint: '/api/orders/approve', provided_token_role: 'customer', required_role: 'staff', extracted_table_id: 'table-07-token', user_agent: 'Mozilla/5.0 (Linux; Android)' },
      created_at: new Date(Date.now() - 1200000).toISOString(),
      table_number: 'System',
    },
    {
      id: '77777777-7777-7777-7777-000000000007',
      store_id: this.store.id,
      table_id: null,
      event_type: 'ADMIN_LOGIN_FAILED',
      severity: 'WARNING',
      ip_address: '118.70.45.12',
      message: 'Admin login failed: 3 consecutive wrong password attempts for account "admin@cybercoffee.vn".',
      metadata: { attempted_username: 'admin@cybercoffee.vn', failure_reason: 'INVALID_PASSWORD', user_agent: 'curl/7.88.1' },
      created_at: new Date(Date.now() - 1800000).toISOString(),
      table_number: 'System',
    },
    {
      id: '77777777-7777-7777-7777-000000000008',
      store_id: this.store.id,
      table_id: null,
      event_type: 'VIETQR_CONFIG_UPDATED',
      severity: 'WARNING',
      ip_address: '192.168.1.1',
      message: 'VietQR bank account configuration updated by Super Admin. Payment destination changed.',
      metadata: { admin_id: 'admin-001', old_config: { bank_code: '970422', account_no: '0987654000' }, new_config: { bank_code: '970422', account_no: '0987654321' } },
      created_at: new Date(Date.now() - 3600000).toISOString(),
      table_number: 'System',
    },
    {
      id: '77777777-7777-7777-7777-000000000009',
      store_id: this.store.id,
      table_id: null,
      event_type: 'MENU_ITEM_STOCK_TOGGLED',
      severity: 'INFO',
      ip_address: '192.168.1.55',
      message: 'Staff toggled stock status of "Cold Brew Cam Sả Đá" from available to out-of-stock.',
      metadata: { staff_id: 'staff-002', item_id: '44444444-4444-4444-4444-000000000004', item_name: 'Cold Brew Cam Sả Đá', previous_status: true, new_status: false },
      created_at: new Date(Date.now() - 7200000).toISOString(),
      table_number: 'System',
    },
    {
      id: '77777777-7777-7777-7777-000000000010',
      store_id: this.store.id,
      table_id: null,
      event_type: 'INVALID_QR_TOKEN_SCAN',
      severity: 'WARNING',
      ip_address: '45.133.1.202',
      message: 'Suspicious QR scan: Token "table-99-token" does not exist. Possible brute-force token enumeration.',
      metadata: { provided_token: 'table-99-token', scan_source: 'web', user_agent: 'python-requests/2.31.0' },
      created_at: new Date(Date.now() - 2400000).toISOString(),
      table_number: 'System',
    },
  ];

  public addOrder(order: Order, items: OrderItem[]): void {
    const table = this.tables.find((t) => t.id === order.table_id);
    const enriched: Order = {
      ...order,
      table_number: table?.table_number || 'Bàn ?',
      items,
    };
    this.orders.unshift(enriched);
    if (table) {
      table.status = order.payment_method === 'pay_later' ? 'pending_pay_later' : 'occupied';
    }
  }

  public updateOrderStatus(orderId: string, status: Order['status'], isPaid?: boolean): Order | undefined {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      this.orders[idx].status = status;
      this.orders[idx].updated_at = new Date().toISOString();
      if (typeof isPaid === 'boolean') {
        this.orders[idx].is_paid = isPaid;
      }
      return this.orders[idx];
    }
    return undefined;
  }

  public addSecurityLog(log: Omit<SecurityLog, 'id' | 'created_at'>): SecurityLog {
    const table = this.tables.find((t) => t.id === log.table_id);
    const newLog: SecurityLog = {
      ...log,
      id: `77777777-7777-7777-7777-${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      created_at: new Date().toISOString(),
      table_number: table?.table_number || (log.metadata?.blocked_table as string) || 'System',
    };
    this.security_logs.unshift(newLog);
    return newLog;
  }

  public resetTableSecurity(tableId: string): boolean {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return false;
    // Reset table status
    table.status = 'idle';
    // Clear unpaid pay_later orders for this table (mark as cancelled)
    this.orders.forEach((o) => {
      if (o.table_id === tableId && o.payment_method === 'pay_later' && !o.is_paid && o.status !== 'completed' && o.status !== 'cancelled') {
        o.status = 'cancelled';
        o.updated_at = new Date().toISOString();
      }
    });
    // Log the reset action
    this.addSecurityLog({
      store_id: this.store.id,
      table_id: tableId,
      event_type: 'PAY_LATER_APPROVED',
      severity: 'INFO',
      ip_address: '192.168.1.1',
      message: `Security reset applied to ${table.table_number}: Rate limit and debt ceiling cleared by Super Admin.`,
      metadata: { table_id: tableId, action: 'SECURITY_RESET', cleared_by: 'super_admin' },
    });
    return true;
  }

  public simulateSecurityEvent(eventType: string): SecurityLog {
    const simulatedEvents: Record<string, Omit<SecurityLog, 'id' | 'created_at'>> = {
      SESSION_PRIVILEGE_ESCALATION: {
        store_id: this.store.id,
        table_id: null,
        event_type: 'SESSION_PRIVILEGE_ESCALATION',
        severity: 'CRITICAL',
        ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        message: `SIMULATED ATTACK: Customer token attempted to access /api/admin/config. Privilege escalation blocked.`,
        metadata: { attempted_endpoint: '/api/admin/config', provided_token_role: 'customer', required_role: 'super_admin', simulated: true },
        table_number: 'System',
      },
      RATE_LIMIT_ORDER_BLOCKED: {
        store_id: this.store.id,
        table_id: '22222222-2222-2222-2222-000000000001',
        event_type: 'RATE_LIMIT_ORDER_BLOCKED',
        severity: 'WARNING',
        ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        message: `SIMULATED ATTACK: Table "Bàn 01" hit rate limit — 5 Pay-Later requests in 2 minutes. Spam shield activated.`,
        metadata: { table_id: '22222222-2222-2222-2222-000000000001', rate_limit_window: '10m', request_count_attempted: 5, max_allowed: 2, simulated: true },
        table_number: 'Bàn 01',
      },
      WEBHOOK_VERIFICATION_FAILED: {
        store_id: this.store.id,
        table_id: null,
        event_type: 'WEBHOOK_VERIFICATION_FAILED',
        severity: 'CRITICAL',
        ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        message: `SIMULATED ATTACK: Forged VietQR webhook received. HMAC signature mismatch. Replay attack suspected.`,
        metadata: { webhook_source: 'Unknown', provided_signature: 'sha256=FORGED', raw_payload: { transactionAmount: 999999 }, simulated: true },
        table_number: 'System',
      },
    };

    const event = simulatedEvents[eventType] || simulatedEvents['SESSION_PRIVILEGE_ESCALATION'];
    return this.addSecurityLog(event);
  }

  public updateSecurityThresholds(thresholds: Partial<typeof this.store.security_thresholds>): void {
    this.store.security_thresholds = { ...this.store.security_thresholds, ...thresholds };
    this.addSecurityLog({
      store_id: this.store.id,
      table_id: null,
      event_type: 'VIETQR_CONFIG_UPDATED',
      severity: 'WARNING',
      ip_address: '192.168.1.1',
      message: `Security thresholds updated by Super Admin: rate_limit=${this.store.security_thresholds.max_pay_later_per_window}/window, ceiling=${this.store.security_thresholds.unpaid_ceiling_vnd}VND.`,
      metadata: { updated_thresholds: thresholds, updated_by: 'super_admin' },
      table_number: 'System',
    });
  }
}

// Global Singleton in Next.js development
const globalForMock = global as unknown as { mockDb: MockDatabase };
export const mockDb = globalForMock.mockDb || new MockDatabase();
if (process.env.NODE_ENV !== 'production') globalForMock.mockDb = mockDb;
