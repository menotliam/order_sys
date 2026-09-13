# Kế hoạch Triển khai (Implementation Plan) - Hệ thống Đặt đồ ăn/uống qua mã QR (QR Code Cafe & Beverage Order System)

Hệ thống đặt đồ uống qua mã QR dành cho cửa hàng Cafe/Nước uống được xây dựng với công nghệ hiện đại (Next.js 15 App Router, TypeScript Strict Mode, Tailwind CSS, Shadcn UI, Supabase SRR & Realtime) gồm 3 phân hệ chính:
1. **Customer App (`/app/(customer)`)**: Giao diện Mobile-first siêu nhanh, quét QR tại bàn, tạo Guest Session ẩn danh, xem menu nước uống kèm trường Ghi chú (Note), đặt đơn theo 2 chế độ **Pay-now (VietQR)** hoặc **Pay-later** với **bảo mật 2 lớp chống Ghost Ordering & Replay Attack**.
2. **Store Owner/Staff Dashboard (`/app/(dashboard)`)**: Giao diện Quản lý Quán **ưu tiên tối ưu cho Mobile & Tablet**, với **2 chế độ hiển thị song song** (Kanban luồng món & Sơ đồ Bàn Table Map), tích hợp **Âm báo Realtime** qua Supabase Realtime cho nhân viên và duyệt đơn Pay-later.
3. **Super Admin SIEM/SOC Dashboard (`/app/(admin)`)**: Giao diện Quản trị viên theo phong cách **SOC/SIEM (Security Operations Center)** với bảng màu SIEM đặc thù (`#0A0F1D`, `#00E5FF`, Holo Blue glow, cảnh báo cảnh báo 3 cấp độ Info/Warning/Critical) và font chữ chuyên dụng (**Rajdhani**, **JetBrains Mono**, **Inter**).

---

## User Review Required

> [!IMPORTANT]
> **Cấu hình Supabase & Dữ liệu mẫu (Seed Data)**
> - Toàn bộ SQL Schema và dữ liệu mẫu phong phú (1 quán cafe mẫu "Highlands/The Coffee House clone", 8 bàn kèm mã QR, 12 món đồ uống cafe/trà chất lượng cao, bảng nhật ký bảo mật `security_logs`, tài khoản mẫu) sẽ được đóng gói trong thư mục `supabase/migrations/20260802000000_initial_schema.sql` và `supabase/seed.sql`.
> - Trong quá trình phát triển, chúng ta có thể kết nối trực tiếp với một project Supabase hoặc sử dụng chế độ Mock/Seed trực tiếp để kiểm thử toàn bộ UX và Realtime ngay trên trình duyệt mà không bị vướng mắc môi trường.

> [!NOTE]
> **Thiết kế SIEM/SOC cho Super Admin Dashboard (`/app/(admin)`)**
> - Giao diện Quản trị viên Super Admin sẽ được thiết kế với **bảng màu SOC/SIEM đặc thù** và **3 bộ font Google Fonts chuyên dụng**:
>   - **Bảng màu SIEM**:
>     - Nền tảng chính: `#0A0F1D`
>     - Nền các khu vực chức năng (Glassmorphic state): `rgba(20, 27, 45, 0.5)`
>     - Chữ hiển thị dữ liệu chính (Crisp Silver): `#E2E8F0`
>     - Chữ phụ / Metadata: `#64748B`
>     - Text Accent: `#00E5FF`
>     - Viền tĩnh (Subtle edge): `#1E293B`
>     - Viền tương tác / Glow (Holo blue): `rgba(0, 229, 255, 0.4)`
>     - Cảnh báo: Info (`#00E5FF`), Warning (`#FFB800`), Critical (`#FF1744`)
>   - **Font chữ Google Fonts**:
>     - Tiêu đề & Cụm chức năng chính: **Rajdhani**
>     - Dữ liệu đặc thù & Log sự kiện: **JetBrains Mono**
>     - Văn bản phụ & Metadata: **Inter**

---

## Open Questions

Hiện tại toàn bộ kiến trúc và thiết kế giao diện đã được thống nhất rõ ràng. Không còn câu hỏi mở.

---

## Proposed Changes

