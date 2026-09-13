'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getActiveStoreId, writeAuditLog } from '@/lib/supabase/context';
import { requireStaff, requireAdmin } from '@/lib/auth';
import {
  SecurityLog,
  Store,
  CafeTable,
  CashflowDataPoint,
  SecurityThresholds,
  PublicTableInfo,
} from '@/types/database';

/** Columns of `stores` that are safe to hand to a browser. webhook_secret is
 *  absent by construction rather than stripped after the fact. */
const STORE_PUBLIC_COLUMNS =
  'id, name, logo_url, vietqr_bank_id, vietqr_account_no, vietqr_account_name, is_active, created_at, security_thresholds';

interface TableStatusRow {
  id: string;
  table_number: string;
  sort_order: number;
  qr_token: string;
  status: CafeTable['status'];
  open_orders: number;
  unpaid_debt: number;
}

async function loadTables(storeId: string): Promise<CafeTable[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc('table_security_status', { p_store_id: storeId });

  return ((data ?? []) as TableStatusRow[]).map((row) => ({
    id: row.id,
    store_id: storeId,
    table_number: row.table_number,
    qr_token: row.qr_token,
    status: row.status,
    sort_order: row.sort_order,
    created_at: '',
    open_orders: row.open_orders,
    unpaid_debt: row.unpaid_debt,
  }));
}

/**
 * What a customer gets from scanning one QR code: their own table, and the
 * store fields needed to render a VietQR code.
 *
 * The customer pages previously called getStoreConfigAction() and searched
 * its table list client-side, which shipped every table's qr_token to every
 * customer's browser — the exact bypass the random tokens exist to prevent.
 */
export async function resolveTableAction(qrToken: string): Promise<{
  store: Store;
  table: PublicTableInfo;
} | null> {
  const supabase = createAdminClient();

  const { data: table } = await supabase
    .from('tables')
    .select('id, table_number, store_id')
    .eq('qr_token', qrToken)
    .eq('is_active', true)
    .maybeSingle();

  if (!table) {
    const storeId = await getActiveStoreId();
    await writeAuditLog({
      store_id: storeId,
      event_type: 'INVALID_QR_TOKEN_SCAN',
      category: 'SPAM',
      severity: 'WARNING',
      actor_type: 'guest',
      message: 'Quét mã QR với token không tồn tại hoặc đã bị vô hiệu hoá.',
      metadata: { provided_token: qrToken.slice(0, 64), scan_source: 'qr_landing' },
    });
    return null;
  }

  const { data: store } = await supabase
    .from('stores')
    .select(STORE_PUBLIC_COLUMNS)
    .eq('id', table.store_id)
    .maybeSingle();

  if (!store) return null;

  return {
    store: store as unknown as Store,
    table: { id: table.id, table_number: table.table_number },
  };
}

/**
 * Store details a customer surface may see: name, logo and the VietQR fields
 * that end up printed on the QR code anyway. Returns no table list, so a
 * customer page cannot become a directory of every table's token.
 */
export async function getPublicStoreAction(): Promise<Store | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('stores')
    .select(STORE_PUBLIC_COLUMNS)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as unknown as Store) ?? null;
}

/** Staff and admin view: includes qr_token, because the tables page renders
 *  the printable QR codes from it. */
export async function getStoreConfigAction(): Promise<{
  store: Store;
  tables: CafeTable[];
}> {
  if (!(await requireStaff('getStoreConfigAction'))) {
    throw new Error('Không có quyền truy cập cấu hình cửa hàng.');
  }

  const supabase = createAdminClient();
  const { data: store } = await supabase
    .from('stores')
    .select(STORE_PUBLIC_COLUMNS)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!store) throw new Error('Chưa có cửa hàng nào trong database. Hãy chạy supabase/seed.sql.');

  return {
    store: store as unknown as Store,
    tables: await loadTables(store.id),
  };
}

export async function getSocTelemetryLogsAction(
  filterSeverity?: string,
  filterCategory?: string,
  searchQuery?: string
): Promise<SecurityLog[]> {
  if (!(await requireAdmin('getSocTelemetryLogsAction'))) return [];

  const storeId = await getActiveStoreId();
  if (!storeId) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('search_security_logs', {
    p_store_id: storeId,
    p_severity: filterSeverity ?? null,
    p_category: filterCategory ?? null,
    p_query: searchQuery?.trim() || null,
    p_limit: 200,
  });

  if (error) {
    console.error('[soc] log search failed', error);
    return [];
  }
  return (data ?? []) as SecurityLog[];
}

