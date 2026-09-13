import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client holding the service_role key. It bypasses RLS entirely, so
 * every caller is responsible for its own authorization checks.
 *
 * All writes in this application go through Server Actions using this client;
 * RLS exists to constrain what the public anon key can read, not to authorize
 * writes.
 *
 * Two guards worth keeping:
 *   - `import 'server-only'` fails the build if a client component ever
 *     imports this file, rather than leaking the key at runtime.
 *   - Missing configuration throws instead of returning null. Returning null
 *     is how this project silently ran on in-memory mock data for months; for
 *     a key that bypasses RLS, failing loudly at boot is the only safe option.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY. ' +
        'Kiểm tra .env.local — xem .env.example.'
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
