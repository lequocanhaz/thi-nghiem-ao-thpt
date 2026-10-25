# V5.0 — tiến độ bản v54

Đây là đợt sửa ưu tiên khoa học, hình học và công cụ hiển thị. **V5.0 chưa hoàn tất toàn bộ.** Mã nền trước sửa: `4863af0`. Giữ nguyên phiên đo, 300 bài soạn, 388 trang sách, 301 âm thanh, banner và nhận diện.

| Phần việc | Trạng thái có bằng chứng |
|---|---|
| Audit 300 | Inventory đạt ở 304 cấu hình mặc định. Kiểm số trên tập mẫu: 280 VERIFIED, 20 PARTIAL, 0 FAILED. Tham chiếu độc lập đã đóng kèm để chạy từ checkout sạch. Xem AUDIT_REPORT.md. |
| Vật lí ưu tiên | Đã sửa lực thành phần, điện thế hai nguồn, RC và trường lớp điện; chặn quỹ đạo/cyclotron ngoài miền áp dụng. Các bộ giải còn PARTIAL chưa được gọi là hoàn thiện. |
| Hình học | Cân đòn dùng mô hình B; bình khí/Boyle theo tham số. Kiểm mesh, hạt, chuyển động liên tục và camera đạt. Hạt ở thể tích cực nhỏ vẫn khó quan sát; chưa rà độ rõ mọi cảnh. |
| Visual Settings | Bốn chế độ và nhãn/lưới/quỹ đạo kế thừa đã tích hợp. Kiểm trình duyệt giữ thời gian, camera và bảng đo. Chưa có thang hạt/marker/vectơ, mật độ đường sức hoặc nền tối chung. |
| i18n | Nền tảng 784 khóa, tên 300 bài song ngữ và 58 thuật ngữ có kiểm thử. **Chưa có bộ chọn ngôn ngữ hoặc bản EN của toàn UI và 300 bài soạn.** |
| AI | Giữ đúng Quanh Lab/Lê Quốc Anh. Locale có allowlist, được chụp tại lúc gửi và truyền vào chính sách của provider. Kiểm bằng fixtures; chưa triển khai backend hoặc gọi API thật. |
| Công cụ | Khôi phục nút quét tham số; bỏ nghiệm ngoài miền và thông báo số bị bỏ qua. Giữ dữ liệu cũ. |
| Mobile/hiệu năng | Chromium với WebGL2 SwiftShader đạt 12/12 nhóm trên desktop 1440 và mobile giả lập 390. Chưa phải Safari/iPhone thật hay bằng chứng FPS phần cứng. |
| Phát hành | `npm run check` và QA đã đạt. CI/Pages là cổng tiếp theo của commit phát hành; xem trạng thái thực tế ở GitHub Actions. |

## Các agent thực sự tham gia lượt tiếp tục

- `physics_finish`: đối chiếu số độc lập và inventory đủ 300 bài.
- `geometry_finish`: kiểm mesh, hạt, chuyển động liên tục, camera và hồi quy 300 bài.
- `visual_settings`: module, menu, CSS và 1.200 kiểm tra kết quả không đổi.
- `i18n_foundation`: runtime, từ điển, tên 300 bài và glossary; chưa gắn bộ chọn ngôn ngữ.
- `qa_v54_finish`: 12 nhóm Chromium; phát hiện thiếu nút quét và kiểm lại sau sửa.
- `ai_review_v54`: review chỉ đọc và kiểm fixtures; không gọi API, đọc biến môi trường hay bí mật.

Agent chính tích hợp cảnh báo miền, quét và chạy; sửa preset dùng miền gốc khi import lặp; bổ sung cổng kiểm và danh sách sửa khoa học có giải trình; quản lí cache và phát hành. Không agent nào tự commit/push.

## Thứ tự phần còn lại

1. Khép bằng chứng cho 20 mục PARTIAL, ưu tiên hội tụ bộ giải phi tuyến và kiểm thống kê.
2. Hoàn tất binding UI, metadata và dịch biên tập 300 bài sang EN. Kiểm đổi ngôn ngữ khi đang chạy, giữ camera/ghi chép/bảng đo, LaTeX và SEO. Công bố đúng ngôn ngữ của sách ảnh gốc.
3. Mở rộng renderer cho bán kính, marker, vectơ, đường sức và nền; kiểm cả WebGL/Canvas và độ rõ tại cận tham số.
4. Rà UX, đồ thị; đo hiệu năng trước/sau trên thiết bị thật; kiểm Safari/cảm ứng và nghiệm thu sư phạm độc lập.