export async function getPlatformMetricsAction(): Promise<{
  grossGmv: number;
  totalOrders: number;
  payNowCount: number;
  payLaterCount: number;
  blockedAttemptsCount: number;
  activeTablesCount: number;
  storeName: string;
}> {
  if (!(await requireAdmin('getPlatformMetricsAction'))) {
    throw new Error('Không có quyền xem số liệu hệ thống.');
  }

  const supabase = createAdminClient();
  const storeId = await getActiveStoreId();

  if (!storeId) {
    return {
      grossGmv: 0,
      totalOrders: 0,
      payNowCount: 0,
      payLaterCount: 0,
      blockedAttemptsCount: 0,
      activeTablesCount: 0,
      storeName: '—',
    };
  }

  const [storeRes, ordersRes, blocksRes, tables] = await Promise.all([
    supabase.from('stores').select('name').eq('id', storeId).maybeSingle(),
    supabase
      .from('orders')
      .select('total_amount, payment_method')
      .eq('store_id', storeId)
      .neq('status', 'cancelled'),
    supabase
      .from('security_logs')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .in('severity', ['WARNING', 'CRITICAL']),
    loadTables(storeId),
  ]);

  const orders = ordersRes.data ?? [];

  return {
    grossGmv: orders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0),
    totalOrders: orders.length,
    payNowCount: orders.filter((o) => o.payment_method === 'pay_now').length,
    payLaterCount: orders.filter((o) => o.payment_method === 'pay_later').length,
    blockedAttemptsCount: blocksRes.count ?? 0,
    activeTablesCount: tables.filter((t) => t.status !== 'idle').length,
    storeName: storeRes.data?.name ?? '—',
  };
}

export async function getOperationsOverviewAction(): Promise<{
  tables: CafeTable[];
  cashflow: CashflowDataPoint[];
  totalRevenue: number;
  totalOrders: number;
}> {
  if (!(await requireAdmin('getOperationsOverviewAction'))) {
    return { tables: [], cashflow: [], totalRevenue: 0, totalOrders: 0 };
  }

  const storeId = await getActiveStoreId();
  if (!storeId) {
    return { tables: [], cashflow: [], totalRevenue: 0, totalOrders: 0 };
  }

  const supabase = createAdminClient();
  const [tables, cashflowRes, ordersRes] = await Promise.all([
    loadTables(storeId),
    supabase.rpc('cashflow_series', { p_store_id: storeId, p_hours: 12 }),
    supabase
      .from('orders')
      .select('total_amount')
      .eq('store_id', storeId)
      .neq('status', 'cancelled'),
  ]);

  const buckets = (cashflowRes.data ?? []) as Array<{
    bucket: string;
    revenue: number;
    order_count: number;
  }>;

  const orders = ordersRes.data ?? [];

  return {
    tables,
    cashflow: buckets.map((b) => ({
      time: new Date(b.bucket).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      revenue: b.revenue,
      orderCount: b.order_count,
    })),
    totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0),
    totalOrders: orders.length,
  };
}

/**
 * Grants a time-boxed rate-limit exemption for one table.
 *
 * It deliberately does NOT clear unpaid debt. A table blocked by the debt
 * ceiling is a table that owes money; clearing that here would erase the
 * record of uncollected cash. Marking the debt collected is a separate
 * action, because it is a different real-world event.
 */
export async function resetTableSecurityAction(
  tableId: string
): Promise<{ success: boolean; table?: CafeTable }> {
  const profile = await requireStaff('resetTableSecurityAction');
  if (!profile) return { success: false };

  const supabase = createAdminClient();

  const { data: table } = await supabase
    .from('tables')
    .select('id, store_id, table_number')
    .eq('id', tableId)
    .maybeSingle();

  if (!table) return { success: false };

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await writeAuditLog({
    store_id: table.store_id,
    table_id: table.id,
    event_type: 'RATE_LIMIT_EXEMPTION_GRANTED',
    category: 'SPAM',
    severity: 'WARNING',
    actor_type: profile.role === 'admin' ? 'admin' : 'staff',
    actor_id: profile.id,
    message: `Tạm bỏ qua giới hạn tần suất cho ${table.table_number} trong 15 phút.`,
    metadata: { expires_at: expiresAt, table_number: table.table_number },
  });

  const tables = await loadTables(table.store_id);

  revalidatePath('/admin');
  revalidatePath('/admin/operations');
  return { success: true, table: tables.find((t) => t.id === tableId) };
}

const SIMULATED_EVENTS: Record<
  string,
  { category: SecurityLog['category']; severity: SecurityLog['severity']; message: string; metadata: Record<string, unknown> }
