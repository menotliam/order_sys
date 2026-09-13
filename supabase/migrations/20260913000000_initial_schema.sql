-- ============================================================================
-- QR Beverage Ordering System — Initial Schema
-- ============================================================================
-- Design decisions recorded here so future readers do not have to guess:
--
--   1. security_logs.event_type has NO check constraint. This is a telemetry
--      table; a rejected INSERT means a dropped security event, which is a
--      worse failure than an unexpected string. Stability lives in `category`.
--   2. tables.status holds operational state only. "Blocked" is DERIVED at
--      query time from orders + security_logs, never stored as a flag, so it
--      can never get stuck after a rate-limit window expires.
--   3. qr_token / tracking_token are 128-bit and 96-bit random. Never derive
--      them from a table number — guessable tokens defeat the whole point.
--   4. All writes go through Server Actions using the service_role key.
--      RLS therefore only needs to be correct for SELECT.
--   5. Money is INT (VND has no decimals in practice). Float would drift
--      against webhook amounts during reconciliation.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================================
-- 1. STORES
-- ============================================================================
CREATE TABLE public.stores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  logo_url            TEXT,
  vietqr_bank_id      TEXT,
  vietqr_account_no   TEXT,
  vietqr_account_name TEXT,
  webhook_secret      TEXT,
  security_thresholds JSONB NOT NULL DEFAULT '{
    "max_pay_later_per_window": 2,
    "rate_limit_window_min": 10,
    "unpaid_ceiling_vnd": 100000,
    "audio_alert_enabled": true
  }'::jsonb,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.stores.webhook_secret IS
  'HMAC shared secret for SePay/Casso. Never expose to the browser.';

-- ============================================================================
-- 2. TABLES — count is data, not code. Add table 31 with an INSERT.
-- ============================================================================
CREATE TABLE public.tables (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  sort_order   INT  NOT NULL DEFAULT 0,
  qr_token     TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  status       TEXT NOT NULL DEFAULT 'idle'
               CHECK (status IN ('idle', 'occupied', 'pending_pay_later')),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tables_qr_token_key     ON public.tables (qr_token);
CREATE UNIQUE INDEX tables_store_number_key ON public.tables (store_id, table_number);
CREATE INDEX        tables_store_sort_idx   ON public.tables (store_id, sort_order);

COMMENT ON COLUMN public.tables.qr_token IS
  '128-bit random. Rotate by UPDATE when a QR sticker is reprinted.';

-- ============================================================================
-- 3. CATEGORIES & PRODUCTS
-- ============================================================================
CREATE TABLE public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  sort_order INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX categories_store_idx ON public.categories (store_id, sort_order);

CREATE TABLE public.products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  price        INT  NOT NULL CHECK (price >= 0),
  image_url    TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order   INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX products_store_cat_idx ON public.products (store_id, category_id, sort_order);

-- ============================================================================
-- 4. ORDERS
-- ============================================================================
CREATE TABLE public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_id         UUID NOT NULL REFERENCES public.tables(id) ON DELETE RESTRICT,
  order_code       TEXT NOT NULL,
  tracking_token   TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(12), 'hex'),
  payment_method   TEXT NOT NULL CHECK (payment_method IN ('pay_now', 'pay_later')),
  status           TEXT NOT NULL DEFAULT 'pending_approval'
                   CHECK (status IN ('pending_approval', 'paid_preparing', 'ready',
                                     'completed', 'cancelled')),
  total_amount     INT  NOT NULL CHECK (total_amount > 0),
  is_paid          BOOLEAN NOT NULL DEFAULT false,
  paid_at          TIMESTAMPTZ,
  paid_reference   TEXT,
  customer_name    TEXT,
  customer_phone   TEXT,
  guest_session_id TEXT,
  created_ip       INET,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX orders_store_code_key ON public.orders (store_id, order_code);
CREATE INDEX orders_ratelimit_idx ON public.orders (table_id, payment_method, created_at DESC);
CREATE INDEX orders_dashboard_idx ON public.orders (store_id, status, created_at DESC);

-- Partial index: only unpaid pay-later debt. Keeps the ceiling check scanning
-- a handful of rows instead of the whole table on every customer submit.
CREATE INDEX orders_debt_idx ON public.orders (table_id)
  WHERE payment_method = 'pay_later'
    AND is_paid = false
    AND status NOT IN ('completed', 'cancelled');

COMMENT ON COLUMN public.orders.tracking_token IS
  'Guests prove ownership of an order with this, not with the UUID id.';
COMMENT ON COLUMN public.orders.paid_reference IS
  'Bank transaction ref from the webhook, or CASH when staff collect at table.';

