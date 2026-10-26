# Quanh Lab — mô phỏng dễ quan sát và tài khoản v64

Đợt này cải tiến **121 thí nghiệm**, giữ đủ **300 ID**, sách và dữ liệu phiên. Tiêu chí chọn: 60 bài gốc và 61 bài khác đang được catalog đánh dấu nền tảng. Đây là phạm vi phát hành cụ thể, không phải tuyên bố mọi bài ngoài phạm vi đều phức tạp hoặc đã được giáo viên nghiệm thu. Danh sách toàn bộ300 bài và phạm vi từng ID: [EXPERIMENTS.md](experiments-v64/EXPERIMENTS.md), [JSON](experiments-v64/catalog-scope.json).

## Vấn đề và thay đổi thực tế

- Mô hình thiếu dấu mốc khiến người học khó liên hệ thao tác với hiện tượng. Bổ sung các vị trí cân bằng/biên, mẫu quãng đường trong các khoảng thời gian bằng nhau, đỉnh/quãng ném, cánh tay đòn, thành phần lực, nút/bụng sóng và quan hệ dòng nhánh. Giữ các dụng cụ đang hoạt động; không viết lại phương trình chỉ để đổi giao diện.
- Độ dài vectơ từng thành phần bị giới hạn riêng làm mất tỉ lệ. Tổng hợp/phân tích lực dùng một thang chung, hình bình hành đúng; lực bằng0 không có mũi tên khác0. Các vectơ khác đơn vị chỉ biểu diễn hướng và có nhãn riêng, không so độ dài như cùng một đại lượng.
- Sóng âm dùng chấm dao động dọc tại vị trí cân bằng thay vì hiểu nhầm phân tử chạy cùng sóng. Tần số, bước sóng và pha được liên hệ với đầu ra mô hình. Chuyển động chấm vẫn là minh họa, không đo tốc độ truyền âm bằng hoạt ảnh đã làm chậm.
- Điện nối tiếp/song song phân biệt dòng nhánh, tốc độ dấu dòng dùng cùng hệ số. Tụ điện nối tiếp/song song có hai cặp bản và dây nối đúng topology: nối tiếp cùng điện tích, song song cùng điện áp. Không tạo dòng DC liên tục đi xuyên điện môi. Diện tích bản cùng thang thể hiện tỉ lệ điện dung; vectơ trường phản ứng với điện áp.
- Công có thành phần lực dọc đường; chuyển động hộp không bị cắt vị trí ở mép ray. Lực nổi có lực giữ khi cần cưỡng bức độ chìm, phân biệt với vật tự nổi cân bằng. Nội năng/trao đổi nhiệt có dấu; phân cực vuông góc triệt tắt. Các tia lăng kính mới được ghi rõ là điều kiện lệch cực tiểu riêng cho từng màu.
- Thử nghiệm đồ thị nằm trong cảnh3D gây chữ chồng nhau trên điện thoại. Bản phát hành chuyển **95 quan hệ lý thuyết** xuống bảng HTML/SVG riêng dưới mô hình, có trục/đơn vị, điểm hiện tại màu cam, bảng giá trị tương ứng và thu gọn bằng bàn phím. Chữ giữ ngang, không che dụng cụ hoặc kéo camera ra xa. Các điểm lý thuyết không nhập vào bảng đo. Góc là quan hệ liên tục; số electron, nhánh dây, số cell và mode rời rạc được biểu diễn bằng các điểm riêng.
- 300 ảnh WebP mới được xuất từ chính LabScene tại `dist/previews/v64/`. Giữ bộv62 làm lịch sử; thư viện tải lười ảnh thật và không mở WebGL trên trang chủ. Manifest giữ nguồn/hash/tham số/camera. Không dùng ảnhAI hoặc thay bằng ảnh giả khi xuất lỗi.

## Tài khoản: chuẩn bị tích hợp, chưa bật dịch vụ thật

Theo trả lời của chủ dự án, chưa có Firebase project. `dist/auth-config.js` giữ `enabled:false`; giao diện thông báo rõ và các thí nghiệm vẫn dùng được không cần tài khoản. **Chưa có tài khoản thật, Google OAuth thật hoặc email đặt lại mật khẩu thật được nghiệm thu.**

Mã đã có đăng ký/đăng nhập email, Google popup, khôi phục mật khẩu, đăng xuất, xóa tài khoản có xác nhận và lỗi cần đăng nhập lại. Giao diện VI/EN, nhãn trường, lỗi inline, trạng thái chờ, focus trong dialog, Escape và trả focus. Khởi tạo SDK khi mở tài khoản; không tải Firebase/Google khi config thiếu. SESSION mặc định, LOCAL khi người dùng chọn giữ đăng nhập. Firebase quản lý token; Quanh Lab không chép mật khẩu/token vào phiên thí nghiệm.

