# V89 — thao tác liên tục và nhiều phần đá

Ngày 17/11/2026 (UTC+7). Nền main: `b02e3f68b252de665426da35f61196e217577240`.

## Đã sửa

Người dùng báo điều khiển không mượt và muốn thả nhiều viên đá. Phạm vi lần này là hai hoạt động nhiệt trong ID `calorimetry`; giữ đường dẫn “Nhiệt dung riêng” cho hoạt động vật rắn và đường dẫn riêng cho nước–đá.

- Từng mẫu pointer vẫn được kiểm va chạm và cập nhật trạng thái ngay. Chỉ việc vẽ/đổi DOM được gom vào một animation frame; chế độ 3D không vẽ lại SVG ẩn. Không bỏ mẫu chuyển động dùng để tính khuấy.
- Khi chạm thành bình/bàn, dụng cụ tiến tới phần đường đi hợp lệ rồi có thể trượt theo một đoạn tiếp tuyến được kiểm tra. Không trả toàn bộ thao tác về vị trí cũ, không xuyên vật, không tự sửa vị trí phiên cũ. Xoay cốc cũng dừng ở góc hợp lệ.
- Hoãn serialize/ghi primary localStorage trong lúc giữ dụng cụ; thả/cancel sẽ lưu tiếp. Ghi định kỳ chỉ thực hiện khi dữ liệu thay đổi. Import đánh dấu dữ liệu mới cần lưu cả khi phiên trước đang sạch; rời trang kết thúc gesture trước khi lưu.
- Phiên nước–đá mới có 100 g đá trên khay, mỗi phần mặc định 10 g. Có lựa chọn nhanh 1/5/10/20 g và nhập chính xác. Phần đã thả trừ đúng nguồn; hết nguồn không hiện viên giả. Viên lấy ở phía trước khay, tránh chồng cân.
- Lưu riêng khối lượng ban đầu, khối lượng còn lại và thời điểm của mỗi lần thả được chấp nhận. Tan rồi thả thêm không làm phần cũ lớn lại. Số phần đã thả và lượng đá còn trên khay/trong bình được hiển thị song ngữ.
- Phiên cũ giữ nguyên lượng đá và lựa chọn trước đây. Muốn thêm nguồn: chọn **Lượt mới với 100 g đá**; dữ liệu lượt trước còn trong sổ tay và có xác nhận khi đã làm bài. Không tự thêm vật chất vào lượt đang đo.
- Khối lượng truyền thực tế được dùng cho event/điều kiện khi sai số floating point làm lần thả cuối chênh cực nhỏ; không tạo thêm khối lượng từ dung sai.

## Mô hình và tương thích

`thermal-ice-portions.js` mở rộng tùy chọn `thermal.ice-portions.v1`, không đổi model version, session key hoặc phương trình truyền nhiệt. Ledger mới được kiểm tra trước import, hành động và phân vùng mesh. Tổng khối lượng còn lại phải khớp aggregate bằng dung sai tuyệt đối tối đa 1e−10 kg và tương đối 1e−9; trường hợp zero/positive phải khớp tuyệt đối về sự hiện diện. Dữ liệu sai bị từ chối, không được làm tròn hoặc sửa ngầm.

Phiên chưa có ledger vẫn đọc được. Khi lần đầu thêm đá vào phiên cũ, lượng đá trước đó được giữ dưới tên nội bộ `legacy-aggregate`; không dựng số viên/thời điểm lịch sử không có chứng cứ. JSON mới lưu ledger, CSV tiếp tục xuất số đo học sinh theo định dạng hiện hữu. Import bằng phiên bản cũ hơn V89 có thể không bảo toàn metadata mới nếu lưu đè; nên giữ JSON khi quay về bản cũ.

Renderer chia đúng hình bao đá tương đương thành các khối tiếp giáp có thể tích tỷ lệ khối lượng, tổng thể tích bằng `m/917`. Hình bao, nước bị chiếm chỗ và mô hình nhiệt vẫn dùng cùng nguồn SI. Đây là **các phần của một khối nhiệt tương đương**, chưa phải nhiều viên tự do trôi/va chạm độc lập. Không có CFD hoặc rigid body tổng quát; không làm tăng diện tích trao đổi nhiệt giả khi số lần thả tăng.

## Kịch bản tự kiểm chứng

Mở hoạt động nước–đá → đặt bình → rót nước → chọn đá 10 g → nhấc khỏi khay, đưa qua miệng bình và thả; lặp 5 lần. Khi thời gian đang dừng, khay còn 50 g, bình có 50 g đá và ghi nhận 5 lần thêm. Cho chạy/từng bước để đá tan, rồi thả lần thứ sáu: phần cũ tiếp tục giữ hoặc giảm khối lượng, không lớn trở lại. Đặt đầu dò/khuấy và chủ động ghi số đọc; xuất JSON, nhập lại rồi reload để kiểm sổ tay.

Phiên cũ chỉ còn ít đá: xuất JSON nếu muốn sao lưu, chọn “Lượt mới với 100 g đá”; lượt trước vẫn nằm trong notebook. Thử kéo cốc vào thành bình: cốc tiến tới điểm tiếp xúc thay vì đứng nguyên hoặc xuyên qua.

## Bằng chứng và giới hạn nghiệm thu

Các báo cáo cuối trong `evidence/` có hash nguồn trước/sau. Báo cáo baseline chỉ dùng để chứng minh lỗi/áp lực xử lý trước sửa; không trộn với kết quả cuối. CPU cho chuỗi 120 pointermove đồng bộ là tín hiệu giảm công việc main thread, không phải P95 tương tác người dùng hoặc FPS phần cứng. Thời gian phụ thuộc tải máy chạy kiểm thử.

