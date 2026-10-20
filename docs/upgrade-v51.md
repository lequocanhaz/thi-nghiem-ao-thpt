# Nâng cấp v51 — danh mục và phân tích Điện trường

## A. Hiện trạng và phạm vi

Đợt này hoàn thành một nhóm thay đổi có thể kiểm chứng, không thiết kế lại toàn bộ website. Giữ frontend buildless, 300 ID và tên/đường dẫn, 300 bài soạn, mô hình và công thức, 388 trang sách, 85 mục lục bài học, 301 tệp âm thanh, dữ liệu phiên và backend AI.

Các lỗi/thiếu sót đã tái hiện trước khi sửa:

- Bộ lọc đưa ra Hóa/Sinh và ba bộ sách trong khi danh mục chỉ có Vật lí và chưa có mapping bộ sách được đối chiếu.
- Trục tung đồ thị `electric` chỉ ghi N hoặc N/C; bảng phân tích dùng nhãn “Độ lớn” và có thể khớp lẫn dữ liệu F với E của nhiều chế độ.
- Ở chế độ điện trường điểm, thay thông số điện tích thử không tham gia mô hình làm điểm đo cũ biến mất khỏi lớp điểm so sánh.
- Chưa có dạng khớp nghịch đảo bình phương; kiểm thử `checks/research.mjs` tồn tại nhưng chưa được gọi bởi lệnh CI chính.

## B. Thay đổi và tệp

| Tệp | Thay đổi |
| --- | --- |
| `dist/catalog-filters.js`, `dist/views.js` | Suy ra lựa chọn từ bản ghi thật; ẩn selector không cần thiết. Giữ từ vựng URL cũ, chip bỏ bộ lọc và thông tin phạm vi. Chỉ sửa vùng dưới banner. |
| `dist/electric-analysis.js` | Nhận diện chế độ từ snapshot hoặc nhãn trong bảng cũ; kiểm tra đơn vị; cung cấp nhãn F/E cho trục và selector. Không đoán chế độ của dữ liệu thiếu thông tin. |
| `dist/analytics.js`, `dist/graphs.js`, `dist/app.js` | Cách li số liệu theo chế độ khi vẽ/khớp; giữ index dòng gốc, toàn bộ bảng và CSV. Báo số dòng không đưa lên đồ thị. Nhãn F (N), E (N/C); tham số không tham gia mô hình không làm ẩn điểm đã ghi. |
| `dist/research.js` | Thêm `inverseSquare`: hồi quy y theo 1/x², hệ số chặn, phần dư, R², RMSE và SE như các mô hình cũ; loại x=0 và ngắt đường tại kỳ dị. Nêu điều kiện áp dụng. |
| `dist/boot.js`, `dist/index.html`, các import liên quan | Chỉ cập nhật chuỗi cache cho module thay đổi; không thay startup hoặc hành vi banner. |
| `checks/*v51*`, `checks/research.mjs`, `checks/dom.mjs`, `checks/startup-library-v49.mjs`, `package.json` | Thêm bảo toàn SHA-256, kiểm thử số học độc lập, dòng đo đa chế độ/phiên cũ, UI DOM, URL cũ và đưa kiểm tra phân tích vào CI. |

## C. Thí nghiệm cụ thể

Chỉ `electric` được cải tiến và kiểm tra sâu trong đợt này, gồm bốn chế độ: Lực Coulomb, Điện trường điểm, Tổng hợp lực, Tổng hợp điện trường. Phép khớp mới dùng chung có thể chọn ở bài khác, nhưng điều đó không có nghĩa 300 bài đã được thẩm định khoa học.

Không sửa `models.js`, `physics.js`, `measurements.js`, các scientific catalog hoặc nội dung bài soạn. Không gắn thêm số bài/tiết SGK khi chưa đối chiếu.

Hoạt động kiểm tra dành cho giáo viên/học sinh:

