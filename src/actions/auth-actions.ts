'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestContext } from '@/lib/supabase/context';

export interface SignInResult {
  success: boolean;
  message?: string;
}

/**
 * Sign-in runs as a Server Action rather than from the browser so that failed
 * attempts are visible to the server. Calling supabase.auth.signInWithPassword
 * directly from the client would leave ADMIN_LOGIN_FAILED unrecordable, since
 * the failure never reaches our code.
 */
export async function signInAction(email: string, password: string): Promise<SignInResult> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const { ip, userAgent } = await getRequestContext();
    const admin = createAdminClient();
    await admin.rpc('log_auth_failure', {
      p_email: email,
      p_reason: error.message,
      p_ip: ip,
      p_user_agent: userAgent,
    });

    // Deliberately vague: distinguishing "no such account" from "wrong
    // password" tells an attacker which emails are real.
    return { success: false, message: 'Email hoặc mật khẩu không đúng.' };
  }

  return { success: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}
