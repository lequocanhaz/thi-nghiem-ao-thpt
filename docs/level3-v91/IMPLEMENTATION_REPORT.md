# V91 — sửa lỗi theo cổng nghiệm thu

Ngày 17/11/2026 (UTC+7). Nền main: `acaf8b8843cfd9c2bcdc34697163da6afb7a12dc`. Phạm vi hai hoạt động nhiệt thuộc ID `calorimetry`.

Thang điểm được chốt trong [ACCEPTANCE_RUBRIC.md](ACCEPTANCE_RUBRIC.md) trước khi sửa runtime. Điểm dựa trên các ca công bố, không phải khảo sát người dùng hoặc chứng nhận toàn sản phẩm. Không gắn PASS cấp 3 vì điểm này.

## Các lỗi đã tái hiện và sửa

| Lỗi | Trước sửa / phép thử | Sửa thực tế |
|---|---|---|
|Cận cảnh cắt màn hình nhiệt kế|4/4 viewport LCD nằm ngoài canvas, có góc Y âm|Fit theo camera-space của tất cả góc hộp bao, gồm dụng cụ đo trong bình. Named focus căn lại khi resize/reload; zoom thủ công được giữ|
|Cốc/bình cùng hết nước thành ngõ cụt|CTA chính bị khóa|Đưa ra tạo lượt mới giữ dữ liệu cũ; nếu lượng nước cấu hình bằng 0 thì mở đúng trường tham số để chọn lượng cho lượt mới|
|Bỏ qua reduced motion|Chế độ reduce vẫn chạy animation dụng cụ 500 ms|Đi thẳng đến trạng thái cuối với cùng kiểm sweep/corner; giữ phản hồi và dữ liệu, không tắt kiểm vật lí|
|Tính nhiệt dung riêng tràn/thiếu số|Đầu vào hữu hạn cho Infinity/0; autosave hoặc JSON lỗi|Kiểm kết quả hữu hạn và dương trước khi ghi, giữ kết quả hợp lệ/số đo trước; không đổi công thức|
|Rót sau restore không dừng đúng|Cốc nghiêng đang rót nhưng CTA sai; Escape vẫn tăng nước|Nút dừng và Escape căn cứ trạng thái rót thực, không chỉ cờ UI tạm. Không ép thẳng cốc khi tải phiên|
|Đủ 20 lượt không thể tiếp tục|Xuất JSON rồi tạo lượt mới vẫn lỗi giới hạn|Lưu trữ toàn phiên có xác minh ghi, rồi mới chuyển sang phiên mới. Có danh sách tải lại JSON và xác nhận/hủy; quota thất bại giữ phiên hiện tại|
|Tự ghi phiên vượt giới hạn đọc|Phiên hợp lệ ~1,497 triệu ký tự thành ~1,503 triệu sau ghi chú, rồi không đọc lại được|Chính sách kích thước thống nhất, ngưỡng chỉ đọc/snapshot chính xác và chuyển phiên có lưu trữ, không cắt ghi chú|
|Phiên chỉ đọc vẫn cho sửa một số mục|Loại điểm trông đã đổi trên UI nhưng JSON giữ bản cũ|Khóa đồng bộ UI và controller cho loại điểm, pose/góc/dụng cụ/ghi số liệu; vẫn đọc/xuất/camera hoặc mở phiên mới được|

Các ca đỏ đã chạy trước sửa; không suy luận lỗi chỉ từ ảnh. Log chẩn đoán giữ riêng trong `work/thermal-v91/`. Những lượt source còn thay đổi không tính vào bộ cuối.

## Dữ liệu và kích thước phiên

