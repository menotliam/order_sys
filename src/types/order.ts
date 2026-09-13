/** A line in the customer's cart. Price is for display only — the server
 *  prices the order from the products table, never from this payload. */
export interface CartItem {
  product_id: string;
  product_name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  note: string;
}

export interface CreateOrderInput {
  /** The table is identified by its QR token, not by a client-supplied
   *  table_id. Sending an id let a customer charge another table's debt. */
  qr_token: string;
  payment_method: 'pay_now' | 'pay_later';
  customer_name: string;
  customer_phone: string;
  items: CartItem[];
  guest_session_id?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order_id?: string;
  order_code?: string;
  tracking_token?: string;
  total_amount?: number;
  security_block?: {
    code: string;
    message: string;
    severity: 'WARNING' | 'CRITICAL';
  };
}
