# Giao diện v18 · 16/10/2026

Banner bỏ nhãn nguồn, độ phân giải, phát/dừng, thanh phóng cảnh và phần chú thích phía dưới. Tiêu đề/lời dẫn ngắn, dùng tên chức năng; giữ nút vào thư viện, tiếp tục bài và toàn màn hình. Nguồn tài nguyên vẫn được lưu trong `dist/video/NOTICE.txt`.

Video mặc định autoplay/muted/loop/playsinline, ưu tiên H.264 trên điện thoại. Không phụ thuộc thiết lập hiệu ứng giao diện, không chủ động dừng khi cuộn khỏi banner hoặc tab ẩn. Tự nối lại sau pause, khi quay về tab và khi phục hồi trang từ bộ nhớ điều hướng (có xử lý pageshow; chưa kiểm tra BFCache trên trình duyệt thật). Nếu trình duyệt chặn autoplay, lần chạm/phím tiếp theo thử phát lại; không có nút hoặc ghi chú bật/tắt trên banner. Trình duyệt/hệ điều hành vẫn có thể chặn phát trong chế độ tiết kiệm pin hoặc hạn chế tự phát; mã trang không thể bảo đảm chạy video khi thiết bị cấm phát.

Các màu chữ thuộc nhóm mực và màu nhạt trên nền sáng chuyển về đen; placeholder đen, trục đồ thị đen. Banner tối dùng chữ trắng, nút chính chữ đen trên nền sáng. Màu biểu diễn đại lượng và vectơ được giữ. Không thay đổi mô hình, miền số liệu, 300 bài, bảng đo, lưu phiên hay trợ lý hiện có. “Hết AI” được hiểu theo ngôn ngữ thiết kế bớt khuôn mẫu, theo các yêu cầu giao diện trước đó.

Kiểm tra: cú pháp và tài nguyên, sáu mô đun khoa học và 301 tệp âm thanh không đổi; hợp đồng CSS/DOM ở 360/768/1440 px; bộ kiểm tra video với media event giả lập (luôn bật, resume, chặn tự phát, retry theo thao tác, dispose và promise race); kiểm tra DOM toàn bộ 300 bài và các luồng dữ liệu hiện có. Không kiểm tra hình ảnh GPU, cảm ứng, autoplay iOS hay loa thật trong đợt này.
