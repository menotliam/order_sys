# Walkthrough: Hệ Thống Đặt Đồ Uống Qua Mã QR & Trung Tâm Điều Hành SOC SIEM v2.6

Dự án **QR Code Cafe & Beverage Order System** gồm 3 phân hệ chính đã được hiện thực hoàn chỉnh theo đúng **Bản Thiết Kế Kiến Trúc (Architecture Plan)** và các yêu cầu điều chỉnh từ phía User (Super Admin/SOC):

1. **Customer QR App (Mobile-first Web)**: Đặt đồ uống tại bàn không cần chờ đợi, có ô nhập **Ghi chú tuỳ chỉnh** (độ ngọt/đá...), hỗ trợ thanh toán VietQR (Pay Now) và Trả Sau (Pay Later).
2. **Store Owner / Staff Dashboard (Mobile & Tablet First)**: Điều hành đơn theo **Kanban 4 trạng thái** hoặc **Sơ đồ 8 bàn Cafe**, nút chạm bật/tắt nhanh **Hết hàng / Còn hàng** và công tắc **Âm báo Ding-Dong Realtime** khi có đơn mới.
3. **Super Admin SOC/SIEM Dashboard (Dark Cyber-terminal)**: Giao diện chuyên dụng cho vị trí **SOC/SIEM** giám sát doanh thu GMV, các cuộc tấn công/spam bị chặn, bảng cấu hình VietQR và luồng **Nhật ký An ninh (Live Telemetry Log Feed)** realtime.

---

## 1. Tóm Tắt Kiến Trúc & Bảng Màu SOC

- **Bảng màu SIEM SOC**:
  - Nền tảng chính: `#0A0F1D` (`siem-bg`)
  - Nền khu vực chức năng (Glassmorphism): `rgba(20, 27, 45, 0.5)`
  - Màu nhấn (Accent Info): `#00E5FF`, Cảnh báo (Warning): `#FFB800`, Nguy cấp (Critical): `#FF1744`
- **Bộ phông chữ Google Fonts**:
  - `Rajdhani` cho tiêu đề chính và các thẻ Kanban/KPI
  - `JetBrains Mono` cho nhật ký an ninh, số liệu tài chính và mã token
  - `Inter` cho văn bản mô tả và chú thích món

---

## 2. Chi Tiết Các Phân Hệ Đã Xây Dựng

### Phân Hệ 1: Customer App (Khách Hàng Quét QR)
- **Welcome Landing (`/t/[token]`)**:
  - Khách quét mã QR tại bàn (từ Bàn 01 đến Bàn 08) sẽ được chào đón tại màn hình nhận diện số bàn và token.
- **Thực Đơn Đồ Uống (`/menu`)**:
  - Giao diện Mobile-first với các danh mục: *Cà Phê Đặc Sản, Trà Trái Cây Đào Cam Sả, Matcha & Đá Xay, Bánh Ngọt & Pastry*.
  - Tích hợp Modal nhập **Ghi chú món (Note)** theo yêu cầu: `"Ít đường, nhiều đá"`, `"Đường 50%"`, `"Nhiều kem muối"`...
  - **Giỏ hàng Floating Bottom Drawer** cho phép chọn hình thức thanh toán **Thanh toán ngay (VietQR)** hoặc **Thanh toán sau**.
- **Lớp Bảo Mật 1 cho Pay-Later (`src/lib/security/rate-limit.ts`)**:
  - **Giới hạn tần suất**: Tối đa 2 đơn Trả Sau / 10 phút / bàn.
  - **Mức trần đơn nợ (Unpaid Ceiling)**: Từ chối yêu cầu Trả Sau nếu bàn đang có đơn nợ chưa xác nhận trị giá $\ge 100,000$ VNĐ.
  - Khi kích hoạt chặn, hệ thống tự động ghi nhật ký `RATE_LIMIT_BLOCKED` (CRITICAL) hoặc `UNPAID_CEILING_BLOCKED` (WARNING) về SOC.
