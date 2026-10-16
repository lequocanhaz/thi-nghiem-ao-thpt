# Trợ lý Vật lí

Giao diện đã tích hợp ở `dist/assistant.js`. GitHub Pages chỉ phục vụ tệp tĩnh, nên **chưa có AI trả lời trực tiếp** khi `assistantEndpoint` còn trống. Không đặt API key trong mã frontend hoặc repository.

## Bật dịch vụ

1. Triển khai `ai-handler.mjs` trên runtime hỗ trợ Fetch, hoặc `start.mjs` trên Node 22+ sau HTTPS reverse proxy. Lệnh Node: `node server/start.mjs`.
2. Đặt bí mật `OPENAI_API_KEY` bằng secret manager của host. Đặt `OPENAI_MODEL` thành model Responses API tài khoản được phép dùng. Không ghi giá trị bí mật vào GitHub.
3. Đặt `ALLOWED_ORIGIN=https://lequocanhaz.github.io` (giá trị mặc định). Nếu dùng adapter Node, không mở cổng trực tiếp ra Internet; cấu hình TLS ở proxy và rate limiting tại edge.
4. Gán URL HTTPS thực của endpoint vào `dist/ai-config.js`, tăng cache version, chạy `npm run check` rồi xuất bản lại.
5. Thử câu hỏi thực, lỗi dịch vụ, dừng yêu cầu, và xác nhận bảng đo chỉ được gửi khi người học tự chọn. Không bật tự động gửi thông số.

Handler giới hạn 30 yêu cầu/IP/giờ và 400 yêu cầu/tiến trình/giờ; giới hạn bộ nhớ này không thay thế rate limit dùng chung ở host nhiều instance. Node adapter dùng IP socket, vì vậy phải cấu hình rate limit ở proxy nếu cần phân biệt người dùng sau proxy. Dùng hạn mức ngân sách của nhà cung cấp và bảo vệ endpoint trước khi mở rộng sử dụng công cộng. CORS là giới hạn trình duyệt, không phải xác thực người dùng.

Hội thoại chỉ nằm trong bộ nhớ tab, tách theo từng bài. Không gửi ghi chú riêng, lịch sử học, giọng nói hoặc toàn bộ phiên. Trạng thái `store:false` được gửi tới OpenAI; chính sách dữ liệu của nhà cung cấp vẫn áp dụng.

Tài liệu API: https://developers.openai.com/api/reference/resources/responses/methods/create

Kiểm tra tự động dùng transport giả lập, **không phải** kiểm tra trả lời AI thật hoặc triển khai máy chủ thật.
