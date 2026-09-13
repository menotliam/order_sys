# Super Admin SOC SIEM v2.6 – Full Enhancement Plan

Upgrade the Super Admin & Security Operations Center (SOC SIEM) subsystem (`/admin`) into a comprehensive 3-page tactical command center based on `super_admin_enhance.md` and our `/grill-me` architectural decisions. This upgrade adds rich telemetry with 10 event types across 4 categories, strict whole-word log filtering, an Anomaly Detection dashboard, a Live Cashflow SVG trend chart, a 30-Table Tactical Node Map with per-table security reset, configurable live security thresholds, and an interactive "Simulate Attack" button—all while maintaining 100% backward compatibility with existing E2E tests.

---

## User Review Required

> [!IMPORTANT]
> **E2E Backward Compatibility Guarantee**  
> To ensure our existing 12 Playwright test cases (`TC_ADMIN_SEC_01` and `TC_ADMIN_SEC_02`) continue passing without modification:
> - `/admin` remains the default **SIEM Security Monitoring & Anomaly Dashboard** (`TC_ADMIN_SEC_01` assertions for KPIs and log inspection will pass natively).
> - We establish automatic 308 permanent redirects in `next.config.ts`:
>   - `/vietqr-config` $\rightarrow$ `/admin/config`
>   - `/admin/vietqr-config` $\rightarrow$ `/admin/config`
> - `TC_ADMIN_SEC_02` will seamlessly test the Master VietQR config section on `/admin/config`.

> [!TIP]
> **WOW-Factor Interactive Features Included**
> - **Simulate Cyber Attack Button** in the SOC Command Header to inject live `RATE_LIMIT_ORDER_BLOCKED` or `SESSION_PRIVILEGE_ESCALATION` events with audio sirens.
> - **Syntax-Highlighted JSONB Metadata Inspector** drawer/modal for deep audit investigation.
> - **Live Cashflow SVG/Canvas Chart** with dynamic gradients and pulse markers on `/admin/operations`.
> - **Tactical Table Control Drawer** on the 30-Table Node Map with instant **RESET BẢO MẬT & MỞ KHÓA BÀN** (Clear Rate Limit & Debt Ceiling).

---

## Proposed Changes

### 1. Data Model & Backend Server Actions

#### [MODIFY] [mock-data.ts](file:///c:/Users/lemdi/Downloads/order_sys/src/lib/supabase/mock-data.ts)
- Extend `SecurityLog` type and seed 10 distinct event types across 4 standard categories:
  1. **Financial & Payment Group**: `WEBHOOK_VERIFICATION_FAILED` (CRITICAL), `PAY_LATER_CEILING_BLOCKED` (WARNING), `MOCK_PAY_PROD_TRIGGERED` (CRITICAL), `ORDER_PAID_SUCCESS` (INFO).
  2. **Auth & Identity Group**: `SESSION_PRIVILEGE_ESCALATION` (CRITICAL), `ADMIN_LOGIN_FAILED` (WARNING).
  3. **Data Integrity Group**: `VIETQR_CONFIG_UPDATED` (WARNING), `MENU_ITEM_STOCK_TOGGLED` (INFO).
  4. **Anti-Spam Group**: `RATE_LIMIT_ORDER_BLOCKED` (WARNING), `INVALID_QR_TOKEN_SCAN` (WARNING).
- Add `security_thresholds` to `mockDb.store`:
  ```ts
  security_thresholds: {
    max_pay_later_per_window: 2,
    rate_limit_window_min: 10,
    unpaid_ceiling_vnd: 100000,
    audio_alert_enabled: true
  }
  ```
- Expand `mockDb.tables` to support **30 tables** (Table 01 to Table 30) for production scaling.
- Add sample **Cashflow Time-Series** data points (`time`, `revenue`, `orderCount`) for the Live Operations chart.
- Implement helper methods:
  - `resetTableSecurity(tableId)`: Removes active rate-limit block state and clears/approves unpaid debt balance for that table.
  - `simulateSecurityEvent(eventType)`: Injects a realistic mock attack log with full JSONB metadata.
  - `updateSecurityThresholds(newThresholds)`: Updates store security thresholds and logs `VIETQR_CONFIG_UPDATED` / `SECURITY_THRESHOLD_UPDATED`.

#### [MODIFY] [admin-actions.ts](file:///c:/Users/lemdi/Downloads/order_sys/src/actions/admin-actions.ts)
- Export server actions:
  - `getSocTelemetryLogsAction(filterCategory?, searchQuery?, strictWordSearch?)`: Returns filtered logs with strict whole-word matching support.
  - `getOperationsOverviewAction()`: Returns Cashflow time-series and 30-Table node status array.
  - `resetTableSecurityAction(tableId: string)`: Calls `mockDb.resetTableSecurity(tableId)` and returns updated status.
  - `simulateSecurityEventAction(eventType: string)`: Injects a simulated attack log for live demo.
  - `updateSecurityThresholdsAction(thresholds: any)`: Updates live security thresholds.

#### [MODIFY] [rate-limit.ts](file:///c:/Users/lemdi/Downloads/order_sys/src/lib/security/rate-limit.ts)
- Refactor `checkPayLaterSecurityLayer` to dynamically read thresholds from `mockDb.store.security_thresholds` instead of hardcoded constants.

---

### 2. Admin Subsystem Routing & Layout