> = {
  SESSION_PRIVILEGE_ESCALATION: {
    category: 'AUTH',
    severity: 'CRITICAL',
    message: 'Session khách cố gắng truy cập API dành riêng cho Dashboard nhân viên.',
    metadata: {
      attempted_endpoint: '/api/orders/approve',
      provided_token_role: 'guest',
      required_role: 'staff',
    },
  },
  RATE_LIMIT_ORDER_BLOCKED: {
    category: 'SPAM',
    severity: 'WARNING',
    message: 'Phát hiện flood đơn Trả Sau vượt ngưỡng cửa sổ thời gian.',
    metadata: {
      attempts_in_window: 3,
      max_allowed: 2,
      rate_limit_window: '10m',
      endpoint: '/checkout',
    },
  },
  WEBHOOK_VERIFICATION_FAILED: {
    category: 'FINANCE',
    severity: 'CRITICAL',
    message: 'Chữ ký HMAC từ cổng thanh toán không khớp — nghi vấn giả mạo payload.',
    metadata: {
      webhook_source: 'sepay',
      provided_signature: 'c0ffee...deadbeef',
      raw_payload: { gateway: 'SEPAY', transactionAmount: 45000 },
    },
  },
  INVALID_QR_TOKEN_SCAN: {
    category: 'SPAM',
    severity: 'WARNING',
    message: 'Quét dò tìm mã QR: token bàn không tồn tại, lặp lại từ cùng một nguồn.',
    metadata: { provided_token: 'table-99-token', scan_source: 'brute_force_probe' },
  },
};

export async function simulateSecurityEventAction(eventType: string): Promise<boolean> {
  if (!(await requireAdmin('simulateSecurityEventAction'))) return false;

  const storeId = await getActiveStoreId();
  const preset = SIMULATED_EVENTS[eventType];
  if (!storeId || !preset) return false;

  await writeAuditLog({
    store_id: storeId,
    event_type: eventType,
    category: preset.category,
    severity: preset.severity,
    actor_type: 'system',
    message: preset.message,
    metadata: { ...preset.metadata, simulated: true },
  });

  revalidatePath('/admin');
  return true;
}

export async function updateSecurityThresholdsAction(
  thresholds: Partial<SecurityThresholds>
): Promise<boolean> {
  const profile = await requireAdmin('updateSecurityThresholdsAction');
  if (!profile) return false;

  const supabase = createAdminClient();
  const storeId = await getActiveStoreId();
  if (!storeId) return false;

  const { data: current } = await supabase
    .from('stores')
    .select('security_thresholds')
    .eq('id', storeId)
    .maybeSingle();

  const merged = { ...(current?.security_thresholds ?? {}), ...thresholds };

  const { error } = await supabase
    .from('stores')
    .update({ security_thresholds: merged })
    .eq('id', storeId);

  if (error) return false;

  await writeAuditLog({
    store_id: storeId,
    event_type: 'SECURITY_THRESHOLD_UPDATED',
    category: 'INTEGRITY',
    severity: 'WARNING',
    actor_type: 'admin',
    actor_id: profile.id,
    message: 'Ngưỡng bảo mật Layer-1 được cập nhật.',
    metadata: { old_config: current?.security_thresholds ?? {}, new_config: merged },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/config');
  return true;
}

export async function updateStoreVietQRAction(
  bankId: string,
  accountNo: string,
  accountName: string
): Promise<boolean> {
  const profile = await requireAdmin('updateStoreVietQRAction');
  if (!profile) return false;

  const supabase = createAdminClient();
  const storeId = await getActiveStoreId();
  if (!storeId) return false;

  const { data: before } = await supabase
    .from('stores')
    .select('vietqr_bank_id, vietqr_account_no, vietqr_account_name')
    .eq('id', storeId)
    .maybeSingle();

  const { error } = await supabase
    .from('stores')
    .update({
      vietqr_bank_id: bankId,
      vietqr_account_no: accountNo,
      vietqr_account_name: accountName,
    })
    .eq('id', storeId);

  if (error) return false;

  // Anything that changes where money lands must be traceable afterwards.
  await writeAuditLog({
    store_id: storeId,
    event_type: 'VIETQR_CONFIG_UPDATED',
    category: 'INTEGRITY',
    severity: 'WARNING',
    actor_type: 'admin',
    actor_id: profile.id,
    message: `Cấu hình nhận tiền VietQR được thay đổi: ${accountNo} (${bankId}).`,
    metadata: {
      old_config: {
        bank_code: before?.vietqr_bank_id,
        account_no: before?.vietqr_account_no,
        account_name: before?.vietqr_account_name,
      },
      new_config: { bank_code: bankId, account_no: accountNo, account_name: accountName },
    },
  });

  revalidatePath('/admin/config');
  revalidatePath('/checkout');
  return true;
}
