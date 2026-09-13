import { SecurityCheckResult } from '@/types/order';
import { mockDb } from '@/lib/supabase/mock-data';

// Layer 1 System Limits Defense — thresholds are now configurable live via /admin/config
// Rule 1: Max N Pay-Later orders within window per Table (configurable)
// Rule 2: Unpaid Order Ceiling -> Cannot place Pay-Later order if Table unpaid balance >= ceiling (configurable)

export async function checkPayLaterSecurityLayer(
  tableId: string,
  newOrderAmount: number
): Promise<SecurityCheckResult> {
  const { max_pay_later_per_window, rate_limit_window_min, unpaid_ceiling_vnd } =
    mockDb.store.security_thresholds;

  const now = Date.now();
  const windowStart = new Date(now - rate_limit_window_min * 60 * 1000).toISOString();

  // 1. Rate-limit: count recent Pay-Later orders for this table within the window
  const recentPayLaterOrders = mockDb.orders.filter(
    (o) =>
      o.table_id === tableId &&
      o.payment_method === 'pay_later' &&
      o.created_at >= windowStart
  );

  if (recentPayLaterOrders.length >= max_pay_later_per_window) {
    const table = mockDb.tables.find((t) => t.id === tableId);
    const tableName = table?.table_number || 'Bàn Khách';

    mockDb.addSecurityLog({
      store_id: mockDb.store.id,
      table_id: tableId,
      event_type: 'RATE_LIMIT_ORDER_BLOCKED',
      severity: 'WARNING',
      message: `Table "${tableName}" blocked from Pay-Later order: Exceeded rate limit of ${max_pay_later_per_window} orders within ${rate_limit_window_min} minutes. Anti-Spam protection triggered.`,
      metadata: {
        blocked_table: tableName,
        attempts_in_window: recentPayLaterOrders.length + 1,
        limit: max_pay_later_per_window,
        rate_limit_window: `${rate_limit_window_min}m`,
        endpoint: '/api/orders',
      },
    });

    return {
      allowed: false,
      error_code: 'RATE_LIMIT_EXCEEDED',
      severity: 'CRITICAL',
      message: `Hệ thống bảo mật từ chối: Bàn đã tạo ${recentPayLaterOrders.length} đơn Trả Sau trong ${rate_limit_window_min} phút qua. Vui lòng thanh toán đơn cũ hoặc liên hệ nhân viên phục vụ để tránh đơn hàng ảo.`,
    };
  }

  // 2. Unpaid Order Ceiling: total unpaid pay_later balance for this table
  const pendingPayLaterOrders = mockDb.orders.filter(
    (o) =>
      o.table_id === tableId &&
      o.payment_method === 'pay_later' &&
      !o.is_paid &&
      o.status !== 'completed' &&
      o.status !== 'cancelled'
  );

  const totalUnpaidBalance = pendingPayLaterOrders.reduce(
    (sum, o) => sum + o.total_amount,
    0
  );

  if (totalUnpaidBalance + newOrderAmount > unpaid_ceiling_vnd) {
    const table = mockDb.tables.find((t) => t.id === tableId);
    const tableName = table?.table_number || 'Bàn Khách';

    mockDb.addSecurityLog({
      store_id: mockDb.store.id,
      table_id: tableId,
      event_type: 'PAY_LATER_CEILING_BLOCKED',
      severity: 'WARNING',
      message: `Table "${tableName}" blocked from new Pay-Later order: Unpaid pending balance of ${totalUnpaidBalance.toLocaleString('vi-VN')} VND + new order ${newOrderAmount.toLocaleString('vi-VN')} VND exceeds ceiling limit (${unpaid_ceiling_vnd.toLocaleString('vi-VN')} VND).`,
      metadata: {
        blocked_table: tableName,
        current_debt: totalUnpaidBalance,
        attempted_order_amount: newOrderAmount,
        ceiling_limit: unpaid_ceiling_vnd,
      },
    });

    return {
      allowed: false,
      error_code: 'UNPAID_CEILING_EXCEEDED',
      severity: 'WARNING',
      message: `Bàn đang có đơn nợ Trả Sau trị giá ${totalUnpaidBalance.toLocaleString('vi-VN')}đ chưa xác nhận/thanh toán (chạm ngưỡng trần ${unpaid_ceiling_vnd.toLocaleString('vi-VN')}đ). Vui lòng chờ nhân viên duyệt đơn hoặc thanh toán đơn cũ.`,
    };
  }

  return {
    allowed: true,
  };
}
