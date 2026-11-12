# P0 — kiểm kê nền Level 3, v84

> Cập nhật P1: audit hiện có 1 ID calorimetry PARTIAL và 299 NOT TESTED; xem IMPLEMENTATION_REPORT.md. Các quan sát P0 dưới đây mô tả snapshot nền trước pilot, không phải chứng nhận Level 3.

Ngày kiểm tra: 2026-11-12. Nền bất biến: `6aba10bd33f013d2f96d51513764022a65b65d86`.

**Đã hoàn thành kiểm kê nguồn và API nền, chưa nghiệm thu 300 bài Level 3.** Ma trận ban đầu có **0 PASS, 0 PARTIAL, 300 NOT TESTED, 0 BLOCKED**. Cả 8 gate và F1–F5 đều khởi tạo NOT TESTED. Công việc pilot sau baseline phải có chứng cứ riêng; không được suy diễn từ việc có mô hình, nút Chạy, thanh trượt hoặc số đọc.

## Nguồn và khả năng tái lập

- Đặc tả đầy đủ: [source-specification.txt](source-specification.txt); yêu cầu bổ sung: [source-request.txt](source-request.txt). Hash nguồn do agent chính lưu trong [source-provenance.json](source-provenance.json).
- [catalog-audit.json](catalog-audit.json): 300 record theo thứ tự export thực tế, metadata nguồn, kết quả probe, khoảng trống, 8 gate, F1–F5 và chứng cứ.
- [catalog-audit.csv](catalog-audit.csv): cùng 300 ID và trạng thái, dùng để lọc/phân công.
- [Dashboard chỉ đọc](../../dist/review/level3-v84.html), phục vụ ở `/review/level3-v84.html`: lọc ID/tên/chủ đề/trạng thái; không nối vào giao diện học sinh, không ghi localStorage, không có thao tác sửa/duyệt.
- Generator: [scripts/audit-level3-v84.mjs](../../scripts/audit-level3-v84.mjs).

Generator lấy dependency closure của catalog/model/playback/measurement/learning/lesson bằng `git show` tại commit nền, nạp trong thư mục tạm và xóa sau kiểm tra. Vì vậy module pilot đang được sửa đồng thời không thể trở thành chứng cứ baseline. Manifest ghi SHA-256 của từng module nền và hash working tree tại lần xuất; chênh working tree cần được hiểu là thay đổi sau nền, không phải kết quả nghiệm thu.

Fingerprint catalog (JSON theo thứ tự export; hàm được biểu diễn bằng SHA-256 của mã nguồn hàm; số không hữu hạn có marker riêng):

```text
4db58b9ecfc3e5d5ebb166a0de06c1212c9535eb47dc17471f88e761289861c2
```

Hash danh sách ID được sắp xếp nằm tại `baseline.idFingerprintSha256`; không dùng thứ tự hoặc danh sách ID gõ tay để tạo ma trận.

```sh
node scripts/audit-level3-v84.mjs --write
node scripts/audit-level3-v84.mjs --check
```

`--write` chỉ xuất JSON/CSV/dashboard, giữ phần `acceptance` đã được rà soát theo ID. `--check` so nguồn và API nền, 300 ID, tổng trạng thái, CSV và dashboard với JSON. PASS/PARTIAL phải có evidenceRefs, reviewer và reviewedAt. PASS tổng chỉ hợp lệ khi cả 8 gate cùng PASS và giáo viên/thiết bị thật đã PASS. Generator tự kiểm hai ca âm để từ chối PASS giả.

## Kiểm kê chính xác

| Hạng mục | Số lượng | Cách xác định |
| --- | ---: | --- |
| Thí nghiệm và ID duy nhất | 300 | Import export `experiments` của baseline |
| Bài soạn khớp ID | 300 | Import `lessons`, so tập ID với catalog |
| Trang sách | 388 | Đường dẫn WebP trong git tree; kiểm thêm dữ liệu file thật |
| Mục lục từng bài | 85 | Tổng `books/catalog.json` (34 + 26 + 25) |
| Âm thanh | 301 | MP3 trong `dist/audio/vi13/` tại git tree |

12 chủ đề thực tế: Cơ học 60; Dao động 20; Sóng 26; Điện trường 28; Dòng điện 37; Khí lí tưởng 10; Điện từ 37; Hạt nhân 7; Chất lưu 11; Quang học 38; Vật lí nhiệt 18; Vật lí hiện đại 8.

## Hành vi mô hình/playback đã quan sát

