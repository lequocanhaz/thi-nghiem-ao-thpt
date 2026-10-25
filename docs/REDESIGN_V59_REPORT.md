# Quanh Lab — audit và nâng cấp v59

> **Kết quả phát hành cuối — 26/10/2026:** [PR #28](https://github.com/lequocanhaz/thi-nghiem-ao-thpt/pull/28) đã merge, [commit mã phát hành](https://github.com/lequocanhaz/thi-nghiem-ao-thpt/commit/decfbb8555c4e43c7fe817a899297010696d23d6) vượt kiểm tra và [GitHub Pages](https://github.com/lequocanhaz/thi-nghiem-ao-thpt/actions/runs/40246562448) triển khai thành công. [physicslab.tech](https://physicslab.tech/) trả HTTPS 200, DNS Google/Cloudflare đã trả đủ bốn A-record của GitHub Pages và Enforce HTTPS đã bật. Đối chiếu byte: 388/388 tệp phát hành khớp source (gồm 300 trang thí nghiệm và một trang danh mục); hai HTTP 503 ở lượt tải hàng loạt đầu đã được thử lại thành công. Chromium trên website thật đã tìm Ohm, mở canvas, ghi một dòng và đổi EN, 0 pageerror; vẫn là trình duyệt giả lập 390 px, không phải thiết bị thật. Xem [bằng chứng HTTP](redesign-v59/evidence/live-verification.json) và [browser live](redesign-v59/evidence/live-browser.json). Các ghi nhận DNSchưa sẵn sàng bên dưới là lịch sử tại thời điểm audit, **không còn là việc đang chờ**. Agent không thay DNS hoặc gỡ custom domain.

Ngày: 26/10/2026. Mã nền đã fetch: `7e491e0c641dca33ed222b47942b085e728ab590`. Đây là đợt cải tiến trực tiếp website hiện hữu, không phải demo hoặc bản viết lại framework. Nhánh: `feat/quanh-lab-redesign-v59`. Trước phát hành đã fetch và hợp nhất các commit mới đến `7d7b2be` trên main: giữ tiêu đề banner in hoa hai dòng, `banner-title.css`, chuyển domain/robots/SEO và các kiểm tương ứng; không ghi đè thay đổi đồng thời.

## 1. Kết quả audit

HEAD thực tế đã có VI/EN, lớp học tập tiếng Anh cho 300 mô hình và mục lục sách tiếng Anh; các mô tả “chưa gắn i18n” trong bàn giao v54 đã cũ. Audit bắt đầu từ mã hiện tại, đọc `AGENTS.md`, `CODEX_HANDOFF.md`, package/workflow và kiểm số/hình học/trình duyệt. Đã gọi thực tế5 agent: `physics`, `ui`, `textbook`, `ai`, `qa`. Agent chính tích hợp, kiểm lại, bổ sung tìm kiếm/SEO/bảo vệ dữ liệu và chịu trách nhiệm phát hành. Một lượt bổ sung của agent UI bị dừng do hạn mức; agent chính tiếp quản các kiểm tra desktop và bàn phím còn lại.

Không phát hiện P0 trong runtime được kiểm. Có P0 hạ tầng: URL GitHub Pages hiện chuyển hướng 301 sang tên miền chưa có DNS/HTTPS; đã khắc phục ở cấu hình ngoài patch khi kiểm lại DNS/HTTPS cuối; xem cập nhật phát hành ở đầu báo cáo. Điều này không chứng nhận toàn bộ sản phẩm không còn lỗi.

| Mức | Lỗi thực tế | Xử lý |
|---|---|---|
| P0 | URL GitHub Pages chuyển 301 sang tên miền chưa có DNS/HTTPS | Phát hiện bằng GET không cache và DNS công khai; đã nêu lựa chọn khôi phục URL cũ hoặc sửa DNS; đã kiểm lại DNS/HTTPS và website hoạt động; không cần gỡ custom domain |
| P1 | Xóa bảng đo ngay khi bấm; nhập phiên ghi đè thông số/bảng/ghi chép không xác nhận | Dialog nêu số dòng và hậu quả, mặc định giữ dữ liệu, có tải bản sao; chỉ thay sau xác nhận |
| P1 | Hai xe khối lượng lớn xuyên nhau tại va chạm dù dữ liệu số đúng | Mặt cản cùng cao, chassis cùng kích thước, tải riêng theo m; ánh xạ hình học và ray đồng nhất |
| P1 | Vuốt sách bị hủy khi ảnh chuyển implicit pointer capture sang vùng đọc | Chỉ xử lý lostpointercapture của chính stage; kiểm sự kiện độc lập và CDP touch |
| P2 | Cộng hưởng cắt li độ hình vẽ, làm vật đứng giả ở biên | Một hệ số hiển thị theo A cho toàn chu kì; giữ waveform và toàn bộ số đo |
| P2 | Header mobile nhiều hàng, nút locale nhỏ, công cụ che mô hình | Header hai hàng, locale 44 px, công cụ ngoài hình; ưu tiên vùng quan sát trên mobile |
| P2 | Dãy điều khiển desktop chiếm nhiều hàng | Gọn dãy điều khiển ở chiều rộng đủ lớn, giữ các chức năng truy cập được |
| P2 | Nhiều bộ lọc phơi ra ngay; Back đi qua từng ký tự tìm kiếm | Bộ lọc nâng cao mở dần; coalescing lịch sử trong một lượt nhập |
| P2 | Tìm kiếm thiếu dụng cụ/hiện tượng EN/không dấu | Index có cache, metadata VI/EN, nhãn tham số và alias dụng cụ có chọn lọc |
| P2 | Dịch EN duyệt toàn bộ DOM khi readout đổi | Chỉ dịch node/subtree thay đổi, bỏ node con trùng; giữ input/canvas/state |
| P2 | Sách thiếu loading nhìn thấy, nhãn rõ, scope phím và fullscreen fallback đầy đủ | Nhãn luôn hiện, trang tệp/trang in, nút Đến 44 px, loading/error/retry và focus/Tab/Escape |
| P2 | Trợ lý còn trạng thái/ariaVI trong EN; Enter cảm ứng gửi ngoài ý muốn | CopyVI/EN trực tiếp, Enter xuống dòng trên cảm ứng, giữ nháp/ảnh và phân biệt hủy/timeout |
| P2 | Route hash lab không cung cấp 300 trang nội dung độc lập cho crawler |300 trang vào tĩnh có công thức/MathML/điều kiện/schema và link mở lab, sitemap 305 URL |

## 2. Những phần đã sửa trong mã

**Giao diện và điều hướng:** hệ token chung, nhãn/action rõ, focus, trạng thái pressed/disabled, bộ lọc native details, bố cục mobile, vùng công thức có thể focus/cuộn bằng bàn phím mà không lồng điều khiển trong link. Giữ liên kết mở bài ở tiêu đề và nút hành động. Thẻ vẫn giữ slot ảnh; không thay bộ ảnh bằng ảnh mới.

**Dữ liệu học tập:** xác nhận xóa/nhập đè, tải bản sao và khôi phục bảng vừa xóa. Không đổi schema session/localStorage, không xóa dữ liệu để sửa UI, không route hoặc dựng lại canvas khi chuyển locale. Search không sửa catalog hoặc phép tính.

**Vật lí và dựng hình:** sửa vị trí tiếp xúc xe và phép co giãn minh họa cộng hưởng. Không đổi phương trình, khối lượng số học, vận tốc, thời điểm va chạm, hệ số hồi phục, bảng đo hoặc đồ thị. Chỉ cập nhật câu giải thích giới hạn hình vẽ cộng hưởng cho đúng hành vi mới.

**Sách và AI:** sửa tương tác thật như bảng audit; giữ ảnh sách gốc,85 bài mục lục, các tệp âm thanh. Không thay backend, endpoint hoặc khóa AI. Kiểm chat dùng transport fixtures; không gọi inference trả phí hoặc tuyên bố backend live đã nghiệm thu.

**SEO/sản phẩm:** `experiments/<id>.html` đọc được không cần JavaScript, có tên/mô tả/công thức/giới hạn/quy trình và `LearningResource`. `about.html`/`about-en.html` giải thích giá trị, dữ liệu, giới hạn và quyền sử dụng. Không tạo tài khoản, thanh toán, analytics hoặc biểu mẫu thu thập cá nhân. Không tuyên bố Google đã index hoặc bản quyền đã được cấp phép.

## 3. Bảo toàn dữ liệu và mô hình

Giữ đủ 300 ID thí nghiệm,300 bài soạn gốc,388 trang sách,85 bài mục lục và 301 tệp âm thanh. SHA-256 các cây tài nguyên được bảo vệ, media/markup banner, logo/phông và CSS nền ban đầu được kiểm bằng cổng preservation. Không đổi baseline lịch sử để giấu kết quả trước sửa. Tiêu đề banner mới từ main được giữ theo ngoại lệ đã có trong các kiểm của nhánh chính; phần video, hình nền và lifecycle được bảo toàn.

Guard v51 trước đây hash nguyên dòng clickhandler, bao gồm cả chức năng xóa/nhập không liên quan banner. V59 giữ manifest v51 và thêm snapshot hash từng trách nhiệm banner từ HEAD trước sửa: import, stop/mount, home/lab, route, fullscreen và lifecycle. Chỉ bỏ phần cleanup xác nhận mới khi so route; metadata/footer mới được loại rõ khỏi phép so entry. Video/poster, code banner, markup và cây tài nguyên vẫn giữ kiểm hash cũ.

## 4. Design system và kiến trúc

Xem [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) cho bảng color/spacing/radius/typography tokens và hành vi component. Xem [ARCHITECTURE.md](ARCHITECTURE.md) cho quyền sở hữu state, ESM, renderer, locale, AI riêng, cache version và phát hành.

Không thêm framework. KaTeX 0.16.45 tự phục vụ tiếp tục được đóng gói lúc preview/CI; không commit thư mục sinh cục bộ. Các trang tĩnh dùng `product.css` nhỏ và không tải engine mô phỏng. Sau thay catalog/formula/giới hạn, chạy `npm run build:discovery` để đồng bộ 300 trang.

## 5. Kiểm thử và bằng chứng

**PASS cục bộ:** `npm run check` kết thúc exit 0; browser tổng 20/20, sách 8/8, trợ lý 4/4, studio/keyboard bổ sung và axe 36 trạng thái không có violation tự động. Trạng thái phát hành được chốt riêng sau CI/Pages; bằng chứng máy đọc có phạm vi nằm trong [redesign-v59/evidence](redesign-v59/evidence/).

| Lớp kiểm | Phạm vi và kết quả |
|---|---|
| Cổng bắt buộc | PASS, exit 0; gồm các kiểm v59 mới và toàn bộ kiểm trước đó. [Log](redesign-v59/evidence/npm-check.txt) |
| Danh mục/tài nguyên |300 ID/300 bài soạn,388 trang/85 bài mục lục,301 âm thanh; bảo toàn hash tài nguyên |
| Khoa học độc lập |280 VERIFIED theo tập mẫu,20 PARTIAL,0 FAILED;143.974 so sánh vật lí,895 kiểm đơn vị,3.544 kiểm đồ thị,395.911 mapping số liệu |
| Hình học xe |320 bộ tham số,2.254 khung,218 điểm tiếp xúc,224 khung dính; actual tight mesh và mặt cản giao vùngy/z; sai số tiếp xúc khoảng6,44e-9 |
| Hình cộng hưởng |38 bộ tham số,3.686 khung;9 bộ cần giảm scale; giữ dạng nghiệm điều hòa độc lập |
| Hồi quy chuyển động |300 bài,61.200 khung playback,17.185 khung toàn ray; đây là kiểmCPU |
| Browser tổng |20 nhóm:9 viewport,VI/EN,search/Back/Forward,landscape,state/notes/rows/backup/import,reload,xóa/khôi phục,sách,chat,SEO,mesh thực và HTTP/pageerror |
| Sách browser |8 nhóm:9 viewport,scope phím,fullscreen fallback,loading/error/retry,locale giữ page/zoom,landscape và CDP touch |
| Trợ lý browser |4 luồng:EN+LaTeX,Enter cảm ứng,lỗi 503 giữ nháp,gửi lại và focus;API giả lập |
| Locale native DOM |Cùng 30 lần đổi nhãn: trước 150 treewalk/45.000 node visits; sau0/0, dịch đủ 30/30 và giữ input/canvas. Không phải benchmarkFPS |
| Accessibility tự động |Axe 36 trạng thái ở 320/390/1440 với các tagA/AA liên quan; PASS 36/36 trạng thái, 0 violation; có các mục “incomplete” vẫn cần con người rà. Không phải chứng nhậnWCAG hoặc screen-reader acceptance |
| Studio bổ sung |Desktop 1280/1440/1920,mobile 390,fullscreen; cold-library 320/390 cuộn công thức bằng bàn phím,Home/End; bằng chứng riêng |

Viewport bắt buộc:320,375,390,414,430,768,1024,1440,1920 px. Browser là Chromium headless với SwiftShader và cảm ứng/viewport giả lập. Không gọi kết quả này là kiểm iPhone/Safari/Android thật, bàn phím ảo thật hoặc 60 FPS phần cứng.

## 6. Ảnh trước/sau

| Khu vực | Trước | Sau |
|---|---|---|
| Lab mobile 390 | [Ảnh](redesign-v59/before-lab-390.png) | [Ảnh](redesign-v59/after-lab-390.png) |
| Sách 320 | [Ảnh](redesign-v59/before-books-320.png) | [Ảnh](redesign-v59/after-books-320.png) |
| Trợ lý EN 390 | [Ảnh](redesign-v59/before-assistant-390.png) | [Ảnh](redesign-v59/after-assistant-390.png) |

Ảnh chỉ chứng minh trạng thái được chụp, không thay oracle khoa học hoặc kiểm mọi góc camera. Ảnh trợ lý trước dùng source assistant HEAD gốc trong stylesheet working tree, không phải ảnh sản xuất cũ nguyên vẹn. Banner được bảo toàn, không đánh giá thay bằng hình tĩnh.

## 7. Những phần chưa hoàn tất hoặc chưa kiểm chứng

- 20 mục còn PARTIAL: `lens`, `mirror`, `gyroscope`, `elliptic_orbit`, `siphon`, `stokes_settling`, `large_pendulum`, `parametric_oscillation`, `duffing`, `van_der_pol`, `water_refraction`, `charged_plane`, `coaxial_capacitor`, `voltmeter_design`, `rectifier_filter`, `cyclotron`, `wave_plate`, `brownian_motion`, `van_der_waals`, `poisson_counting`. Xem báo cáo khoa học lịch sử để biết miền loại trừ và đầu ra thiếu oracle; PARTIAL không mặc định là lỗi runtime.
- Chưa có chuyên gia/giáo viên độc lập nghiệm thu 300 bài hoặc dữ liệu thí điểm lớp học.
- Bản EN là lớp học tập biên soạn riêng, không phải dịch nguyên văn đã chứng nhận của 300 bài VI; một số nhãn/cảnh/chuỗi động vẫn cần rà đầy đủ. Các trang sách gốc vẫn tiếng Việt.
- Chưa xem xét trực quan mọi mô hình ở mọi cận tham số/góc nhìn. Một số vật/nhãn trục còn nhỏ hoặc sát nhau khi fit toàn ray; đây là việc tiếp tục cải thiện khả năng đọc, không được chữa bằng đổi dữ liệu số.
- Chưa đo FPS/GPU/RAM dài hạn trên máy yếu hoặc phần cứng iPhone/Safari/Android; chưa thử screen reader và bàn phím ảo thật.
- Chưa gọi provider AIthật, xác nhận quota hoặc triển khai backend. Fixture không chứng minh câu trả lời khoa học đúng.
- Chưa xác minh đủ quyền chuyển giao/phân phối thương mại sách và âm thanh; kho chưa có LICENSE chung cấp quyền thương mại.
- Chưa xác nhận crawler đã index 305 URL hoặc có dữ liệu analytics/người dùng thực.

## 8. Domain và triển khai

Kiểm đọc GitHub Pages cho biết `cname=physicslab.tech`, `https_enforced=false`, `html_url=http://physicslab.tech/`. Truy vấn DNSGoogle A/CNAME ngày 26/10/2026 trả Status 0 và SOA, không có Answer A/CNAME/AAAA. GET có query mới tới GitHub Pages trả 301 với Location https://physicslab.tech/. Truy cập HTTPS chưa thành công từ executor; endpoint kiểm health Pages trả 403 “Resource not accessible by integration”. Không coi đây là quyền sửa DNS. Trước hợp nhất, nhánh làm việc giữ URL GitHub Pages. Main đồng thời đã đổi canonical/OG sang physicslab.tech ở commit `3cba448`; bản hợp nhất bảo toàn thay đổi đó, các trang mới theo cùng canonical để tránh hai domain mâu thuẫn. Việc kế thừa cấu hình không được coi là DNS/HTTPS đã được xác minh. Không tự tạo redirect mới; tại thời điểm audit từng cần lựa chọn về việc tạm gỡ custom domain. Khi kiểm lại cuối, DNS/HTTPS đã hoạt động nên lựa chọn đó không còn cần thiết.

Mã nguồn: [repository](https://github.com/lequocanhaz/thi-nghiem-ao-thpt). Lịch sử phát hành: [commits](https://github.com/lequocanhaz/thi-nghiem-ao-thpt/commits/main/). CI/Pages: [workflow](https://github.com/lequocanhaz/thi-nghiem-ao-thpt/actions/workflows/pages.yml). PR, commit và CI/Pages cụ thể ở cập nhật đầu báo cáo. Đã đối chiếu tài nguyên live và chạy smoke trực tiếp website, phân biệt với kiểm thiết bị thật.

## 9. Tệp thay đổi và phát triển tiếp

Danh sách đầy đủ nằm ở [changed-files.txt](redesign-v59/changed-files.txt), gồm runtime/checks/tài liệu và 301 HTML danh mục/trang vào được sinh. Các thay đổi cache import chỉ đổi version, không đổi công thức. Không commit `work/`, khóa hoặc KaTeX sinh cục bộ.

Xem [COMMERCIAL_READINESS.md](COMMERCIAL_READINESS.md): ưu tiên nghiệm thu khoa học/sư phạm, thiết bị thật, quyền tài nguyên, DNS/HTTPS và pilot trường học trước khi xây tài khoản/thanh toán. Không tuyên bố đợt này đã hoàn thành mọi tiêu chí “commercial ready”.