Agent thực gọi: `ice89_implement` triển khai ledger và kiểm khoa học; `render89_implement` triển khai hình 2D/3D/cache; `thermal89_qa_review` rà độc lập và phát hiện lỗi capture 2D, import sạch và ledger rỗng dưới dung sai. Agent chính sửa controller/interaction, tích hợp, chạy browser và phụ trách phát hành.

| PASS cấp 3 | PARTIAL | NOT TESTED | BLOCKED | Tổng ID |
|---:|---:|---:|---:|---:|
|0|1 — calorimetry|299|0|300|

Chưa thử iPhone Safari/Android thật, FPS/P95 trên thiết bị mục tiêu, nghiệm thu giáo viên hoặc WCAG đầy đủ. Không tuyên bố 300 bài đã đạt cấp 3. Tài nguyên 300 bài, 388 trang sách, 85 mục lục và 301 tệp âm thanh phải còn qua suite hiện hữu. Không thay AI/auth, canonical hoặc DNS.

Trạng thái CI/Pages/live chỉ được bổ sung sau khi có bằng chứng phát hành. Kết quả local không tự chứng minh website đã cập nhật.

## Tệp nguồn và kiểm thử

- `dist/l3/thermal-motion.js`: giải quyết đoạn dịch chuyển/xoay hợp lệ bằng sweep hiện hữu.
- `dist/l3/thermal-ice-portions.js`, `thermal-physics.js`: ledger khối lượng tùy chọn, validate/import và tan bảo toàn.
- `dist/l3/thermal-pilot.js`, `interaction-core.js`: gom render, lifecycle/autosave, nhập phiên, nguồn đá/điều khiển.
- `dist/l3/thermal-three.js`, `thermal-view.js`: phần đá đúng thể tích, readouts tách khỏi SVG, cache và khay.
- `dist/l3/thermal-apparatus.js`, `thermal-spatial.js`: vị trí lấy đá/khay rộng phù hợp hình học.
- `dist/index.html`, `boot.js`, `app.js`: cache URL V89; không thay ứng dụng/framework.
- `checks/thermal-motion-v89.mjs`, `thermal-ice-portions-v89.mjs`: kiểm contact/lifecycle và mô hình/ledger/import.
- `checks/browser-thermal-motion-v89.py`, `browser-thermal-ice-v89.py`, `browser-thermal-storage-v89.py`, `browser-thermal-stock-v89.py`: tương tác, hình/khối lượng, tan, JSON/reload và ghi dữ liệu.
- `checks/thermal-spatial-v87.mjs`: chuyển fixture thả trên bàn từ vị trí nay nằm trên khay ra vùng bàn trống; không nới guard.
- `package.json`: đưa kiểm mới vào suite; `CODEX_HANDOFF.md`: bàn giao.

Ưu tiên tiếp theo: nhiều viên độc lập chỉ triển khai khi có mô hình hình học–nổi–tiếp xúc phù hợp và oracle; đo trên điện thoại thật; giáo viên nghiệm thu mục tiêu/đọc số liệu; sau đó mới nhân primitive đã kiểm sang bài khác.

## Kết quả kiểm thử cuối

| Bộ kiểm | Kết quả có bằng chứng |
|---|---|
| Ledger/partition/import | 7.731 assertions đạt, có khối lượng cực nhỏ, tan hết, chuỗi thêm nhiều lần và dữ liệu giả |
| Vật lí/overflow | 61.503 và 76.379 assertions đạt; hai oracle chuẩn giữ 29,0996085 °C và 0,04994012 kg đá còn |
| Native nhiều lần thêm | 2/2: chuột1440 và CDPtouch390, 5 lần thêm, tan, lần thứ6, volume mesh, JSON/reload |
| Autosave/import sạch | 2/2: 2D/3D giữ1800ms không ghi primary, release1write, import/reload giữ physics/trials |
| Phiên cũ/lượt100g | 1/1: giữ stock20g/piece20g, hết nguồn, lượt mới100g giữ giả thuyết và finalphysicalstate qua reload |
| Cầm que dưới nước | 5/5: 3D chuột1440/touch390/landscape844, 2D chuột1440/touch390 |
| Viewport | 18/18: hai hoạt động × 320/375/390/414/430/768/1024/1440/1920px; không tràn, nút hiện≥44px |
| Hồi quy | 7/7 nhóm: render/camera, export/import, focus/data, lifecycle/VIEN/theme, 2D/keyboard, cancel/capture, WebGL fallback/loss |
| Security | 306 HTML, 503 public text assets đạt |

Node24.19.0; Chromium154.0.8037.57/ANGLE/SwiftShader. Các report cuối có manifest trùng mã hiện tại. Có lỗi WebGL console dự kiến ở ca chủ động tắt WebGL, nhưng không có pageerror; fallback dùng được và giữ dữ liệu.

Baseline chuỗi120pointermove: 3D352,6ms,1200ghiSVGẩn,4216mutation; bản cuối51,9ms,0ghiSVGẩn,0mutation trong burst, giữ đúng pose cuối. 2D278,9→21,8ms. Không coi những con số này là benchmark thiết bị hoặc bảo đảm độ trễ; máy có tải khác nhau và paint được hoãn tới RAF tiếp theo. Kiểm cầm/khuấy native, pose cuối và lưu phiên được chạy riêng để tránh đánh đổi đúng thao tác lấy số đẹp.

`npm run check` cuối đạt exit0 trong647,78giây, manifest nguồn trước/sau ổn định; log và JSON nằm trong evidence. Diffcheck đạt. CI phải đạt trước merge. Bằng chứng deploy/live nằm ở PR/báo cáo phát hành riêng; chưa có kết quả thì chưa coi web đã cập nhật.
