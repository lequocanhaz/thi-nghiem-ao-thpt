# Khả năng truy cập và tương thích UI v82

Ngày 12/11/2026 (UTC+7). Tiếp tục đặc tả UI/UX của chủ dự án từ main `4ded103`; đợt này xử lý các lỗi đã tái hiện ở bảng số liệu và ngữ nghĩa điều khiển. Không thay mô hình, phương trình, bảng giá trị, phiên thí nghiệm, backend hoặc lưu trữ hội thoại.

## Phát hiện và bản sửa

- `dist/accessibility-v82.css:2`–`10`: tiêu đề bảng tối trước sửa dùng chữ `#ececec` trên nền sáng `#f4f7fb`, tương phản **1,09:1**. Ghép nền/chữ cho bảng, tiêu đề, cột đầu cố định, nút và dòng đang chọn theo từng giao diện. Sau sửa, tiêu đề/cột đầu đạt **14,42:1 sáng / 11,17:1 tối**; dòng chọn/nút đạt **10,83:1 sáng / 9,94:1 tối**. Các số này đo từ computed style của bảng Franck–Hertz 24 dòng trong Chromium; không suy rộng ra mọi chữ trong website.
- `dist/app.js:302`, `dist/app.js:345`: bộ chọn `[data-electric-mode]` trước đây bắt cả `#graphOptions`, vốn dùng cùng thuộc tính để cache chế độ. Giới hạn cập nhật trạng thái vào `button[data-electric-mode]`; giữ cache và hoạt động của bốn nút. Vùng không tương tác không còn nhận `aria-pressed`.
- `dist/app.js:307`: vùng cuộn bảng đã có tên và `tabindex`; bổ sung `role="region"` để tên được hỗ trợ trong cây truy cập. Giữ bảng HTML và cách cuộn native.
- `dist/accessibility-v82.css:16`, `dist/accessibility-v82.css:20`: Firefox giúp tái hiện hai trạng thái trước đó chưa kiểm đủ: thông báo renderer dự phòng và thông báo khôi phục dòng có chữ sáng trên nền sáng khi dùng giao diện tối (**1,07:1 / 1,06:1**). Ghép cặp màu riêng cho cảnh báo, hai nút của cảnh báo và thông báo dòng chọn. Đo lại trên Firefox thực chạy: cảnh báo/nút **9,00:1 sáng / 10,11:1 tối**; thông báo dòng chọn **10,08:1 sáng / 9,46:1 tối**. Giữ thuộc tính hidden và hành vi khôi phục số liệu.
- `checks/dom.mjs:306`: kiểm hành vi qua đổi chế độ và khôi phục phiên, xác nhận nút đang chọn có trạng thái đúng, vùng đồ thị không nhận trạng thái nút và bảng có region được đặt tên.

CSS chỉ áp dụng bảng, cảnh báo renderer và thông báo dòng chọn trong `.lab`; giữ màu mô hình và số đọc khoa học. Dòng chọn còn có chữ đậm/viền, cùng đường viền hệ thống trong forced-colors. `index.html` nạp stylesheet cuối và entry `boot/app` dùng query v82. Kiểm bảo toàn banner chỉ bỏ qua đúng stylesheet mới khi chuẩn hóa; không đổi hash gốc.

## Cách kiểm chứng

Agent `ui` kiểm độc lập bảng 24 dòng ở sáng/tối: mục tiêu chọn dòng tối thiểu 44px, ArrowRight cuộn ngang 40px, focus bàn phím có viền 3px. Ảnh sáng/tối được rà soát trực tiếp; axe không còn báo lỗi tương phản ở bảng. Các mục axe `incomplete` được giữ riêng.

Agent `qa` dùng `checks/browser-accessibility-v82.py` để lấy kết quả axe-core 4.10.3 trên các trạng thái thật của UI: trang chủ, thư viện, thông số, dữ liệu, nhiệm vụ, kệ sách, trang đọc, đăng nhập, hồ sơ, AI và hộp bảo vệ điều hướng; cả sáng và tối. Firebase SDK/AI được thay bằng fixture, không ghi tài khoản hoặc gọi inference thật.

Harness cần Playwright và axe ngoài cây nguồn; truyền `--axe-path` hoặc `AXE_CORE_PATH`. Ví dụ sau khi tải gói chính thức `axe-core@4.10.3` vào thư mục làm việc riêng:

```sh
python3 checks/browser-accessibility-v82.py --axe-path /absolute/path/to/axe.min.js --engine chromium
```

