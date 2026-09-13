export interface CartItem {
  product_id: string;
  product_name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  note: string;
}

export interface SecurityCheckResult {
  allowed: boolean;
  error_code?: 'RATE_LIMIT_EXCEEDED' | 'UNPAID_CEILING_EXCEEDED';
  message?: string;
  severity?: 'WARNING' | 'CRITICAL';
}

export interface CreateOrderInput {
  store_id: string;
  table_id: string;
  payment_method: 'pay_now' | 'pay_later';
  customer_name: string;
  customer_phone: string;
  items: CartItem[];
}

export interface CreateOrderResponse {
  success: boolean;
  order_id?: string;
  order_code?: string;
  security_block?: {
    code: string;
    message: string;
    severity: 'WARNING' | 'CRITICAL';
  };
}
