export type TableStatus =
  | 'idle'
  | 'occupied'
  | 'pending_pay_later'
  // Derived at query time by table_security_status(); never stored. A stored
  // flag could not expire when the rate-limit window closed.
  | 'blocked_rate_limit'
  | 'blocked_debt';

export type OrderStatus =
  | 'pending_approval'
  | 'paid_preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'pay_now' | 'pay_later';

export type SecurityLogSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type SecurityLogCategory = 'FINANCE' | 'AUTH' | 'INTEGRITY' | 'SPAM';

export type ActorType = 'guest' | 'staff' | 'admin' | 'system' | 'webhook';

/**
 * Known event types, kept for autocomplete only. The column accepts any
 * string on purpose: a rejected INSERT on a telemetry table means a dropped
 * security event, which is worse than an unrecognised label.
 */
export type KnownSecurityEvent =
  | 'NEW_ORDER'
  | 'ORDER_PAID_SUCCESS'
  | 'PAY_LATER_APPROVED'
  | 'PAY_LATER_CEILING_BLOCKED'
  | 'WEBHOOK_VERIFICATION_FAILED'
  | 'MOCK_PAY_PROD_TRIGGERED'
  | 'SESSION_PRIVILEGE_ESCALATION'
  | 'ADMIN_LOGIN_FAILED'
  | 'VIETQR_CONFIG_UPDATED'
  | 'SECURITY_THRESHOLD_UPDATED'
  | 'MENU_ITEM_STOCK_TOGGLED'
  | 'RATE_LIMIT_ORDER_BLOCKED'
  | 'RATE_LIMIT_EXEMPTION_GRANTED'
  | 'INVALID_QR_TOKEN_SCAN';

export type SecurityLogEventType = KnownSecurityEvent | (string & {});

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

/**
 * Store as exposed to the application. webhook_secret is deliberately absent:
 * Server Actions return their result to the browser, so a field that must
 * never reach a client should not be in the type that crosses that boundary.
 */
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
  sort_order: number;
  created_at: string;
  open_orders?: number;
  unpaid_debt?: number;
}

/** What a customer is allowed to learn from scanning one QR code. */
export interface PublicTableInfo {
  id: string;
  table_number: string;
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
  sort_order: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
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
  tracking_token: string;
  payment_method: PaymentMethod;
  status: OrderStatus;
  total_amount: number;
  customer_name: string | null;
  customer_phone: string | null;
  is_paid: boolean;
  paid_at: string | null;
  paid_reference: string | null;
  created_at: string;
  updated_at: string;
  table_number?: string;
  items?: OrderItem[];
}

export interface SecurityLog {
  id: string;
  store_id: string;
  table_id: string | null;
  order_id: string | null;
  event_type: SecurityLogEventType;
  category: SecurityLogCategory;
  severity: SecurityLogSeverity;
  message: string;
  ip_address?: string | null;
  user_agent?: string | null;
  actor_type?: ActorType | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  table_number?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'staff';
  store_id: string | null;
  is_active: boolean;
  created_at: string;
}