Chúng ta sẽ khởi tạo dự án Next.js mới nhất với TypeScript, Tailwind CSS, Shadcn UI và Supabase SSR trong thư mục workspace hiện tại (`c:/Users/lemdi/Downloads/order_sys`), sau đó xây dựng kiến trúc file rõ ràng theo tiêu chuẩn:

```
c:/Users/lemdi/Downloads/order_sys/
├── supabase/
│   ├── migrations/
│   │   └── 20260802000000_initial_schema.sql  # Toàn bộ DDL + RLS Policies + Security Logs table
│   └── seed.sql                               # Dữ liệu quán cafe mẫu, 8 bàn, 12 món, sample logs
├── src/
│   ├── app/
│   │   ├── (customer)/                        # Phân hệ 1: Khách hàng (Mobile-first)
│   │   │   ├── t/[token]/page.tsx             # QR Table Landing & Guest Session setup
│   │   │   ├── menu/page.tsx                  # Menu đồ uống + Note modal + Floating Cart
│   │   │   ├── checkout/page.tsx              # Chọn Pay-now (VietQR + Mock pay) / Pay-later (2-Layer Defense)
│   │   │   └── order/[id]/page.tsx            # Theo dõi trạng thái đơn hàng realtime
│   │   ├── (dashboard)/                       # Phân hệ 2: Store Owner & Staff Dashboard (Mobile & Tablet First)
│   │   │   ├── layout.tsx                     # Mobile/Tablet Responsive Navigation + Audio Alert Toggle
│   │   │   ├── orders/page.tsx                # Dual View: Kanban Order Cards & Table Map Grid
│   │   │   ├── menu/page.tsx                  # Quản lý đồ uống & Bật/tắt "Hết hàng" realtime
│   │   │   └── tables/page.tsx                # Quản lý 8 Bàn & xuất file tải mã QR
│   │   ├── (admin)/                           # Phân hệ 3: Super Admin SIEM / SOC Dashboard (#0A0F1D, Holo Blue, Rajdhani/JetBrains Mono)
│   │   │   ├── layout.tsx                     # SOC Cyber-terminal Dark Navigation & Top Status Bar
│   │   │   ├── page.tsx                       # SIEM Live Event Feed + Telemetry Counters + Tactical Map
│   │   │   └── stores/page.tsx                # Quản lý Cửa hàng & Cấu hình tài khoản VietQR
│   │   ├── api/
│   │   │   └── webhooks/vietqr/route.ts       # Endpoint nhận Webhook SePay/Casso chuyển tiền thành công
│   │   ├── layout.tsx                         # Google Fonts import (Inter, Rajdhani, JetBrains Mono)
│   │   └── globals.css                        # Design system tokens, SIEM theme variables, Glassmorphism
│   ├── actions/
│   │   ├── order-actions.ts                   # Server Actions: Create order (L1 Security check), Approve, Update status, Mock Pay
│   │   ├── menu-actions.ts                    # Server Actions: Update menu, toggle stock
│   │   └── admin-actions.ts                   # Server Actions: Get SOC security logs, manage stores
│   ├── components/
│   │   ├── ui/                                # Shadcn UI & Custom primitives (Button, Modal, Badge, Card, Dialog...)
│   │   ├── customer/                          # Customer specific UI components (CartSheet, ItemModal, VietQRDisplay)
│   │   ├── dashboard/                         # Owner dashboard UI (KanbanBoard, TableGrid, SoundAlertBar)
│   │   └── admin/                             # SIEM/SOC specific UI (TerminalLogFeed, MetricTelemetryCard, SecurityStatusBadge)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                      # Browser Supabase Client
│   │   │   ├── server.ts                      # Server SSR Supabase Client
│   │   │   └── mock-data.ts                   # In-memory Mock Store fallback (để test tức thì cả khi chưa link Supabase)
│   │   ├── security/
│   │   │   └── rate-limit.ts                  # Lớp 1: Rate limiter (2 đơn/10p) + Check Mức trần đơn chờ (<100k)
│   │   ├── vietqr.ts                          # Bộ tạo URL mã QR chuẩn NAPAS (STK + Số tiền + Mã đơn)
│   │   └── audio.ts                           # Web Audio API Sound Generator / Player cho chuông báo realtime (chỉ cho Staff Dashboard)
│   └── types/
│       ├── database.ts                        # TypeScript interfaces cho Supabase schema
│       └── order.ts                           # Order, Item, Table, SecurityLog interfaces
```