- **Thanh Toán VietQR & Giả Lập Webhook (`/checkout`)**:
  - Mã QR động chuẩn NAPAS 247 được sinh trực tiếp từ `img.vietqr.io` với đúng số tiền và mã đơn (`ORDER_SOC-xxxx`).
  - Nút **"Giả lập thanh toán thành công (Mock Pay Sandbox)"** giúp test luồng thanh toán tự động kèm hiệu ứng pháo hoa chúc mừng.
- **Theo Dõi Đơn Hàng 4 Bước (`/order/[id]`)**:
  - Hiển thị 4 trạng thái: `Chờ xác nhận -> Đang pha chế -> Ready -> Hoàn thành`.
  - **Đúng theo yêu cầu điều chỉnh**: Trạng thái `"Ready for Pickup"` được sửa gọn thành **`"Ready"`**. Khi món hoàn tất, giao diện đổi sang hiệu ứng màu xanh lá rực rỡ kèm thông báo *“Nhân viên sẽ mang đồ uống đến tận bàn cho bạn trong giây lát”*, **hoàn toàn không nổ chuông âm thanh** tại máy khách hàng.

### Phân Hệ 2: Owner/Staff Dashboard (Chủ Quán / Phục Vụ)
- **Tối ưu Mobile & Tablet First**:
  - Bố trí các nút bấm lớn, dễ chạm trên máy tính bảng hoặc điện thoại di động của quầy bar/nhân viên.
- **Thanh Công Tắc Âm Báo Realtime (`<AudioAlertToggle />`)**:
  - Tích hợp **Web Audio API** tự động phát chuông đôi `"Ding-Dong"` (880Hz -> 659Hz) **chỉ trên Staff Dashboard** mỗi khi hệ thống phát hiện có đơn gọi món mới. Nhân viên có thể bật/tắt âm báo tuỳ ý.
- **Điều Hành Đơn Hàng (`/orders`)**:
  - Chuyển đổi linh hoạt giữa **2 chế độ xem**:
    1. **Kanban Luồng món**: 4 cột trạng thái rõ ràng, cho phép duyệt đơn Trả Sau, bấm chuyển trạng thái `Ready` và `Hoàn thành`.
    2. **Sơ đồ 8 bàn (Table Map)**: Trực quan hóa tình trạng từng bàn (*Bàn trống, Có khách, Chờ duyệt Pay-Later*).
- **Quản Lý Menu Chạm (`/menu`)**:
  - Chỉ cần 1 lần chạm (1-Tap) để đánh dấu **Còn hàng / Hết hàng** cho bất kỳ món nào. Thay đổi có hiệu lực ngay lập tức bên phía khách hàng.
- **Quản Lý Mã QR 8 Bàn (`/tables`)**:
  - Hiển thị mã QR chuẩn cho Bàn 01 - Bàn 08, hỗ trợ mở nhanh giao diện kiểm thử của từng bàn.

### Phân Hệ 3: Super Admin SOC/SIEM Dashboard (Trung Tâm SOC)
- **Thiết Kế Đậm Chất Cyber-Terminal (`/admin`)**:
  - Nền `#0A0F1D`, viền sáng `#1E293B`, các thẻ Glassmorphic `rgba(20, 27, 45, 0.5)` và phông chữ kỹ thuật `JetBrains Mono`.
- **Ma Trận Telemetry KPI Matrix**:
  - Số liệu **Tổng doanh thu GMV**, phân bổ thanh toán **Pay-Now / Pay-Later**, tổng số cảnh báo an ninh bị chặn và số lượng Node (bàn) đang hoạt động.
