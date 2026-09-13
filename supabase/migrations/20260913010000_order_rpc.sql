-- ============================================================================
-- Order creation RPC + derived read helpers
-- ============================================================================
-- create_order_with_security_check() exists because the Layer-1 defence was
-- previously three separate round trips (count recent orders, sum debt,
-- insert). Between the checks and the insert there was a window in which a
-- double submit passed both checks twice. Here the whole sequence runs inside
-- one transaction behind a row lock on the table, so the window is gone.
--
-- It also closes two input-trust problems present in the TypeScript version:
--   * the caller passed table_id, so changing it in the payload charged a
--     different table's debt. The function takes qr_token and resolves the
--     table itself.
--   * the caller passed item prices, which the server summed without
--     checking. Prices are now read from products.
--
-- Never grant EXECUTE to anon or authenticated: PostgREST would expose this
-- as a public endpoint. Server Actions call it with the service_role key.
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.order_code_seq START 1000;

CREATE OR REPLACE FUNCTION public.create_order_with_security_check(
  p_qr_token         TEXT,
  p_payment_method   TEXT,
  p_items            JSONB,
  p_customer_name    TEXT DEFAULT NULL,
  p_customer_phone   TEXT DEFAULT NULL,
  p_guest_session_id TEXT DEFAULT NULL,
  p_ip               INET DEFAULT NULL,
  p_user_agent       TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_table        public.tables%ROWTYPE;
  v_store        public.stores%ROWTYPE;
  v_thresholds   JSONB;
  v_max_orders   INT;
  v_window_min   INT;
  v_ceiling      INT;
  v_recent_count INT;
  v_debt         INT;
  v_total        INT;
  v_exempt       BOOLEAN;
  v_order_id     UUID;
  v_order_code   TEXT;
  v_tracking     TEXT;
  v_unavailable  TEXT;
BEGIN
  -- ---------------------------------------------------------------------
  -- 1. Resolve the table from the token, and lock it.
  --    FOR UPDATE serialises concurrent submits from the same table, which
  --    is what actually closes the double-submit race.
  -- ---------------------------------------------------------------------
  SELECT * INTO v_table
  FROM public.tables
  WHERE qr_token = p_qr_token AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.security_logs
      (store_id, event_type, category, severity, message, ip_address, user_agent, actor_type, metadata)
    SELECT s.id, 'INVALID_QR_TOKEN_SCAN', 'SPAM', 'WARNING',
           'Quét mã QR với token không tồn tại hoặc đã bị vô hiệu hoá.',
           p_ip, p_user_agent, 'guest',
           jsonb_build_object('provided_token', left(p_qr_token, 64),
                              'scan_source', 'create_order')
    FROM public.stores s
    WHERE s.is_active = true
    LIMIT 1;

    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_TOKEN',
      'severity', 'WARNING',
      'message', 'Mã QR của bàn không hợp lệ. Vui lòng quét lại hoặc gọi nhân viên.'
    );
  END IF;

  SELECT * INTO v_store FROM public.stores WHERE id = v_table.store_id;

  -- ---------------------------------------------------------------------
  -- 2. Price the order from the database, never from the payload.
  -- ---------------------------------------------------------------------
  SELECT string_agg(p.name, ', ')
    INTO v_unavailable
  FROM jsonb_to_recordset(p_items) AS i(product_id UUID, quantity INT, note TEXT)
  JOIN public.products p ON p.id = i.product_id
  WHERE p.is_available = false;

  IF v_unavailable IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ITEM_UNAVAILABLE',
      'severity', 'INFO',
      'message', 'Món đã hết hàng: ' || v_unavailable || '. Vui lòng cập nhật giỏ hàng.'
    );
  END IF;

  SELECT COALESCE(SUM(p.price * i.quantity), 0)
    INTO v_total
  FROM jsonb_to_recordset(p_items) AS i(product_id UUID, quantity INT, note TEXT)
  JOIN public.products p
    ON p.id = i.product_id
   AND p.store_id = v_table.store_id;

  IF v_total <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'EMPTY_ORDER',
      'severity', 'INFO',
      'message', 'Giỏ hàng trống hoặc không có món hợp lệ.'
    );
  END IF;

  -- ---------------------------------------------------------------------
  -- 3. Layer 1 defence, pay-later only.
  -- ---------------------------------------------------------------------
  IF p_payment_method = 'pay_later' THEN
    v_thresholds := v_store.security_thresholds;
    v_max_orders := COALESCE((v_thresholds->>'max_pay_later_per_window')::INT, 2);
    v_window_min := COALESCE((v_thresholds->>'rate_limit_window_min')::INT, 10);
    v_ceiling    := COALESCE((v_thresholds->>'unpaid_ceiling_vnd')::INT, 100000);

    -- An exemption granted by staff suppresses the rate limit only, never
    -- the debt ceiling: unpaid money is a bookkeeping fact, not a policy.
    SELECT EXISTS (
      SELECT 1 FROM public.security_logs
      WHERE table_id = v_table.id
        AND event_type = 'RATE_LIMIT_EXEMPTION_GRANTED'
        AND (metadata->>'expires_at')::TIMESTAMPTZ > now()
    ) INTO v_exempt;

    IF NOT v_exempt THEN
      SELECT count(*) INTO v_recent_count
      FROM public.orders
      WHERE table_id = v_table.id
        AND payment_method = 'pay_later'
        AND created_at >= now() - make_interval(mins => v_window_min);

      IF v_recent_count >= v_max_orders THEN
        INSERT INTO public.security_logs
          (store_id, table_id, event_type, category, severity, message,
           ip_address, user_agent, actor_type, metadata)
        VALUES (
          v_table.store_id, v_table.id, 'RATE_LIMIT_ORDER_BLOCKED', 'SPAM', 'WARNING',
          v_table.table_number || ' bị chặn đơn Trả Sau: vượt ngưỡng '
            || v_max_orders || ' đơn trong ' || v_window_min || ' phút.',
          p_ip, p_user_agent, 'guest',
          jsonb_build_object(
            'blocked_table', v_table.table_number,
            'attempts_in_window', v_recent_count + 1,
            'max_allowed', v_max_orders,
            'rate_limit_window', v_window_min || 'm',
            'attempted_order_amount', v_total,
            'endpoint', 'create_order_with_security_check'
          )
        );

        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'RATE_LIMIT_EXCEEDED',
          'severity', 'CRITICAL',
          'message', 'Hệ thống bảo mật từ chối: bàn đã tạo ' || v_recent_count
            || ' đơn Trả Sau trong ' || v_window_min
            || ' phút qua. Vui lòng thanh toán đơn cũ hoặc gọi nhân viên.'
        );
      END IF;
    END IF;

    SELECT COALESCE(SUM(total_amount), 0) INTO v_debt
    FROM public.orders
    WHERE table_id = v_table.id
      AND payment_method = 'pay_later'
      AND is_paid = false
      AND status NOT IN ('completed', 'cancelled');

    IF v_debt + v_total > v_ceiling THEN
      INSERT INTO public.security_logs
        (store_id, table_id, event_type, category, severity, message,
         ip_address, user_agent, actor_type, metadata)
      VALUES (
        v_table.store_id, v_table.id, 'PAY_LATER_CEILING_BLOCKED', 'FINANCE', 'WARNING',
        v_table.table_number || ' bị chặn: công nợ Trả Sau '
          || to_char(v_debt, 'FM999,999,999') || 'đ cộng đơn mới '
          || to_char(v_total, 'FM999,999,999') || 'đ vượt trần '
          || to_char(v_ceiling, 'FM999,999,999') || 'đ.',
        p_ip, p_user_agent, 'guest',
        jsonb_build_object(
          'blocked_table', v_table.table_number,
          'current_debt', v_debt,
          'attempted_order_amount', v_total,
          'ceiling_limit', v_ceiling
        )
      );

      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'UNPAID_CEILING_EXCEEDED',
        'severity', 'WARNING',
        'message', 'Bàn đang có đơn Trả Sau chưa thanh toán trị giá '
          || to_char(v_debt, 'FM999,999,999') || 'đ (trần '
          || to_char(v_ceiling, 'FM999,999,999')
          || 'đ). Vui lòng chờ nhân viên duyệt hoặc thanh toán đơn cũ.'
      );
    END IF;
  END IF;

  -- ---------------------------------------------------------------------
  -- 4. Insert. A sequence guarantees order_code uniqueness; the previous
  --    4-digit random generator collided at ~50% after 110 orders, and
  --    order_code is the VietQR transfer memo used for reconciliation.
  -- ---------------------------------------------------------------------
  v_order_code := 'SOC' || lpad(nextval('public.order_code_seq')::TEXT, 5, '0');

  INSERT INTO public.orders (
    store_id, table_id, order_code, payment_method, status, total_amount,
    customer_name, customer_phone, guest_session_id, created_ip
  ) VALUES (
    v_table.store_id, v_table.id, v_order_code, p_payment_method,
    'pending_approval', v_total,
    NULLIF(p_customer_name, ''), NULLIF(p_customer_phone, ''),
    p_guest_session_id, p_ip
  )
  RETURNING id, tracking_token INTO v_order_id, v_tracking;

  INSERT INTO public.order_items (order_id, product_id, product_name, price, quantity, note)
  SELECT v_order_id, p.id, p.name, p.price, i.quantity, NULLIF(i.note, '')
  FROM jsonb_to_recordset(p_items) AS i(product_id UUID, quantity INT, note TEXT)
  JOIN public.products p ON p.id = i.product_id;

  UPDATE public.tables
  SET status = CASE WHEN p_payment_method = 'pay_later'
                    THEN 'pending_pay_later' ELSE 'occupied' END
  WHERE id = v_table.id;

  INSERT INTO public.security_logs
    (store_id, table_id, order_id, event_type, category, severity, message,
     ip_address, user_agent, actor_type, metadata)
  VALUES (
    v_table.store_id, v_table.id, v_order_id, 'NEW_ORDER', 'FINANCE', 'INFO',
    'Đơn mới ' || v_order_code || ' tại ' || v_table.table_number || ' ('
      || CASE WHEN p_payment_method = 'pay_now' THEN 'VietQR' ELSE 'Trả Sau' END
      || ', ' || to_char(v_total, 'FM999,999,999') || 'đ).',
    p_ip, p_user_agent, 'guest',
    jsonb_build_object(
      'order_code', v_order_code,
      'payment_method', p_payment_method,
      'amount', v_total,
      'item_count', jsonb_array_length(p_items)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_code', v_order_code,
    'tracking_token', v_tracking,
    'total_amount', v_total,
    'table_number', v_table.table_number
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order_with_security_check(
  TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, INET, TEXT) FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- Derived read helpers
-- ============================================================================
-- Blocked state is computed here rather than stored on tables.status, so it
-- expires by itself when the rate-limit window passes and can never get stuck.
CREATE OR REPLACE FUNCTION public.table_security_status(p_store_id UUID)
RETURNS TABLE (
  id           UUID,
  table_number TEXT,
  sort_order   INT,
  qr_token     TEXT,
  status       TEXT,
  open_orders  INT,
  unpaid_debt  INT
)
LANGUAGE sql
STABLE
AS $$
  WITH cfg AS (
    SELECT
      COALESCE((security_thresholds->>'max_pay_later_per_window')::INT, 2) AS max_orders,
      COALESCE((security_thresholds->>'rate_limit_window_min')::INT, 10)   AS window_min,
      COALESCE((security_thresholds->>'unpaid_ceiling_vnd')::INT, 100000)  AS ceiling
    FROM public.stores WHERE id = p_store_id
  ),
  agg AS (
    SELECT
      t.id,
      t.table_number,
      t.sort_order,
      t.qr_token,
      t.status AS raw_status,
      COUNT(*) FILTER (
        WHERE o.status IN ('pending_approval', 'paid_preparing', 'ready')
      )::INT AS open_orders,
      COALESCE(SUM(o.total_amount) FILTER (
        WHERE o.payment_method = 'pay_later'
          AND o.is_paid = false
          AND o.status NOT IN ('completed', 'cancelled')
      ), 0)::INT AS unpaid_debt,
      COUNT(*) FILTER (
        WHERE o.payment_method = 'pay_later'
          AND o.created_at >= now() - make_interval(mins => (SELECT window_min FROM cfg))
      )::INT AS recent_pay_later
    FROM public.tables t
    LEFT JOIN public.orders o ON o.table_id = t.id
    WHERE t.store_id = p_store_id AND t.is_active = true
    GROUP BY t.id
  )
  SELECT
    a.id, a.table_number, a.sort_order, a.qr_token,
    CASE
      WHEN a.unpaid_debt >= (SELECT ceiling FROM cfg) THEN 'blocked_debt'
      WHEN a.recent_pay_later >= (SELECT max_orders FROM cfg)
           AND NOT EXISTS (
             SELECT 1 FROM public.security_logs sl
             WHERE sl.table_id = a.id
               AND sl.event_type = 'RATE_LIMIT_EXEMPTION_GRANTED'
               AND (sl.metadata->>'expires_at')::TIMESTAMPTZ > now()
           ) THEN 'blocked_rate_limit'
      ELSE a.raw_status
    END AS status,
    a.open_orders,
    a.unpaid_debt
  FROM agg a
  ORDER BY a.sort_order, a.table_number;
$$;

-- Hourly revenue buckets for the live cashflow chart, replacing the
-- synthetic series that mock-data generated.
CREATE OR REPLACE FUNCTION public.cashflow_series(p_store_id UUID, p_hours INT DEFAULT 12)
RETURNS TABLE (bucket TIMESTAMPTZ, revenue INT, order_count INT)
LANGUAGE sql
STABLE
AS $$
  SELECT
    g.bucket,
    COALESCE(SUM(o.total_amount), 0)::INT AS revenue,
    COUNT(o.id)::INT                      AS order_count
  FROM generate_series(
         date_trunc('hour', now()) - make_interval(hours => p_hours - 1),
         date_trunc('hour', now()),
         interval '1 hour'
       ) AS g(bucket)
  LEFT JOIN public.orders o
    ON o.store_id = p_store_id
   AND o.status <> 'cancelled'
   AND date_trunc('hour', o.created_at) = g.bucket
  GROUP BY g.bucket
  ORDER BY g.bucket;
$$;

REVOKE EXECUTE ON FUNCTION public.table_security_status(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cashflow_series(UUID, INT)  FROM PUBLIC, anon;
