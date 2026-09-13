-- ============================================================================
-- Supabase shim for local migration testing
-- ============================================================================
-- Reproduces the objects a Supabase project provides but plain PostgreSQL does
-- not. Load this into a scratch database before applying the migrations, so
-- schema changes can be tested without a network round trip to Supabase.
--
--   createdb ordersys
--   psql -d ordersys -f supabase/tests/00_supabase_shim.sql
--   psql -d ordersys -f supabase/migrations/20260913000000_initial_schema.sql
--   psql -d ordersys -f supabase/migrations/20260913010000_order_rpc.sql
--   psql -d ordersys -f supabase/seed.sql
--   psql -d ordersys -f supabase/tests/01_rpc_behaviour.sql
--
-- Never load this into a real Supabase project.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS auth;

DO $$ BEGIN CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE ROLE service_role NOLOGIN BYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS auth.users (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$;

DO $$ BEGIN CREATE PUBLICATION supabase_realtime;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
