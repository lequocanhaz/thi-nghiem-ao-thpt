# Kiểm tra v17 · 16/10/2026

## Thay đổi

- Áp dụng nguyên bốn tệp Product Sans OTF người dùng đính kèm, gồm regular/bold/italic/bold italic. Mỗi tệp chứa 318 glyph; kiểm tra cmap của chuỗi tiếng Việt có dấu.
- Thay banner ảnh/shader bằng video NASA 1920 × 1080, 165 khung hình chuyển động riêng biệt; WebM và H.264 MP4 đóng gói cùng website. Muted, loop, inline, pause/resume, phát thủ công khi autoplay bị chặn, dừng khi khuất hoặc tab ẩn. Phóng cảnh là crop video, không phải xoay mô hình hay mô phỏng tương đối rộng trực tiếp.
- Sửa thanh kéo 3D tái gán nút thứ nhất sang biến của nút thứ hai. Mỗi nút giữ khóa đại lượng riêng; lựa chọn biến bằng bàn phím không đổi liên kết. Giữ chế độ q₁/vị trí P cho điện trường điểm. Chặn pointer khác trong khi kéo. Khi nhập tham số mở rộng, camera tự vừa khung nếu chưa tự chọn góc; giữ camera đứng yên trong lúc kéo và giữ góc người dùng đã chọn.
- Mở rộng 629 miền ở 270 bài, làm mịn bước phù hợp. Giữ các ràng buộc nhiệt độ tuyệt đối, góc, số lượng nguyên, quang học, vận tốc dưới âm, mô hình phi tuyến bước cố định, dòng tầng và điều kiện áp dụng khác. Không đổi 6 mô đun tính toán lõi. Miền cũ lưu trong `originalDomain`, các mẫu cũ tạo trước khi mở rộng.
- Sửa làm tròn 6 chữ số thập phân khiến kéo/phím/quét biến lượng rất nhỏ thành 0; đồ thị nhận miền mở rộng, không cắt kết quả hợp lệ trên 10⁷ và không ép trục siêu nhỏ thành khoảng cỡ 1.
- Thêm hộp trợ lý: hội thoại theo bài, opt-in gửi thông số/tối đa 12 dòng đo, hiển thị trước dữ liệu, dừng yêu cầu, bảo toàn câu hỏi khi lỗi. Backend dùng Responses API, key phía máy chủ, kiểm tra Origin, giới hạn payload/lượt gọi, không lưu hội thoại trong frontend storage.

## Kết quả

- `checks/full-catalog.mjs`: **300 bài, 9.776 trạng thái tính toán/cây hình học, 0 lỗi**. Kiểm tra mặc định, mẫu, cận từng tham số, một số tổ hợp cận và thời gian. Hữu hạn không đồng nghĩa đã chứng minh mọi công thức/giả thiết chính xác ở mọi tổ hợp.
- `checks/interaction-v17.mjs`: **590 nút kéo ở 300 bài**, chọn nút thứ hai không di chuyển nút thứ nhất; **852** đường kéo/phím; **1.704** đồ thị tại cận tham số. Có hồi quy quét biến 10⁻¹², đồ thị và khớp tuyến tính 10⁻¹⁵.
- `checks/framing.mjs`: **13.500** phép chiếu góc hộp bao, 3 tỉ lệ vùng xem × 3 góc nhìn, mặc định/mẫu/45% thời gian; không tràn sau vừa khung.
- `checks/parameter-window.mjs`: 852 thanh trượt, 851 khoảng tùy chỉnh, giới hạn động của sóng dừng; không thay đổi kết quả khi thay riêng cửa sổ thanh trượt.
- `checks/dom.mjs`: DOM mô phỏng cho cả 300 bài: tìm/mở, mô hình gắn vào trang, chạy/tạm dừng với bài động, ghi điểm, bảng/đồ thị, A/B, quét biến, xuất báo cáo/phiên và nhập lại, ba bố cục không mất dữ liệu, khôi phục dữ liệu đã xóa, lỗi renderer, điều khiển giọng nói và lỗi lưu trữ.
- `checks/workspace.mjs`: hợp đồng CSS/cấu trúc DOM tại 360, 768, 1440 px; bàn phím và trình xử lý pointer thật chạy trên đối tượng mô phỏng, gồm pointer thứ hai bị từ chối.
- `checks/banner.mjs`: trạng thái video với play/pause/error/metadata mô phỏng, autoplay bị chặn, thử lại, offscreen, hủy promise cũ và cleanup. Tệp video đã được FFprobe và FFmpeg giải mã đầy đủ trước khi đóng gói; hash trong `video-audit-v17.json`.
- `checks/assistant.mjs`: DOM hội thoại riêng, dữ liệu chỉ gửi khi chọn, escape câu trả lời, lỗi/dừng giữ câu hỏi; handler API kiểm tra CORS, giới hạn, lỗi upstream và payload Responses. **Dùng transport fixture; chưa gọi AI thật.**
- Kiểm tra cú pháp/import/tài nguyên; 301 tệp âm thanh khớp hash của kiểm tra giải mã v13. Không tạo lại hoặc nhận là giọng OpenScienceVN.

## Giới hạn còn lại

- **Trợ lý chưa trả lời trực tiếp**: endpoint công khai trong `dist/ai-config.js` còn trống; chưa có backend HTTPS được triển khai với API key/model. GitHub Pages là hosting tĩnh. Website hiển thị đúng trạng thái chưa kết nối và vô hiệu hóa gửi, không trả lời giả. Mã máy chủ và hướng dẫn ở `server/`.
- Chưa có kiểm tra GPU/shader, ảnh chụp bố cục, autoplay trên thiết bị, cảm ứng thật hay nghe âm thanh trên loa. Không dùng kiểm tra DOM/hình học để khẳng định đã kiểm tra trực tiếp bằng trình duyệt.
- Không thể thử vô hạn tổ hợp tham số; các miền cần giả thiết sâu hơn được giữ có chủ đích. Các trạng thái ngoài điều kiện áp dụng tiếp tục được giải thích trong giao diện.