---

### Component 1: CSDL Supabase Schema, RLS & Seed SQL

#### [NEW] [20260802000000_initial_schema.sql](file:///c:/Users/lemdi/Downloads/order_sys/supabase/migrations/20260802000000_initial_schema.sql)
- Định nghĩa các bảng:
  - `stores`: ID, name, logo, vietqr_bank_id, vietqr_account_no, vietqr_account_name, is_active, created_at.
  - `tables`: ID, store_id, table_number, qr_token, status (`idle`, `occupied`, `pending_pay_later`).
  - `categories`: ID, store_id, name, sort_order.
  - `products`: ID, store_id, category_id, name, description, price, image_url, is_available.
  - `orders`: ID, store_id, table_id, order_code, payment_method (`pay_now`, `pay_later`), status (`pending_approval`, `paid_preparing`, `ready`, `completed`, `cancelled`), total_amount, customer_name, customer_phone, is_paid, created_at.
  - `order_items`: ID, order_id, product_id, product_name, price, quantity, note.
  - `security_logs`: ID, store_id, table_id, event_type (`RATE_LIMIT_BLOCKED`, `UNPAID_CEILING_BLOCKED`, `WEBHOOK_PAID`, `PAY_LATER_APPROVED`, `NEW_ORDER`), severity (`INFO`, `WARNING`, `CRITICAL`), message, metadata, created_at.
  - `profiles`: ID, email, role (`super_admin`, `store_owner`), store_id.
- Bật Row Level Security (RLS) cho tất cả các bảng:
  - Cho phép Public/Guest truy cập đọc menu, tạo đơn, đọc đơn theo ID/Table Token.
  - Cho phép Owner cập nhật đơn, menu thuộc `store_id` của họ.
  - Cho phép Super Admin truy cập toàn bộ `stores` và `security_logs`.

#### [NEW] [seed.sql](file:///c:/Users/lemdi/Downloads/order_sys/supabase/seed.sql)
- Dữ liệu mẫu phong phú:
  - 1 Quán Cafe: "The Cyber Coffee - SOC Station".
  - 8 Bàn từ Bàn 01 đến Bàn 08 với `qr_token` mẫu (`table-01-token` đến `table-08-token`).
  - 4 Danh mục: Cà phê Máy, Trà Trái Cây, Đá Xay, Bánh Ngọt.
  - 12 Món đồ uống với hình ảnh đẹp (Cà phê Muối, Bạc Xỉu, Trà Đào Cam Sả, Matcha Latte, Espresso, Cold Brew...).
  - Dữ liệu mẫu cho `security_logs` để hiển thị ngay trên giao diện SIEM/SOC.

---

### Component 2: Core Utilities & Security Defense Layer

#### [NEW] [rate-limit.ts](file:///c:/Users/lemdi/Downloads/order_sys/src/lib/security/rate-limit.ts)
- Hiện thực **Mô hình Bảo mật Lớp 1 (System Limits)** cho đơn Pay-later:
  - `checkPayLaterRateLimit(tableId)`: Kiểm tra tần suất (tối đa 2 đơn trong 10 phút). Nếu vượt -> trả về lỗi & ghi log `RATE_LIMIT_BLOCKED` vào `security_logs`.
  - `checkUnpaidOrderCeiling(tableId)`: Kiểm tra nếu bàn đang có đơn Pay-later chưa xử lý trị giá > 100.000 VNĐ -> từ chối đơn mới & ghi log `UNPAID_CEILING_BLOCKED` vào `security_logs`.

#### [NEW] [vietqr.ts](file:///c:/Users/lemdi/Downloads/order_sys/src/lib/vietqr.ts)
- Bộ tạo link ảnh mã QR tĩnh & động chuẩn VietQR NAPAS qua `https://img.vietqr.io/image/` theo STK, ID Ngân hàng, Số tiền, Nội dung thanh toán (`ORDER_{order_code}`).

#### [NEW] [audio.ts](file:///c:/Users/lemdi/Downloads/order_sys/src/lib/audio.ts)
- Hiện thực bộ phát chuông báo bằng Web Audio API (không cần tải file âm thanh ngoài, tự động tổng hợp âm chuông "Ding-Dong" sắc nét dành cho **Staff Dashboard**).