1. Lưu dự đoán: nếu đổi dấu điện tích thử, E tại một điểm có đổi chiều không? Phân biệt E của nguồn và F tác dụng lên điện tích thử.
2. Chọn Điện trường điểm; giữ q₁, đặt đầu dò ở các khoảng cách hợp lệ. Chủ động ghi tối thiểu bốn dòng. Không dùng vùng loại trừ gần nguồn (r < 0,012 m).
3. Trong Phân tích, chọn Trạng thái đã ghi, x = r₁, y = E (N/C), bật Khớp mô hình và chọn Nghịch đảo bình phương. Đối chiếu hệ số a với k|Q|, đơn vị N·m²/C; b lý tưởng gần 0. Đây là hồi quy theo 1/r² với đồ thị hiển thị theo r.
4. Đối chiếu với chế độ Lực Coulomb: thay dấu điện tích chịu lực làm F đổi chiều, độ lớn không đổi nếu chỉ đổi dấu. Giữ cả hai điện tích khi khảo sát F theo khoảng cách.
5. Giải thích tại sao không mặc định áp dụng quan hệ một nguồn cho tổng hợp nhiều nguồn; chỉ ra điều kiện nguồn điểm, điện môi và miền hợp lệ.

Tiêu chí sư phạm cần đánh giá độc lập: tự xác định biến khảo sát/biến kiểm soát; tự tạo bảng đo; đọc hệ số và phần dư; phát hiện giới hạn mô hình; kết luận bằng bằng chứng thay vì chỉ nhắc công thức. **Chưa kiểm chứng bằng thực nghiệm sư phạm.**

