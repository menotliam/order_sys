import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/supabase/context';
import type { Profile } from '@/types/database';

/**
 * Authorization for Server Actions.
 *
 * Route protection in middleware is not sufficient here. A Server Action is a
 * POST endpoint with a stable id; anyone who has seen the client bundle can
 * call it directly without ever loading the page it belongs to. Since the
 * actions run with the service-role key and bypass RLS, the permission check
 * has to live in the action itself.
 *
 * Denials return null rather than throwing, so callers keep their existing
 * return shapes, and every denial is recorded as
 * SESSION_PRIVILEGE_ESCALATION — the event the SOC spec defines for exactly
 * this situation.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const admin = createAdminClient();
    const { data } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    return (data as Profile) ?? null;
  } catch {
    return null;
  }
}

async function denied(
  actionName: string,
  requiredRole: 'staff' | 'admin',
  profile: Profile | null
): Promise<null> {
  await writeAuditLog({
    store_id: profile?.store_id ?? null,
    event_type: 'SESSION_PRIVILEGE_ESCALATION',
    category: 'AUTH',
    severity: 'CRITICAL',
    actor_type: profile ? 'staff' : 'guest',
    actor_id: profile?.id ?? null,
    message: `Truy cập bị từ chối: ${actionName} yêu cầu quyền ${requiredRole}.`,
    metadata: {
      attempted_endpoint: actionName,
      provided_token_role: profile?.role ?? 'anonymous',
      required_role: requiredRole,
    },
  });
  return null;
}

/** Any signed-in staff member or admin. */
export async function requireStaff(actionName: string): Promise<Profile | null> {
  const profile = await getCurrentProfile();
  if (!profile) return denied(actionName, 'staff', null);
  return profile;
}

/** Admin only: payment configuration, security thresholds, the SOC feed. */
export async function requireAdmin(actionName: string): Promise<Profile | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    return denied(actionName, 'admin', profile);
  }
  return profile;
}
