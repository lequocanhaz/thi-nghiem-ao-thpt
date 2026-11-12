# Trang chủ và điều hướng logo v83

Ngày 12/11/2026 (UTC+7), từ main `53baed6`. Chủ dự án báo lỗi giao diện khi bấm logo bên trái, gửi ảnh desktop và xác nhận cả banner quá cao/chữ quá lớn. Đây là yêu cầu sửa hình thức trang chủ hiện tại; không suy từ bộ kiểm axe của v82 rằng màu thương hiệu hoặc bố cục banner đã được nghiệm thu đầy đủ.

## Nguyên nhân và thay đổi

- `dist/app.css:798` giữ màu trắng cho wordmark ở trang chủ từ thiết kế header phủ lên video. Header chung v80 đã chuyển sang nền trắng và nằm trong luồng tài liệu nhưng chưa ghép lại màu wordmark. UI/root/QA đều tái hiện chữ trắng trên trắng **1:1**, cả mở mới và lab/sách → logo. Chữ vẫn có trong DOM và có kích thước bình thường; không phải lỗi tải logo hoặc khởi động JavaScript.
- `dist/header-ui-v80.css`: wordmark và chữ đậm dùng cùng `--header-ink` của header ở cả sáng/tối. Giữ logo SVG, font và nhãn hiện có.
- `dist/header-ui-v80.js`: logo trong app dùng liên kết fragment `#` qua router sẵn có, về trang chủ/đầu trang trong cùng tài liệu. Tránh tải lại header/tài khoản và giữ các Maps hội thoại, draft, ảnh, pending request. Logo ở sách giữ liên kết sang tài liệu trang chủ (`index.html`); bộ bảo vệ hội thoại khi rời tài liệu vẫn hoạt động. Giữ modifier-click và hành vi liên kết native.
- `dist/home-layout-v83.css`: tách phần hình học trang mở đầu theo yêu cầu mới, giảm chiều cao/cỡ chữ; hai hàng vẫn đồng font/cỡ chữ/giãn dòng. Các CTA giữ nguyên văn bản và hành động. Header được đo qua ResizeObserver, hero trừ chiều cao header thực thay vì cộng thêm một header vào banner toàn màn hình. Fullscreen giữ quy tắc riêng. Không sửa ảnh/video, nội dung hai dòng hoặc `banner.js`.
- Entry header CSS/JS ở app/sách dùng query83; stylesheet trang chủ chỉ tải trong index. Bộ bảo toàn banner giữ các hash lịch sử của media/CSS gốc/markup/lifecycle; chỉ chuẩn hóa đúng link stylesheet mới. Thông báo kiểm tra đã nêu rõ hình học v83 là thay đổi được chủ dự án yêu cầu, không gọi banner hoàn toàn không đổi về hình thức.

## Kiểm tra theo trách nhiệm

- Agent ui: tái hiện bằng screenshot/computed style, sửa CSS ghép màu và banner; kiểm typography, hộp nút, bố cục sáng/tối, VI/EN, fullscreen và màn hình thấp. Root xem trực tiếp ảnh đối chiếu ở viewport 1520×824.
- Agent qa: hành trình logo thật từ lab/thư viện/trang chủ lặp/Back/sách, document identity, dữ liệu, trạng thái giao diện và phép đo hình học. Các báo cáo thô trước sửa giữ trong `work/logo-v83-qa/`.
- Agent ai: 3 ca Chromium, gồm lab Ohm tại 390/1440 → logo → bài cũ, giữ thread/draft/ảnh/pending trong cùng tài liệu; phản hồi chờ hoàn tất trong thread gốc và draft thư viện độc lập. Ở sách, logo vẫn hiện guard và “Ở lại” giữ draft/ảnh. Dùng transport fixture, không gọi inference thật hoặc sửa backend.
- Agent textbook: 16 viewstate shelf/reader × sáng/tối × 320/390/768/1440; logo/nav không chồng/cắt, liên kết native về trang chủ. Browser Back giữ trang 25. **Zoom 150% trở về 100% sau điều hướng đổi tài liệu rồi Back** là hành vi đã có (`openBook` đặt zoom=1); không tuyên bố zoom được lưu hoặc sửa schema lưu trữ trong bản này.
- Root: tích hợp link/ResizeObserver/cache, kiểm DOM header (link app, chiều cao header thay đổi, disconnect khi destroy), hồi quy toàn dự án và phát hành.