---

### Component 3: Server Actions (`src/actions/`)

#### [NEW] [order-actions.ts](file:///c:/Users/lemdi/Downloads/order_sys/src/actions/order-actions.ts)
- `createOrderAction(data)`:
  - Thực hiện kiểm tra Bảo mật Lớp 1 cho Pay-later.
  - Tạo đơn mới trong DB.
  - Ghi sự kiện vào `security_logs` (`NEW_ORDER`).
- `approvePayLaterAction(orderId)`:
  - Chuyển đơn Pay-later từ `pending_approval` sang `paid_preparing` (Bảo mật Lớp 2: Duyệt đơn).
  - Ghi log `PAY_LATER_APPROVED`.
- `updateOrderStatusAction(orderId, newStatus)`: Chuyển trạng thái (`ready`, `completed`, `cancelled`).
- `mockPaySuccessAction(orderId)`:
  - Nút Giả lập thanh toán thành công cho đơn Pay-now -> chuyển sang `paid_preparing` và ghi log `WEBHOOK_PAID`.

#### [NEW] [admin-actions.ts](file:///c:/Users/lemdi/Downloads/order_sys/src/actions/admin-actions.ts)
- `getSocTelemetryLogsAction()`: Fetch danh sách log an ninh theo thời gian thực cho màn hình SIEM/SOC.
- `getPlatformMetricsAction()`: Thống kê doanh thu, số đơn, tỷ lệ phương thức thanh toán cho Super Admin.

---

### Component 4: Customer Web App (`src/app/(customer)/`)

#### [NEW] [t/[token]/page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/(customer)/t/[token]/page.tsx)
- Landing page khi khách quét QR bàn: lưu `token` và `table_id` vào local storage / guest cookie -> tự động chuyển tiếp sang `/menu`.

#### [NEW] [menu/page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/(customer)/menu/page.tsx)
- Giao diện Mobile-first tuyệt đẹp:
  - Thanh Header hiển thị "Bàn số X - The Cyber Coffee".
  - Thanh cuộn danh mục nhanh (Cà Phê, Trà, Bánh...).
  - Danh sách thẻ sản phẩm dạng Grid/List hiển thị giá và nút Thêm (+).
  - **Modal chọn món & Ghi chú (ItemModal)**: Khách chọn số lượng và ghi chú riêng (Ví dụ: "Ít đường, nhiều đá", "Mức đường 50%").
  - **Floating Cart Button**: Hiển thị tổng số ly và tổng tiền nổi dưới màn hình điện thoại.

#### [NEW] [checkout/page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/(customer)/checkout/page.tsx)
- Trang thanh toán đơn hàng:
  - Cho phép khách chọn phương thức:
    - **(1) Pay-now (Chuyển khoản VietQR)**: Hiển thị mã VietQR động theo đúng số tiền và Mã đơn hàng + nút **"Giả lập chuyển tiền thành công (Mock Pay Success)"** để test ngay lập tức.
    - **(2) Pay-later (Tiền mặt tại bàn)**: Cảnh báo "Đơn hàng sẽ được nhân viên quan sát xác nhận trước khi pha chế để tránh đơn hàng ảo".
  - Hiển thị phản hồi bảo mật ngay trên UI nếu khách cố tình đặt vượt ngưỡng Rate-limit / Mức trần đơn nợ.

#### [NEW] [order/[id]/page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/(customer)/order/[id]/page.tsx)
- Trang theo dõi luồng trạng thái món thời gian thực (với Supabase Realtime):
  - Hiển thị thanh tiến trình 4 bước (`Pending Approval` → `Preparing` → `Ready` → `Completed`).
  - **Đổi trạng thái mượt mà**: Khi món xong (`Ready`), chỉ cần hiệu ứng thay đổi màu sắc và huy hiệu trực quan trên màn hình (không kêu chuông vì nhân viên sẽ mang nước đến tận bàn cho khách).

---

### Component 5: Store Owner / Staff Dashboard (`src/app/(dashboard)/`) - Ưu tiên Mobile & Tablet First

