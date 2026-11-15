# V88 — cầm và khuấy trực tiếp trong bình

Ngày 15/11/2026 (UTC+7). Nền main trước sửa: `f76ba57f7188a8ebeedc312ddfed3c04595989d6`.

## Đúng lỗi người dùng báo

“Bị che” ở đây là không cầm được que để khuấy khi que đã nằm trong bình, không chỉ vấn đề nhìn thấy. Browser trước sửa đã tái hiện: bình đang được chọn; chạm đầu que ngập nước → không bắt được que, không có sự kiện khuấy. Không dùng nút khuấy hoặc chọn que sẵn để thay cho bằng chứng sửa lỗi này.

## Thay đổi thực tế

- 3D bỏ việc bình/nước trong suốt chiếm cú chạm trước que. Vùng bắt thao tác theo cả đoạn thân chiếu ra màn hình, tối thiểu45px để bù làm tròn CSS; không đổi tọa độ hay số đo vật lí.
- Các vật cản đặc như vành bình/cân/mẫu vẫn chặn thao tác xuyên qua. Khi hai dụng cụ cầm tay cùng pixel, lựa chọn tường minh trong bảng dụng cụ phân biệt que và đầu dò; không làm mesh luôn nổi trên các vật khác.
- Sơ đồ2D cũng chọn theo đoạn thân thực thay vì ép chọn bình hoặc vùng hit lớn đè lên que. Giữ Pointer Events/capture/cancel và thao tác bàn phím.
- Bỏ tên nổi trên mô hình, chữ tên trong SVG và vòng chọn lớn. Giữ tên trong bảng dụng cụ, accessible name, số chỉ và đơn vị trên cân/nhiệt kế.
- Nước dùng mặt trước của mesh kín, opacity0,27, depthWrite=false nhưng depthTest vẫn bật. Que có vật liệu tương phản và tay cầm nhận biết; lòng bình/nước/mẫu vẫn đúng hình học SI. Que2D dùng màu accent: tương phản màu cục bộ khoảng4,22:1 ở sáng và4,02:1 ở tối, chưa phải chứng nhậnWCAG.
- Giao diện dùng trung tính/teal tiết chế, CTA ghi số đo rõ, nhóm chế độ gọn và bỏ hướng dẫn trùng. Nước–đá và vật rắn không còn hai tab ngang hàng trong tiêu đề bài; hoạt động liên quan vẫn mở được từ cuối trang.

## Đặt đúng bài “Nhiệt dung riêng”

- Route mới `#lab/specific-heat` mở hoạt động **vật rắn**, tiêu đề “Nhiệt dung riêng”. Đây là alias của hoạt động trong IDcalorimetry, không tạo ID301.
- SGK lớp12, bài4 “Nhiệt dung riêng”, trang tệp22–25 có CTA “Thực hành: Nhiệt dung riêng”. Ngoài bài này CTA ẩn; VI/EN giữ trang và zoom khi đổi ngôn ngữ trong reader.
- Tìm kiếm hỗ trợ “nhiệt dung riêng”/“specific heat capacity” qua alias trình bày của mục hiện có. Trang mô hình cổ điển có lối mở hoạt động này rõ tên.
- Route cũ `#lab/calorimetry?l3=solid` vẫn dùng cùng phiên lưu với alias mới, không đổi key/schema. Nước–đá còn ở route cũ riêng, không bị gọi là phép đo nhiệt dung riêng vật rắn.
- Không sửa ảnh/trang sách hoặc giả là đã dịch scan; không hứa giữ zoom xuyên điều hướng book→lab→Back, vốn chưa được lưu bởi reader cũ.

## Kiểm thử và nghiệm thu

Các kết quả cuối, source hashes và log ở thư mục `evidence/`. Chỉ dùng các lượt accepted sau bản sửa cuối; các lượt bị dừng để sửa exact-overlap và tương phản2D được giữ trong work/ dưới dạng chẩn đoán, không tính PASS.

Kiểm hồi quy đầu tiên có9PASS/1FAIL do assertion tiêu đề EN cũ đòi chữ “solid”; bài nay có tiêu đề “Specific heat capacity”. Giữ nguyên báo cáo lỗi và recheck riêng toàn bộ luồng locale/theme/lifecycle cho cả hai hoạt động với tiêu đề mới, không sửa runtime để khớp chữ cũ.