Chromium dùng `/usr/bin/chromium`; Firefox/WebKit dùng browser do Playwright cài và có thể chọn bằng `PLAYWRIGHT_BROWSERS_PATH`. Không commit browser, thư viện hệ điều hành, axe hoặc báo cáo tạm. Bộ quy tắc bổ sung được đọc từ [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md), đối chiếu ngữ nghĩa HTML, focus, thao tác bàn phím và màu sáng/tối; đây là hướng dẫn rà soát, không phải bằng chứng nghiệm thu.

## Giới hạn và việc còn mở

- Axe tự động không chứng nhận WCAG AA toàn trang. Chữ SVG ngắn, nền ảnh/video và các lớp phủ có kết quả cần kiểm thủ công; không chuyển `incomplete` thành `pass`.
- `dist/books.html:28` (`#bookToolbar`) và `dist/views.js:28` (`.banner-model-links`) có tên ARIA trên div chưa có role hỗ trợ tên: cần rà soát ngữ nghĩa nhóm/điều hướng ở đợt tiếp. Đây là mục `incomplete`, không được che bằng tắt quy tắc.
- `#openAccount` có `aria-controls` trỏ tới dialog tồn tại nhưng đang đóng; axe yêu cầu kiểm thủ công khi dialog không hiện. Không xóa quan hệ điều khiển chỉ để làm sạch báo cáo.
- Browser engine headless với viewport mô phỏng chưa chứng minh thao tác trên iPhone/Android, Safari thật, trình đọc màn hình hoặc bàn phím ảo. Không nghiệm thu Google OAuth/Firebase production bằng fixture.

## Kết quả kiểm tra trình duyệt

Mỗi engine phủ 24 trạng thái: 11 màn hình ở hai giao diện, cộng luồng điện bằng bàn phím ở sáng/tối. Luồng điện dùng Space/Enter chọn chế độ, ghi hai dòng, chọn lại từng dòng, kiểm đúng chế độ và giữ nguyên số liệu/focus.

| Engine chạy thật | Lượt đầu | Kiểm lại sau sửa/ổn định bố cục |
|---|---|---|
| Chromium 156.0.8078.79 | 18 ca sạch, 6 ca hết thời gian chờ thao tác; không có lỗi axe hay JS ở các ca đã chạy audit | 8/8 ca mục tiêu đạt với native click/keypress, gồm cả 6 ca trước đó lỗi |
| Firefox 153.0 | 20 ca sạch, 4 ca có lỗi tương phản ở rendererNotice/selectedState | 4/4 ca bị ảnh hưởng đạt sau sửa CSS |
| WebKit 26.5 | 24/24 ca sạch, không có lỗi JS | Không cần chạy lại các ca không bị ảnh hưởng |

Lỗi Chromium ban đầu được giữ nguyên trong artifact; probe ghi nhận vùng controls dịch 69px lúc thông báo renderer xuất hiện rồi ổn định. Harness chờ font và mẫu hình chữ nhật thực ổn định trong thời gian hữu hạn trước khi thao tác. Lượt kiểm lại chạy tuần tự sau khi đóng hai engine khác, giữ điều kiện actionability của Playwright; không force-click. Việc kiểm lại thành công không chứng minh đầy đủ nguyên nhân của mọi timeout ban đầu.

Nguồn kết quả tại workspace: `work/a11y-v82/final-{chromium,firefox,webkit}/report.json`, `chromium-sequential-recheck/report.json`, `firefox-final-recheck/report.json`; phép đo/ảnh UI ở `work/a11y-ui82/`. Các kết quả incomplete, DOM/ARIA snapshot và phân loại thủ công được giữ riêng trong `manual-review-classification.json` và `manual-dom-review.json`. Agent ui/qa thực sự được gọi theo AGENTS; không sửa sách hoặc AI runtime trong đợt này, nên không gọi agent textbook/ai cho việc triển khai.

Tổng hợp có provenance ở `work/a11y-v82/report.json`: **72 trạng thái cuối không có vi phạm axe tự động hoặc lỗi JS**, sau các lượt kiểm lại nêu trên. Còn 126 lần xuất hiện quy tắc `incomplete` lặp lại giữa các trang/theme/engine; đó không phải 126 lỗi độc lập và không được tính là đã đạt kiểm thủ công.

## Kiểm tra trước phát hành

`npm run check` hoàn tất exit 0 trên Node 24.22.1; các assertion DOM mới đã đi qua cùng luồng đổi chế độ/khôi phục phiên. `node checks/site-security-v63.mjs` và `git diff --check` đạt. Các báo cáo audit sinh tự động được khôi phục, không đưa vào commit; KaTeX và thư mục work không được xuất bản từ git. Đã fetch main trước khi phát hành. Trạng thái triển khai thực tế xem [workflow Pages](https://github.com/lequocanhaz/thi-nghiem-ao-thpt/actions/workflows/pages.yml).
