# Bàn giao Quanh Lab sang Codex

Ngày bàn giao: 19/10/2026. Chủ dự án: Lê Quốc Anh. Giao tiếp bằng tiếng Việt.

## Mở đúng dự án

- Kho: https://github.com/lequocanhaz/thi-nghiem-ao-thpt
- Web: https://lequocanhaz.github.io/thi-nghiem-ao-thpt/
- Nhánh chính: `main`. Luôn fetch và đọc HEAD hiện tại; nhiều cuộc trò chuyện đã cùng cập nhật kho này.
- Mốc mã khi chuẩn bị tài liệu: `7de7eb68d62f1331f6a90fa1ab0335554d3a8ec8` (v48). Đây là mốc tham chiếu, không phải yêu cầu quay lui.
- GitHub Actions của mốc này: https://github.com/lequocanhaz/thi-nghiem-ao-thpt/actions/runs/39233531587 — đã thành công cả kiểm tra và triển khai.
- Bản sửa zoom/sách/không gian trước đó: `965aa59ca1f669e7fc76c0aeadf75d1a442e9135`, workflow 39219250860 cũng đã thành công.
- v45 từng đổi ảnh xem trước 300 bài, sau đó người dùng yêu cầu trả lại. Commit `22ac5d4` đã hoàn tác v45. Không tự khôi phục bộ ảnh đó.

## Chạy trên máy hoặc môi trường Codex

Dự án dùng HTML/CSS/JavaScript ES modules và Three.js, không phải React/Vite. `dist/` chính là mã nguồn frontend đang phát hành, không phải thư mục build có thể xóa rồi sinh lại.

Dùng Node.js 24, giống CI:

```sh
npm ci --ignore-scripts
npm install --ignore-scripts --no-save --package-lock=false katex@0.16.45
```

KaTeX không nằm sẵn trong mã nguồn. CI đóng gói JavaScript/CSS/font từ gói đã ghim vào `dist/vendor/katex/` khi triển khai. Khi cần xem giao diện trên môi trường riêng, chuẩn bị tương tự:

```sh
mkdir -p dist/vendor/katex/fonts
cp node_modules/katex/dist/katex.min.js dist/vendor/katex/katex.min.js
cp node_modules/katex/dist/katex.min.css dist/vendor/katex/katex.min.css
cp -R node_modules/katex/dist/fonts/. dist/vendor/katex/fonts/
```

Có thể phục vụ static `dist/` bằng HTTP, ví dụ `python3 -m http.server 4173 --directory dist`, nếu môi trường làm việc cho phép xem trước. Không mở ES modules bằng `file://`. Việc khởi động server không tự chứng minh đã kiểm tra trình duyệt.

Kiểm tra chính:

```sh
npm run check
```

Bộ kiểm tra mất vài phút, gồm sách, thao tác cảm ứng mô phỏng, hình học/camera của 300 bài, CSS/DOM, LaTeX, tương tác, trợ lý và backend fixtures. Xem `package.json` để chạy các nhóm kiểm tra phù hợp khi chỉ sửa một phần.

## Các tệp cần biết

| Khu vực | Tệp |
| --- | --- |
| Khởi động và trạng thái app | `dist/index.html`, `dist/boot.js`, `dist/app.js` |
| Bố cục và giao diện | `dist/views.js`, `dist/app.css` |
| Danh mục 300 bài | `dist/experiments.js`, các catalog và model modules trong `dist/` |
| Công thức/số liệu | `dist/models.js`, `dist/physics.js`, `dist/measurements.js`, các catalog khoa học |
| Dựng mô hình/camera | `dist/scene3d.js`, `dist/software-scene.js`, `dist/camera-fit.js` |
| Không gian và ray xe | `dist/model-workspace.js`, `dist/simulation-space.js`, `dist/track-layout.js` |
| Trục/tỉ lệ đo | `dist/coordinates.js` |
| Mô hình mở rộng | `dist/extended-scenes.js`, `dist/discovery-scenes.js` và các module atlas |
| Đọc sách | `dist/books.html`, `dist/books.css`, `dist/book-reader.js`, `dist/book-touch.js`, `dist/book-model.js` |
| Dữ liệu/trang sách | `dist/books/catalog.json`, `dist/books/10/`, `11/`, `12/` |
| Nguồn mục lục | `sources/textbook-lessons-v44.json`, `scripts/build-books.py` |
| Công thức LaTeX | `dist/math.js`, `checks/latex-v48.mjs` |
| Trợ lý và cấu hình public | `dist/assistant.js`, `dist/ai-config.js` |
| Backend trợ lý riêng | `server/`, đọc `server/README.md` và các tài liệu trong đó trước khi thay đổi |
| Xuất bản | `.github/workflows/pages.yml` |

## Yêu cầu và trạng thái đã triển khai

