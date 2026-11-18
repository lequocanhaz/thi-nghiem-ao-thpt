# Thí nghiệm nhiệt lượng kế V92

Phạm vi gồm hai hoạt động nước–đá và nhiệt dung riêng của vật rắn trong ID `calorimetry`. Bản này mở rộng quy trình từ chuẩn bị mẫu và đo đến so sánh hai lượt và xử lý số liệu.

| Công cụ | Cách dùng và dữ liệu |
|---|---|
| Rót theo khối lượng | Đặt bình và đưa cốc vào vị trí rót, rồi chọn lượng tính bằng gam. Mô hình chuyển nước qua các bước rót hữu hạn và dừng khi đủ. Có thể dừng giữa chừng. Phần tràn vào sổ cân bằng khối lượng của mô hình. |
| Cân cốc và mẫu | Chọn dụng cụ đưa lên cân, trừ bì hoặc lấy ra. Cân cốc cho số chỉ gồm khối lượng cốc và nước sau khi trừ giá trị bì. Đĩa rỗng dùng khi cân đá. Mẫu vật rắn cần được gắp trước. |
| Đo nhiệt độ mẫu | Chạm đầu dò vào mặt trên của mẫu đang kẹp. Số đo dùng trạng thái nhiệt của mẫu và độ trễ đầu dò. Vị trí đo hiển thị riêng cho mẫu, nước trong bình và bể gia nhiệt. |
| Lặp cấu hình | Nút trước các thao tác xuất sổ tay tạo lượt với cùng cấu hình. Lượt cũ còn nguyên. Cơ chế lưu trữ khi đủ lượt hoặc đầy phiên tiếp tục áp dụng. |
| So sánh hai lượt | Chọn hai lượt trên cùng trục. Chọn số học sinh ghi hoặc chuỗi nhiệt kế và vị trí đầu dò. Có thể lấy lần đưa mẫu được chấp nhận đầu tiên làm mốc 0 s. Điểm bị loại và khoảng trống không được nối thành một đường liên tục. Dấu × chỉ phép đo cục bộ khi nước chưa đều. |
| Tính tính chất nhiệt | Nhập số đo và xem nhiệt lượng từng phần. Bài nước–đá yêu cầu xác nhận đá tan hết, nước cân bằng trên 0 °C và chặn tính khi bình thực tế còn đá. Bài vật rắn giữ định dạng kết quả đã lưu. Nhiệt độ vô lý và tràn số được từ chối trước khi ghi. |

Khi dừng rót bằng nút trên bàn hoặc phím Escape, mô phỏng lưu ngay lượng đã chuyển. Phần so sánh hiển thị được lượng rót 50,125 g mà vẫn bỏ được sai khác chữ số do biểu diễn số thực.

Đường hỗ trợ vẫn dùng bộ kiểm va chạm và các hành động vật lí hiện có. Học sinh có thể dùng thao tác trực tiếp, tự đọc và ghi kết quả. Bảng nhiệt lượng là phép tính từ số người học nhập dưới giả thiết cách nhiệt, bình cùng nhiệt độ ban đầu với nước và không tràn. Cần phân biệt số liệu mô phỏng tự ghi với điểm đo của học sinh khi đối chiếu.

Đồ thị so sánh đọc dữ liệu phiên hiện có. Nó khởi tạo phần nội dung khi mở và giới hạn số điểm vẽ để giữ bố cục nhẹ, trong khi CSV giữ toàn bộ điểm đã lưu. Mốc đưa mẫu chỉ dựa vào sự kiện được chấp nhận và chưa hoàn tác. Những lượt thiếu sự kiện đó vẫn mở được theo mốc thời gian từ đầu. Dữ liệu cũ được đọc theo schema hiện hành, dữ liệu mới của phép tính nhiệt nóng chảy riêng là kết quả tùy chọn của từng lượt.

`thermal-assist.js` mở rộng các đích cân và đo mẫu. `thermal-pilot.js` nối thao tác, lượng rót và lifecycle với mô hình. `thermal-analysis.js` xử lý phép tính và hiển thị nhiệt lượng. `thermal-comparison.js` và stylesheet tương ứng phụ trách đồ thị. `data-notebook.js` giữ đồ thị tóm tắt dưới dạng các điểm để tránh nối hai vị trí đo khác nhau. Các URL khởi động được cập nhật để tải đúng mã trên website.