| Nhóm loại trừ nhau | Số bài | Bằng chứng và giới hạn |
| --- | ---: | --- |
| `AUTOMATIC_PARAMETER_PROCESS` | 221 | `isDriven`, `createProcess`, `advanceProcess`: nội suy một tham số rồi gọi model; đã probe trạng thái nửa quá trình. Không chứng minh HS tự bố trí/thao tác dụng cụ. |
| `TIME_DEPENDENT_OUTPUT_OBSERVED` | 63 | `evaluate` tại 3 thời điểm phân số duration làm đổi ít nhất một output số ngoài khóa `t`. Đây là quan sát API, chưa phải oracle độc lập hoặc mô hình động lực học đã nghiệm thu. |
| `VISUAL_EMISSION_ONLY` | 9 | Cờ nguồn cho reflection, refraction, tir, lens, mirror, prism, young, diffraction, polarization; các đốm sáng làm chậm không dùng đo tốc độ ánh sáng. |
| `NO_TIME_DEPENDENT_OUTPUT_OBSERVED` | 7 | ohm, boyle, gas, series, parallel, kinetic, transformer. Probe mặc định không thấy output số ngoài `t` đổi; không khẳng định hình hoàn toàn đứng yên. |
| **Tổng** | **300** | Các nhóm phục vụ P0, không là mức độ Level 3. |

Có 79 bài không thuộc `isDriven`, nhưng 14 trong số đó không có tham số `t` (5 định luật nền và 9 visualOnly). `kinetic`/`transformer` có `t` nhưng số đọc RMS/thống kê tại mặc định không đổi theo thời gian. Vì vậy không được báo “79 bài động lực học theo thời gian”.

Probe mặc định (electric mode 0, capacitor charge) không ném lỗi, không có output số mặc định NaN/Infinity. Đây là smoke API ở cấu hình xác định; không bao phủ mọi mode, góc miền, singularity, bảo toàn, va chạm, solver sai số, hoặc giới hạn hiệu năng. Nó không thay thế các oracle của agent physics.

## Khoảng trống thực tế của nền

Tất cả 300 bài có title/description/params/headers/tasks/formula/theory/limit; 270 có `readouts`/`columns`/`graph`, 240 có `scene`/`compute`. 30 bài đầu lấy meter và bảng từ các API chung, không vì thiếu field mà mất số đọc.

Không record catalog nào có trường cấu trúc tên `apparatus`, `physicalSystem`, `causalActions`, `measurements`, `independent`, `dependent`, `controls`, `instrumentState` hoặc `setup`. Điều này cho thấy **thiếu hợp đồng metadata Level 3 tại catalog**, không chứng minh mọi cảnh runtime đều không có dụng cụ. Audit giữ apparatus.items rỗng thay vì tự bịa bộ dụng cụ cho từng tên bài.

- `physicalSystem` lấy nguyên tên/mô tả/công thức hiện có, ghi rõ SOURCE DECLARATION ONLY.
- `archetype.scene/view/sourceGroup` giữ nhóm dựng hình thực tế; chưa xem nhóm dùng chung là một quy trình dụng cụ đã được duyệt.
- `causalActions` liệt kê đúng params, core handle và quy trình tự động có probe. `parameterFromDrag` hiện là ánh xạ X chung sang giá trị tham số; chưa phải bằng chứng đúng vị trí, lắp ráp, tiếp xúc, nối dây hoặc xử lí thao tác sai.
- `measurements` giữ label/key/unit/scale/digits hiện có. Không đồng nhất digits hiển thị với độ chia dụng cụ; placement/range/tare/lag/studentRecordContract để null khi chưa có hợp đồng.
- Biến độc lập/phụ thuộc/kiểm soát là **ứng viên** từ graph/coreParams, chưa là thiết kế khảo sát được duyệt. Với bài không có graph field, coreParams chỉ là fallback UI; không được xem đó là lựa chọn biến độc lập hợp lí. Các danh sách approved để rỗng.
- Giả thiết và giới hạn lấy nguyên văn nguồn, không tự biến chúng thành kết quả rà soát Vật lí. Không quy tất cả đơn vị hiển thị về SI khi nguồn còn dùng cm, L, kPa, °C, mA…
- Các test chứa literal ID được liệt kê để truy vết. Chỉ tìm thấy chuỗi ID không chứng minh test chạy, oracle độc lập hoặc đủ 8 gate.

Mỗi record có priority/difficulty/risk/reuse. Chỉ `calorimetry` được chọn **P1 PILOT** theo yêu cầu. Các bài khác ghi NOT TRIAGED / NOT ESTIMATED / NOT ASSESSED; đây là phần phân công thiết kế còn mở, không phải 299 kế hoạch đã duyệt. Các API dùng lại cũng chỉ là ứng viên hạ tầng, không nghiệm thu dụng cụ.

## Gate và bằng chứng nghiệm thu

