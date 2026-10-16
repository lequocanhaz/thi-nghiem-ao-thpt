# Kiểm chứng giao diện v12

## Đã thay đổi

- Trang chủ ưu tiên thư viện, tìm kiếm và các bộ lọc. Lối vào theo lớp và thí nghiệm gần nhất được thu gọn. Tuyến khảo sát và demo Ohm/Sóng/Quang học nằm trong bảng mở khi cần; demo chỉ dựng và hoạt ảnh khi được mở.
- Phòng thí nghiệm trên máy tính có mô hình lớn bên trái, bảng thông số bên phải với vùng cuộn riêng, phân tích và ghi chép dưới mô hình. Kéo thanh phân cách bên trái bảng thông số thay đổi đúng chiều. Đồ thị/bảng có thể thay đổi kích thước, thu gọn và khôi phục.
- Ở màn hình nhỏ, cùng một bảng điều khiển được chuyển xuống ngay dưới mô hình; không nhân đôi ô nhập hoặc trạng thái. Đổi qua lại điểm chuyển bố cục giữ nguyên thông số, số liệu và ghi chép.
- Bổ sung `interface.css`: nền trung tính, màu thao tác xanh lam, cỡ chữ theo hệ thống hiện có, nút/thanh trượt/ô số thống nhất. Giữ màu đại lượng và chủ đề. Gom góc nhìn vào một menu, giữ các nút chụp ảnh và toàn màn hình.
- Hướng dẫn và các nút giọng đọc nằm trong bảng bên dưới, mặc định đóng khi nâng cấp giao diện. Mở từ thanh công cụ sẽ đưa bảng hướng dẫn vào vùng nhìn. Các bước, tùy chọn giọng Việt tích hợp, tạm dừng/tiếp tục/dừng và đọc số đo được bảo toàn.
- Thanh đầu thêm tải phiên và đặt lại mô hình; đặt lại vẫn giữ bảng đo. Liên kết Viết giải thích tự mở sổ tay. Ô số rỗng giữ giá trị trước; nhập ngoài khoảng được giới hạn kèm giải thích.
- Giữ nguyên 300 mục, các mô hình Vật lí, phương trình, dữ liệu, công cụ kéo/đo, A/B, quét biến, khớp số liệu, xuất/nhập phiên, báo cáo và âm thanh. Không thêm dịch vụ hay tài khoản.

## Đã kiểm tra

- `checks/dom.mjs`: HTML thật qua LinkeDOM và sự kiện ứng dụng; đủ 300 đường mở, thông số, chạy/tạm dừng ở bài động, ghi điểm, các tab, A/B, quét biến, báo cáo, phân trang, tìm không dấu và xem trước. Ba chế độ giữ trạng thái và ghi chép; đối chiếu dòng/đồ thị; từ chối dòng thiếu trạng thái. Kiểm tra lỗi WebGL giả lập và chuyển sơ đồ giữ dữ liệu. Thêm kiểm tra thư viện trước demo, demo khởi tạo khi mở, đồng bộ khi đổi lại Ohm, bảng thông số cùng node qua điểm chuyển bố cục, đóng/mở hướng dẫn, sổ tay và nút tải phiên trên đầu, phản hồi ô số rỗng/ngoài khoảng.
- `checks/ui-60.mjs`: đủ 300 callback điều chỉnh và nút thay thế, lưu trạng thái, CSV, xuất/nhập phiên, A/B, quét biến, hồi quy, khôi phục dòng, ghi chú/giả thuyết và núm nguồn.
- `checks/workspace.mjs`: lược đồ khôi phục/MathML cho 300 bài, tọa độ và xử lý kéo không dùng GPU. Kiểm tra thứ tự DOM và cascade của cả hai stylesheet tại 360, 768, 1440 px trong ba chế độ; cột thông số phải, dữ liệu phía dưới, cuộn độc lập, ẩn bảng và giới hạn thao tác xoay khi cuộn trên cảm ứng.
- `checks/research.mjs`: các phép khớp độc lập, sai số, miền áp dụng và báo cáo.
- `checks/media.mjs`, `checks/clip-player.mjs`: 301 tệp tiếng Việt và đoạn đọc, ánh xạ đủ 300 bài, số/đơn vị; luồng tải/phát/tạm dừng/tiếp tục/dừng/lỗi, không tự phát. AudioContext được giả lập; không phải kiểm tra qua loa.
- Cú pháp 33 mô-đun, 70 import cục bộ, thứ tự stylesheet, phân tích CSS, manifest và `git diff --check`. Đối chiếu nội dung 20 mô-đun tính toán, hình học và âm thanh với bản trước, xác nhận không đổi ngoài khóa cache v12.

## Giới hạn kiểm chứng

Đây là kiểm tra mã, DOM/sự kiện giả lập và hình học bằng Node. Các mốc chiều rộng kiểm tra quy tắc CSS và cấu trúc; không đo bounding box hay chụp ảnh trang. Không có kiểm tra trực tiếp trên trình duyệt, GPU/WebGL, cảm ứng thật, trình đọc màn hình hoặc âm thanh trên thiết bị thật trong lần này, vì môi trường không có công cụ trình duyệt được hỗ trợ. Chất lượng đọc vẫn có các khoảng ngắt khi ghép số đo; âm thanh cần tải sau thao tác người dùng. Các bài mở rộng và hình nguyên lí tiếp tục có nhãn/điều kiện áp dụng.
