# Quang học v65 — bằng chứng QA trình duyệt

Chromium 154.0.8037.57 chạy WebGL thực qua ANGLE/SwiftShader trong môi trường máy chủ. Viewport điện thoại là mô phỏng.

- Bộ đầy đủ: 47/47 kịch bản đạt, 136 trạng thái mô hình và 1.066 tia được dựng thực, 22 luồng tương tác. Đủ 11 ID; mặc định ở 320/390/768/1440 px; từng đầu mút min/max của đủ 22 ô số tại 390/1440 px; thêm hệ kính sát nhau vô tiêu và phân kì. Báo cáo: `browser/report.json`.
- Sau khi toàn bộ nguồn được đóng băng: 27/27 kịch bản đạt, 24 trạng thái mô hình (22 mặc định + 2 góc kết hợp pinhole), 22 luồng tương tác và 10 luồng bật nhãn 2D. Báo cáo: `final/report.json`; 56 ảnh trong `final/`.
- Cả hai lần không có lỗi JavaScript chưa được bắt, HTTP lỗi nội bộ hoặc request đến nhà cung cấp ngoài. Hash nguồn cuối ở `final-source-hashes.json`; không có thay đổi kể từ snapshot giữa lần theo dõi cuối.

## Nội dung được xác minh

Tia được đọc từ tâm hình trụ/đỉnh BufferGeometry của chính đối tượng WebGL, đổi ngược bằng cùng một tỉ lệ độ dài để so với phương trình độc lập: Snell và tia ló song song của bản mặt song song; giao ngược gần trục h/n; hai tia ra vuông góc ở Brewster; phản xạ véc-tơ và góc quay gấp đôi của gương; nón nhận và phản xạ toàn phần của sợi; tiêu cự có dấu và đường kéo dài ảo; chùm ló song song tại vô cực; vị trí ảnh trung gian và độ phóng đại kính thiên văn/hiển vi; ảnh đảo qua lỗ nhỏ.

D=0 của hệ kính sát nhau không có marker tiêu điểm hữu hạn, chùm ló song song, số đọc tiêu cự là gạch ngang và hàng ghi chứa null. D<0 có đường kéo dài ảo nét đứt. Chú thích apparent_depth nói rõ xấp xỉ gần pháp tuyến bằng VI/EN. Mặt chắn pinhole vẫn có mesh dương tại d=25 m, màn=0,01 m, h=0,01 m.

Các ô số làm đổi hình thực; ghi dữ liệu được giữ qua VI/EN và 2D/3D. Zoom thủ công giữ camera qua chạy/dừng và vòng 2D/3D; Vừa mô hình bật lại căn tự động. Cùng topology giữ UUID Mesh và BufferGeometry qua đổi tham số và phát quy trình. Nút Google/email bị vô hiệu hóa do chưa có cấu hình Firebase. Luồng bật nhãn kiểm tra ray symbol còn hiện, tên tham số trên rig ẩn ở mặt trước 2D, handle vẫn còn và tên trở lại trong 3D.

Không có tràn ngang tài liệu trong các viewport được kiểm tra. Đã xem trực quan ảnh contact-sheet, ảnh ảo/vô tiêu và ảnh apparent_depth/pinhole bật nhãn ở 2D. Các góc pinhole cực đoan có tỉ lệ hình rất hẹp/cao vì giữ chung tỉ lệ vật lí, cần 2D và zoom để xem chi tiết.

## Giới hạn

Không kiểm tra iPhone/Android/Safari thật, bàn phím cảm ứng thật, FPS/GPU phần cứng, Google OAuth/email/Firebase thật hoặc đồng bộ đám mây. Không phải chứng nhận khoa học cho toàn bộ 300 bài. Không chạy `npm run check` theo phân công; agent chính phụ trách bộ kiểm tra tích hợp. Không sửa nguồn runtime, audit JSON lịch sử, commit hoặc push.
