'use server';

import { revalidatePath } from 'next/cache';
import { CreateOrderInput, CreateOrderResponse } from '@/types/order';
import { checkPayLaterSecurityLayer } from '@/lib/security/rate-limit';
import { mockDb } from '@/lib/supabase/mock-data';
import { Order, OrderItem } from '@/types/database';

export async function createOrderAction(
  input: CreateOrderInput
): Promise<CreateOrderResponse> {
  const totalAmount = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 1. If customer selected Pay-Later, enforce Layer 1 Security Checks!
  if (input.payment_method === 'pay_later') {
    const securityCheck = await checkPayLaterSecurityLayer(
      input.table_id,
      totalAmount
    );
    if (!securityCheck.allowed) {
      return {
        success: false,
        security_block: {
          code: securityCheck.error_code || 'SECURITY_BLOCKED',
          message: securityCheck.message || 'Yêu cầu bị từ chối bởi hệ thống bảo mật SOC.',
          severity: securityCheck.severity || 'WARNING',
        },
      };
    }
  }

  // 2. Create new order
  const orderId = `55555555-5555-5555-5555-${String(Math.floor(Math.random() * 90000000) + 10000000)}`;
  const orderCode = `SOC-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const initialStatus =
    input.payment_method === 'pay_now' ? 'pending_approval' : 'pending_approval';

  const newOrder: Order = {
    id: orderId,
    store_id: input.store_id,
    table_id: input.table_id,
    order_code: orderCode,
    payment_method: input.payment_method,
    status: initialStatus,
    total_amount: totalAmount,
    customer_name: input.customer_name || 'Khách Tại Bàn',
    customer_phone: input.customer_phone || '',
    is_paid: false,
    created_at: now,
    updated_at: now,
  };

  const newItems: OrderItem[] = input.items.map((item, index) => ({
    id: `66666666-6666-6666-6666-${String(Math.floor(Math.random() * 90000000) + 10000000 + index)}`,
    order_id: orderId,
    product_id: item.product_id,
    product_name: item.product_name,
    price: item.price,
    quantity: item.quantity,
    note: item.note || null,
    created_at: now,
  }));

  mockDb.addOrder(newOrder, newItems);

  // Log NEW_ORDER to SIEM SOC
  mockDb.addSecurityLog({
    store_id: input.store_id,
    table_id: input.table_id,
    event_type: 'NEW_ORDER',
    severity: 'INFO',
    message: `New ${input.payment_method === 'pay_now' ? 'Pay-Now (VietQR)' : 'Pay-Later'} Order #${orderCode} (${totalAmount.toLocaleString('vi-VN')} VND) submitted.`,
    metadata: {
      order_code: orderCode,
      payment_method: input.payment_method,
      amount: totalAmount,
      items: input.items.length,
    },
  });

  revalidatePath('/orders');
  revalidatePath('/');
  return {
    success: true,
    order_id: orderId,
    order_code: orderCode,
  };
}

// Layer 2 Defense: Staff Approves Pay-Later Order after visual verification at table
export async function approvePayLaterAction(orderId: string): Promise<boolean> {
  const updated = mockDb.updateOrderStatus(orderId, 'paid_preparing', false);
  if (updated) {
    mockDb.addSecurityLog({
      store_id: updated.store_id,
      table_id: updated.table_id,
      event_type: 'PAY_LATER_APPROVED',
      severity: 'INFO',
      message: `Staff visually verified customer and approved Pay-Later Order #${updated.order_code}. Kitchen preparing.`,
      metadata: { order_code: updated.order_code, table_id: updated.table_id },
    });
    revalidatePath('/orders');
    revalidatePath(`/order/${orderId}`);
    return true;
  }
  return false;
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: Order['status']
): Promise<boolean> {
  const updated = mockDb.updateOrderStatus(orderId, newStatus);
  if (updated) {
    revalidatePath('/orders');
    revalidatePath(`/order/${orderId}`);
    return true;
  }
  return false;
}

// Instant Demo/Webhook simulation: Pay-Now payment verified
export async function mockPaySuccessAction(orderId: string): Promise<boolean> {
  const updated = mockDb.updateOrderStatus(orderId, 'paid_preparing', true);
  if (updated) {
    mockDb.addSecurityLog({
      store_id: updated.store_id,
      table_id: updated.table_id,
      event_type: 'WEBHOOK_PAID',
      severity: 'INFO',
      message: `VietQR payment verified for Order #${updated.order_code} (${updated.total_amount.toLocaleString('vi-VN')} VND). Automated transition to preparing.`,
      metadata: { order_code: updated.order_code, amount: updated.total_amount },
    });
    revalidatePath('/orders');
    revalidatePath(`/order/${orderId}`);
    return true;
  }
  return false;
}

export async function getOrderByIdAction(orderId: string): Promise<Order | null> {
  const order = mockDb.orders.find((o) => o.id === orderId);
  return order || null;
}

export async function getAllOrdersAction(): Promise<Order[]> {
  return [...mockDb.orders];
}
