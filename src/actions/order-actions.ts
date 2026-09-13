'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestContext, writeAuditLog } from '@/lib/supabase/context';
import { requireStaff } from '@/lib/auth';
import { CreateOrderInput, CreateOrderResponse } from '@/types/order';
import { Order, OrderStatus } from '@/types/database';

/** Shape returned by the create_order_with_security_check RPC. */
interface RpcOrderResult {
  success: boolean;
  order_id?: string;
  order_code?: string;
  tracking_token?: string;
  total_amount?: number;
  error_code?: string;
  message?: string;
  severity?: 'WARNING' | 'CRITICAL';
}

const ORDER_SELECT = '*, tables(table_number), order_items(*)';

type OrderRow = Order & {
  tables?: { table_number: string } | null;
  order_items?: Order['items'];
};

function shapeOrder(row: OrderRow): Order {
  const { tables, order_items, ...rest } = row;
  return {
    ...rest,
    table_number: tables?.table_number,
    items: order_items ?? [],
  };
}

/**
 * Creates an order. Every security decision — token validity, pricing, rate
 * limit, debt ceiling — happens inside one Postgres transaction, so a double
 * submit cannot slip between a check and the insert.
 */
export async function createOrderAction(
  input: CreateOrderInput
): Promise<CreateOrderResponse> {
  const supabase = createAdminClient();
  const { ip, userAgent } = await getRequestContext();

  const { data, error } = await supabase.rpc('create_order_with_security_check', {
    p_qr_token: input.qr_token,
    p_payment_method: input.payment_method,
    p_items: input.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      note: item.note || null,
    })),
    p_customer_name: input.customer_name || null,
    p_customer_phone: input.customer_phone || null,
    p_guest_session_id: input.guest_session_id || null,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    console.error('[createOrder] rpc failed', error);
    return {
      success: false,
      security_block: {
        code: 'SERVER_ERROR',
        message: 'Không thể gửi đơn lúc này. Vui lòng thử lại hoặc gọi nhân viên.',
        severity: 'WARNING',
      },
    };
  }

  const result = data as RpcOrderResult;

  if (!result?.success) {
    return {
      success: false,
      security_block: {
        code: result?.error_code ?? 'SECURITY_BLOCKED',
        message: result?.message ?? 'Yêu cầu bị từ chối bởi hệ thống bảo mật.',
        severity: result?.severity ?? 'WARNING',
      },
    };
  }

  revalidatePath('/orders');
  revalidatePath('/admin');

  return {
    success: true,
    order_id: result.order_id,
    order_code: result.order_code,
    tracking_token: result.tracking_token,
    total_amount: result.total_amount,
  };
}

/** Layer 2: staff eyeball the customer at the table, then release to the bar. */
export async function approvePayLaterAction(orderId: string): Promise<boolean> {
  if (!(await requireStaff('approvePayLaterAction'))) return false;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'paid_preparing' })
    .eq('id', orderId)
    .eq('status', 'pending_approval')
    .select('id, store_id, table_id, order_code, total_amount')
    .maybeSingle();

  if (error || !data) return false;

  await writeAuditLog({
    store_id: data.store_id,
    table_id: data.table_id,
    order_id: data.id,
    event_type: 'PAY_LATER_APPROVED',
    category: 'FINANCE',
    severity: 'INFO',
    actor_type: 'staff',
    message: `Nhân viên xác nhận khách tại bàn và duyệt đơn Trả Sau ${data.order_code}.`,
    metadata: { order_code: data.order_code, amount: data.total_amount },
  });

  revalidatePath('/orders');
  revalidatePath(`/order/${orderId}`);
  return true;
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<boolean> {
  if (!(await requireStaff('updateOrderStatusAction'))) return false;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select('id, table_id')
    .maybeSingle();

  if (error || !data) return false;

  // Release the table once nothing is outstanding on it. Without this the
  // table stays "occupied" forever after the last order is served.
  if (newStatus === 'completed' || newStatus === 'cancelled') {
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('table_id', data.table_id)
      .in('status', ['pending_approval', 'paid_preparing', 'ready']);

    if (!count) {
      await supabase.from('tables').update({ status: 'idle' }).eq('id', data.table_id);
    }
  }

  revalidatePath('/orders');
  revalidatePath(`/order/${orderId}`);
  return true;
}

/**
 * Sandbox payment confirmation. Refused outside development: this endpoint
 * marks an order paid without any money moving, so reaching it in production
 * is itself a CRITICAL security event (MOCK_PAY_PROD_TRIGGERED).
 */
export async function mockPaySuccessAction(orderId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, store_id, table_id, order_code, total_amount')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return false;

  if (process.env.NODE_ENV === 'production') {
    await writeAuditLog({
      store_id: order.store_id,
      table_id: order.table_id,
      order_id: order.id,
      event_type: 'MOCK_PAY_PROD_TRIGGERED',
      category: 'FINANCE',
      severity: 'CRITICAL',
      actor_type: 'guest',
      message: `Endpoint giả lập thanh toán bị gọi trong môi trường Production cho đơn ${order.order_code}.`,
      metadata: { order_code: order.order_code, amount: order.total_amount },
    });
    return false;
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'paid_preparing',
      is_paid: true,
      paid_at: new Date().toISOString(),
      paid_reference: 'MOCK_SANDBOX',
    })
    .eq('id', orderId);

  if (error) return false;

  await writeAuditLog({
    store_id: order.store_id,
    table_id: order.table_id,
    order_id: order.id,
    event_type: 'ORDER_PAID_SUCCESS',
    category: 'FINANCE',
    severity: 'INFO',
    actor_type: 'system',
    message: `Thanh toán (sandbox) được xác nhận cho đơn ${order.order_code}.`,
    metadata: {
      order_code: order.order_code,
      amount: order.total_amount,
      payment_method: 'pay_now',
      confirmed_by_webhook: false,
    },
  });

  revalidatePath('/orders');
  revalidatePath(`/order/${orderId}`);
  return true;
}

export async function getOrderByIdAction(orderId: string): Promise<Order | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .maybeSingle();

  return data ? shapeOrder(data as OrderRow) : null;
}

export async function getAllOrdersAction(): Promise<Order[]> {
  if (!(await requireStaff('getAllOrdersAction'))) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false })
    .limit(200);

  return (data ?? []).map((row) => shapeOrder(row as OrderRow));
}