| Gate | Nội dung cần chứng minh |
| --- | --- |
| L3-01 | HS tự bố trí/thiết lập hệ có ràng buộc |
| L3-02 | Hành động trực tiếp có ý nghĩa nguyên nhân |
| L3-03 | Hệ quả đúng, kể cả thao tác sai |
| L3-04 | Đọc dụng cụ với vị trí/thang/độ chia/đơn vị và tự ghi |
| L3-05 | Chọn biến, giữ biến kiểm soát, lặp/so sánh |
| L3-06 | Sổ đo, đồ thị, xuất CSV/JSON có dữ liệu HS |
| L3-07 | Dự đoán, khảo sát, kết luận có chứng cứ và giới hạn |
| L3-08 | Rà soát độc lập, tương tác/dữ liệu/browser, giáo viên và thiết bị thật |

`acceptance.overall`, `acceptance.gates['L3-01'…'L3-08']`, `acceptance.evidenceLayers.F1…F5`, `acceptance.teacherReview` và `acceptance.realDeviceReview` tách biệt. Mỗi mục có status/evidenceRefs/reviewer/reviewedAt. Khi pilot có bằng chứng một phần, chỉ cập nhật các mục thật sự có chứng cứ và đặt overall PARTIAL; chưa được đóng L3-08 vì chỉ chạy Chromium.

## Ưu tiên P1 và các điểm chưa đóng

`calorimetry` nền hiện là trộn hai lượng nước, bình cách nhiệt với nhiệt dung bằng 0, không chuyển pha. **Không thể đổi nhãn hoặc tái dùng trực tiếp công thức đó để tuyên bố đã có thí nghiệm nước đá hay đo nhiệt dung riêng vật rắn.** Hai hoạt động P1 phải tách mục tiêu/thiết lập/dữ liệu trong ID này:

1. Nước nóng + nước đá: có trạng thái pha, đá còn lại, cân bằng năng lượng, nhiệt kế đúng vị trí và tiến trình trao đổi; khuấy đổi tốc độ, không tự đổi cân bằng lí tưởng.
2. Vật rắn nóng + nước: có chuẩn bị/cân/đun/chuyển bằng kẹp, thả vào nước và suy ra nhiệt dung riêng từ số đo có thể sai; không tự điền đáp án.

Thiết kế dụng cụ, notebook schema tương thích phiên cũ, protocol, scientific oracle, integration browser và phản hồi giáo viên/thiết bị phải được ghi trong bằng chứng pilot sau nền. Audit P0 không tự nâng trạng thái theo sự có mặt của file mới.

## Kiểm tra đã chạy ở workspace đã khôi phục

| Lệnh | Kết quả | Phạm vi |
| --- | --- | --- |
| `node --check scripts/audit-level3-v84.mjs` | PASS | Cú pháp generator |
| `node scripts/audit-level3-v84.mjs --write` | PASS | Sinh inventory/smoke API nền từ git snapshot |
| `node scripts/audit-level3-v84.mjs --check` | PASS | Tái lập fingerprint, 300 row, JSON/CSV/dashboard và guard chống PASS giả |
| `node checks/spec-inventory-v72.mjs` | PASS | 300 ID/grade, proposal và trạng thái giáo viên/thiết bị pending |
| `node checks/books.mjs` | PASS | 388 WebP và 1.552 chuyển trạng thái đọc; không phải lật trang trên máy thật |
| `node checks/lessons-v50.mjs` | PASS | 300 bài soạn và cấu trúc nguồn. Có cảnh báo KaTeX font metrics tiếng Việt; không ghi nhận đó là font hiển thị trình duyệt đã nghiệm thu |
| Chromium dashboard 1440×900 và 390×844 | PASS | 300 dòng, 18 bài nhiệt sau lọc, 0 PASS, mở chi tiết gate, không tràn thân trang/lỗi JS/ghi localStorage |

Chạy dashboard qua HTTP cục bộ; lần mở `file://` đầu tiên bị chính sách trình duyệt chặn (`ERR_BLOCKED_BY_ADMINISTRATOR`), không phải lỗi ứng dụng. Ảnh và JSON kiểm tra trong `work/level3-v84/`; các artifact này là bằng chứng dashboard, không phải bằng chứng L3 của 300 bài.

Không chạy lại toàn bộ `npm run check` từ agent QA trong nhiệm vụ P0 này; agent chính phụ trách trước phát hành. Chưa chạy browser pilot, kiểm điện thoại thật, Safari/iOS thật, giáo viên, dụng cụ vật lí hoặc hiệu năng L3. Chưa nghiệm thu per-ID archetype/độ khó/rủi ro cho 299 bài còn lại.
