> Frontend v21 dùng chat máy chủ và không tải mô hình cục bộ. Endpoint hiện chưa được bật vì kiểm tra API ngày 17/10/2026 (giờ Việt Nam) vẫn trả `billing_not_active`. Không có câu trả lời AI thật khi dịch vụ chưa hoạt động.

# Backend API tùy chọn của Trợ lý Vật lí

Frontend: `dist/assistant.js`. API: `server/ai-handler.mjs` (Fetch/Worker, không có khóa trong mã nguồn).

Đã triển khai giao diện hội thoại riêng theo bài, ảnh PNG/JPEG/WebP, dán ảnh, chụp mô hình, xem trước/xóa ảnh và gửi thông số theo lựa chọn. Mô hình tạm dừng khi chụp để thông số khớp ảnh. Hội thoại chỉ ở bộ nhớ trang; tải lại sẽ mất. Ảnh được nén tối đa 1600 px; tối đa 2 ảnh/lượt, 4 ảnh gần nhất trong ngữ cảnh gửi. Chưa có phản hồi dạng streaming.

## Máy chủ

Dịch vụ riêng: https://vat-li-lab-assistant-api.itsqanh.chatgpt.site/api/chat

Máy chủ hiện ở chế độ riêng tư. Chưa cấu hình URL vào frontend công khai cho đến khi được phép mở API cho khách website. Không nhúng token truy cập hoặc khóa API vào GitHub Pages.

Cấu hình runtime:
- `OPENAI_API_KEY_ENCRYPTED` (secret): khóa được mã hóa RSA-OAEP; khóa giải mã chỉ nằm trong D1 phía máy chủ.
- `OPENAI_MODEL`: gpt-5.4-mini.
- D1 `DB`: schema dưới `server/migrations/`.

Chỉ gửi câu hỏi/ảnh/ngữ cảnh khi người học nhấn Gửi; OpenAI Responses dùng `store:false`. Không lưu nội dung chat/ảnh ở D1. D1 chỉ có khóa máy chủ và bộ đếm giới hạn (100 lượt/ngày toàn web, 40/IP/ngày, 4/IP/phút). IP chỉ dùng để tạo hash thay đổi mỗi ngày; không lưu IP nguyên văn. CORS chỉ cho origin GitHub Pages của chủ web; CORS không phải xác thực hay biện pháp chống gọi trực tiếp. Giới hạn bộ đếm áp dụng cả gọi trực tiếp.

Kiểm tra thật ngày 16/10/2026: OpenAI trả HTTP 429 `billing_not_active`. Cần chủ tài khoản bật thanh toán API; chưa xác nhận được câu trả lời thực tế từ mô hình.

## Chạy riêng trên Node

Node 24: `node --env-file=.env.local server/start.mjs`. Dùng `OPENAI_API_KEY` trong file bị gitignore và `OPENAI_MODEL` trong môi trường. Endpoint `/api/chat`, CORS origin `https://lequocanhaz.github.io`. Local không có D1 dùng bộ đếm RAM 30 lượt/IP/giờ; không dùng bản giới hạn RAM cho dịch vụ công khai.

## Kiểm tra

`node checks/assistant.mjs` dùng DOM và transport giả lập để kiểm tra giao thức ảnh, hội thoại, giữ bản nháp, lỗi và giới hạn. Không thay thế kiểm tra trình duyệt, camera WebGL hoặc phản hồi AI thật.