#### [NEW] [layout.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/(dashboard)/layout.tsx)
- Navigation tối ưu cho **Mobile & Tablet (iPad)**:
  - Responsive Top Bar & Bottom/Sidebar Navigation linh hoạt cho màn hình cảm ứng: Đơn hàng (Orders), Thực đơn (Menu), Quản lý Bàn (Tables).
  - **Thanh Audio Alert Toggle Switch** trên Header: Cho phép bật/tắt chuông báo đơn mới và kiểm tra trạng thái kết nối Realtime.

#### [NEW] [orders/page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/(dashboard)/orders/page.tsx)
- Giao diện Quản lý Đơn hàng **kết hợp 2 chế độ (Dual-View UX) với nút cảm ứng lớn**:
  - **Nút chuyển đổi chế độ**: `Kanban Luồng món` <--> `Sơ đồ Bàn (Table Map)`.
  - **Chế độ 1 - Kanban Order Cards**:
    - Cột 1: **Chờ duyệt (Pending Approval - Pay Later)** -> Có thẻ cảnh báo màu vàng, nút **"Duyệt đơn (Approve)"**.
    - Cột 2: **Đang pha chế (Preparing)** -> Nút **"Báo món xong (Ready)"**.
    - Cột 3: **Sẵn sàng phục vụ (Ready)** -> Nút **"Hoàn thành (Completed)"** sau khi đã mang ra bàn cho khách.
    - Cột 4: **Đã hoàn thành (Completed)**.
  - **Chế độ 2 - Sơ đồ Bàn (Table Map / Grid)**:
    - Hiển thị 8 bàn (Bàn 01 - Bàn 08) dễ chạm trên tablet, đổi màu sống động (Xanh: Trống, Vàng: Chờ duyệt Pay-later, Cam: Đang pha chế).
  - **Tích hợp Supabase Realtime Channel**: Ngay khi có đơn hàng mới (`INSERT` vào `orders`), tự động kêu chuông "Ding-Dong" và làm nhấp nháy đơn hàng mới trên thiết bị của quán.

#### [NEW] [menu/page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/(dashboard)/menu/page.tsx)
- Quản lý danh sách 12 đồ uống trên giao diện chạm (Touch UI):
  - Cho phép Chủ quán/Nhân viên bật/tắt công tắc **"Còn hàng / Hết hàng"** ngay trên giao diện với hiệu ứng tức thì.

#### [NEW] [tables/page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/(dashboard)/tables/page.tsx)
- Hiển thị danh sách 8 bàn kèm mã QR Code (`qrcode.react`), cho phép xem nhanh link test (`/t/table-01-token`) hoặc in mã QR cho bàn.

---

### Component 6: Super Admin SIEM / SOC Dashboard (`src/app/(admin)/`) - Thiết kế SOC/SIEM đặc thù

#### [NEW] [layout.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/(admin)/layout.tsx)
- Thiết kế **SOC / SIEM Cyber-Terminal Aesthetic**:
  - Tích hợp 3 font Google Fonts: **Rajdhani** (tiêu đề/chức năng chính), **JetBrains Mono** (dữ liệu/log), **Inter** (văn bản phụ).
  - Màu nền chính: `#0A0F1D`.
  - Viền tĩnh (Subtle edge): `#1E293B`.
  - Viền tương tác/glow (Holo blue): `rgba(0, 229, 255, 0.4)`.
  - Top Tactical Status Bar: Hiển thị trạng thái SOC: `SYSTEM_STATUS: HEALTHY`, `ACTIVE_DEFENSE_LAYER: ON`, `RATE_LIMIT_GUARD: 2 req/10m`, `TENANT: THE_CYBER_COFFEE`.