- Giữ schema `lab.session.v3`, model `thermal.nodes.v1` và key phiên cũ. Đọc/ghi giới hạn **2.000.000 ký tự**, cảnh báo/ngừng ghi thêm từ **1.400.000 ký tự**. Giới hạn tệp nhập **6.000.000 byte** để không nhầm kích thước UTF-8 với độ dài chuỗi JavaScript. Các kiểm kiểu, độ sâu, collection, số hữu hạn và chống prototype pollution vẫn giữ.
- Phiên đã lớn được mở ở chế độ chỉ đọc, giữ nguyên chuỗi JSON đầu vào để xuất; không pretty-print lại một tệp minified thành quá lớn. Tệp V90 ~1,503 triệu ký tự trước đây bị từ chối nay đọc được trong miền mới. Không giảm hoặc sửa nội dung để lọt giới hạn.
- Phiên đang tăng tới ngưỡng mềm được lưu snapshot an toàn rồi dừng bổ sung. Người dùng chọn lưu trữ và mở phiên mới để tiếp tục; snapshot cũ vẫn tải/import được.
- Rollover ghi bản sao đầy đủ, xác minh nội dung và index, rồi mới ghi primary mới và kích hoạt RAM mới. Lỗi ghi archive/index/primary hoặc quota giữ dữ liệu cũ; không xóa archive. Nếu không đủ bộ nhớ để lưu bản sao, chuyển phiên bị chặn có thông báo, JSON hiện tại vẫn tải được.
- `session-archive.js` chỉ lưu/đọc JSON và metadata có kiểm namespace; không thực thi dữ liệu nhập. Snapshot chỉ đọc không giả là đang lưu các chỉnh sửa mới.

## Bảo toàn khoa học và hệ thống

Bảy module khoa học/đo/geometry/protocol cốt lõi giữ nguyên byte; `data-notebook.js` chỉ đổi hợp đồng dung lượng có giới hạn và kiểm đầu ra, không sửa số đo hay công thức. Camera không ảnh hưởng model SI. Giữ 300 ID, 388 trang sách, 85 mục lục, 301 âm thanh, dữ liệu cũ, banner/logo, AI/auth và các đường vào bài. Không đổi DNS/canonical.

Đá vẫn là phần của khối nhiệt tương đương, chưa trôi/va chạm độc lập hoặc CFD. Hỗ trợ theo đích được ghi đúng loại thao tác, không giả chứng cứ pointerdrag của học sinh. Không tự điền đáp án hay nâng 300 bài thành PASS.

## Kiểm chứng

- Unit camera: 2.169 assertions với oracle chiếu Three độc lập.
- Unit archive/dung lượng: 49 assertions, collision key, quota/silent write/partial write, rollback, index sai, giới hạn đọc/xuất không cắt dữ liệu.
- Browser edge độc lập: phép tính valid→overflow/underflow, restore cốc nghiêng và dừng, 20 lượt hủy/lưu trữ/tải lại, quota, snapshot lớn pretty/minified và khóa chỉnh sửa chỉ đọc.
- Browser phục hồi: cốc/bình rỗng ở desktop/390, cấu hình nước 0 và reduced motion.
- Hồi quy: luồng nước–đá/vật rắn, CSV/JSON/import/reload, VI/EN/theme, camera/fallback, pointercancel/grip, viewport. Đối với controls cũ, harness mở disclosure tường minh; giao diện thu gọn được kiểm riêng.

Mỗi report cuối có source hash; log và kết quả đầy đủ trong `evidence/`. CI/Pages/live được ghi sau khi có kết quả, không coi local PASS là đã phát hành.

Agent thực gọi: `acceptance91_science` tái hiện lỗi dữ liệu/vòng đời, viết browser edge và rà khoa học độc lập; `acceptance91_ux` tái hiện/sửa camera và kiểm UI độc lập. Agent chính sửa controller, archive, chính sách dung lượng, chạy tích hợp và phát hành.

## Phạm vi chưa nghiệm thu

