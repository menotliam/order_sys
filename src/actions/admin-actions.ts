'use server';

import { revalidatePath } from 'next/cache';
import { mockDb } from '@/lib/supabase/mock-data';
import { SecurityLog, Store, CafeTable, CashflowDataPoint, SecurityThresholds } from '@/types/database';

// Mapping event_type -> category for filtering
const EVENT_CATEGORY: Record<string, string> = {
  WEBHOOK_VERIFICATION_FAILED: 'FINANCE',
  PAY_LATER_CEILING_BLOCKED: 'FINANCE',
  UNPAID_CEILING_BLOCKED: 'FINANCE',
  MOCK_PAY_PROD_TRIGGERED: 'FINANCE',
  ORDER_PAID_SUCCESS: 'FINANCE',
  WEBHOOK_PAID: 'FINANCE',
  SESSION_PRIVILEGE_ESCALATION: 'AUTH',
  ADMIN_LOGIN_FAILED: 'AUTH',
  VIETQR_CONFIG_UPDATED: 'INTEGRITY',
  MENU_ITEM_STOCK_TOGGLED: 'INTEGRITY',
  PAY_LATER_APPROVED: 'LEGACY',
  RATE_LIMIT_ORDER_BLOCKED: 'SPAM',
  RATE_LIMIT_BLOCKED: 'SPAM',
  INVALID_QR_TOKEN_SCAN: 'SPAM',
  NEW_ORDER: 'LEGACY',
};

/**
 * Strict whole-word search: returns true only if query matches a full word
 * boundary in the text (case-insensitive). Prevents false positives from
 * partial string matches (e.g. "01" matching "table-01-token" anywhere).
 */
function strictWordMatch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(text);
}

export async function getSocTelemetryLogsAction(
  filterSeverity?: string,
  filterCategory?: string,
  searchQuery?: string
): Promise<SecurityLog[]> {
  let logs = [...mockDb.security_logs];

  if (filterSeverity && filterSeverity !== 'ALL') {
    logs = logs.filter((l) => l.severity === filterSeverity);
  }
  if (filterCategory && filterCategory !== 'ALL') {
    logs = logs.filter((l) => EVENT_CATEGORY[l.event_type] === filterCategory);
  }
  if (searchQuery && searchQuery.trim()) {
    logs = logs.filter((l) => {
      const searchTarget = [
        l.message,
        l.event_type,
        l.ip_address || '',
        l.table_number || '',
        JSON.stringify(l.metadata),
      ].join(' ');
      return strictWordMatch(searchTarget, searchQuery.trim());
    });
  }

  return logs;
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
  const totalOrders = mockDb.orders.length;
  const grossGmv = mockDb.orders.reduce((sum, o) => sum + o.total_amount, 0);
  const payNowCount = mockDb.orders.filter((o) => o.payment_method === 'pay_now').length;
  const payLaterCount = mockDb.orders.filter((o) => o.payment_method === 'pay_later').length;
  const blockedAttemptsCount = mockDb.security_logs.filter(
    (l) =>
      l.event_type === 'RATE_LIMIT_BLOCKED' ||
      l.event_type === 'RATE_LIMIT_ORDER_BLOCKED' ||
      l.event_type === 'UNPAID_CEILING_BLOCKED' ||
      l.event_type === 'PAY_LATER_CEILING_BLOCKED' ||
      l.event_type === 'SESSION_PRIVILEGE_ESCALATION' ||
      l.event_type === 'WEBHOOK_VERIFICATION_FAILED'
  ).length;
  const activeTablesCount = mockDb.tables.filter((t) => t.status !== 'idle').length;

  return {
    grossGmv,
    totalOrders,
    payNowCount,
    payLaterCount,
    blockedAttemptsCount,
    activeTablesCount,
    storeName: mockDb.store.name,
  };
}

export async function getStoreConfigAction(): Promise<{
  store: Store;
  tables: CafeTable[];
}> {
  return {
    store: { ...mockDb.store },
    tables: [...mockDb.tables],
  };
}

export async function getOperationsOverviewAction(): Promise<{
  tables: CafeTable[];
  cashflow: CashflowDataPoint[];
  totalRevenue: number;
  totalOrders: number;
}> {
  const totalRevenue = mockDb.orders.reduce((s, o) => s + o.total_amount, 0);
  return {
    tables: [...mockDb.tables],
    cashflow: [...mockDb.cashflow_series],
    totalRevenue,
    totalOrders: mockDb.orders.length,
  };
}

export async function resetTableSecurityAction(tableId: string): Promise<{ success: boolean; table?: CafeTable }> {
  const ok = mockDb.resetTableSecurity(tableId);
  const table = mockDb.tables.find((t) => t.id === tableId);
  revalidatePath('/admin');
  revalidatePath('/admin/operations');
  return { success: ok, table: table ? { ...table } : undefined };
}

export async function simulateSecurityEventAction(eventType: string): Promise<SecurityLog> {
  const log = mockDb.simulateSecurityEvent(eventType);
  revalidatePath('/admin');
  return log;
}

export async function updateSecurityThresholdsAction(
  thresholds: Partial<SecurityThresholds>
): Promise<boolean> {
  mockDb.updateSecurityThresholds(thresholds);
  revalidatePath('/admin');
  return true;
}

export async function updateStoreVietQRAction(
  bankId: string,
  accountNo: string,
  accountName: string
): Promise<boolean> {
  mockDb.store.vietqr_bank_id = bankId;
  mockDb.store.vietqr_account_no = accountNo;
  mockDb.store.vietqr_account_name = accountName;
  mockDb.addSecurityLog({
    store_id: mockDb.store.id,
    table_id: null,
    event_type: 'VIETQR_CONFIG_UPDATED',
    severity: 'WARNING',
    ip_address: '192.168.1.1',
    message: `VietQR config updated: Bank=${bankId}, Account=${accountNo}, Name=${accountName}.`,
    metadata: { new_config: { bank_code: bankId, account_no: accountNo, account_name: accountName }, updated_by: 'super_admin' },
    table_number: 'System',
  });
  revalidatePath('/stores');
  revalidatePath('/checkout');
  return true;
}