#### [NEW] [page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/(admin)/page.tsx)
- Màn hình Trung tâm Điều hành SOC / SIEM (Security Operations Center):
  - **1. Telemetry Counter Matrix (Glassmorphic `rgba(20, 27, 45, 0.5)`)**:
    - Chữ hiển thị số liệu chính (Crisp Silver `#E2E8F0`), label phụ (`#64748B`), Text accent (`#00E5FF`).
    - Tổng doanh thu hệ thống (Gross GMV).
    - Tỷ lệ giao dịch Pay-now (VietQR) vs. Pay-later.
    - Số lần chặn tấn công/spam đơn ảo (Security Blocks Counter).
  - **2. Live SIEM Security & Event Feed (Terminal Log Console - JetBrains Mono)**:
    - Console cuộn thời gian thực với màu sắc cảnh báo 3 cấp độ:
      - `[INFO]` (Màu `#00E5FF`): `PAY_LATER_APPROVED`, `WEBHOOK_PAID`, `NEW_ORDER`.
      - `[WARNING]` (Màu `#FFB800`): `UNPAID_CEILING_BLOCKED - Table 05 blocked from Pay-Later due to unpaid order #1002 (120,000 VND).`
      - `[CRITICAL]` (Màu `#FF1744`): `RATE_LIMIT_BLOCKED - Table 03 attempted 3rd Pay-Later order within 4 minutes.`
  - **3. Tactical Table & Node Monitor Grid**:
    - Sơ đồ ma trận 8 node bàn hiển thị trạng thái an ninh của từng bàn thời gian thực (Normal, Guard Alerted, Active Session) với hiệu ứng viền Holo Blue.

#### [NEW] [stores/page.tsx](file:///c:/Users/lemdi/Downloads/order_sys/src/app/(admin)/stores/page.tsx)
- Quản lý cấu hình cửa hàng:
  - Cấu hình tài khoản VietQR cho quán cafe (Ngân hàng MB/VCB/TCB, STK, Tên tài khoản, Webhook URL).

---

## Verification Plan

### Automated Tests
- Kiểm tra tính hợp lệ của cú pháp TypeScript và kiểm tra lỗi Server/Client component:
  ```bash
  npx tsc --noEmit
  npm run build
  ```

### Manual Verification Flow
- **Bước 1: Khởi tạo Database & Dữ liệu mẫu (Seed Data)**
  - Chạy migration SQL và seed SQL trong Supabase SQL Editor (hoặc sử dụng hệ thống test tích hợp trong ứng dụng).
- **Bước 2: Trải nghiệm Customer Web App (`/app/(customer)`)**
  - Truy cập `/t/table-01-token` -> Vào Menu đồ uống -> Thêm 2 món Cà Phê Muối và Trà Đào kèm Ghi chú ("Ít đường").
  - Kiểm thử Bảo mật Lớp 1 (Pay-later): Đặt liên tiếp 3 đơn Pay-later cho cùng Bàn 01 trong vòng vài phút -> Xác nhận thông báo từ chối bảo mật hiển thị rõ ràng trên UI và được ghi vào nhật ký SOC.
  - Kiểm thử Pay-now VietQR: Chọn thanh toán VietQR -> Xem QR chuẩn NAPAS -> Bấm nút "Giả lập thanh toán thành công (Mock Pay Success)" -> Kiểm tra chuyển hướng sang màn hình theo dõi trạng thái đơn hàng.
  - Kiểm tra trạng thái món 4 bước: `Pending Approval` → `Preparing` → `Ready` → `Completed` (nhận thấy trạng thái `Ready` không phát tiếng chuông).
- **Bước 3: Trải nghiệm Store Owner Dashboard (`/app/(dashboard)`) trên Tablet/Mobile UX**
  - Bật "Âm báo Realtime" trên header -> Ngay khi đơn hàng mới xuất hiện, xác nhận chuông "Ding-Dong" vang lên và thẻ đơn hàng nhấp nháy.
  - Chuyển đổi linh hoạt giữa Tab "Kanban Luồng món" và Tab "Sơ đồ Bàn Table Map" trên cảm ứng.
  - Bấm nút **"Duyệt đơn (Approve)"** cho đơn Pay-later -> Chuyển sang `Preparing` -> `Ready` -> `Completed`.
- **Bước 4: Trải nghiệm Super Admin SIEM / SOC Dashboard (`/app/(admin)`)**
  - Kiểm tra bảng màu chính xác `#0A0F1D`, viền Holo Blue `rgba(0, 229, 255, 0.4)` và 3 font **Rajdhani**, **JetBrains Mono**, **Inter**.
  - Quan sát Terminal Log Console hiển thị dòng sự kiện cảnh báo bảo mật (`RATE_LIMIT_BLOCKED`, `UNPAID_CEILING_BLOCKED`) đúng màu sắc Info `#00E5FF`, Warning `#FFB800`, Critical `#FF1744`.