#### [MODIFY] [layout.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/admin/layout.tsx)
- Add **"SIMULATE ATTACK" (Giả lập Tấn công)** button in the top sticky command bar with pulsing red warning styling.
- Update bottom tactical navbar to 3 distinct tabs:
  - `[1] SIEM ANOMALY (/admin)`
  - `[2] LIVE OPERATIONS (/admin/operations)`
  - `[3] SYSTEM CONFIG (/admin/config)`

#### [MODIFY] [next.config.ts](file:///c:/Users/lemdi/Downloads/order_sys/next.config.ts)
- Maintain and expand permanent redirects:
  - `/vietqr-config` $\rightarrow$ `/admin/config`
  - `/admin/vietqr-config` $\rightarrow$ `/admin/config`

---

### 3. Page 1: SIEM Security Monitoring & Anomaly Dashboard

#### [MODIFY] [page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/admin/page.tsx)
- **Top Anomaly Detection Dashboard**:
  - Cards monitoring abnormal indicators: High-frequency rate-limit blocked IPs/Tables, HTTP 4xx/5xx error frequency, and active Privilege Escalation attempts.
- **Middle Multi-Filter & Strict Whole-Word Search**:
  - Filter chips by Severity (`ALL`, `INFO`, `WARNING`, `CRITICAL`) and by 4 Event Groups (`ALL`, `FINANCE`, `AUTH`, `INTEGRITY`, `SPAM`).
  - Search bar implementing **Strict Whole-Word Search** (exact word boundary matching to eliminate false positives when inspecting token hashes or table IDs).
- **Bottom Live Audit Log Feed & JSONB Inspector Modal**:
  - Rich log table displaying event timestamp, severity badge, event type, IP address, and summary.
  - Click any log row to open the **JSONB Metadata Inspector Modal**, rendering formatted syntax-highlighted JSONB with copy-to-clipboard support.

---

### 4. Page 2: Live Operations Dashboard (`/admin/operations`)

#### [NEW] [page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/admin/operations/page.tsx)
- **Top Section: Live Cashflow Trend Chart**:
  - SVG/Canvas interactive time-series chart displaying real-time gross revenue over the last 12 hours with gradient fill, gridlines, and hover tooltips.
- **Bottom Section: 30-Table Tactical Node Map**:
  - Responsive grid rendering Tables 01 to 30.
  - Each node shows real-time status badges: `IDLE`, `ACTIVE (ORDERS)`, `BLOCKED: RATE LIMIT`, or `BLOCKED: DEBT CEILING`.
- **Interactive Table Control Drawer**:
  - Click any table node to open a tactical slide-over panel.
  - Displays table number, active order items, current unpaid debt balance, and recent security logs.
  - Includes a prominent action button: **"RESET BẢO MẬT & MỞ KHÓA BÀN" (Reset Security & Clear Debt/Blocks)** that instantly clears blocks and refreshes the map.

---

### 5. Page 3: System Configuration (`/admin/config`)

#### [NEW] [page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/admin/config/page.tsx)
- **Top Section: Master VietQR NAPAS Configuration**:
  - Configures `vietqr_bank_id`, `vietqr_account_no`, `vietqr_account_name`.
  - Includes Live Dynamic QR preview using official Napas VietQR 247 endpoint.
  - Fully compatible with `TC_ADMIN_SEC_02`.
- **Bottom Section: Security Thresholds & Anti-Spam Policy**:
  - Form controls for:
    - **Max Pay-Later Orders per Window** (default: 2)
    - **Rate Limit Window (Minutes)** (default: 10)
    - **Unpaid Order Debt Ceiling (VNĐ)** (default: 100,000)
    - **SOC Audio Alert Toggle** (Ding-dong / Siren siren)
  - Save button triggers live update across all security layers and logs `SECURITY_THRESHOLD_UPDATED`.

#### [DELETE] [page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/admin/vietqr-config/page.tsx)
- Removed redundant page file since `/admin/vietqr-config` now redirects to `/admin/config`.

---

## Verification Plan

### Automated Tests
- Execute our existing 12-test Playwright suite to verify 0 regressions and 100% backward compatibility:
  ```powershell
  npx playwright test e2e/order_sys.spec.ts --reporter=list
  ```
  - `TC_ADMIN_SEC_01` (SOC Dashboard KPI and log feed on `/admin`) $\rightarrow$ **MUST PASS**.
  - `TC_ADMIN_SEC_02` (VietQR config live update on `/admin/config` via redirect from `/admin/vietqr-config`) $\rightarrow$ **MUST PASS**.

### Manual Verification
1. **SIEM Anomaly & Strict Search (`/admin`)**:
   - Type exact word `table-01-token` in search bar $\rightarrow$ verify only exact whole-word matches appear.
   - Click "SIMULATE ATTACK" button in header $\rightarrow$ verify audio siren plays and a new `RATE_LIMIT_ORDER_BLOCKED` or `SESSION_PRIVILEGE_ESCALATION` log appears instantly.
   - Click any log entry $\rightarrow$ verify JSONB syntax-highlighted inspector modal opens.
2. **Live Operations & Table Reset (`/admin/operations`)**:
   - Verify SVG Cashflow trend chart renders smoothly.
   - Verify 30 tables display in grid.
   - Click a blocked table (e.g., Table 03 or Table 05) $\rightarrow$ click **"RESET BẢO MẬT & MỞ KHÓA BÀN"** $\rightarrow$ verify table badge changes to `IDLE`/`ACTIVE` and security block is cleared.
3. **System Configuration (`/admin/config`)**:
   - Change Debt Ceiling from `100000` to `200000` $\rightarrow$ verify new ceiling takes effect when placing orders on Customer QR app.