1. **Banner:** hố đen chuyển động liên tục phủ kín màn hình đầu trang, tiêu đề “Thí nghiệm Vật Lí”. Không tự thêm lại ghi chú kỹ thuật, nguồn NASA, nút bật/tắt chuyển động vào giao diện. Nguồn/credit vẫn được giữ trong tài liệu tài nguyên.
2. **Toàn bộ 300 bài:** giữ chạy/dừng, tham số, 2D/3D, ghi số liệu, đồ thị và tương tác thực sự. Không sửa một vài ví dụ rồi kết luận cả danh mục đã đạt. Không tự đổi phương trình hoặc thang đo chỉ để hình trông vừa khung.
3. **Không gian:** studio rộng 10 lần ban đầu; có “Không gian ×10”, “Vừa mô hình” và zoom. Đã mở ray và trục theo toàn hành trình xe thay vì cuộn/wrap/clamp vị trí vật.
4. **Lỗi v43 và sửa v44:** camera từng tự căn lại trong lúc chạy, ghi đè zoom. Hiện thao tác zoom/pan/góc nhìn thủ công được giữ qua chạy/dừng; nút Vừa mô hình bật lại căn tự động. Không phục hồi điều kiện ép fit khi `playing` bất chấp `autoFrame=false`.
5. **Lỗi sóng xuyên mặt bàn:** người dùng gửi ảnh sóng có biên độ lớn, nửa âm đi xuyên mặt bàn nhỏ cũ. v44 thay mặt bàn trang trí cũ bằng mặt đỡ chung nằm dưới vùng mô hình/trục; sàn và lưới studio cũng nằm dưới đó. Áp dụng qua wrapper chung cho mọi thí nghiệm. Xem `docs/zoom-books-space-v44.md`. Đây là thay đổi dựng hình, không thay số liệu hoặc gốc vật lí.
6. **Sách:** đủ 388 trang gốc của ba sách Vật lí 10/11/12 Kết nối tri thức. Lớp 11/12 là bản mẫu theo tài liệu được cung cấp. Lật bằng kéo ngang, kéo ngắn trả lại, kéo dọc cuộn, nhiều ngón hủy lật, khi zoom thì pan. Có một/hai trang, nhớ vị trí, lỗi ảnh và thử lại.
7. **Mục lục:** có tên từng bài dưới nhóm chương, đủ 34 + 26 + 25 = 85 bài. Mỗi bài mở đúng trang đầu theo số trang file, hiển thị số trang in. Không thay bằng danh sách trang vô danh. Tránh mất dữ liệu bài học khi chạy lại script sinh sách.
8. **Tiêu đề:** các tiêu đề chính trang chủ dùng `.home-section-title` chung để bằng cỡ chữ ở cùng viewport; giữ cấp bậc riêng cho hero và tiêu đề thẻ.
9. **Nền mô hình v47:** người dùng yêu cầu tối hơn một chút để thấy dụng cụ; đã có ở main. Không đổi thành đen toàn bộ hoặc hoàn tác khi sửa vấn đề khác.
10. **LaTeX v48:** công thức trên web và trợ lý hiển thị dạng phân số xếp tầng, dùng KaTeX tự phục vụ. Giữ xử lí văn bản/HTML an toàn và kiểm tra đủ 300 công thức. Các tài nguyên KaTeX được tạo ở bước deploy, không tự coi là tệp nguồn bị thiếu rồi gỡ tính năng.

## Kiểm tra nào đã có và việc còn cần xác nhận

v44 đã qua `npm run check`: 61.200 khung chạy của 300 bài, 17.185 khung kiểm tra cả ray xe, cả 2D/3D, kiểm tra zoom giữ nguyên khi chạy, kiểm tra mặt đỡ không lấn mô hình, điều hướng 85 bài sách, thao tác cảm ứng giả lập và so sánh cỡ chữ qua 22 độ rộng. v48 tiếp tục có CI thành công, gồm kiểm tra LaTeX mới.

**Các phép thử Node/DOM/hình học CPU không chứng minh hiển thị WebGL trên trình duyệt hay iPhone/Safari thật.** Bản sửa gần đây chưa được xác nhận trực quan bởi người dùng sau triển khai. Ưu tiên tiếp theo nếu được yêu cầu tiếp tục sửa: kiểm tra thực tế zoom, model/axis clipping, sóng biên độ tối đa, xe chạy toàn hành trình, thanh công cụ/khung hiển thị, vuốt sách và xoay màn hình ở kích thước điện thoại. Ghi rõ trình duyệt/thiết bị và thao tác nào đã thử; không gọi viewport giả lập là iPhone thật.

Ảnh người dùng từng gửi:

