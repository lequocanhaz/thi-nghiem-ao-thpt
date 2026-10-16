# Kiểm chứng bản cập nhật v10 · 15/10/2026

## Phạm vi

- Giữ 150 ID cũ; thêm 150 bài khảo sát, tổng 300 ID và 300 tên riêng.
- 105 bài nền tảng, 195 bài có nhãn Mở rộng. Các bài nâng cao không được coi là 300 định luật độc lập hay toàn bộ đều thuộc chương trình THPT bắt buộc.
- 150 bài mới dùng 29 họ mô hình dựng cảnh, mỗi bài có biến, số đọc, phương trình, điều kiện và câu hỏi khảo sát. Dụng cụ dùng chung được cấu hình theo bài.
- Ghi chú nổi mặc định tắt; màn hình số gắn trên dụng cụ vẫn hiện. Tooltip chỉ có tên và giá trị.
- Bảng Thông số thí nghiệm có ô số/thanh trượt, nút truy cập trong cụm điều khiển; dưới mô hình trên màn hình nhỏ, cột cuộn riêng trên máy tính.
- Giọng đọc chỉ chọn tiếng Việt, ưu tiên vi-VN; thử giọng, tốc độ, chia câu, đọc đơn vị, tạm dừng/tiếp tục/dừng và phản hồi thiếu giọng.

## Kiểm tra đã hoàn tất

Tất cả lệnh sau trả mã thoát 0 trên nguồn v10:

- `node checks/expansion-300.mjs`: số lượng/ID/tên, bảo toàn và đối xứng, miền áp dụng, RLC ba chế độ, giới hạn quang học, chuẩn hóa xác suất, Poisson 10.000 mẫu, phương sai cầu Brown 10.000 mẫu tại thời điểm giữa bước; 150 bài mới ở các tổ hợp biên.
- `node checks/models-60.mjs`: 300 lược đồ bảng đo, đầu mút thông số, miền đồ thị, tọa độ/đỉnh/instance Three.js hữu hạn và các hệ thức vật lí.
- `node checks/atlas-150.mjs`: 240 bài atlas trong danh mục 300 bài, nghiệm đối chiếu độc lập, miền áp dụng và hình học khi đổi thông số.
- `node checks/discovery.mjs`: 300 bộ tương tác, trạng thái giới hạn, phép khớp dữ liệu và độ tương phản màu chủ đề.
- `node checks/motion.mjs`: các bài động cũ và toàn bộ bài atlas theo thời gian đổi ma trận/đỉnh/instance, không chỉ đổi đồng hồ; khôi phục tay nắm từ hero; không cấp lại drawing buffer khi kích thước giữ nguyên.
- `node checks/dom.mjs`: LinkeDOM với HTML thật; mở 300 bài, nhãn, mô hình gắn đúng vùng, chạy/tạm dừng, ghi điểm, tab, A/B, quét biến, xuất báo cáo; lỗi 3D giữ dữ liệu và thử lại; phân trang đủ 300, xem trước/MathML, ba bố cục giữ trạng thái, chọn đồ thị/dòng, ngăn tham số nằm dưới mô hình trên màn hình nhỏ.
- `node checks/ui-60.mjs`: 300 callback điều chỉnh trực tiếp và nút thay thế, CSV, lưu, nhập/xuất phiên, từ chối phiên sai bài, so sánh A/B và núm nguồn thô/tinh.
- `node checks/workspace.mjs`: 300 lược đồ khôi phục, MathML, lọc điểm đo, bộ xử lí kéo không dùng GPU, đối tượng ẩn, chặn xoay để cuộn; quy tắc CSS tại 360/768/1440 px.
- `node checks/media.mjs`: ưu tiên vi-VN/giọng tự nhiên, không chọn tiếng Anh, không tự phát; đọc số/đơn vị; chia câu; dừng hàng đợi và từ chối callback cũ; tạm dừng/tiếp tục/lỗi/làm mới giọng.
- `node checks/research.mjs`: bốn dạng khớp, phép tính hồi quy độc lập, sai số/phần dư, miền loại trừ, dữ liệu suy biến, báo cáo in và nội dung người dùng được escape.
- Cú pháp 29 mô-đun ứng dụng, 62 import cục bộ, khóa cache v10, tài nguyên cục bộ và `git diff --check`.

## Lỗi phát hiện và sửa trong đợt này

Tọa độ hai thấu kính, chuyển động Van der Pol bị kẹp, hiển thị nhiệt kế nhầm K/°C; sơ đồ RC thông cao, vôn kế, RLC tự do, cầu chỉnh lưu/tụ lọc, Zener/diode đối song và bộ đệm RC; góc tán xạ Bragg; hai vectơ động lượng alpha bằng nhau và đối nhau; mất LCD khi tắt chú thích; núm nguồn không có biến tương ứng.

Bổ sung trạng thái ngoài miền Stokes/tiến động chậm; finesse Fabry–Pérot không xác định dưới ngưỡng nửa cực đại; phân biệt cân bằng trung hòa của khối nổi; cầu Brown thay nội suy tuyến tính sai phương sai. Giới hạn chu trình tủ lạnh phân biệt đường Carnot ngược lí tưởng và công tăng do tổn hao.

## Giới hạn kiểm chứng

Đây là kiểm tra mã, mô hình toán, DOM, sự kiện giả lập, ma trận và đỉnh hình học. Các bài DOM thay WebGLRenderer bằng bộ dựng cây Three.js. Kiểm tra CSS xác nhận cascade tại ba chiều rộng, không đo hộp hình học hay tràn chữ của trình duyệt.

Chưa kiểm tra trực tiếp trên trình duyệt: ảnh WebGL, ảnh chụp 360/768/1440 px, cảm ứng thật, trình đọc màn hình và chất lượng giọng trên thiết bị thật. Không có công cụ kiểm thử trình duyệt được hỗ trợ trong môi trường này. Giọng Việt phụ thuộc bộ giọng trình duyệt/hệ điều hành; không tích hợp máy chủ TTS. Mô hình nguyên lí/đổi tỉ lệ và các giả định được ghi trong từng bài; các kiểm tra tự động không thay thế thẩm định sư phạm toàn bộ nội dung.
