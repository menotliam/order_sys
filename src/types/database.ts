export type TableStatus = 'idle' | 'occupied' | 'pending_pay_later' | 'blocked_rate_limit' | 'blocked_debt';

export type OrderStatus = 'pending_approval' | 'paid_preparing' | 'ready' | 'completed' | 'cancelled';

export type PaymentMethod = 'pay_now' | 'pay_later';

export type SecurityLogSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type SecurityLogEventType =
  // Legacy (preserved for backward compatibility)
  | 'RATE_LIMIT_BLOCKED'
  | 'UNPAID_CEILING_BLOCKED'
  | 'WEBHOOK_PAID'
  | 'PAY_LATER_APPROVED'
  | 'NEW_ORDER'
  // Financial & Payment Group
  | 'WEBHOOK_VERIFICATION_FAILED'
  | 'PAY_LATER_CEILING_BLOCKED'
  | 'MOCK_PAY_PROD_TRIGGERED'
  | 'ORDER_PAID_SUCCESS'
  // Auth & Identity Group
  | 'SESSION_PRIVILEGE_ESCALATION'
  | 'ADMIN_LOGIN_FAILED'
  // Data Integrity Group
  | 'VIETQR_CONFIG_UPDATED'
  | 'MENU_ITEM_STOCK_TOGGLED'
  // Anti-Spam Group
  | 'RATE_LIMIT_ORDER_BLOCKED'
  | 'INVALID_QR_TOKEN_SCAN';

export type SecurityLogCategory = 'FINANCE' | 'AUTH' | 'INTEGRITY' | 'SPAM' | 'LEGACY';

export interface SecurityThresholds {
  max_pay_later_per_window: number;
  rate_limit_window_min: number;
  unpaid_ceiling_vnd: number;
  audio_alert_enabled: boolean;
}

export interface CashflowDataPoint {
  time: string;
  revenue: number;
  orderCount: number;
}

export interface Store {
  id: string;
  name: string;
  logo_url: string | null;
  vietqr_bank_id: string;
  vietqr_account_no: string;
  vietqr_account_name: string;
  is_active: boolean;
  created_at: string;
  security_thresholds: SecurityThresholds;
}

export interface CafeTable {
  id: string;
  store_id: string;
  table_number: string;
  qr_token: string;
  status: TableStatus;
  created_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  note: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  table_id: string;
  order_code: string;
  payment_method: PaymentMethod;
  status: OrderStatus;
  total_amount: number;
  customer_name: string | null;
  customer_phone: string | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  table_number?: string;
  items?: OrderItem[];
}

export interface SecurityLog {
  id: string;
  store_id: string;
  table_id: string | null;
  event_type: SecurityLogEventType;
  severity: SecurityLogSeverity;
  message: string;
  ip_address?: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  table_number?: string;
}

export interface Profile {
  id: string;
  email: string;
  role: 'super_admin' | 'store_owner' | 'staff';
  store_id: string | null;
  created_at: string;
}
