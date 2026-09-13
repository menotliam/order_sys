-- ============================================================================
-- Behavioural tests for create_order_with_security_check()
-- ============================================================================
-- Run against a freshly seeded scratch database. See 00_supabase_shim.sql for
-- the full sequence. Each block prints an actual value next to the expectation
-- encoded in the column name.
-- ============================================================================

\set ON_ERROR_STOP on
\pset pager off

\echo ''
\echo '--- T1: unknown qr_token is refused and recorded as a scan attempt ---'
SELECT create_order_with_security_check(
  'khong-ton-tai', 'pay_later',
  '[{"product_id":"44444444-4444-4444-4444-000000000003","quantity":1}]'::jsonb
)->>'error_code' AS actual_expect_INVALID_TOKEN;

SELECT count(*) AS scan_logs_expect_1
FROM security_logs WHERE event_type = 'INVALID_QR_TOKEN_SCAN' AND ip_address IS NULL;

\echo ''
\echo '--- T2: total is priced from products, not from the payload ---'
-- Espresso Double Shot is 35000 in the seed; the caller supplies no price.
CREATE TEMP TABLE t2 AS
SELECT create_order_with_security_check(
  (SELECT qr_token FROM tables WHERE table_number = 'Bàn 01'),
  'pay_now',
  '[{"product_id":"44444444-4444-4444-4444-000000000003","quantity":2,"note":"Ít đường"}]'::jsonb
) AS r;

SELECT r->>'success'       AS success_expect_true,
       r->>'total_amount'  AS total_expect_70000,
       r->>'order_code'    AS order_code,
       length(r->>'tracking_token') AS tracking_token_len_expect_24
FROM t2;

SELECT product_name, price, quantity, note
FROM order_items ORDER BY created_at DESC LIMIT 1;

\echo ''
\echo '--- T3: rate limit blocks the third pay-later order in the window ---'
-- Ceiling raised out of the way so this block tests the rate limit alone.
UPDATE stores SET security_thresholds =
  security_thresholds || '{"unpaid_ceiling_vnd": 100000000}'::jsonb;

SELECT
  create_order_with_security_check(
    (SELECT qr_token FROM tables WHERE table_number = 'Bàn 02'), 'pay_later',
    '[{"product_id":"44444444-4444-4444-4444-000000000003","quantity":1}]'::jsonb
  )->>'success' AS first_expect_true,
  create_order_with_security_check(
    (SELECT qr_token FROM tables WHERE table_number = 'Bàn 02'), 'pay_later',
    '[{"product_id":"44444444-4444-4444-4444-000000000003","quantity":1}]'::jsonb
  )->>'success' AS second_expect_true;

SELECT create_order_with_security_check(
  (SELECT qr_token FROM tables WHERE table_number = 'Bàn 02'), 'pay_later',
  '[{"product_id":"44444444-4444-4444-4444-000000000003","quantity":1}]'::jsonb
)->>'error_code' AS third_expect_RATE_LIMIT_EXCEEDED;

\echo ''
\echo '--- T4: a staff exemption suppresses the rate limit ---'
INSERT INTO security_logs (store_id, table_id, event_type, category, severity,
                           message, actor_type, metadata)
SELECT store_id, id, 'RATE_LIMIT_EXEMPTION_GRANTED', 'SPAM', 'WARNING',
       'Nhân viên tạm bỏ qua giới hạn tần suất.', 'staff',
       jsonb_build_object('expires_at', now() + interval '15 minutes')
FROM tables WHERE table_number = 'Bàn 02';

SELECT create_order_with_security_check(
  (SELECT qr_token FROM tables WHERE table_number = 'Bàn 02'), 'pay_later',
  '[{"product_id":"44444444-4444-4444-4444-000000000003","quantity":1}]'::jsonb
)->>'success' AS exempt_order_expect_true;

\echo ''
\echo '--- T5: the debt ceiling ignores the exemption ---'
-- Deliberate: an exemption is a policy override, unpaid money is a fact.
UPDATE stores SET security_thresholds =
  security_thresholds || '{"unpaid_ceiling_vnd": 100000}'::jsonb;

SELECT create_order_with_security_check(
  (SELECT qr_token FROM tables WHERE table_number = 'Bàn 02'), 'pay_later',
  '[{"product_id":"44444444-4444-4444-4444-000000000003","quantity":1}]'::jsonb
)->>'error_code' AS actual_expect_UNPAID_CEILING_EXCEEDED;

\echo ''
\echo '--- T6: out-of-stock items are refused by name ---'
UPDATE products SET is_available = false WHERE id = '44444444-4444-4444-4444-000000000001';

SELECT create_order_with_security_check(
  (SELECT qr_token FROM tables WHERE table_number = 'Bàn 04'), 'pay_now',
  '[{"product_id":"44444444-4444-4444-4444-000000000001","quantity":1}]'::jsonb
)->>'error_code' AS actual_expect_ITEM_UNAVAILABLE;

UPDATE products SET is_available = true WHERE id = '44444444-4444-4444-4444-000000000001';

\echo ''
\echo '--- T7: empty / unknown-product cart is refused ---'
SELECT create_order_with_security_check(
  (SELECT qr_token FROM tables WHERE table_number = 'Bàn 04'), 'pay_now',
  '[]'::jsonb
)->>'error_code' AS actual_expect_EMPTY_ORDER;

\echo ''
\echo '--- T8: order_code is unique (sequence, not 4-digit random) ---'
SELECT count(*) AS orders, count(DISTINCT order_code) AS distinct_codes FROM orders;

\echo ''
\echo '--- T9: table status is derived, never stored as a stuck flag ---'
SELECT table_number, status, open_orders, unpaid_debt
FROM table_security_status('11111111-1111-1111-1111-111111111111')
WHERE status <> 'idle' OR unpaid_debt > 0
ORDER BY table_number;

\echo ''
\echo '--- T10: cashflow returns one bucket per hour requested ---'
SELECT count(*) AS buckets_expect_12, sum(revenue) AS revenue
FROM cashflow_series('11111111-1111-1111-1111-111111111111', 12);

\echo ''
\echo '--- T11: strict whole-word search matches words, not substrings ---'
SELECT
  (SELECT count(*) FROM security_logs
   WHERE to_tsvector('simple', message) @@ plainto_tsquery('simple', 'Trả Sau'))
    AS whole_word_hits,
  (SELECT count(*) FROM security_logs
   WHERE to_tsvector('simple', message) @@ plainto_tsquery('simple', 'Sa'))
    AS substring_hits_expect_0;

\echo ''
\echo '--- T12: the RPC is not reachable by anon or authenticated ---'
SELECT
  has_function_privilege('anon',
    'public.create_order_with_security_check(text,text,jsonb,text,text,text,inet,text)',
    'EXECUTE') AS anon_expect_false,
  has_function_privilege('authenticated',
    'public.create_order_with_security_check(text,text,jsonb,text,text,text,inet,text)',
    'EXECUTE') AS authenticated_expect_false;

\echo ''
\echo '--- T13: every public table has RLS enabled ---'
SELECT count(*) AS tables_without_rls_expect_0
FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