- **Nhật Ký An Ninh SIEM Realtime (Live Security Log Feed)**:
  - Khung Terminal ghi nhận các sự kiện: `RATE_LIMIT_BLOCKED`, `UNPAID_CEILING_BLOCKED`, `WEBHOOK_PAID`, `PAY_LATER_APPROVED`, `NEW_ORDER`.
  - Phân loại màu sắc theo mức độ: **`CRITICAL`** (Đỏ #FF1744), **`WARNING`** (Vàng #FFB800), **`INFO`** (Xanh #00E5FF).
  - Cho phép click mở rộng để kiểm tra chi tiết **JSON Metadata Payload** của từng sự kiện an ninh.
- **Sơ Đồ Giám Sát Bàn (Tactical Node Map)**:
  - Hiển thị tình trạng an ninh và trạng thái của 8 Node (Bàn 01 - Bàn 08).
- **Cấu Hình VietQR Ngân Hàng (`/admin/vietqr-config`)**:
  - Cho phép Super Admin thay đổi Ngân hàng nhận tiền (MBBank, Vietcombank, BIDV...), Số tài khoản và Tên chủ tài khoản kèm khung **xem trước mã QR động NAPAS**.

---

## 3. Cấu Trúc Database & Mock Data Sandbox

- **SQL Schema (`supabase/migrations/20260802000000_initial_schema.sql`)**:
  - 8 bảng chuẩn hóa: `stores`, `tables`, `categories`, `products`, `orders`, `order_items`, `security_logs`, `profiles`.
  - Đã bật **Row Level Security (RLS)** và **Supabase Realtime**.
- **Rich Seed Data (`supabase/seed.sql` & `src/lib/supabase/mock-data.ts`)**:
  - 1 quán cafe *"The Cyber Coffee - SOC Station"*.
  - 8 bàn với QR token hợp lệ (`table-01-token` -> `table-08-token`).
  - 4 danh mục với 12 món cà phê, trà, matcha, bánh ngọt kèm hình ảnh Unsplash chất lượng cao.
  - Dữ liệu đơn hàng mẫu và các dòng nhật ký SIEM SOC mẫu để trải nghiệm sống động ngay từ lần mở đầu tiên.

---

## 4. Hướng Dẫn Kiểm Thử (How to Verify)

1. **Khởi động Dev Server**:
   ```powershell
   npm run dev
   ```
2. **Truy cập Cổng Welcome Portal (`http://localhost:3000/`)**:
   - Bạn sẽ thấy 3 cổng truy cập nhanh ứng với 3 phân hệ.
3. **Kiểm thử Phân Hệ Khách Hàng (Customer)**:
   - Click vào **Customer QR App (Bàn 01)** hoặc chọn nhanh **Bàn 03 / Bàn 05** ở dưới.
   - Chọn món đồ uống, bấm để mở cửa sổ nhập **Ghi chú tuỳ chọn** (*"Ít đường, nhiều đá"*).
   - Vào Giỏ hàng, thử đặt đơn theo hình thức **Pay-Later** $\rightarrow$ Thử tạo tiếp 3 đơn liên tiếp hoặc đơn trị giá > 100k để chứng kiến **Lớp Bảo Mật 1 từ chối** và ghi nhật ký cảnh báo về SOC.
   - Chọn hình thức **Pay-Now** $\rightarrow$ Bấm **"Giả lập thanh toán thành công (Mock Pay)"** để thấy đơn tự động nhảy sang trạng thái **Đang pha chế** và tiến tới **Ready**.
4. **Kiểm thử Phân Hệ Quán (Staff Dashboard)**:
   - Mở `http://localhost:3000/orders`.
   - Kiểm tra **Âm báo Ding-Dong** ở trên cùng bên phải. Khi khách gửi đơn mới, chuông đôi sẽ reo.
   - Chuyển đổi giữa chế độ **Kanban Món** và **Sơ Đồ 8 Bàn**, bấm **"Duyệt Đơn Trả Sau"**, bấm **"Báo Xong Món (Ready)"** và **"Hoàn Thành"**.
   - Vào tab **Quản Lý Menu**, thử chạm tắt trạng thái Còn hàng của 1 món và qua ứng dụng Khách kiểm tra thấy món bị làm mờ Hết hàng.
5. **Kiểm thử Phân Hệ Super Admin SOC (`http://localhost:3000/admin`)**:
   - Quan sát các chỉ số KPI doanh thu GMV và số lần chặn tấn công/spam.
   - Mở khung **Terminal Security Log Feed**, click vào một sự kiện cảnh báo để xem **JSON Metadata Payload**.
   - Vào **VietQR Bank Config**, thử sửa số tài khoản hoặc ngân hàng để kiểm chứng mã QR thay đổi trực tiếp.