- `image(9).png`: Chọn lớp học/Sách giáo khoa/Thư viện thí nghiệm có cỡ tiêu đề khác nhau.
- `image(10).png`: phần âm của sóng xuyên xuống mặt bàn cũ.

Hai ảnh gốc và các PDF tải lên không mặc định được chuyển sang checkout mới. Nội dung trang sách đã render và mục lục nằm trong git. Nếu cần đối chiếu tài liệu gốc/ảnh gốc, đề nghị người dùng đính kèm đúng tệp cần thiết; không dùng đường dẫn scratch cũ và không chèn thông báo “Codex could not read...” vào sản phẩm.

## Triển khai và giữ dữ liệu

- Giữ nguyên kho và GitHub Pages hiện tại. Đẩy main kích hoạt kiểm tra rồi deploy `dist/`; chờ trạng thái thành công trước khi báo đã lên web.
- Khi chỉ tạo tài liệu bàn giao có thể dùng commit `[skip ci]`; điều này không xuất bản runtime mới.
- Trước khi đẩy: fetch main, xem diff, không force-push ghi đè thay đổi từ phiên khác. Không reset cứng hoặc xóa tệp lạ khi chưa biết chủ sở hữu.
- Có query version trên module/CSS: cập nhật chuỗi import từ entrypoint đến module thay đổi để tránh cache cũ, đồng thời giữ URL tài nguyên ổn định nếu chúng không đổi.
- Dữ liệu tiến độ/phiên thí nghiệm lưu trong trình duyệt không nằm trong git. Giữ tương thích cơ chế xuất/nhập và localStorage; không xóa dữ liệu người dùng để chữa lỗi giao diện.
- Backend AI là dịch vụ riêng với endpoint public tại `dist/ai-config.js`; triển khai GitHub Pages không tự triển khai backend hay chuyển khóa API. Không đưa khóa vào frontend, git hoặc chat. Nếu thay backend, xác minh quyền truy cập và cấu hình hiện có trước.
- Người dùng ưu tiên làm trực tiếp, tránh hỏi xác nhận lặp lại cho việc đã được giao; báo trung thực phần đã làm, đã kiểm tra và phần còn chưa xác nhận. Khi bàn giao thay đổi, cung cấp link toàn bộ mã cuối trong kho.

## Prompt mở đầu để người dùng dán vào Codex

> Tiếp tục dự án Quanh Lab trong repository lequocanhaz/thi-nghiem-ao-thpt. Đọc AGENTS.md, CODEX_HANDOFF.md và trạng thái main mới nhất trước khi làm. Đây là website đang hoạt động; giữ toàn bộ 300 thí nghiệm, sách và các thay đổi hiện có. Trước tiên tóm tắt trạng thái và các giới hạn kiểm tra, xác nhận chạy được các kiểm tra phù hợp. Nếu tôi chưa giao lỗi mới, đừng tự thiết kế lại hoặc triển khai thay đổi giao diện. Khi tôi giao việc, sửa trực tiếp trong kho, kiểm tra phần liên quan và gửi link toàn bộ mã cuối.

## Bài soạn v50 (19/10/2026)

- Có lớp nội dung riêng cho toàn bộ 300 bài trong `dist/lessons/`, không ghi đè phương trình của các scientific catalog. Xem bảng 300 ID ở `docs/lessons-v50.md` và quy tắc mở rộng ở `docs/lesson-authoring.md`.
- Mỗi bài có mục tiêu, giải thích, quy trình, lỗi dễ nhầm, câu hỏi/lời giải riêng, biến thật và nguồn đối chiếu. Bài học chỉ tải khi mở lab; `lesson-loader.js` và `lesson-view.js` giữ nội dung độc lập với phiên đo.
- `references.js` lưu 144 nguồn OpenStax/MIT, ngày truy cập và hash bản đã tải. Nguồn nguyên lý nền không có nghĩa mọi biến thể nâng cao đã được phản biện. Chưa có giáo viên/chuyên gia độc lập ký duyệt toàn bộ hoặc thí điểm lớp học.
- `formulas.js` có LaTeX tường minh cho chín biểu thức cũ lỗi chuyển đổi và sửa ký hiệu hiển thị dãy bi Newton. Không sửa phép tính mô hình để chữa typography.
- `npm run check:lessons` kiểm tra đủ 300 bài, nguồn/biến, KaTeX thật, escape văn bản, lời giải đóng và ví dụ tính độc lập; đã được đưa vào `npm run check`. Bộ Playwright tùy chọn `checks/browser-lessons-v50.mjs` kiểm tra UI thật, ghi chép, lỗi tải và điều hướng.
- Giữ 301 tệp âm thanh cũ; đây là thuyết minh mô hình, chưa phải bản thu mới của toàn bộ bài soạn. Không xóa sách, banner, thương hiệu, LaTeX, accessibility hoặc dữ liệu người dùng khi biên tập tiếp.