Các bộ kiểm gồm: Nodepicking/capture/labels/accessibility; booklesson/search/388pages/85TOC/300IDs; oracle Vật lí hiện có; browser5ca cầm que trực tiếp 2D/3D bằng chuột/cảm ứng giả lập;4ca hai dụng cụ chồng pixel; luồng từ SGK vào lab và reload/route cũ giữ số37,4°C; hồi quy3D/data/camera/locale/fallback/cancel; viewport320–1920 và `npm run check` toàn dự án.

Physics review độc lập xác nhận7tệp physics/geometry/contact/measurement/notebook/protocol không đổi byte. Vòng khuấy vẫn tính từ vị trí sau kiểm va chạm, không lấy thao tác bị chặn để sinh khuấy. Tay cầm mới là affordance đồ họa; không tuyên bố mọi kích thước mesh đều giữ nguyên hoặc có rigidbody tổng quát.

Agent thực gọi: `thermal_lesson88_review` triển khai và kiểm sách/search; `thermal_ui88_review` rà giao diện và chạy ca native overlap; `thermal_physics88_review` rà khoa học và chạy oracle; agent chính tích hợp và kiểm các luồng cuối/phát hành.

| PASS L3 | PARTIAL | NOT TESTED | BLOCKED | Tổng ID |
|---:|---:|---:|---:|---:|
|0|1 — calorimetry|299|0|300|

Chưa nghiệm thu iPhoneSafari/Android thật, giáo viên, P95/FPS phần cứng hoặc WCAG đầy đủ. 3D dùng Chromium/SwiftShader; CDPtouch là giả lập. Không sửa phương trình, khối lượng, nhiệt lượng hay dữ liệu phiên để làm giao diện đẹp hơn.

## Phát hành

Snapshot tài liệu trước commit: chỉ xác nhận kết quả có evidence. CI/Pages và kiểm tra physicslab.tech được ghi vào PR/báo cáo phát hành sau khi có kết quả thực; localPASS không thay deployment.

## Kết quả cuối trước phát hành

- `npm run check`: exit0,750,54giây, manifest nguồn trước/sau ổn định.
- Native grip5/5; lựa chọn dụng cụ chồngpixel4/4; SGK→bài thực hành/phiên cũ1/1; đọc SGK1440/320:2/2; viewport18/18.
- Hồi quy:9PASS trong lượt chính;1assertion tiêu đề cũ được giữ nguyên báo cáo và đã recheckPASS cảlocale/theme/lifecycle trên cùng runtime. Không gọi lượt đầu10/10.
- Security306HTML/501publictextassets vàdiffcheck đạt. Chromium154.0.8037.57/SwiftShader; chưa phần cứng thật.

## Danh sách tệp

- `CODEX_HANDOFF.md`
- `checks/book-thermal-link-v88.mjs`
- `checks/browser-thermal-locale-v88.py`
- `checks/browser-thermal-placement-v88.py`
- `checks/browser-thermal-v88.py`
- `checks/thermal-picking-v88.mjs`
- `dist/app.js`
- `dist/book-reader.js`
- `dist/books-assistant-v79.js`
- `dist/books.html`
- `dist/boot.js`
- `dist/catalog-search.js`
- `dist/index.html`
- `dist/l3/interaction-core.js`
- `dist/l3/thermal-picking.js`
- `dist/l3/thermal-pilot.js`
- `dist/l3/thermal-three.css`
- `dist/l3/thermal-three.js`
- `dist/l3/thermal-view.js`
- `dist/l3/thermal.css`
- `docs/level3-v88/IMPLEMENTATION_REPORT.md`
- `docs/level3-v88/evidence/after-2d.png`
- `docs/level3-v88/evidence/after-desktop.png`
- `docs/level3-v88/evidence/after-mobile390.png`
- `docs/level3-v88/evidence/before-immersed-rod.png`
- `docs/level3-v88/evidence/book-lesson-mobile320.png`
- `docs/level3-v88/evidence/browser-before.json`
- `docs/level3-v88/evidence/browser-book.json`
- `docs/level3-v88/evidence/browser-grip.json`
- `docs/level3-v88/evidence/browser-locale-recheck.json`
- `docs/level3-v88/evidence/browser-overlap.json`
- `docs/level3-v88/evidence/browser-placement.json`
- `docs/level3-v88/evidence/browser-regression-original.json`
- `docs/level3-v88/evidence/browser-viewports.json`
- `docs/level3-v88/evidence/npm-check-final.json`
- `docs/level3-v88/evidence/npm-check-final.log`
- `docs/level3-v88/evidence/verification-summary.json`
- `package.json`
