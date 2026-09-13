-- ============================================================================
-- Auth wiring
-- ============================================================================
-- Supabase creates rows in auth.users; this project needs a matching profile
-- carrying role and store. Doing it with a trigger means an account created
-- from the Supabase dashboard is immediately usable, instead of silently
-- having no profile and therefore no access.
--
-- Role comes from user metadata at sign-up time and defaults to 'staff', so
-- the failure mode of a mistake is the least-privileged one.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_role     TEXT;
BEGIN
  SELECT id INTO v_store_id
  FROM public.stores
  WHERE is_active = true
  ORDER BY created_at
  LIMIT 1;

  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'staff');
  IF v_role NOT IN ('admin', 'staff') THEN
    v_role := 'staff';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, store_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    v_role,
    v_store_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Failed sign-in attempts are recorded against the store even though no
-- session exists yet, which is the whole point: an attacker is by definition
-- not authenticated. store_id is resolved server-side so the caller cannot
-- choose where its failures get filed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_auth_failure(
  p_email      TEXT,
  p_reason     TEXT,
  p_ip         INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_store_id UUID;
BEGIN
  SELECT id INTO v_store_id
  FROM public.stores WHERE is_active = true ORDER BY created_at LIMIT 1;

  INSERT INTO public.security_logs
    (store_id, event_type, category, severity, message, ip_address, user_agent,
     actor_type, metadata)
  VALUES (
    v_store_id, 'ADMIN_LOGIN_FAILED', 'AUTH', 'WARNING',
    'Đăng nhập khu vực quản trị thất bại cho tài khoản ' || COALESCE(p_email, '(trống)') || '.',
    p_ip, p_user_agent, 'guest',
    jsonb_build_object('attempted_username', p_email, 'failure_reason', p_reason)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_auth_failure(TEXT, TEXT, INET, TEXT)
  FROM PUBLIC, anon, authenticated;
