-- ============================================================================
-- Security log search
-- ============================================================================
-- The SOC feed needs strict whole-word search across message, event_type, IP
-- and the JSONB metadata — the point of the requirement was being able to hunt
-- for one token or one error code without substring false positives.
--
-- Doing this in TypeScript would mean pulling every log row into the app
-- process to filter it, which stops working the moment the table is large.
-- to_tsvector with the 'simple' configuration gives word-boundary matching
-- without stemming or stopword removal, which is what log data needs, and
-- works for Vietnamese text since 'simple' does no language processing.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.search_security_logs(
  p_store_id UUID,
  p_severity TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_query    TEXT DEFAULT NULL,
  p_limit    INT  DEFAULT 200
)
RETURNS TABLE (
  id           UUID,
  store_id     UUID,
  table_id     UUID,
  order_id     UUID,
  event_type   TEXT,
  category     TEXT,
  severity     TEXT,
  message      TEXT,
  ip_address   TEXT,
  user_agent   TEXT,
  actor_type   TEXT,
  actor_id     UUID,
  metadata     JSONB,
  created_at   TIMESTAMPTZ,
  table_number TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    l.id, l.store_id, l.table_id, l.order_id,
    l.event_type, l.category, l.severity, l.message,
    host(l.ip_address) AS ip_address,
    l.user_agent, l.actor_type, l.actor_id, l.metadata, l.created_at,
    COALESCE(t.table_number, 'System') AS table_number
  FROM public.security_logs l
  LEFT JOIN public.tables t ON t.id = l.table_id
  WHERE l.store_id = p_store_id
    AND (p_severity IS NULL OR p_severity = 'ALL' OR l.severity = p_severity)
    AND (p_category IS NULL OR p_category = 'ALL' OR l.category = p_category)
    AND (
      p_query IS NULL OR btrim(p_query) = ''
      OR to_tsvector('simple',
           coalesce(l.message, '') || ' ' ||
           coalesce(l.event_type, '') || ' ' ||
           coalesce(host(l.ip_address), '') || ' ' ||
           coalesce(t.table_number, '') || ' ' ||
           coalesce(l.metadata::text, '')
         ) @@ plainto_tsquery('simple', p_query)
    )
  ORDER BY l.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 1000);
$$;

REVOKE EXECUTE ON FUNCTION public.search_security_logs(UUID, TEXT, TEXT, TEXT, INT)
  FROM PUBLIC, anon, authenticated;
