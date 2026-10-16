# Kiểm chứng v13 — 300 bài, banner và âm thanh

## Thực hiện

- Banner Three.js dùng ba dụng cụ hiện có (mạch Ohm, con lắc, lăng kính), vật liệu/ánh sáng môi trường PMREM, bố cục nổi theo ảnh tham khảo và chuyển động tách các mô hình theo cuộn lấy ý tưởng từ video người dùng gửi. Có thanh tách mô hình, nút dừng, liên kết mở bài thật, giảm chuyển động, ngừng vẽ ngoài vùng nhìn và phương án Canvas. Không thay bằng video nền hoặc ghi là đã train AI.
- Đổi giao diện sang bốn kiểu Product Sans người dùng cung cấp; đóng gói WOFF2, giữ Inter dự phòng và font toán. Kiểm tra đủ 57 kí tự Việt xuất hiện trong danh mục trên cả bốn tệp và xem mẫu glyph riêng.
- Sửa render thừa khi mô hình nằm trong bảng đóng/ngoài vùng nhìn; giới hạn nhịp vẽ khoảng 30 FPS hoặc 15 FPS ở chế độ nhẹ. Bố cục, điều khiển và số đọc được giữ.
- Sửa việc một thumbnail lỗi làm ngừng cả hàng đợi. Không tạo được WebGL thì thử Canvas; một bài lỗi ảnh xem trước không chặn những bài sau.
- Người dùng đã chọn dùng nguồn giọng Việt phù hợp khi chưa xác định được giọng OpenScienceVN cụ thể. Nguồn thay thế là Hoài My (`vi-VN-HoaiMyNeural`) của Microsoft, tạo âm thanh sẵn qua công cụ build. Không có dịch vụ TTS hay API bên ngoài chạy trên máy học sinh. Thêm cách đọc kí hiệu Hy Lạp, chỉ số và số mũ; giữ phát/tạm dừng/tiếp tục/dừng và giọng thiết bị. Chỉ thay toàn bộ thư mục giọng đọc sau khi đủ tệp và kiểm tra thành công.

## Đã kiểm tra

- `checks/full-catalog.mjs`: 300 bài, 9.776 trạng thái và 9.776 lần kiểm tra hình học. Bao gồm mặc định, preset, từng tham số min/giữa/max, các tổ hợp góc, nhiều thời điểm, bốn chế độ điện trường và hai chế độ tụ. Kiểm tra đại lượng hữu hạn hoặc null có nghĩa, bảng/số đọc, thời lượng, ma trận/đỉnh/instance. Không có lỗi trong báo cáo `checks/catalog-audit-v13.json`.
- `checks/models-60.mjs`, `checks/atlas-150.mjs`, `checks/discovery.mjs`, `checks/expansion-300.mjs`: danh mục và lược đồ, miền thông số, hệ thức định lượng/bảo toàn và các điều kiện đặc biệt. Đối chiếu các mô-đun thí nghiệm, thuật toán Vật lí, số đọc, bảng và đồ thị với v12: giữ nguyên ngoài khóa cache v13.
- `checks/dom.mjs`, `checks/ui-60.mjs`: mở/điều chỉnh đủ 300 bài; chạy/tạm dừng ở bài động, ghi điểm, A/B, quét biến, khớp dữ liệu, xuất/nhập, báo cáo, lưu riêng từng bài, tìm/lọc/phân trang/xem trước. Bố cục giữ dữ liệu. Thêm luồng điều khiển banner và giải phóng khi rời trang.
- `checks/motion.mjs`: các bài động thay đổi ma trận hoặc đỉnh thực, không chỉ số thời gian; khôi phục dụng cụ khi chuyển từ xem thử sang bài cùng ID.
- `checks/workspace.mjs`: cấu trúc DOM và cascade CSS tại 360/768/1440 px; ba chế độ, vùng cuộn, bảng thu gọn, khôi phục, MathML và kéo không dùng GPU.
- `checks/banner.mjs`: ba dụng cụ ở 27 tổ hợp kích thước/thời gian/độ tách; tọa độ và các mặt chiếu hữu hạn, thấy được từng dụng cụ. Thực thi controller thật qua Canvas với lệnh vẽ giả lập: lỗi WebGL, dừng thời gian, chặn chuyển động theo cuộn khi dừng, thanh kéo đổi vị trí và giải phóng.
- `checks/render-resilience.mjs`: lỗi WebGL/thumbnail được tiêm có chủ đích, hàng đợi tiếp tục, cảnh ẩn hoặc có chiều cao 0 không render, nhịp vẽ được giới hạn.
- `checks/software-scene.mjs`: 300 dụng cụ ở 900 trạng thái, 1.248.311 phần tử chiếu hữu hạn; có lệnh vẽ mặt/đường/hạt bằng Canvas.
- `checks/media.mjs`, `checks/clip-player.mjs`: giọng hệ thống, đọc số/kí hiệu/đơn vị, hàng đợi, không tự phát, pause/resume/stop, lỗi/tải muộn; ánh xạ đoạn đọc đủ 300 bài. Luồng phát dùng AudioContext giả lập.

- `scripts/check-audio.py`: giải mã thực đủ 301 MP3, 11.404,848 s; kiểm tra 2.591 vùng cue có âm thanh (RMS thấp nhất 2.775,15), thời lượng và SHA-256. Không đồng nghĩa thẩm định phát âm hoặc phát trên thiết bị.
- Cú pháp 34 mô-đun, 78 import cục bộ, tài nguyên font/âm thanh, khóa cache v13 và `git diff --check`.

## Giới hạn

Kiểm tra mã, mô hình, hình học, DOM và sự kiện thực hiện bằng Node/LinkeDOM. Đã xem contact sheet của toàn thời lượng video, mẫu glyph riêng và hình chiếu banner bằng phần mềm; các hình này không phải ảnh chụp giao diện hay WebGL. Môi trường không có công cụ kiểm thử trình duyệt được hỗ trợ, nên chưa xác nhận hình ảnh ở ba chiều rộng, GPU, chạm thật, trình đọc màn hình hoặc âm thanh qua loa/nghe thẩm định phát âm trên thiết bị. Không thể từ những kiểm tra này bảo đảm hoạt động trên mọi máy. Bài tĩnh khảo sát bằng tham số; chỉ bài có diễn biến thời gian mới có nút Chạy.
