# Kiến trúc và bàn giao Quanh Lab

## Thành phần và quyền sở hữu dữ liệu

`dist/` là mã nguồn frontend đang phát hành, không phải thư mục build có thể xóa. Ứng dụng dùng HTML/CSS/JavaScript ES modules; không cần React hoặc bước bundle để vận hành.

| Thành phần | Trách nhiệm | Không được dùng để sửa |
|---|---|---|
| `index.html`, `boot.js`, `app.js` | Khởi động có fallback, route hash, state, điều khiển và lưu phiên | Không reset localStorage để sửa UI |
| `views.js`, `app.css`, `language-pill.js` | Bố cục, token, điều hướng, component | Không sửa phương trình vì hình không vừa |
| `experiments.js`, các scientific catalog, `models.js`, `physics.js` | ID, tham số và phép tính khoa học | Không suy ra phép tính từ chuỗi dịch/giá trị đã format |
| `lab-loader.js`, `scene3d.js`, các scene module | Tải renderer theo nhu cầu, WebGL và dựng hình | Không dùng vị trí pixel thay số đo vật lí |
| `software-scene.js` | Canvas fallback từ cùng mô hình | Không vô hiệu hóa bài vì thiếu WebGL |
| `camera-fit.js`, `track-layout.js`, `collision-layout.js` | Camera/bao hình học/ánh xạ đồ họa | Không clamp quỹ đạo để che xuyên vật |
| `measurements.js`, `graphs.js`, `analytics.js`, `research.js` | Bảng, đồ thị, khớp và xuất báo cáo | Không sửa dữ liệu đo để làm đẹp đồ thị |
| `lessons/`, `lesson-loader.js`, `lesson-view.js` | Học liệu tải khi mở bài | Không làm mất ghi chép khi tải/đổi ngôn ngữ |
| `i18n.js`, `language-ui.js`, `english-study.js` | Locale, từ điển và lớp học tập EN | Không dịch key tham số/schema phiên |
| `books/`, `book-reader.js`, `book-touch.js` | 388 ảnh trang, 85 bài mục lục, đọc/zoom/vuốt | Không ghi đè bản sách bằng dịch UI |
| `assistant.js`, `ai-config.js`, `server/` | UI chat, endpoint public, backend riêng | Không đặt khóa API trong frontend/git |
| `experiments/*.html`, `about*.html`, `sitemap.xml` | Trang vào có thể đọc không cần JS | Không tạo thêm solver hoặc website mô phỏng khác |

## Luồng chạy

Home chỉ tải catalog và UI; các renderer/Three.js được tải sau khi mở lab. State số học được truyền vào `evaluate`, sau đó cùng kết quả này cấp cho readout, bảng/đồ thị và renderer. Vị trí đồ họa có thể được co giãn để dễ quan sát, nhưng đơn vị và kết quả số giữ trong model. Cộng hưởng dùng một hệ số biểu diễn cho toàn chu kì; collision dùng ánh xạ mặt cản theo cùng tỉ lệ toàn ray.

Render loop, cache nhãn/công thức và các tối ưu điện trường v52 được giữ. Locale EN chỉ dịch node/subtree vừa thay đổi, thay vì duyệt toàn UI mỗi lần readout đổi. Chuyển locale không route/reload hoặc dựng lại canvas/input; nội dung sách gốc và tin nhắn lịch sử được bảo toàn.

## Lưu trữ và dữ liệu người dùng

Các khóa hiện hữu `thpt-lab-v1`, `thpt-ui-v3`, `quanh.locale.v1`, `quanh-visual-v1` giữ schema. Session export/import dùng `thpt.session.v1`; nhập đè chỉ áp dụng sau xác nhận. Lưu cục bộ có thể bị trình duyệt từ chối/xóa, nên chức năng tải bản sao phiên vẫn là cách chuyển dữ liệu giữa thiết bị. Không thêm tài khoản, thanh toán hoặc analytics trong đợt v59.

## Phát triển và xuất bản

1. Đọc `AGENTS.md`, `CODEX_HANDOFF.md`, fetch `origin/main`, kiểm tra working tree trước thay đổi.
2. Node 24: `npm ci --ignore-scripts`; cài KaTeX ghim theo `.github/workflows/pages.yml`.
3. Khi preview, copy KaTeX JS/CSS/fonts vào `dist/vendor/katex/` theo bàn giao. Thư mục này sinh cục bộ/CI, không commit.
4. Phục vụ `dist/` qua HTTP, không mở ESM bằng `file://`.
5. Sau khi đổi catalog, formula hoặc mô tả/giới hạn: `npm run build:discovery`, review diff các trang HTML tĩnh. Generator không sửa catalog.
6. Cập nhật query version từ entrypoint qua các cạnh import đến module sửa, kể cả import động trong `lab-loader.js` và script sách.
7. Chạy `npm run check`; chạy các browser checks phù hợp với HTTP server 4173 và Chromium. Script browser không được tự coi là đã thử Safari/iPhone thật.
8. Làm PR, theo dõi CI, merge khi kiểm tra đạt và nhánh chính chưa có thay đổi xung đột; chờ Pages deploy thành công rồi xác minh tài nguyên live.

Backend AI có hạ tầng/triển khai riêng; đọc `server/README.md`. Xuất bản Pages không triển khai backend hoặc xác nhận provider còn quota. Fixture thành công không chứng minh inference AI thật.

## SEO và domain

300 URL `experiments/<id>.html` có tiêu đề, mô tả, công thức MathML, điều kiện và link vào route lab tương ứng. `sitemap.xml` chứa 305 URL, được liên kết từ trang chủ. Search engine quyết định crawl/index; có sitemap không bảo đảm thứ hạng. Trên URL GitHub Pages chạy dưới project subpath, `robots.txt` tại subpath không điều khiển host. Main đồng thời đã thêm tệp này cho custom-domain root; bản hợp nhất giữ nó, nhưng chỉ xem là cấu hình có hiệu lực khi domain/DNS/HTTPS đã hoạt động.

Bản hợp nhất kế thừa canonical physicslab.tech từ các commit đồng thời trên main; generator đọc canonical đó từ index.html. Trạng thái DNS/HTTPS vẫn chưa nghiệm thu, việc kế thừa không chứng nhận tên miền đã sẵn sàng. Mọi thay đổi domain tiếp theo cần xác minh bản ghi DNS, chứng chỉ HTTPS, Pages và redirect thực tế; không coi cấu hình được kế thừa là bằng chứng này. Không đổi domain chỉ vì trường `cname` đã được thiết lập trong GitHub.

## Ranh giới kiểm chứng

Các oracle độc lập kiểm tập trạng thái hữu hạn;20 mục vẫn PARTIAL. Kiểm geometry CPU không chứng minh WebGL/điểm chạm thực tế. SwiftShader không đại diện hiệu năng GPU điện thoại. Báo cáo phát hành ghi riêng lớp kiểm và các phần chưa nghiệm thu; giữ báo cáo lịch sử và không ghi đè baseline để biến lỗi thành PASS.