Rà soát và triển khai song song bởi `investigation92_notebook` cho đồ thị, `investigation92_lab_tools` cho phép tính, `acceptance91_science` cho vật lí và dữ liệu, `acceptance91_ux` cho giao diện và bàn phím. Agent chính tích hợp, kiểm tra và phụ trách phát hành.

| PASS cấp 3 | PARTIAL | NOT TESTED | BLOCKED | Tổng ID |
|---:|---:|---:|---:|---:|
|0|1|299|0|300|

Mô hình đá vẫn sử dụng các phần trong khối nhiệt tương đương. Phạm vi kiểm thử thiết bị của bản này là Chromium, gồm chuột, bàn phím, cảm ứng và kích thước màn hình mô phỏng. Nghiệm thu thực địa với giáo viên, điện thoại thật và đo FPS chưa có kết quả.

## Tự kiểm tra trong bài

1. Mở hoạt động nước–đá, đặt bình lên bàn và đưa cốc đến bình. Mở **Rót theo khối lượng** và rót 50,125 g.
2. Trừ bì đĩa rỗng rồi đặt một viên đá 10 g lên cân. Đọc số chỉ, thả viên đá, nhúng nhiệt kế và ghi số đo.
3. Dùng **Lặp lại cấu hình**, rót cùng lượng nước và chọn viên đá 5 g. Ghi thêm các số đo, mở **So sánh các lượt** và lấy lúc đưa mẫu làm mốc thời gian.
4. Sau khi đá tan hết và nhiệt độ ổn định, dùng các số đo để tính nhiệt nóng chảy riêng. CSV giữ số đo và chuỗi nhiệt kế. JSON giữ cả kết quả tính để có thể đọc lại khi khôi phục phiên.

## Bằng chứng kiểm thử

| Lệnh hoặc bộ kiểm | Kết quả |
|---|---|
| `npm run check:thermal-v92` | Đạt 620 kiểm tra phép tính và bộ kiểm đồ thị hai lượt, nguồn mẫu đo, mốc thời gian, dữ liệu cục bộ, ngoại lệ và giới hạn điểm vẽ. |
| `node checks/site-security-v63.mjs` | Đạt với 306 tài liệu HTML và 508 tài nguyên văn bản công khai. |
| `python checks/browser-thermal-investigation-v92.py --url http://127.0.0.1:4198 --swiftshader` | Đạt 3 kịch bản trên Chromium 154.0.8037.57. Rót đúng 50,125 g, cân đá 10 g sau trừ bì, giữ số đo hai lượt, tính và tải lại. Đo mẫu đang kẹp ở bài vật rắn. Kiểm cả từ chối lượng rót vượt mức và bảo toàn khi rót tràn ở 20×. [Bản ghi](evidence/investigation.json) |
| `python checks/browser-thermal-edge-v91.py --url http://127.0.0.1:4198 --swiftshader` | Đạt 6 ca miền tính, cốc nghiêng, dừng rót, ngưỡng lưu trữ, lưu phiên cũ và chế độ chỉ đọc. [Bản ghi](evidence/edge.json) |
| `python checks/browser-thermal-viewports-v87.py --url http://127.0.0.1:4198 --swiftshader` | Đạt 18 bố cục ở hai bài trên 9 độ rộng từ 320 đến 1920 px. [Bản ghi](evidence/viewports.json) |
| `python checks/browser-thermal-regression-v90.py --url http://127.0.0.1:4198 --swiftshader --only focus_and_data,lifecycle_locale_theme,fallback_2d_keyboard,cancel_pointer_lifecycle,no_webgl_and_context_loss` | Đạt 5 nhóm hồi quy về camera, dữ liệu, đổi ngôn ngữ và giao diện, bàn phím 2D, hủy cử chỉ và dự phòng mất WebGL. [Bản ghi](evidence/regression.json) |
| Đồ thị, giao diện và thẩm định vật lí độc lập | Đạt 3 bố cục đồ thị gồm chế độ tối. Kiểm lưu nháp qua tải lại và đổi ngôn ngữ, kiểm lại miền nhiệt độ và số dư bảo toàn sau khi rót. [Giao diện](evidence/ux-review.md) · [Vật lí](evidence/science-review.md) |

[Ảnh so sánh hai lượt ở 390 px](evidence/comparison-390.png) · [Ảnh chế độ tối](evidence/comparison-dark-390.png)
