### 🟢 1. PHÂN HỆ KHÁCH HÀNG (CUSTOMER QR APP - `/menu`, `/checkout`, `/order/[id]`)

#### **A. Happy Path (Luồng Chuẩn)**
- [ ] **TC_CUST_HP_01 [Pay-Now VietQR Flow]:**
  - **Steps:**
    1. Truy cập `/menu?tableToken=table-01-token` (Bàn 01).
    2. Chọn món *"Cà Phê Sữa Đá"*, chọn số lượng `2`, nhập ghi chú *"Ít đường"*, bấm **Thêm vào giỏ**.
    3. Mở Giỏ hàng, kiểm tra tổng tiền hiển thị chính xác (`2 x giá món`).
    4. Chọn phương thức **Thanh toán ngay (Pay-Now)** $\rightarrow$ Bấm **TIẾN HÀNH THANH TOÁN VIETQR**.
    5. Kiểm tra URL chuyển đến `/checkout?orderId=...`.
    6. Kiểm tra QR Code hiển thị chính xác (NAPAS 247) cùng số tiền, số tài khoản, tên chủ tài khoản.
    7. Bấm **Giả lập thanh toán thành công (Mock Pay)** $\rightarrow$ Hiệu ứng Confetti nổ và tự động redirect sang trang theo dõi `/order/[id]` với trạng thái **Đang pha chế (Preparing)**.

- [ ] **TC_CUST_HP_02 [Pay-Later Order Flow]:**
  - **Steps:**
    1. Truy cập `/menu?tableToken=table-03-token` (Bàn 03).
    2. Thêm 1 món đồ uống dưới 100,000đ vào giỏ.
    3. Chọn phương thức **Thanh toán sau (Pay-Later)** $\rightarrow$ Bấm gửi đơn hàng.
    4. Kiểm tra trang thông báo chuyển sang màn hình **Yêu cầu Trả sau đang chờ nhân viên quán xác nhận**.
    5. Bấm vào nút **Theo dõi trạng thái đơn hàng** để xem màn hình chi tiết đơn.

---

#### **B. Edge Cases (Các Trường Hợp Biên & Logic Giao Diện)**
- [ ] **TC_CUST_EDGE_01 [Empty Cart / 0đ Prevent - *Resolved Bug*]:**
  - **Steps:**
    1. Mở `/menu`, thêm 1 món vào giỏ hàng và mở giỏ hàng lên.
    2. Trong giỏ hàng, giảm số lượng về `0` hoặc bấm icon thùng rác (`Trash2`) để xoá hết món.
    3. **Verify:** Hiển thị màn hình trống *"Giỏ hàng hiện đang trống (0đ)"*.
    4. **Verify:** Nút submit đơn hàng ở Footer **bị vô hiệu hóa (disabled)**, người dùng không thể bấm tạo đơn 0đ hoặc chuyển sang trang thanh toán VietQR.

- [ ] **TC_CUST_EDGE_02 [Out-of-Stock Dimming - *Resolved Bug*]:**
  - **Steps:**
    1. Truy cập `/menu` nơi có ít nhất 1 món đang ở trạng thái **Hết hàng (`is_available = false`)**.
    2. **Verify:** Món không bị ẩn khỏi danh sách mà được **làm mờ (opacity-50, grayscale)**, hiển thị huy hiệu **"Hết hàng"** màu đỏ trên hình ảnh.
    3. **Verify:** Giá tiền bị gạch ngang (`line-through`) và nút **"Thêm"** được thay bằng nhãn **"Hết hàng"**.
    4. **Verify:** Bấm/Click vào món hết hàng **không** hiển thị Modal tùy chọn/thêm giỏ hàng.

- [ ] **TC_CUST_EDGE_03 [Quantity & Note Modification]:**
  - **Steps:**
    1. Thêm 1 món với ghi chú *"Nhiều sữa"* (qty = 1).
    2. Thêm tiếp chính món đó với ghi chú *"Nhiều sữa"* (qty = 2) $\rightarrow$ **Verify:** Giỏ hàng gộp thành `qty = 3` cùng 1 dòng.
    3. Thêm chính món đó nhưng ghi chú khác *"Không đá"* $\rightarrow$ **Verify:** Giỏ hàng tách thành 2 dòng riêng biệt.

---

#### **C. Attack & Rate Limit Scenarios (Tấn Công & Phá Vỡ Giới Hạn)**
- [ ] **TC_CUST_SEC_01 [Pay-Later Ceiling Limit Breach (> 100k VND)]:**
  - **Steps:**
    1. Vào `/menu?tableToken=table-05-token` (Bàn 05).
    2. Chọn các món hoặc tăng số lượng sao cho **Tổng đơn hàng > 100,000đ**.
    3. Chọn phương thức **Thanh toán sau (Pay-Later)** và bấm submit.
    4. **Verify (Layer 1 Security):** Hệ thống từ chối tạo đơn, hiển thị cảnh báo đỏ ngay trong giỏ hàng: *"Hệ thống từ chối do quá giới hạn đơn chờ chưa thanh toán / Trần đơn nợ > 100k"*.

