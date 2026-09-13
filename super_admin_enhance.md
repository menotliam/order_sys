# Trang giám sát an ninh
## 1 khung kích thước lớn hiển thị live audit logs: 
Chỉ catch các loại log sau với cấu trúc DB linh hoạt với JSONB để lưu trữ metadata cho từng loại, cụ thể:
Tạo 1 bảng security_logs duy nhất, dùng kiểu JSONB của PostgreSQL cho phần chi tiết:
* id: UUID
* timestamp
* event_type
* severity
* ip_address
* metadata: cột JSONB chứa toàn bộ các trường tùy biến, cụ thể:
### Nhóm thanh toán & tài chính
 * WEBHOOK_VERIFICATION_FAILED (CRITICAL): Kích hoạt khi chữ ký bảo mật (HMAC/Secret Key) từ SePay/Casso không khớp. Với các trường: order_id, webhook_source, provided_signature, raw_payload{gateway, transactionAmount}, user_agent.
 * PAY_LATER_CEILING_BLOCKED (WARNING): Ghi nhận khi một bàn đang có nợ nhưng tiếp tục gửi request thanh toán Pay-Later. Với các trường: table_id, current_debt, attempted_order_amount, ceiling_limit
 * MOCK_PAY_PROD_TRIGGERED (CRITICAL): Endpoint giả lập thanh toán (Mock Pay) bị gọi trái phép trong môi trường Production. Với các trường: order_id, request_headers{origin, referrer}, user_agent
 * ORDER_PAID_SUCCESS (INFO): Phục vụ đối soát dòng tiền cuối ngày. Với các trường: order_id, amount, payment_method, transaction_reference, confirmed_by_webhook (True/False)
### Nhóm nhật ký phân quyền & định danh
 * SESSION_PRIVILEGE_ESCALATION (CRITICAL): Kích hoạt ngay lập tức khi phát hiện Session Token của khách hàng (hoặc một token không hợp lệ) đang cố gắng truy cập vào các API dành riêng cho Dashboard của Chủ quán hoặc Super Admin. Với các trường: attempted_endpoint, provided_token_role, required_role, extracted_table_id, user_agent
 * ADMIN_LOGIN_FAILED (WARNING): Ghi nhận các nỗ lực nhập sai mật khẩu khi truy cập vào khu vực quản trị. Với các trường: attempted_username, failure_reason, user_agent
### Nhóm nhật ký toàn vẹn dữ liệu
 * VIETQR_CONFIG_UPDATED (WARNING): Bất kỳ thao tác nào làm thay đổi Số tài khoản, Mã ngân hàng, hoặc Tên người nhận. Cần bắt buộc có log này để truy vết nếu dòng tiền bị chuyển sai đích. Với các trường: admin_id, old_config{bank_code, account_no}, new_config{bank_code, account_no}
 * MENU_ITEM_STOCK_TOGGLED (INFO): Ghi nhận nhân viên nào (thông qua IP/Session) đã bật/tắt trạng thái hết hàng của một món đồ uống, tránh tình trạng tắt nhầm khiến khách không thể đặt món. Với các trường: staff_id, item_id, item_name, previous_status, new_status.
### Nhóm anti-spam
 * RATE_LIMIT_ORDER_BLOCKED (WARNING): Kích hoạt khi một IP hoặc một ID Bàn liên tục gửi request tạo đơn hàng vượt quá ngưỡng quy định (ví dụ: > 2 đơn/phút). Dấu hiệu của Replay Attack hoặc cố tình phá hoại. Với các trường: table_id, rate_limit_window, request_count_attempted, max_allowed, endpoint
 * INVALID_QR_TOKEN_SCAN (WARNING): Ghi nhận các request mang Token bàn không tồn tại hoặc đã hết hạn. Nếu xuất hiện liên tục từ một IP, đây là dấu hiệu của việc quét dò tìm (Brute-force) mã QR. Với các trường: provided_token, scan_source, user_agent

## Ở ngay phía trên khung audit logs bố trí bộ lọc và thanh tìm kiếm các log (filtering): 
Thiết lập index GIN trên cột metadata để tăng tốc độ truy vấn, đối với chức năng thanh tìm kiếm trên giao diện, hệ thống (thông qua stored procedure hoặc query builder) sẽ được thiết lập để thực thi việc tìm kiếm theo từ nguyên vẹn (strict whole-word search) thay vì khớp chuỗi một phần (partial string matching). Thiết lập này triệt tiêu các kết quả rác (false positives) khi bạn cần rà soát đích danh một mã lỗi, một ID thiết bị hoặc một token cụ thể trong hàng ngàn dòng log.

## 1 anomaly detection dashboard để theo dõi các chỉ số bất thường như: 
Các địa chỉ ip liên tục tạo đơn pay-later bị chặn bởi rate limit, tần suất lỗi 4xx/5xx trả về từ api backend

# Trang tổng quan vận hành (live operations dashboard)**
1. Bố cục 2 phần bên trên là biểu đồ xu hướng giao dịch cập nhật liên tục dòng tiền mặt
2. Giữa và dưới sẽ là bản đồ node bàn (khi production thì số bàn có thể lên tới 30 bàn), phục vụ giám sát & mở khóa/reset bảo mật cho từng bàn

# Trang cấu hình hệ thống**
Bên trên của giao diện là khu vực Cấu hình VietQR Master Config. Bên dưới là phần cấu hình ngưỡng bảo mật (rate limit, mức trần nợ,...)