Đăng nhập chưa đồng bộ bảng đo/ghi chép/tiến độ sang thiết bị khác, không tự bảo vệ backend AI, không tạo quyền quản trị. Đăng xuất/xóa tài khoản giữ dữ liệu thí nghiệm trên thiết bị. Có [trang quyền riêng tư VI/EN](../dist/privacy.html). Hướng dẫn chủ dự án: [AUTH_SETUP.md](AUTH_SETUP.md). Chỉ cần Firebase Web config công khai; không cần service account/client secret.

SDK Firebase13.1.0 được bundle cục bộ bằng esbuild0.28.2,142218bytes trước nén, giấy phép được giữ; không thêm Analytics/Firestore. Khi cấu hình bật hợp lệ, CSP chỉ mở Google API bootstrap và đúng auth helper domain trên các trang có tài khoản. Bộ quét chỉ cho phép đúng Firebase Web key công khai đã xác thực trong `auth-config.js`; các khóa khác vẫn bị chặn. CI tạo SDK trước kiểm tra/upload và vẫn bảo vệ toàn bộ HTML khi deploy.

## Kiểm chứng và bằng chứng

Kết quả phát hành và các báo cáo máy đọc được nằm trong thư mục [experiments-v64](experiments-v64/). Các phép thử độc lập mới: `concept-physics-v64`, `concept-ui-v64`, `concept-discovery-v64`, `concept-foundation-v64`, `observation-view-v64`, `auth-client-v64`, `auth-security-v64`, `catalog-previews-v64`. Có13 hash nguồn bảo vệ phương trình/catalog/tham số/bảng đo/playback; không nới baseline khoa học lịch sử để làm kiểm tra đạt.

Browser QA dùng Chromium/SwiftShader với ảnh WebGL thật,121 bài tại390/1440px, thao tác chọn lọc,9 viewport320–1920px, VI/EN, login fixtures, bảng quan hệ và axe. Bộ SDK auth dùng bundle Firebase thật với REST mocks, không gọi dịch vụ thật. Kết quả: `npm run check` exit0;258/258 kịch bản browser, thêm 4/4 kiểm hai topology tụ sau sửa diện tích bản;13/13 kịch bản thư viện lạnh (2700 lượt giải mã ảnh ở9 viewport);3/3 kiểm điểm hiện tại/đường liên tục/rời rạc;12 trạng thái axe có0 vi phạm tự động;5/5 kịch bản SDKthật/RESTmocks. Các bộ mô hình mới kiểm454+219+246+433 trạng thái cùng26.279 điểm dự đoán foundation và10.075 đỉnh đường core. Những con số này không thay thế giới hạn đã nêu.

Ảnh trước/sau: [trước](experiments-v64/before-vector-sum.webp), [mô hình sau](experiments-v64/after-vector-sum-390.png), [bảng quan hệ sau](experiments-v64/after-relation-390.png), [tài khoản chưa kết nối](experiments-v64/account-unconfigured-390.png).

Previewv64 xuất300/300, `complete=true`, `sourceStable=true`, không lỗi; nguồn từng tệp cóSHA-256. `sourceCommit` ghiHEADlúc xuất; hash từng tệp mô tả chính xác working tree đã xuất, không suy ra working tree bằngcommitbase.

## Phạm vi chưa nghiệm thu

- 179 bài chưa thiết kế lại riêng; một số cùng họ dựng cảnh có thể hưởng sửa chung. Không gọi đợt này là tái thiết kế hoặc ký duyệt khoa học toàn bộ300 bài.
- Các20mục khoa học PARTIAL trước đây, miền phi tuyến/ngẫu nhiên, mô phỏng va chạm phân tử đầy đủ và nghiệm thu sư phạm vẫn chưa hoàn tất.
- Chưa kiểm phần cứng iPhone/Android/Safari, bàn phím ảo thật, FPS GPU thực hoặc thử lớp học. Axe không phải chứng nhận WCAG.
- Chưa bật Firebase thật, xác nhận provider/domain/email/Google consent, hoặc nghiệm thu chính sách vận hành tài khoản bằng dự án thực tế. Không có đồng bộ cloud trong đợt này.
- Không thay đổi giấy phép học liệu gốc hoặc khẳng định đủ quyền thương mại hóa sách/âm thanh.

Phân công thực sự: physics thực hiện8 bài và kiểm số; ui thực hiện22 bài và kiểm hình; discovery thực hiện30 bài; foundation tạo phần đầu61 bài, agent chính hoàn thiện và kiểm; ai thực hiện adapter/SDK/fixtures; qa tạo browser harness. Agent chính xử lý tích hợp, các lỗi phát hiện khi chạy, bảo mật, kiểm thử và phát hành. Không xem phân công là bằng chứng nghiệm thu.

Mã triển khai: commit `2195983`. Phát hành qua Pull Request và GitHub Actions; chỉ coi website đã cập nhật sau khi Pages thành công và kiểm HTTPS trực tiếp. Danh sách tệp: [FILES.txt](experiments-v64/FILES.txt).
