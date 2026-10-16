# Kiểm chứng bản 14 — ngày 16/10/2026

## Thay đổi

- Banner rút gọn trên điện thoại; tiến độ đặt cạnh bài học tiếp tục. Bản xem 3D được căn khung theo dụng cụ. Giữ font Product Sans do người dùng cung cấp.
- Tìm theo nhiều từ không dấu, chuẩn hóa khoảng trắng, ưu tiên tiêu đề phù hợp. Hiện và bỏ từng điều kiện lọc, phân trang gọn với bộ chọn trang trên màn hình nhỏ. Lọc không dựng lại banner.
- Biến tương tác có nút mở đúng ô số, mở cả thông số phụ; nhãn/đơn vị/giới hạn và biến được chọn rõ hơn. Điều chỉnh tham số tạm dừng đồng hồ.
- Dụng cụ được căn theo kích thước và tỉ lệ khung nhìn khi mở bài/đổi góc. Có Vừa khung; thao tác xoay hoặc phóng thủ công được giữ cho tới lần căn tiếp theo. Ánh sáng nền phòng thí nghiệm chuyển về tông trung tính.
- Số điểm đã ghi hiển thị khi bảng đóng; chọn lại trạng thái ở cột đầu được giữ cố định khi cuộn ngang. Có khôi phục bảng vừa xóa trong phiên hiện tại, đúng bài và khi bảng đang trống. Khôi phục tạm thời này không tồn tại sau tải lại trang.
- Nút nghe đặt ngoài vùng dụng cụ; các nút tạm dừng/tiếp tục/dừng cùng phản ánh một bộ đọc. Trình chiếu vẫn dừng đọc được. Không tự phát. Bộ MP3 Hoài My (Microsoft) được giữ nguyên; không gắn nhãn OpenScienceVN.
- Ngưỡng kết thúc theo thời gian riêng từng bài; nút tiến bước là 1/200 khoảng thời gian, thanh thời gian dùng 1/500. Sửa việc đặt lại thời gian quá sớm ở bài rất nhanh. Phân biệt sẵn sàng/chạy/tạm dừng/kết thúc bằng chữ và kí hiệu.
- Các thao tác mở thông số/dữ liệu/hướng dẫn thoát trạng thái đang che bảng nếu cần; giữ dữ liệu và ghi chép. Cải thiện nhãn dialog, bàn phím, đóng menu, mục tiêu chạm và dữ liệu lưu cũ không hợp lệ.

## Kiểm tra đã qua

- `checks/full-catalog.mjs checks/catalog-audit-v14.json`: đủ 300 bài, 9.776 trạng thái và hình học; mặc định, mẫu, đầu mút tham số, góc miền và thời điểm. Không có lỗi hữu hạn/NaN ở các trường được kiểm tra.
- `checks/framing.mjs`: 13.500 tổ hợp chiếu hộp bao của dụng cụ, 3 tỉ lệ và 3 góc nhìn; mặc định/mẫu/thời điểm. 316/900 trường hợp mặc định trước đây có góc hộp bao nằm ngoài khung camera cố định; đây là số trường hợp, không phải số bài hay bằng chứng ảnh bị cắt. Sau căn khung không có góc hộp bao vượt phần biên kiểm tra.
- `checks/dom.mjs`: HTML thật qua LinkeDOM, mã xử lý sự kiện của ứng dụng; đủ 300 bài mở/điều chỉnh/đo, 300 lối đến ô số, tìm/lọc/phân trang/xem trước, 79 bài động bắt đầu/tiến bước/tạm dừng/tiếp tục/kết thúc/chạy lại, chuyển bố cục, giữ ghi chép/bảng đo, quét biến/A-B/đồ thị/khớp dữ liệu/báo cáo/phiên. Kiểm tra các nhánh mới cho khôi phục bảng, bộ đọc, menu và lỗi thiết lập lưu. Renderer dựng hình học thật trong bộ kiểm DOM, không vẽ GPU.
- `checks/ui-60.mjs`: đủ 300 bài, điều khiển và callback 3D/ô số, CSV/lưu/nhập, dữ liệu độc lập và bác bỏ tệp khác bài. Dùng đối tượng DOM thay thế.
- `checks/workspace.mjs`: kiểm tra CSS và cấu trúc tại 360/768/1440 px, 3 chế độ, vị trí và cuộn thông số, ngăn dữ liệu, nhãn toán học và điều khiển chạm/bàn phím; 1.275 cửa sổ phân trang và biên thời gian rất nhỏ/rất lớn. Không tính hình hộp bố cục trình duyệt.
- `checks/banner.mjs`: 27 tổ hợp mô hình giới thiệu và 27 trường hợp camera thật qua đường Canvas giả lập lệnh vẽ; toàn bộ góc hộp bao trong khung. Dừng/chuyển động/độ tách và giải phóng vẫn qua kiểm tra.
- `checks/software-scene.mjs`: 300 bài, 900 trạng thái, 1.248.311 phần tử chiếu hữu hạn và lệnh vẽ Canvas giả lập.
- `checks/motion.mjs`, `checks/render-resilience.mjs`: chuyển động thực của hình học, đổi từ demo sang bài học, lỗi WebGL/thumbnail, tiếp tục hàng đợi và dừng vẽ khi không thấy cảnh.
- `checks/research.mjs`, `checks/media.mjs`, `checks/clip-player.mjs`: phân tích dữ liệu, báo cáo, chọn giọng, không tự phát, tải/hủy/tạm dừng/tiếp tục/dừng và các tình huống lỗi. Không kiểm tra phát âm qua thiết bị.
- `checks/assets.mjs`: cú pháp 39 mô-đun, 85 import cục bộ, tài nguyên font và khóa cache v14; SHA-256 của 301 MP3 trùng bộ đã giải mã toàn bộ trong bản 13; 8 mô-đun khoa học so với commit gốc không đổi ngoài khóa cache. `git diff --check` qua.

## Giới hạn

Không có công cụ kiểm thử trình duyệt được hỗ trợ trong môi trường này. Chưa kiểm tra ảnh giao diện/GPU, kích thước bố cục thực, chạm thật, trình đọc màn hình hay nghe loa để thẩm định giọng. CSS/DOM, phép chiếu hình học và giả lập sự kiện không thay thế các kiểm tra đó. Các bài tĩnh khảo sát qua thông số; chỉ 79 bài có diễn biến thời gian hiện điều khiển chạy. Không thể từ các kiểm tra này bảo đảm chạy trên mọi thiết bị hoặc coi đó là thẩm định khoa học độc lập toàn bộ nội dung.