-- ============================================================================
-- 5. ORDER_ITEMS — name and price are snapshots, not references
-- ============================================================================
CREATE TABLE public.order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price        INT  NOT NULL CHECK (price >= 0),
  quantity     INT  NOT NULL CHECK (quantity > 0),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX order_items_order_idx ON public.order_items (order_id);

-- ============================================================================
-- 6. SECURITY_LOGS — the SIEM table
-- ============================================================================
CREATE TABLE public.security_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  table_id   UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  order_id   UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  category   TEXT NOT NULL CHECK (category IN ('FINANCE', 'AUTH', 'INTEGRITY', 'SPAM')),
  severity   TEXT NOT NULL DEFAULT 'INFO'
             CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  message    TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  actor_type TEXT CHECK (actor_type IN ('guest', 'staff', 'admin', 'system', 'webhook')),
  actor_id   UUID,
  metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX seclog_feed_idx ON public.security_logs (store_id, created_at DESC);
CREATE INDEX seclog_sev_idx  ON public.security_logs (severity, created_at DESC);
CREATE INDEX seclog_cat_idx  ON public.security_logs (category, created_at DESC);
CREATE INDEX seclog_ip_idx   ON public.security_logs (ip_address, created_at DESC);

-- JSONB containment queries: metadata @> '{"blocked_table":"Ban 05"}'
CREATE INDEX seclog_metadata_gin ON public.security_logs
  USING GIN (metadata jsonb_path_ops);

-- Strict whole-word search. 'simple' config: no stemming, no stopwords —
-- correct for Vietnamese text, table ids and token hashes alike.
CREATE INDEX seclog_msg_fts ON public.security_logs
  USING GIN (to_tsvector('simple', message));

-- Rate-limit exemptions live in this table as events, not as a separate
-- table, so that disabling a defence is visible in the SOC feed itself.
CREATE INDEX seclog_exemption_idx ON public.security_logs (table_id, created_at DESC)
  WHERE event_type = 'RATE_LIMIT_EXEMPTION_GRANTED';

-- ============================================================================
-- 7. PROFILES — bound to Supabase Auth
-- ============================================================================
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT,
  role       TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  store_id   UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX profiles_store_idx ON public.profiles (store_id);

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER stores_touch BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================================
-- 9. AUTH HELPERS
-- ============================================================================
-- SECURITY DEFINER breaks the RLS recursion that would occur if a policy on
-- profiles queried profiles. `SET search_path` is mandatory here: without it a
-- caller can point the function at a spoofed profiles table.
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid() AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.auth_store_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.profiles
  WHERE id = auth.uid() AND is_active = true;
$$;

REVOKE EXECUTE ON FUNCTION public.auth_role()     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auth_store_id() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.auth_role()     TO authenticated;
GRANT  EXECUTE ON FUNCTION public.auth_store_id() TO authenticated;

-- ============================================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================================
-- Every table is enabled. A table with no policy denies everything, and that
-- silence is the most important part of this design: anon gets no access to
-- tables (qr_token would leak), stores (webhook_secret would leak), orders,
-- order_items, security_logs or profiles.

ALTER TABLE public.stores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;

-- --- Guests: the menu, and nothing else -------------------------------------
-- Out-of-stock items are returned deliberately: the customer UI dims them
-- rather than hiding them (TC_CUST_EDGE_02).
CREATE POLICY "anon reads categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon reads products" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

-- --- Staff and admin: reads that Realtime depends on ------------------------
CREATE POLICY "staff reads own store orders" ON public.orders
  FOR SELECT TO authenticated
  USING (store_id = public.auth_store_id());

CREATE POLICY "staff reads own store order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.store_id = public.auth_store_id()
  ));

CREATE POLICY "staff reads own store tables" ON public.tables
  FOR SELECT TO authenticated
  USING (store_id = public.auth_store_id());

-- auth.uid() directly, not auth_role(): calling the helper here would
-- reintroduce the recursion it exists to avoid.
CREATE POLICY "own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- --- Admin only -------------------------------------------------------------
CREATE POLICY "admin reads security logs" ON public.security_logs
  FOR SELECT TO authenticated
  USING (public.auth_role() = 'admin' AND store_id = public.auth_store_id());

CREATE POLICY "admin reads store config" ON public.stores
  FOR SELECT TO authenticated
  USING (public.auth_role() = 'admin' AND id = public.auth_store_id());

-- ============================================================================
-- 11. REALTIME
-- ============================================================================
-- Realtime enforces RLS per subscriber JWT, so staff only receive rows from
-- their own store and anon receives nothing from orders.
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_logs;
