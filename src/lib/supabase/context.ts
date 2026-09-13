import 'server-only';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SecurityLogCategory, SecurityLogSeverity, ActorType } from '@/types/database';

/**
 * This deployment serves a single cafe. Rather than hard-coding a store id
 * the way mock-data did, the active store is resolved from the database, so
 * seeding a different store does not require a code change.
 */
export async function getActiveStoreId(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('stores')
    .select('id')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

/**
 * IP and user agent for audit logs. x-forwarded-for is attacker-controlled in
 * principle, but behind Vercel the left-most entry is the real client. The
 * value is validated before it reaches an INET column so a malformed header
 * cannot abort the INSERT it was meant to annotate.
 */
export async function getRequestContext(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  const candidate = forwarded ? forwarded.split(',')[0].trim() : h.get('x-real-ip');

  const isIpLike =
    !!candidate &&
    (/^\d{1,3}(\.\d{1,3}){3}$/.test(candidate) || /^[0-9a-fA-F:]+$/.test(candidate));

  return {
    ip: isIpLike ? candidate : null,
    userAgent: h.get('user-agent'),
  };
}

export interface AuditEvent {
  store_id: string | null;
  table_id?: string | null;
  order_id?: string | null;
  event_type: string;
  category: SecurityLogCategory;
  severity: SecurityLogSeverity;
  message: string;
  actor_type?: ActorType;
  actor_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Writes one audit event. Failures are swallowed on purpose: logging is
 * observability, and an observability failure must never take down the
 * business operation that triggered it.
 */
export async function writeAuditLog(event: AuditEvent): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { ip, userAgent } = await getRequestContext();

    await supabase.from('security_logs').insert({
      store_id: event.store_id,
      table_id: event.table_id ?? null,
      order_id: event.order_id ?? null,
      event_type: event.event_type,
      category: event.category,
      severity: event.severity,
      message: event.message,
      ip_address: ip,
      user_agent: userAgent,
      actor_type: event.actor_type ?? 'system',
      actor_id: event.actor_id ?? null,
      metadata: event.metadata ?? {},
    });
  } catch (err) {
    console.error('[audit] failed to write security log', err);
  }
}
