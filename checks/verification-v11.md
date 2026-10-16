# Kiểm chứng bản sửa v11

## Những thay đổi đã thực hiện

- Thêm 300 tệp âm thanh bài học và một tệp số/từ/đơn vị dùng chung. Hướng dẫn, từng bước và số đọc có thể phát khi thiết bị không cài giọng Việt. Âm thanh tải khi nhấn Nghe; giữ lựa chọn giọng hệ thống, tốc độ, tạm dừng/tiếp tục/dừng. Số đọc được ghép từ nhãn, từ số và đơn vị, nên có nhịp ngắt khác đọc cả câu.
- Thêm Canvas 2D chiếu cùng hình học dụng cụ khi WebGL không tạo được ngữ cảnh, lỗi shader hoặc mất ngữ cảnh. Chế độ này ghi rõ Sơ đồ giản lược, giảm chi tiết/vật liệu; sử dụng cùng phương trình, thông số và dữ liệu. Có nút đổi chế độ, thử lại và tải thông tin chẩn đoán.
- Sửa trạng thái lỗi dựng hình có thể khóa các bài mở sau đó; giữ dữ liệu và hoạt động điều chỉnh khi chuyển chế độ. Thêm xác thực dữ liệu cài đặt cũ/null để không mắc ở màn hình khởi động.
- Phân biệt bài chạy theo thời gian với bài khảo sát thông số. Trang chủ có demo Ohm thực: chỉnh U, R, tính I bằng bộ mô hình và mở lại đúng thiết lập.
- Tham khảo nội dung trình bày trong video của @ezvibecode, ID 7696348722774478100: giảm nhãn trang trí, thống nhất nút/chữ/khoảng cách, màu thao tác nhất quán, mô tả nhiệm vụ cụ thể và demo có tác dụng. Không nhúng hay sao chép âm thanh/video vào sản phẩm.

## Các kiểm tra đã chạy thành công

1. `checks/dom.mjs`: mở, điều chỉnh và ghi số liệu đủ 300 bài; luồng chạy/tạm dừng; các tab, A/B, quét biến, báo cáo, phân trang/xem trước, ba bố cục giữ dữ liệu, đồ thị/dòng tương ứng, ô số trên màn hình nhỏ. Lỗi WebGL được tiêm có chủ đích để kiểm tra tự chuyển sơ đồ, thử lại và bảo toàn dữ liệu. Demo Ohm cho 8 V / 10 Ω = 0,80 A rồi 8 V / 20 Ω = 0,40 A. Khởi động với cài đặt cũ/null vẫn mở thư viện.
2. `checks/ui-60.mjs`: 300 callback tham số, nút thay thế, lưu, CSV, nhập/xuất phiên, núm nguồn, A/B, quét biến, khớp và khôi phục dòng.
3. `checks/software-scene.mjs`: cả 300 dụng cụ ở 900 trạng thái tham số có thể tái tạo; hơn 1,2 triệu mặt/đường/hạt được chiếu với tọa độ hữu hạn, gọi bộ vẽ Canvas, không cần WebGL. Đã xem bốn hình chiếu riêng của cơ năng, Ohm, sóng và giao thoa màng mỏng; đây không phải ảnh chụp giao diện trình duyệt.
4. `checks/clip-player.mjs`: đủ 301 tệp và các mốc đoạn đọc; ánh xạ hướng dẫn/ba bước/nhãn–số–đơn vị đủ 300 bài; tạo số tiếng Việt; phát không cần giọng hệ điều hành qua AudioContext giả lập; không tự phát, dừng khi tải muộn, tạm dừng/tiếp tục và lỗi tải.
5. FFprobe và FFmpeg giải mã toàn bộ 301 MP3: mono 22.050 Hz, tổng khoảng 7.209 s. Phân tích RMS của mọi đoạn đọc không có đoạn câm hoặc gần câm. Đã phát hiện và sửa 10 tệp mã hóa chưa hoàn tất; quy trình tạo hiện ghi tệp tạm và thay thế nguyên tử sau khi kiểm tra dung lượng.
6. `checks/models-60.mjs`, `checks/atlas-150.mjs`, `checks/discovery.mjs`, `checks/expansion-300.mjs`: số lượng, lược đồ, miền tham số, số đọc/đồ thị, bảo toàn và các giới hạn vật lí; cây Three.js và tọa độ hình học.
7. `checks/motion.mjs`: các bài động thay đổi hình học/ma trận; thời gian mô phỏng, tay nắm từ hero và bộ đệm dựng hình.
8. `checks/workspace.mjs`: lược đồ khôi phục, MathML, kéo/bàn phím, chọn đối tượng, cuộn trên cảm ứng và cascade CSS tại 360/768/1440 px; khôi phục bố cục null.
9. `checks/media.mjs`, `checks/research.mjs`: giọng hệ thống, hàng đợi và lỗi; phép khớp/độ lệch/sai số/báo cáo.
10. Cú pháp 33 mô-đun ứng dụng, 69 import cục bộ, khóa cache v11, tài nguyên và `git diff --check`.

## Phân biệt mức kiểm tra

Kiểm tra mô hình, DOM và sự kiện thực hiện bằng Node/LinkeDOM; AudioContext được giả lập cho luồng điều khiển. Giải mã MP3 và RMS được kiểm tra bằng bộ giải mã âm thanh thật. Phép chiếu hình học được kiểm tra và kết xuất thành hình riêng, không phải WebGL.

Chưa có kiểm tra trực tiếp trên trình duyệt, ảnh chụp trang ở ba chiều rộng, GPU/WebGL, cảm ứng thật, âm thanh qua loa trên thiết bị người dùng hoặc thẩm định phát âm của người bản ngữ. Môi trường không có công cụ kiểm thử trình duyệt được hỗ trợ. Âm thanh tích hợp khắc phục phụ thuộc bộ giọng hệ điều hành; vẫn cần tải tệp và được trình duyệt cho phép phát sau thao tác của người dùng. Các bài mở rộng và sơ đồ đổi tỉ lệ tiếp tục ghi rõ giới hạn.
