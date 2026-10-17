# Trợ lý Vật lí · v27

Trợ lý dùng kiến thức nền của Gemini, chỉ dẫn sư phạm được quản lí trong `ai-handler.mjs`, các hằng số SI đã đối chiếu và ngữ cảnh do website gửi. Đây là cấu hình ứng dụng và cung cấp ngữ cảnh, **không phải fine-tuning, huấn luyện lại trọng số, bộ máy chứng minh hay cam kết trả lời đúng mọi câu hỏi**.

## Phạm vi

Hỗ trợ Vật lí từ cơ bản đến đại học: cơ học, chất lưu, sóng, nhiệt, điện từ, quang học, tương đối, lượng tử, hạt nhân, vật liệu, thiên văn; cùng bài tính, toán, phân tích số liệu và câu hỏi phổ thông ngoài môn học. Mức giải thích theo yêu cầu người học. Bài đang mở không hạn chế phạm vi câu hỏi.

Câu trả lời cần nêu giả thiết, đơn vị, quy ước dấu và phần dữ kiện còn thiếu. Không tạo số đo, không tự nhận đã vận hành mô hình. Không có duyệt web trực tiếp: kiến thức cần cập nhật phải được trình bày cùng giới hạn đó. Không có thao tác tự học từ tin nhắn của khách truy cập.

## Ngữ cảnh từ lịch sử phát triển

Chỉ lưu trong cấu hình những thông tin sản phẩm liên quan đã xác nhận: tên Vật lí Lab, giao diện tiếng Việt, thư viện lớp 10–12, công cụ thay thông số/đo/đồ thị/báo cáo/lưu phiên và nhu cầu giải thích dễ hiểu. Số bài thực tế được lấy từ danh mục frontend (hiện 300). Không nạp toàn bộ lịch sử ChatGPT, ảnh riêng, thông tin tài khoản, khóa API, cấu hình bí mật hay tin nhắn của người dùng khác vào trợ lý công khai.

Ngữ cảnh mỗi lượt gồm câu hỏi, tối đa 10 lượt gần nhất trong bài, công thức/điều kiện/thông số đang gửi, tối đa 12 dòng đo và số lượng danh mục. Hướng dẫn hệ thống tách biệt khỏi dữ liệu ngữ cảnh. Giao diện giữ cấu trúc hỏi → gửi → trả lời, không tải mô hình AI xuống máy.

## Giờ hiện tại

Frontend gửi tên múi giờ IANA của thiết bị, không gửi giờ làm nguồn tin cậy. Máy chủ tạo timestamp thực cho mỗi lượt hỏi. Những câu hỏi ngày/giờ thông thường được trả lời trực tiếp từ đồng hồ máy chủ, không gọi mô hình. Câu hỏi phức tạp vẫn nhận bản ghi thời gian trong chỉ dẫn hệ thống. Múi giờ không hợp lệ hoặc không có được thay bằng Asia/Ho_Chi_Minh và luôn ghi rõ vùng giờ trong kết quả. Quy tắc đổi ngày và giờ mùa hè do Intl xử lí. Hạn mức máy chủ vẫn áp dụng cho câu hỏi đồng hồ.

## Nguồn tham khảo đã kiểm tra ngày 17/10/2026

- BIPM, [SI defining constants](https://www.bipm.org/en/measurement-units/si-defining-constants): cung cấp các giá trị xác định chính xác của c, h, e, k_B và N_A trong cấu hình. Phân biệt với các hằng số có độ không đảm bảo đo.
- NIST, [CODATA recommended values](https://physics.nist.gov/cuu/Constants/index.html): đường dẫn để người học kiểm tra hằng số và độ không đảm bảo. Không sao chép cơ sở dữ liệu.
- OpenStax, University Physics [tập 1](https://openstax.org/details/books/university-physics-volume-1), [tập 2](https://openstax.org/details/books/university-physics-volume-2), [tập 3](https://openstax.org/details/books/university-physics-volume-3): danh mục đọc thêm. Chỉ tên sách và liên kết được đưa vào trợ lý; không nhập nội dung sách, bài tập hay hình ảnh làm dữ liệu huấn luyện.
- Caltech, [The Feynman Lectures on Physics](https://www.feynmanlectures.caltech.edu/): liên kết đọc trực tiếp, không tải hoặc nạp toàn văn vào mô hình.

Không tuyên bố đã đọc toàn bộ các tài liệu trên. Không tạo số trang/DOI/trích dẫn chưa xác minh. Đây là danh mục tham khảo và dữ kiện SI chọn lọc, không phải RAG toàn văn hay công cụ tìm kiếm thời gian thực.

## Kiểm tra và thay đổi sau này

- `npm run check:tutor`: kiểm tra hợp đồng yêu cầu của 16 tình huống, ngữ cảnh/hội thoại, đồng hồ máy chủ, múi giờ, đổi ngày, DST, fallback và hạn mức bằng mô hình giả. Không đánh giá kiến thức thực của Gemini.
- `npm run check:tutor:live -- ohm quantum general`: tối đa 3 tình huống mỗi lần, gọi API thật và lưu `checks/tutor-live-v27.json`. Mỗi tình huống dùng một lượt trong hạn mức hiện có; không chạy tự động trong CI. Xem phần `expected` và đáp án để đánh giá thủ công, không coi HTTP 200 là lời giải đúng.
- `npm run check`: kiểm tra hồi quy nguồn, dữ liệu và DOM 300 bài. Không thay thế kiểm tra trên trình duyệt, iPhone hoặc GPU.

Muốn fine-tune thực sự cần bộ dữ liệu có quyền sử dụng, tập đánh giá riêng và mô hình/quy trình hỗ trợ. Không thu thập riêng tư hoặc tự thay mô hình, billing hay hạn mức trong bản nâng cấp này.
