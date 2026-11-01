# Triển khai đặc tả 300 thí nghiệm — đợt v72

Nguồn là tệp Word người dùng gửi ngày 31/10/2026, phiên bản tài liệu 1.0 ngày 30/10/2026. Đã nhập đủ 300 phiếu, đối chiếu chính xác 300 ID và lớp với catalog tại commit `ef52beae086a2f5140c46a0c6fa37df31c02ceb8`. SHA-256 tệp gốc nằm trong `sources/specification-v72/profiles.json`. Giữ nguyên nhận định của tài liệu: yêu cầu đề xuất không tự chứng minh mô hình đang lỗi.

Đợt này thực hiện nền tảng phần mềm dùng chung và kiểm định số học tám bài lõi theo thứ tự A/B trong mục 7 của đặc tả. Không đóng toàn bộ 300 phiếu, không thay thế nghiệm thu giáo viên hoặc thiết bị thật.

## Đã sửa thực tế

- Phiếu khảo sát trong từng bài: dự đoán, chọn biến, kế hoạch, ghi số liệu, phân tích, kết luận tự viết, vận dụng. Thu gọn bằng native details sau mô hình, không che mô phỏng. Các biến lấy từ tham số thật của đúng bài. Có bật/tắt gợi ý và nhắc số trạng thái/lượt thử phù hợp.
- Lưu nháp từng bài bằng khóa riêng `quanh-inquiry-v72:<id>`, giữ dữ liệu phiên cũ và không gửi phiếu cho AI/cloud. Đổi VI/EN, chuyển bài, tải lại đều giữ nội dung do người học viết. Xuất JSON gồm phiếu, tham số và số liệu gốc khi người học nhấn nút.
- Tạm dừng có thông báo khi đang chạy mà thay tham số bằng slider, ô số, preset hoặc điều khiển trực tiếp; bảng đo được giữ.
- Trước đây hồi quy có thể gộp điểm có điều kiện khác nhau dù đã có cảnh báo. Nay phân nhóm theo snapshot tham số gốc và chặn đường khớp chung khi khác điều kiện hoặc thiếu thông tin; toàn bộ điểm vẫn hiển thị và xuất được. Thời gian chỉ được tự do biến thiên khi trục độc lập thực sự là thời gian; không nhầm độ cao/biên độ/vận tốc ban đầu với kết quả tức thời. Cấu hình hiển thị không tạo nhóm vật lí giả.
- Bộ đối chứng độc lập 208 phép thử cho energy, oscillation, wave, electric, ohm, capacitor, boyle, gas; không tìm thấy lỗi phương trình trong các ca này, nên không sửa solver hoặc renderer. Không sinh lại hoặc đảo màu ảnh.

## Đối chiếu yêu cầu hệ thống

| Mục đặc tả | Trạng thái của đợt này |
| --- | --- |
| 3.1 Bản đồ chương trình | Đủ 300 dòng truy vết và trường YCCĐ/SGK chờ đối chiếu; chưa gán giả một YCCĐ hoặc số bài SGK. Chưa có bản đồ đã được giáo viên xác nhận. |
| 3.2 Chu trình học tập | Đã triển khai phiếu dùng chung cho 300 ID; chưa thí điểm học sinh/giáo viên. |
| 3.3 Nguồn số liệu khoa học | Bảo toàn solver hiện có; bảng/đồ thị/cảnh không tính vật lí từ pixel. Chưa nghiệm thu riêng toàn bộ 300 cảnh. |
| 3.4 Đồ thị/số liệu | Sửa hồi quy trộn điều kiện; giữ CSV và JSON phiên hiện có, bổ sung JSON phiếu. Chưa có selector chọn từng nhóm để khớp riêng. |
| 3.5 Đơn vị | Giữ định dạng khoa học và giá trị thô hiện có; thêm đối chứng SI/đơn vị tám bài lõi. Chưa kiểm chuyên gia mọi phép quy đổi ở 300 bài. |
| 3.6 Điều khiển | Bổ sung thông báo tạm dừng, giữ bảng; giữ reset/step/miền hiện có. Chưa đóng mọi ca biên theo từng phiếu. |
| 3.7 Truy cập | Kiểm UI/QA Chromium và bàn phím trong báo cáo kèm; iPhone Safari/Android thật CHƯA THỬ. |
| 3.8 Tài khoản | Không thay cấu hình Auth; không tự thêm đồng bộ cloud, quyền giáo viên hoặc dữ liệu cá nhân. |
| 3.9 AI | Không thay backend hoặc gửi phiếu mới cho AI. Cảnh báo/đánh giá AI mở rộng của đặc tả còn chờ. |
| 3.10 Phân tích sử dụng | Không bật tracking hoặc thu nội dung bài làm; còn chờ thiết kế chính sách/phạm vi. |
| 3.11 Bản quyền | Giữ nguồn/tài nguyên hiện có; chưa xác nhận quyền thương mại toàn bộ học liệu. |
| 3.12 CI/phát hành | Giữ kiểm cũ, thêm kiểm inventory/phiếu/điều kiện/8 lõi vào npm check; trạng thái phát hành ghi trong PR. |

## Nghiệm thu và phần còn lại

`docs/spec-v72/coverage.json` giữ danh sách đủ 300 ID và trạng thái từng tiêu chí. “Đã triển khai phần mềm” không đồng nghĩa “đạt hoàn toàn”. Kiểm định số học, hình ảnh, cảm ứng thật, sư phạm và đối chiếu chương trình là các bằng chứng khác nhau. Các đợt C/D/E, 292 phiếu chưa có đối chứng số học riêng trong v72, hình ảnh ba bộ tham số mỗi bài và chữ ký thẩm định vẫn chưa hoàn tất.

- [Phản biện Vật lí](spec-v72/physics-review.md)
- [Rà soát UI](spec-v72/ui-review.md)
- Phiếu nguồn đầy đủ: `sources/specification-v72/profiles.json`; yêu cầu hệ thống: `sources/specification-v72/system-requirements.txt`.

Không công bố 300 bài được giáo viên ký duyệt hoặc đã thử phần cứng chỉ từ các phép kiểm tự động.