Nguyên lý được đối chiếu với [OpenStax — Coulomb’s Law](https://openstax.org/books/university-physics-volume-2/pages/5-3-coulombs-law) và [OpenStax — Electric Field](https://openstax.org/books/university-physics-volume-2/pages/5-4-electric-field). Đây không phải xác nhận thực nghiệm của website.

## D. Hiệu suất

`checks/performance-v51.json` ghi phép đo CPU Node v24.22.0/Linux x64: 9 lượt × 3.000 lần `graphFor(electric, mode=1)`, làm nóng 1.000 lần, luân phiên trước/sau trong cùng tiến trình. Trung vị trước 0,03137 ms/lần; sau 0,03302 ms/lần. Máy dùng chung có dao động; không tuyên bố tăng tốc hay đạt mục tiêu hiệu năng.

Không có kết quả FPS, LCP, CLS, GPU, bộ nhớ trình duyệt hoặc benchmark thiết bị thật. Không tối ưu banner.

## E. Kiểm thử và giới hạn

Môi trường: Node.js v24.22.0, LinkeDOM, kiểm tra số học/SVG/CSS và hình học CPU. `npm ci --ignore-scripts --offline` thành công; cài KaTeX qua npm gặp metadata cache thiếu khi mạng bị chặn. Đã khôi phục đúng KaTeX 0.16.45 từ tarball cache npm, kiểm tra SHA-512 trước khi giải nén vào `node_modules`. Không đưa gói sinh cục bộ vào Git.

Lệnh kiểm tra chính là `npm run check` (31 lệnh con sau bổ sung). Kiểm tra riêng: `node checks/banner-preservation-v51.mjs`, `node checks/electric-analysis-v51.mjs`, `node checks/research.mjs`, `node checks/dom.mjs`, `node checks/startup-library-v49.mjs`, `node checks/library-v39.mjs`.

Kiểm tra số học Điện trường dùng giá trị tham chiếu literal tại r = 0,05; 0,1; 0,2; 0,4 m, Q = 4 nC, kiểm tra độc lập hệ số E và Coulomb, dấu, đơn vị, miền nguồn, kỳ dị và loại mô hình sai. Kiểm tra DOM thao tác bốn chế độ, bảng/CSV không mất dòng, trục cập nhật, khớp 1/r² và điều hướng lưu lại dữ liệu.

Kết quả cục bộ: 30/31 lệnh con đạt, 359 dòng PASS, đủ 300 tuyến DOM, không có AssertionError. Lệnh cuối `server/gemini-relay/test.mjs` bị `listen EPERM 127.0.0.1` vì môi trường cấm mở cổng. Bản gốc trong checkout cách ly cũng lỗi đúng vị trí này (355 dòng PASS). 216 cảnh báo font metrics KaTeX giống baseline. Giữ nguyên relay test; cần CI trên GitHub xác nhận đầy đủ trước khi đưa lên main. Trạng thái CI/triển khai được cập nhật trong báo cáo bàn giao của phiên. Không có trình duyệt Chromium/Safari hoặc công cụ browser QA khả dụng trong môi trường này; truy cập URL Pages qua công cụ đọc web cũng không thành công. Không có ảnh desktop/mobile trước/sau hay kiểm tra autoplay/iPhone thật. CSS cascade/viewport CPU và sự kiện cảm ứng tổng hợp không thay thế những kiểm tra đó.

## F. Bảo toàn banner

`checks/banner-preservation-v51.json` ghi SHA-256 trước sửa của MP4, WebM, poster, `banner.js`, toàn bộ `app.css`, `views.js`, `app.js`, `index.html`, `boot.js`. Bản sao mã trước sửa nằm tại `/tmp/quanh-banner-before/`; checkpoint Git tại `/tmp/quanh-upgrade-20261020`, nhánh `checkpoint/before-upgrade-20261020`, commit `5ebc82b`.

`checks/banner-preservation-v51.mjs` bắt buộc toàn byte video/poster/playback/CSS không đổi; khối banner HTML và các dòng tích hợp banner (mount/dispose/routing/fullscreen) không đổi. Entrypoint chỉ được khác phiên bản query cache. Hash khối banner: `46908b1168de4237f17b86528f05e1f761d7e48534a87395a0eff9eeee25d769`.

Kiểm tra thêm hash cây sách, âm thanh, bài soạn, thương hiệu, font và tập 300 ID. Mã/tài nguyên không đổi không tự chứng minh trải nghiệm video desktop/mobile đã được xác minh trên trình duyệt.

## G. Phần chưa hoàn thành

- P0/P4: kiểm tra banner và luồng tương tác trên trình duyệt thật, iPhone/Safari, xoay màn hình, bàn phím và pinch/zoom; đo LCP/CLS/FPS/bộ nhớ trước/sau.
- P1: thiết kế sâu trang chủ ngoài banner và không gian phòng lab; đợt này chỉ giảm bộ lọc vô ích và làm rõ dữ liệu/đồ thị.
- P2: rà soát sâu các bài điện thế, điện trường đều, đường sức, tụ điện tĩnh/điện môi và RC; bổ sung xuất PNG riêng đồ thị. Đối chiếu số bài SGK trước gắn nhãn.
- P3: hoàn thiện tiến trình năm giai đoạn theo từng bài, thêm nhiệm vụ ngộ nhận vào bài soạn cụ thể và nâng cấp chiến lược gia sư AI. Không thay backend hoặc khóa trong đợt này.
- Báo cáo HTML ở nhánh công cụ cũ còn mô tả trục bằng header “Độ lớn”; SVG đã ghi đúng F/E. Công cụ A/B đã gỡ khỏi UI còn mã tiềm ẩn, chưa được xác minh toàn bộ.
- Kiểm chứng sư phạm với học sinh/giáo viên thật và phản biện khoa học độc lập cho toàn danh mục.

## H. Git và điều phối

Workspace gốc ở `develop/multi-agent` (`5ebc82b`); `.git` chỉ đọc. Có tệp `FETCH_HEAD` không theo dõi từ trước, được giữ nguyên và không đưa vào commit. Git shell không phân giải được GitHub; đọc nhánh `main` qua connector xác nhận `9f0c4a4` trước phát hành, có cùng cây mã runtime. Dùng checkout ghi được trong `/tmp` để tạo commit; khi xuất bản phải đọc lại `main` và cập nhật fast-forward với SHA kỳ vọng, không force-push.

Các agent thực sự được gọi: `physics_review` (physics: khớp và kiểm tra khoa học), `ui_review` (ui: bộ lọc và rà soát UX), `qa_review` (qa: kiểm tra đầy đủ/rủi ro). Agent chính nối xử lí biểu đồ, giữ phiên, bảo toàn banner và chịu trách nhiệm phát hành. Không gọi agent sách/AI vì không thay các vùng đó.