- [ ] **TC_CUST_SEC_02 [Pay-Later Rate Limit Spam / Flood Attack (2 Orders / 10 Mins)]:**
  - **Steps:**
    1. Sử dụng cùng một Token bàn (`table-01-token`).
    2. Tạo thành công **Đơn Pay-Later thứ 1** (< 100k) $\rightarrow$ Không thanh toán/không duyệt.
    3. Quay lại menu, tạo tiếp **Đơn Pay-Later thứ 2** (< 100k) $\rightarrow$ Thành công.
    4. Ngay lập tức tạo tiếp **Đơn Pay-Later thứ 3** (< 100k).
    5. **Verify (Rate Limit Block):** Đơn thứ 3 bị từ chối gửi đi, hiển thị cảnh báo lỗi giới hạn đơn chờ (`SECURITY_BLOCKED`) bảo vệ quán khỏi spam đơn ảo.

---

### 🟡 2. PHÂN HỆ QUÁN (STAFF DASHBOARD - `/orders`, `/tables`, `/menu-manage`)

#### **A. Happy Path & Real-time Operations**
- [ ] **TC_STAFF_HP_01 [Kanban Board & Order Processing]:**
  - **Steps:**
    1. Truy cập `http://localhost:3000/orders`.
    2. Kiểm tra danh sách cột Kanban: *Chờ Duyệt (Pending) -> Đang Pha Chế -> Chờ Lấy Món (Ready) -> Đã Hoàn Thành*.
    3. Với đơn **Pay-Later** mới ở cột Chờ Duyệt $\rightarrow$ Bấm **"Duyệt Đơn Trả Sau"** $\rightarrow$ Verify đơn chuyển sang cột **Đang Pha Chế**.
    4. Bấm **"Báo Xong Món (Ready)"** $\rightarrow$ Verify đơn chuyển cột **Chờ Lấy Món**.
    5. Bấm **"Hoàn Thành"** $\rightarrow$ Verify đơn chuyển cột **Đã Hoàn Thành**.

- [ ] **TC_STAFF_HP_02 [8-Table Interactive Layout]:**
  - **Steps:**
    1. Chuyển sang chế độ xem **Sơ Đồ 8 Bàn (`/tables`)**.
    2. Kiểm tra bàn đang có đơn mới/đang phục vụ hiển thị đúng trạng thái màu sắc và tổng bill.
    3. Click vào bàn đang hoạt động để xem chi tiết đơn hàng đang gắn với bàn đó.

- [ ] **TC_STAFF_HP_03 [Real-time Audio Alert (Ding-Dong)]:**
  - **Steps:**
    1. Bật nút chuông thông báo (Audio Toggle) góc trên bên phải trang `/orders`.
    2. Giả lập một đơn hàng mới từ Khách hàng (`NEW_ORDER`).
    3. **Verify:** Hệ thống phát chuông đôi cảnh báo tức thì cho nhân viên quầy.

#### **B. Menu Management & Sync**
- [ ] **TC_STAFF_MENU_01 [Toggle Out-of-Stock Sync]:**
  - **Steps:**
    1. Truy cập `http://localhost:3000/menu-manage`.
    2. Chọn 1 món đang Còn hàng, bấm tắt trạng thái (`is_available = false`).
    3. Mở tab Khách hàng (`/menu`), re-render/refetch và kiểm tra món đã được chuyển sang chế độ **"Hết hàng" (làm mờ, khóa thao tác Thêm)**.

---

### 🔴 3. PHÂN HỆ SUPER ADMIN & SECURITY SOC (`/admin`, `/vietqr-config`)

#### **A. Security Telemetry & SIEM Validation**
- [ ] **TC_ADMIN_SEC_01 [SOC Security Log Feed & JSON Payload Inspection]:**
  - **Steps:**
    1. Truy cập `http://localhost:3000/admin`.
    2. Kiểm tra bộ chỉ số KPI: Doanh thu GMV, tổng số đơn, và **Số lần chặn tấn công/spam (Blocked Attacks)**.
    3. Thực hiện kịch bản tấn công **TC_CUST_SEC_01** hoặc **TC_CUST_SEC_02** ở tab Khách.
    4. Kiểm tra trong **Terminal Security Log Feed** xuất hiện log cảnh báo (Severity: `WARNING` / `ERROR`).
    5. Click vào log event để mở **JSON Metadata Payload**, verify thông số chi tiết (`table_id`, `reason`, `event_type`).

- [ ] **TC_ADMIN_SEC_02 [Live VietQR NAPAS Config Update]:**
  - **Steps:**
    1. Vào `http://localhost:3000/vietqr-config`.
    2. Thay đổi số tài khoản ngân hàng (`vietqr_account_no`) hoặc Ngân hàng hưởng thụ (`vietqr_bank_id`) $\rightarrow$ Lưu cấu hình.
    3. Tạo một đơn Pay-Now mới bên ứng dụng Khách $\rightarrow$ Mở màn hình VietQR (`/checkout`).
    4. **Verify:** Mã QR và thông tin STK/Chủ tài khoản hiển thị đúng theo cấu hình vừa cập nhật từ Super Admin.