# Kiểm tra bản Cinematic v16 · 16/10/2026

## Thay đổi

- Banner chuyển sang minh họa không gian có thị sai và chuyển động ánh sáng; bỏ chế độ dụng cụ khỏi banner.
- Có chọn khung dựng 1920 × 1080, điều khiển góc cảnh, dừng chuyển động, bàn phím và toàn màn hình khi trình duyệt hỗ trợ.
- Ảnh gốc 1672 × 941 (WebP 295924 byte); không phải video gốc Full HD. Hiệu ứng dùng ảnh và shader, không phải mô phỏng tương đối rộng. Canvas nhẹ không có shader ánh sáng.
- Điều khiển mặc định 380 px, được kéo trong khoảng 300–560 px. Ô số 160 px, màn hình nhỏ 180 px; số đọc và ô bảng lớn hơn.
- Bảng đo mở toàn chiều ngang hoặc thu về dưới mô hình; có điều chỉnh chiều cao đồ thị/bảng và chiều rộng bảng đo. Màn hình hẹp xếp dữ liệu theo chiều dọc, bảng cuộn riêng.
- Khoảng thanh trượt được lưu trong cấu hình từng bài. Ô nhập vẫn dùng toàn miền vật lí. Không đổi phương trình hay mở rộng hàng loạt giới hạn vật lí.
- Bổ sung 12 tài liệu quốc tế, gắn với đúng nhóm bài và nêu phạm vi. NIST XCOM là tài liệu tra cứu; chưa nhập dữ liệu của NIST vào mô hình.

## Kiểm tra mã và DOM

Bộ lệnh phát hành: `npm run check`.

- Cú pháp 42 module, 82 đường nhập nội bộ; đường dẫn tài nguyên CSS hợp lệ.
- Đối chiếu hash 8 module khoa học: không đổi so với nền v14. 301 tệp âm thanh giữ nguyên hash của đợt giải mã đầy đủ trước đây.
- Kiểm tra schema khôi phục và công thức MathML của 300 bài; sự kiện chọn/kéo dụng cụ dùng hình học Three.js thực nhưng không dựng GPU.
- Phân tích quy tắc CSS và cấu trúc DOM tại 360, 768 và 1440 px. Đây không phải đo bounding box trên trình duyệt.
- 852 thông số ngoài thời gian của 300 bài có giới hạn hợp lệ; 851 trường hợp có khoảng tùy chỉnh hẹp hơn. Từ chối cận hỏng/ngoài miền; giữ nguyên trạng thái, số liệu tính và giới hạn gốc; kiểm tra cận đầu dò phụ thuộc chiều dài dây.
- Bộ DOM mở đủ 300 bài, dựng cây hình học, ghi điểm, đổi bảng; kiểm tra tiến thời gian cho bài động. Có 79 bài động, các bài còn lại khảo sát theo thông số.
- Hồi quy tìm kiếm, phân trang 300 bài, lọc, xem trước, A/B, quét biến, đồ thị, hồi quy/phần dư, báo cáo, đồng bộ dòng đo và mô hình, đặt lại giữ dữ liệu, bố cục, bảng thu gọn và xử lí lỗi dựng hình.
- Luồng mới: chọn Full HD được lưu và truyền tới renderer; không còn công cụ/chế độ dụng cụ trong banner. Đổi khoảng thanh trượt giữ bảng đo và kết quả; nhập số ngoài khoảng hẹp mở lại toàn miền. Xuất/nhập phiên khôi phục khoảng và dữ liệu. Mở rộng vùng dữ liệu, chuyển Trình chiếu rồi quay lại giữ trạng thái. Thiết lập kích thước phiên bản hiện hành tồn tại qua khởi động lại.
- Trang nguồn có 12 tài liệu bổ sung và 300 mục theo bài.

## Kiểm tra banner

- Kiểm tra bộ điều khiển banner ở bốn kích thước bằng DOM và lệnh Canvas mô phỏng: khung 1920 × 1080 thật trong bộ đệm, dừng/tiếp tục, bàn phím, giữ cuộn bằng chạm, ngừng khi ngoài vùng nhìn và dọn tài nguyên.
- Đã dựng ảnh qua đúng hàm Canvas nhẹ với @napi-rs/canvas ở 1920 × 1080 và 360 × 780 và xem ảnh kết quả.
- Đã sửa lỗi hở góc khi nghiêng ảnh. Kiểm tra pixel của 27 cấu hình kích thước/góc/thị sai: cả bốn góc đều có alpha 255.
- Kiểm tra miền số của góc cảnh và kích thước khung; metadata ảnh; giới hạn dung lượng; liên kết shader chunk màu và quy tắc CSS. Shader chưa được biên dịch bằng GPU trong môi trường kiểm tra này.

## Giới hạn

Không có công cụ preview trình duyệt được hỗ trợ trong môi trường hiện tại. Chưa kiểm tra ảnh toàn trang trên trình duyệt, GPU/shader, FPS, thao tác chạm thật, trình đọc màn hình hoặc phát âm qua loa. Kiểm tra Canvas ở trên là raster CPU độc lập, không thay thế kiểm tra WebGL. Nút toàn màn hình dùng API trình duyệt và báo rõ khi thiết bị không hỗ trợ; chưa thử toàn màn hình trực tiếp trên thiết bị.

Không có thay đổi bộ âm thanh hay tuyên bố giọng của OpenScienceVN. Tài liệu nước ngoài là nguồn tham khảo, không phải chứng nhận đã thẩm định khoa học độc lập toàn bộ 300 mô hình.