Các viewport tương ứng ảnh desktop/phóng đại là phép mô phỏng không gian bố cục; không được gọi là Chrome Windows zoom thật hoặc thiết bị cảm ứng thật. Bộ helper tìm kiếm Python của skill UI/UX không có trong workspace; quyết định sửa dựa trên CSS, screenshot và thao tác trình duyệt đã tái hiện. Không thay mô hình hay thông số khoa học, đủ 300 bài, 388 trang sách và 301 tệp âm thanh được giữ bằng các kiểm bảo toàn hiện có.

## Kết quả bản ghép

- Header wordmark sau sửa đạt **16,21:1 sáng / 13,18:1 tối** trong Chromium, thay vì 1:1 trên trang chủ sáng.
- Hình học bình thường: banner desktop tối đa khoảng **680px**, mobile **480px**; cỡ chữ hai hàng trong khoảng **18–64px**, thay vì tối đa 88px. Ở 1520×824, chữ còn 57,68px. Hero tự giãn nếu nội dung cần thêm không gian, nên đây không phải giới hạn cắt nội dung.
- UI kiểm 14 ca VI/EN tại 1920×1200, 1901×1031, 1520×824, 1440×900, 320×568, 390×844 và 844×390: tiêu đề/hai CTA nằm trong màn hình đầu, không tràn ngang. Chữ banner tăng 200% ở 320/390/844×390/1520 vẫn nằm trong banner. Ở 320 EN chữ 200%, banner giãn khoảng 435→479,8px và nút phụ cần cuộn dọc ngắn; không cắt chữ để ép vừa màn hình. Nút fullscreen mobile chuyển lên góc trên, không chồng CTA.
- QA Chromium: **18/18** ca (12 hình học sáng/tối, 4 hành trình app, 2 guard sách), thêm 2 ca phone sau chỉnh CSS cuối. Firefox/WebKit: mỗi engine 4 ca hình học và 4 hành trình đạt qua lượt kiểm lại có nguồn gốc riêng. Chrome giữ document/auth-client identity, email chưa gửi, dòng đo và draft qua logo/Back; nhấn logo trang chủ nhiều lần giữ cùng banner node.

Các lượt Firefox/WebKit ban đầu có assertion sai vì nút phụ đổi hợp lệ từ “Bắt đầu khảo sát” sang “Tiếp tục bài gần nhất” sau khi ghé Ohm. Harness hiện kiểm CTA chính giữ nguyên và CTA phụ trỏ tới Ohm thật. Firefox headless còn ghi lỗi tạo WebGL2 rồi dùng fallback; các luồng điều hướng kiểm lại chọn chế độ `diagram` vốn có trong profile thử nghiệm. Không thay renderer runtime hoặc coi đây là nghiệm thu GPU/3D. Giữ raw reports và các lượt kiểm lại trong `work/logo-v83-qa/`.

QA tổng hợp **34/34 trường hợp cuối đạt** tại `work/logo-v83-qa/final-report.json`, có provenance cho từng ca được kiểm lại. Hai ca phone sau CSS cuối là kiểm bổ sung, không cộng lặp vào 34 ca. Hình ảnh/báo cáo UI ở `work/logo-v83-ui/`, AI ở `work/logo-v83-ai/`, sách ở `work/logo-v83-textbook/`.

`npm run check` hoàn tất exit0 trên Node24; `site-security-v63`, DOM header, bảo toàn banner và `git diff --check` đạt. Các audit JSON sinh tạm được khôi phục trước commit; không commit KaTeX/work. Xem [workflow Pages](https://github.com/lequocanhaz/thi-nghiem-ao-thpt/actions/workflows/pages.yml) để biết kết quả triển khai thực tế.
