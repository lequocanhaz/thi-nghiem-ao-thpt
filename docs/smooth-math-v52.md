# Độ mượt và công thức — v52

Ngày: 20/10/2026. Mốc so sánh: main `85575c3`. Không đổi nhận diện hoặc bố cục. Giữ nguyên các scientific catalog, phép tính mô hình, 300 bài soạn, sách, banner, âm thanh và định dạng dữ liệu phiên.

## Runtime

- Điện trường giữ dụng cụ, vector và buffer đường sức qua các nhịp chạy. Chỉ tích phân lại đường sức khi nguồn thay đổi; kéo P, đổi q0 hoặc độ dài vector không tính lại trường nguồn. Bật lại lớp sau khi đổi nguồn sẽ cập nhật đúng. Chuyển chế độ điện vẫn dựng dụng cụ tương ứng.
- Giữ thuật toán tích phân, số bước, miền dừng và chiều trường cũ. Canvas fallback dùng `geometry.drawRange`, không vẽ phần dung lượng buffer chưa sử dụng. Camera thủ công tiếp tục được giữ.
- Bỏ lần cập nhật scene trùng trong refresh UI; high nhắm khoảng 60 cập nhật/giây, low 30, có giữ phần dư thời gian. Render chỉ khi dirty/controls thay đổi. Giới hạn pixel ratio high 1.5 giảm tải GPU trên màn hình mật độ cao; low vẫn 1.
- Cập nhật nội dung ô số đọc tại chỗ; giữ SVG nếu chỉ điểm hiện tại thay đổi. Các đường cong, số đo, miền trục, kích thước, chế độ, điểm chọn hoặc grid thay đổi vẫn dựng lại SVG.
- Cache mẫu `evaluate` theo ID/toàn bộ state/mode/capMode; cache HTML KaTeX tối đa 128 biểu thức, tách inline/display và engine, giữ `trust:false`, MathML và fallback.

## LaTeX

`dist/formula-catalog.js` cung cấp TeX tường minh cho đúng 300 ID, tránh đoán nhóm tử/mẫu từ chuỗi slash cũ. Công thức có phép chia dùng phân số xếp tầng `\dfrac`; giữ nhóm ngoặc, căn, đạo hàm, tổng và vector. Sửa CSS icon của thanh công cụ từng làm mất nét căn/vector trong panel: giới hạn selector icon vào nút và trả SVG co giãn của KaTeX về kích thước gốc. Đã kiểm tra ảnh căn cộng hưởng trên Chromium mobile. Catalog này ưu tiên cho công thức lab/preview; không sửa phương trình tính toán để chữa typography. Agent physics đã rà tương đương đại số; chưa có giáo viên/chuyên gia bên ngoài ký duyệt độc lập toàn bộ.

## Đo trước/sau

Hai lượt liên tiếp trên cùng máy chủ, Chromium headless + SwiftShader, viewport 390×844, mẫu chạy khoảng 2.5 giây sau warmup 0.5 giây, bảng dữ liệu mở. CPU4 là giảm tốc giả lập. Kết quả phụ thuộc máy chủ và GPU phần mềm, **không phải FPS điện thoại thật**. JSON gốc nằm ở [before](performance/v52-before.json) và [after](performance/v52-after.json).

| Kịch bản | Median update trước → sau | Dựng lại model trước → sau | Median khoảng rAF trước → sau |
| --- | --- | --- | --- |
| Điện, thay nguồn | 11.2 → 3.0 ms | 4 → 0 | 766.6 → 66.6 ms |
| Điện, di chuyển P | 10.1 → 1.0 ms | 4 → 0 | 866.6 → 66.7 ms |
| Sóng, DPR1 | 1.5 → 1.5 ms | 0 → 0 | 66.7 → 66.6 ms |
| Sóng, màn hình DPR2 | 1.5 → 1.6 ms | 0 → 0 | 100.0 → 83.4 ms |
| Điện, CPU4 | 53.3 → 14.4 ms | 4 → 0 | 816.6 → 83.4 ms |

Không suy rộng số liệu điện trường thành tăng tốc tương tự cho mọi bài: sóng DPR1 gần như ngang trong lượt đo này. Số lần thay cấu trúc readout/play về 0 trong cả năm ca; SVG sóng về 0, SVG điện vẫn đổi khi đường cong/miền trục đổi. CPU4 vẫn có long task (19 so với 4 trước, khi bản sau xử lý nhiều khung hơn); không tuyên bố đã loại bỏ toàn bộ giật. Không cam kết 60 FPS toàn bộ 300 bài trên mọi thiết bị.

Lặp đo tùy chọn: cài Playwright/Chromium ngoài checkout, phục vụ `dist`, đặt `QUANH_BASE_URL`, `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, rồi chạy `node checks/browser-performance-v52.mjs /tmp/result.json`. Đặt `QUANH_PERF_ASSERT=1` cho bản mới để kiểm tra không tái tạo model/readout/play và giữ SVG sóng. Không bật assertion này khi đo baseline cũ.

## Kiểm tra và giới hạn

- `npm run check` gồm kiểm tra 300 bài, dữ liệu nguồn, mô hình, DOM, sách, accessibility và relay fixtures; thêm `math-cache-v52.mjs` và `rendering-v52.mjs`.
- Math: KaTeX thật cho 300 công thức, cache, isolation, eviction, đầu vào nguy hiểm và phục hồi lỗi. Một số chữ tiếng Việt trong `\text` có cảnh báo metrics của KaTeX; vẫn render được, cần tiếp tục kiểm tra font trên thiết bị thật.
- Electric CPU: bốn mode F/E, nguồn/probe, source sign/zero, buffer identity, valid/null/valid, vector triệt tiêu, bật/tắt lớp, manual camera và so với đường sức tích phân cũ; Canvas drawRange.
- DOM: giữ node, điểm hiện tại vẫn di chuyển, invalidate sau grid/resize/ghi điểm, chọn dòng bằng chuột/phím, đơn vị F/E và không cập nhật scene trùng.
- Chromium tùy chọn: library/lazy loading, timeout 15 giây/retry, WebGL unavailable/Canvas, teacher/guide/Escape, mobile width; 14 bài đại diện với KaTeX + MathML/phân số, ghi chú/dự đoán/số đo còn nguyên sau lỗi tải/điều hướng.
- Agent thực sự dùng trong đợt này: `ui` (điểm nghẽn, camera, cadence và Canvas), `ai` (300 TeX), `physics` (tương đương công thức), `qa` (review và hai bộ test mới). Không gọi `textbook` vì không thay sách.
- Chưa xác minh trên iPhone/Safari hoặc thiết bị cảm ứng thật; chưa đo FPS GPU phần cứng, chưa kiểm tra trực quan từng cảnh 3D của đủ 300 bài. Không gọi Gemini/API thật trong đợt này.

Kết quả trước khi phát hành: `npm run check` bản cuối PASS, gồm 61.200 khung playback/17.185 khung ray xe của bộ hồi quy CPU và 300/300 công thức KaTeX không lỗi cú pháp. Hai bộ browser library/lessons PASS trên Chromium; lượt lessons chạy lại sau sửa CSS xác nhận SVG căn/vector và phân số. Bản benchmark có assertion PASS cho model/readout/play/SVG sóng. Xem GitHub Actions của commit phát hành để kiểm tra CI và Pages; tài liệu này không thay cho việc xác nhận triển khai.
