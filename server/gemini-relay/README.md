# Cổng kết nối Gemini theo khu vực

Trạng thái: mã đã chuẩn bị; chỉ có thể xác nhận khắc phục sau khi triển khai và thử lại từ mạng từng bị lỗi. Việc gọi thành công từ máy kiểm tra ở khu vực khác không chứng minh lỗi trên máy người dùng đã hết.

Google có thể từ chối vị trí của máy chủ gọi API ngay cả khi người dùng ở quốc gia được hỗ trợ. Cổng này chạy bằng Node.js tại vùng Vercel `iad1`, thay cho việc gọi Gemini trực tiếp từ các điểm biên Cloudflare khác nhau. Cấu hình vùng là lựa chọn nơi thực thi hàm, không thay đổi tài khoản hay điều kiện sử dụng Google.

Luồng: trình duyệt → API hiện tại (kiểm tra nguồn, nội dung, hạn mức, giải mã khóa) → cổng có xác thực tại `iad1` → Google Gemini. Câu trả lời vẫn đi qua bộ xử lý lỗi và lọc phản hồi hiện có. Khóa Gemini không được đưa vào JavaScript phía trình duyệt.

## Triển khai

1. Tạo dự án Vercel từ kho `lequocanhaz/thi-nghiem-ao-thpt`, đặt Root Directory là `server/gemini-relay`, Framework là Other và dùng cấu hình `vercel.json` kèm theo. Không bật gói trả phí tự động.
2. Tạo token ngẫu nhiên tối thiểu 32 kí tự. Lưu dưới dạng biến bí mật `RELAY_TOKEN` trên Vercel. Không dán token vào issue, source, ảnh hoặc đoạn chat.
3. Triển khai, kiểm tra hàm thực thi tại `iad1` và kiểm tra phản hồi có xác thực. Endpoint là URL dự án Vercel thực tế cộng `/api/gemini`; không dùng URL minh họa để cấu hình production.
4. Trên máy chủ Sites hiện có, đặt hai runtime secret: `GEMINI_RELAY_URL` là endpoint thực tế và `GEMINI_RELAY_TOKEN` giống token trên Vercel. Giữ các khóa Gemini, D1, giới hạn lượt hỏi và `GEMINI_SETUP_ENABLED=0` hiện có.
5. Triển khai phiên bản backend có hỗ trợ relay. Gửi câu hỏi thật và thử lại trên mạng từng gặp lỗi khu vực. Kiểm tra cả lỗi token, giới hạn lượt hỏi và hủy yêu cầu.

Nếu thiếu một trong hai biến relay hoặc URL không đúng dạng HTTPS `*.vercel.app/api/gemini`, backend dừng với lỗi cấu hình. Nếu cả hai biến đều không tồn tại, nó giữ đường gọi Gemini trực tiếp cũ. Khi đã cấu hình relay, không tự quay về đường gọi trực tiếp nếu relay hỏng.

## Bảo mật và giới hạn

Cổng chỉ nhận yêu cầu từ máy chủ có token bí mật, chỉ gọi đích Google cố định, chỉ cho phép hai model trong allowlist và không cấp CORS cho trình duyệt. Nó không phải proxy URL tùy ý. Khóa Google được truyền qua HTTPS từ backend hiện có và chỉ dùng trong bộ nhớ của hàm; không ghi câu hỏi hay khóa vào log. Nền tảng hosting có thể giữ metadata truy cập theo chính sách riêng.

Giới hạn 100 lượt/ngày toàn website, 40 lượt/IP/ngày và 4 lượt/IP/phút vẫn do D1 ở backend hiện tại kiểm soát. Thử lại có thể tiêu thụ thêm hạn mức Google. Không tự bật billing, không chuyển nhà cung cấp và không giả câu trả lời khi Google từ chối.

Chạy `node server/gemini-relay/test.mjs` từ gốc kho để kiểm tra bằng dữ liệu giả và HTTP localhost. Kiểm tra này không chứng minh vị trí production hoặc suy luận Google thực đã hoạt động.
