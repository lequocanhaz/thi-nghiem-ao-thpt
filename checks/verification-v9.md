# Kiểm chứng bản giao diện v9

Các kiểm tra mã và mô hình đã chạy thành công:

- `node checks/models-60.mjs`: 150 cấu hình, miền thông số, sơ đồ đo, đồ thị và các hệ thức bảo toàn.
- `node checks/atlas-150.mjs`: 150 ID phân biệt; 90 bài bổ sung được kiểm tra định lượng, điều kiện áp dụng và hình học.
- `node checks/discovery.mjs`: các bài mở rộng, trạng thái đặc biệt, điểm kéo và độ tương phản chủ đề.
- `node checks/motion.mjs`: biến đổi ma trận/đỉnh/instance khi thời gian thay đổi; chuyển cùng ID từ ảnh giới thiệu sang mô hình tương tác.
- `node checks/dom.mjs`: HTML thật được phân tích bằng LinkeDOM; mở 150 bài, chạy/tạm dừng, ghi điểm, các tab, A/B, quét biến, báo cáo; thêm ba bố cục giữ phiên, ngăn kéo, đổi kích thước bằng chuột/bàn phím, chọn điểm/dòng và 150 bản xem trước.
- `node checks/ui-60.mjs`: điều chỉnh 150 bài, lưu, CSV, nhập/xuất phiên và các núm nguồn điện.
- `node checks/workspace.mjs`: lược đồ khôi phục, MathML, chỉ số dòng sau lọc, chọn đối tượng ẩn, bộ xử lý kéo thật không dùng GPU, dọn khung nổi, chặn xoay để cuộn trên thiết bị chạm; sửa hai hình trụ sai kích thước. Kiểm tra quy tắc CSS tại 360, 768, 1440 px.
- `node checks/media.mjs`: giọng đọc, tốc độ, tạm dừng/tiếp tục/dừng và trạng thái không hỗ trợ.
- `node checks/research.mjs`: phép khớp, phần dư, sai số, miền loại trừ và báo cáo in.
- Kiểm tra cú pháp toàn bộ mô-đun ứng dụng, đường dẫn import cục bộ, khóa bộ nhớ đệm v9 và `git diff --check`.

## Phân biệt mức kiểm tra

DOM, mô hình toán, sự kiện giả lập, ma trận và đỉnh hình học được kiểm tra bằng Node. WebGLRenderer được thay bằng bộ dựng cây Three.js trong bài kiểm tra DOM; kiểm tra sự kiện kéo dùng raycaster giả lập. Kiểm tra CSS xác nhận các quy tắc bố trí tại ba chiều rộng, không đo hộp hình học của trình duyệt.

Chưa thực hiện kiểm tra trực tiếp trên trình duyệt: ảnh WebGL, ảnh chụp 360/768/1440 px, cảm ứng thật, trình đọc màn hình và giọng đọc trên thiết bị thật. Môi trường lần này không cung cấp công cụ kiểm thử trình duyệt được hỗ trợ. Các mô hình nguyên lí/phóng đại tiếp tục ghi điều kiện và giới hạn trong từng bài.