Chưa thử iPhone Safari/Android thật, đo P95/FPS trên thiết bị mục tiêu, giáo viên hoặc chứng nhận WCAG đầy đủ. Mục thực địa của thang điểm để 0/NOT TESTED, không được tự bù bằng viewport hoặc Node. Đánh giá phần mềm không bảo đảm mọi thao tác/ngữ cảnh chưa thử đều không còn lỗi.

| PASS cấp 3 | PARTIAL | NOT TESTED | BLOCKED | Tổng ID |
|---:|---:|---:|---:|---:|
|0|1 — calorimetry|299|0|300|

## Tệp chính

- `thermal-pilot.js`: phục hồi nguồn nước, stop thực, kiểm kết quả tính, chỉ đọc, lưu trữ/chuyển phiên, reduced motion và thông báo.
- `thermal-three.js`: camera fit/restore/resize đúng giới hạn, không đổi SI.
- `data-notebook.js`: hợp đồng dung lượng giới hạn và xuất đọc lại được.
- `session-archive.js`: lưu trữ/chuyển primary có xác minh, không xóa dữ liệu.
- `thermal.css`: bố cục chọn phiên đã lưu; `app.js`/`boot.js`/`index.html`: cache V91.
- Các checks V91 mới; check V84 dùng giới hạn công bố thay hằng cũ. `package.json` chạy unit mới trong suite; handoff và báo cáo/bằng chứng.

Ưu tiên sau nghiệm thu phần mềm: thử thiết bị thật và giáo viên trước khi nâng trạng thái cấp 3; mở rộng primitive đã được kiểm sang nhóm khác theo từng ID.

## Kết quả nghiệm thu cục bộ

`npm run check` cuối:exit0,721,81giây,sourceStable. Sáu nhóm edge độc lập,4luồng phục hồi/reducedmotion,4learnerjourneys,1safety,5nativegrip,18viewport và7nhóm hồi quy đạt; xemmanifestcuối. Oracle vật lí,2.169camera và49archive/budget đạt. Security306HTML/505publictextassets,diffcheckđạt. Node24.19.0,Chromium154.0.8037.57/SwiftShader.

Ca hủy có timing120ms cũ có thể hoàn thành chuyển động trước Escape khi máy tải cao. Ca mới bơm click+Escape qua publicDOM cùngtask để chắc đã hủy trướcRAF; nhánhEscape khi đangrót vẫn dùng nativekeyboard. Reducedmotion kiểm đếm poseđãvẽ:V90controllerisolated5pose→FAIL,new1finalpose→PASS; không dùng nó làmP95/FPS. Không sửa runtime để làm phép đo thời gian đẹp hơn.

| Mục theo rubric | Điểm phần mềm trước bước phát hành | Căn cứ |
|---|---:|---|
|1|1|Oracle và phép tính kết quả hữu hạn trước ghi; reviewkhoa họcđộc lập|
|2|1|Bảo toàn/overflow/volume; khôngđổicorephysics|
|3|1|Empty/zero-config/reload,20trial/archive/cancel/quota và tiếp tục|
|4|1|ActualStop/Escape cho restore/manualpour; lifecycle|
|5|1|Nhúng/độtrễ/assessment/manualreading/cácnhánhsaithao tác|
|6|1|JSON/CSV/oldstate/nearfull exactsnapshot,readonlyguard|
|7|1|Camera LCDframing4viewport,dark,resize/reload; reviewUIđộc lập|
|8|1|Focus/keyboard/nativeCDPtouch/reducedmotion/9viewport|
|9|CHỜ|Cần CI/Pages và kiểm production saucommit, không cộng trước|
|10|0 / NOT TESTED|Chưa thiếtbịthật/giáoviên/hardwareperformance|

Điểm9/10 chỉ được chốt trong biên bản phát hành/PR sau khi mục9 có bằng chứng. Không có P0/P1/P2 đãxácminh còn mở trong phạm vi các ca phần mềm đã rà. Các tổ hợp chưa thử không mặc nhiên PASS.
