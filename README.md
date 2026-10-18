# Quanh Lab · 300 thí nghiệm

## v36 — chữ đậm lớn và giao diện tươi sáng

- Nhận diện QUANH LAB dùng chữ Manrope ExtraBold 800 bên cạnh biểu tượng Q người dùng đã chọn. Tiêu đề, tên thí nghiệm và số đo có trọng lượng rõ; nội dung đọc giữ cỡ và độ đậm vừa phải.
- Màu xanh cobalt cho thao tác chính, vàng chanh cho ghi số liệu và điểm nhấn, cam san hô cho khối lớp 12. Banner video được phối lại với nền xanh, chữ lớn và huy hiệu số lượng bài.
- Nút có màu bão hòa, viền và trạng thái hover/nhấn; thẻ thí nghiệm vẫn nền trắng với tag chủ đề rõ màu. Bố cục chọn lớp và hàng nút xuống dòng trên khung hẹp.
- Kiểm tra tự động: cascade CSS ở 320–1440 px, chạy/ghi số liệu/đổi trang trên 300 bài và luồng ảnh Trợ lý AI. Không thay mô-đun tính toán hoặc tài nguyên âm thanh. Thử nghiệm trên thiết bị cảm ứng thật vẫn cần thực hiện riêng.

## v35 — nhận diện và thẻ thí nghiệm theo mẫu

- Thay logo Q/quỹ đạo bằng đúng hình Q–sóng–máy bay giấy người dùng cung cấp, giữ nguyên byte ảnh trong SVG có khung hiển thị gọn; wordmark Manrope.
- Font Manrope lưu cục bộ, kiểm tra 146 ký tự Việt hoa/thường và kèm giấy phép OFL. Nội dung 400, nút/tiêu đề trang 500, tên thí nghiệm 750, số đo/từ nhấn mạnh 700.
- Thẻ: nền hình trắng, tag màu chủ đề, tên viết hoa, bỏ dòng phân loại cách chạy. Tách rõ Mở thí nghiệm/Xem trước; bố cục flex căn hàng nút, vùng bấm 44 px, điều hướng điện thoại dùng grid.
- Thumbnail tăng từ 380×250 lên 640×400; nền trắng ở cả WebGL và đồ họa nhẹ. Các số liệu, công thức và luồng chạy/ghi được giữ nguyên.


## v34 — đồ thị trên điện thoại và ngữ cảnh Trợ lý AI

- Đồ thị vẽ theo chiều rộng/cao thực tế, cập nhật khi đổi kích thước hoặc mở lại bảng; nhãn dài xuống dòng, trục tung chuyển lên phía trên ở khung hẹp. Giữ nguyên miền số liệu, công thức và thao tác chọn điểm.
- Chat đồng bộ ngay khi chuyển từ bài về thư viện/nguồn; hiển thị tên bài hiện tại và giữ riêng bản nháp/ảnh. Lỗi đến muộn từ bài trước được ghi rõ.
- Mở chat trên màn hình cảm ứng không tự gọi bàn phím; trên máy tính vẫn đặt con trỏ vào ô câu hỏi. Tăng vùng bấm đóng chat/chụp ảnh/toàn màn hình lên 44 px, thu gọn chat khi màn hình thấp.
- `npm run check` bao gồm 3.600 trường hợp đồ thị của đủ 300 bài và kiểm tra luồng đổi trang/chat. Chưa kiểm tra hiển thị trình duyệt hay điện thoại thật.


Website thí nghiệm Vật lí tiếng Việt cho lớp 10–12 và các bài mở rộng có nhãn. Mã nguồn độc lập HTML/CSS/JavaScript, Three.js và tài nguyên âm thanh/font đóng gói trong `dist/`. Thí nghiệm và dữ liệu chạy trực tiếp trong trình duyệt. Chatbox dùng Gemini trên máy chủ: nhập câu hỏi rồi Gửi/Dừng, không tải mô hình AI hoặc yêu cầu WebGPU. Đã kiểm tra API công khai không cần đăng nhập ngày 17/10/2026; Gemini trả lời tiếng Việt và dùng đúng thông số bài đang mở.

Website: https://lequocanhaz.github.io/thi-nghiem-ao-thpt/

## Nhận diện và Trợ lý AI · v33

Đổi tên thành **Quanh Lab**, dùng logo Q/quỹ đạo dạng SVG, wordmark chuyển thành đường nét vector (không phụ thuộc font trên máy), favicon và nhận diện chung cho header/footer/chat. Giao diện nền sáng có điểm nhấn xanh chàm và xanh lá nhạt; trang chủ chia banner video và khối chọn lớp trên desktop, xếp theo chiều dọc trên mobile. Thanh điều hướng, thẻ thí nghiệm, bộ lọc, số đo và bảng điều khiển dùng cùng hệ khoảng cách và hình khối. Nội dung nền sáng giữ chữ đen.

Đã gỡ nút Xuất báo cáo, So sánh A/B, Quét biến và các menu/đặt lại Góc nhìn khỏi giao diện. Giữ chạy thí nghiệm, 2D/3D, trục/lưới, ghi điểm, đồ thị và sổ tay. Phiên có so sánh A/B cũ không tự hiển thị lại lớp so sánh.

**Trợ lý AI** nhận tối đa hai ảnh mỗi lượt qua chọn ảnh, dán hoặc kéo thả. Ảnh được thu nhỏ/nén tại trình duyệt, có bản xem trước, xóa và xem lớn. Có thể chỉ gửi ảnh; câu hỏi tiếp theo mang theo ảnh gần đây trong giới hạn máy chủ. Lỗi/hủy gửi giữ ảnh và bản nháp; đổi thí nghiệm giữ chúng ở đúng bài. Ảnh chỉ được gửi khi nhấn Gửi và chỉ lưu trong bộ nhớ trang hiện tại. Backend Gemini đang dùng đã hỗ trợ ảnh nên v33 không thay cấu hình máy chủ hay khóa API.

Kiểm tra `npm run check:images` bao phủ chuẩn bị ảnh, giới hạn, dọn object URL, gửi/giữ ảnh, chuyển bài khi bất đồng bộ, dán/kéo/chọn ảnh và gỡ công cụ ở cả 300 bài. `checks/vision-live-v33.json` ghi lần gửi PNG thật tới máy chủ, đọc đúng Q33 trên nền xanh. Kiểm tra này không thay thế thao tác bộ chọn ảnh, canvas hay chạm trên Safari thật.

## Xuất bản bằng GitHub Pages

1. Tạo repository mới, ví dụ `thi-nghiem-ao-thpt`, trên tài khoản của bạn. Đưa **nội dung bên trong thư mục này** lên nhánh `main`, gồm cả `.github/workflows/pages.yml` và toàn bộ `dist/`.
2. Mở **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Mở **Actions**, chạy workflow “Kiểm tra và xuất bản website” hoặc đẩy một commit mới lên `main`.
4. Chỉ khi workflow và bước triển khai thành công, lấy đường dẫn thật trong trang Pages hoặc kết quả deployment. Kho này đã được cấu hình GitHub Pages; lần triển khai đầu tiên thành công ngày 16/10/2026.

GitHub Free hỗ trợ Pages từ repository công khai; Pages từ repository riêng tư phụ thuộc gói tài khoản. Chọn Public đồng nghĩa người khác có thể đọc và tải mã nguồn. Tài liệu chính thức: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

## Bố cục và vận hành · v32

Giao diện chỉ tải `dist/app.css`, thay cho sáu lớp CSS chồng nhau. Bảng thông số nằm cạnh mô hình trên màn hình rộng, chuyển xuống dưới mô hình trên màn hình nhỏ và có vùng cuộn riêng. Header tự xuống dòng; đồ thị và bảng đo cuộn trong khung riêng. Font Inter đóng gói sẵn, giữ phân cấp tiêu đề/in đậm và số trục lớn, lưới bật/tắt được. Chế độ Khám phá, Phân tích, Trình chiếu, toàn màn hình và thu gọn bảng dùng chung một bố cục.

Cả 300 bài đều có **Chạy, Tạm dừng, Tiến một bước, tua, chạy lại và lặp lại**. Trong đó 79 bài dùng diễn biến thời gian hoặc phát tia đã có; 221 bài định luật tĩnh dùng quy trình tác động tự động lên dụng cụ, làm thay đổi một biến điều khiển cùng các số đo phụ thuộc và hình học của mô hình. Nhóm quy trình hiển thị **phần trăm tiến trình**, tên biến điều khiển; không coi đó là trục thời gian của chuyển động tự do. Đây không phải 221 bộ giải động lực học mới. Người học vẫn chỉnh dụng cụ, ghi điểm đo, so sánh A/B, dùng đồ thị và xuất/nhập phiên. Đang chạy mà chỉnh thông số sẽ tạm dừng để không ghi đè ô nhập.

Các mô hình lò xo, hệ thấu kính, điện trường đều, bộ tụ, xi-phông, khúc xạ sóng nước, điện thế và ngưỡng phản ứng đã bổ sung phản hồi hình học. Camera giữ góc nhìn khi quy trình chạy, tránh tự co giãn liên tục theo thông số. Sáu mô-đun công thức và 301 tệp âm thanh giữ nguyên theo bộ đối chiếu.

Banner dùng video NASA thực 1920 × 1080 đóng gói MP4/WebM, phát lặp lại và giữ toàn màn hình. Nguồn và credit trong `dist/video/NOTICE.txt`. Trợ lý vẫn dùng endpoint Gemini đã cấu hình; thay đổi v32 không thay backend hoặc khóa API.

Kiểm tra: `npm run check`, `npm run check:models`, `npm run check:framing`, `npm run check:audio`. Kiểm tra mới `npm run check:playback` thực sự tiến trình đủ 300 bài, kiểm tra thay đổi hình học/vật liệu của dụng cụ (loại trừ trục, tay nắm và nhãn), hoàn tất, tua lại, lặp lại và dữ liệu xuất/nhập của quy trình. `checks/mobile.mjs` kiểm tra phân giải CSS/DOM ở sáu bề rộng. Đây là kiểm tra mã, DOM và hình học CPU, **chưa thay thế thao tác hay ảnh chụp trên trình duyệt/điện thoại thực**.

## Chỉnh sửa về sau

- Giao diện: `dist/app.css`, `dist/views.js`, `dist/app.js`. Các CSS cũ giữ làm lịch sử, không còn được tải.
- Quy trình chạy: `dist/playback.js`; không sửa công thức để tạo hiệu ứng giả.
- Dụng cụ/3D: `dist/scene3d.js`, `dist/apparatus.js`, `dist/banner.js`, các tệp `*-scenes.js`.
- Nội dung và mô hình: các tệp `*-catalog.js`, `dist/models.js`, `dist/physics.js`.
- Chatbox: `dist/assistant.js`. Endpoint: `dist/ai-config.js`. Backend trong `server/` hỗ trợ Gemini đang sử dụng và adapter OpenAI tùy chọn. Khóa Gemini nằm trong runtime secret phía máy chủ, không có trong frontend.
- Các bản thuyết minh tiếng Việt: `dist/audio/vi13/`, mục lục đoạn đọc trong `dist/voice-index.js`.
- Dùng GitHub Desktop hoặc trình biên tập của bạn, commit và push lên `main`; workflow kiểm tra rồi cập nhật website. Có thể trao đổi yêu cầu sửa trong cuộc trò chuyện và cung cấp đúng URL repository đã cấp quyền.

Có 3 chế độ Khám phá/Phân tích/Trình chiếu. 79 bài có diễn biến thời gian/phát tia; 221 bài có quy trình tác động tự động trên mô hình. Bảng đo, ghi chép, yêu thích và lịch sử được lưu **trên từng trình duyệt**, không có máy chủ đồng bộ. Chuyển tên miền không tự chuyển dữ liệu cũ: hãy xuất phiên JSON ở website cũ và nhập lại ở bài tương ứng trên website mới.

## Chạy và kiểm tra trên máy

Dùng Node.js 24 để chạy kiểm tra:

```sh
npm ci --ignore-scripts
npm run check
npm run check:models
npm run check:framing
npm run check:audio
```

Để mở website cục bộ khi máy có Python:

```sh
python -m http.server 8080 --directory dist
```

Sau đó mở http://localhost:8080. Không mở `index.html` bằng `file://` vì ES modules và tải âm thanh cần HTTP(S).

## Nguồn và giới hạn

Font Product Sans do người dùng cung cấp; giọng Hoài My (Microsoft), không phải bộ giọng OpenScienceVN. Giữ các ghi nguồn và giấy phép hiện có trong `sources/`, `dist/fonts/`, `dist/vendor/`, `dist/audio/vi13/`. Gói này không tự cấp giấy phép phân phối lại cho tài nguyên bên thứ ba.

Chi tiết bản mới ở `checks/verification-v18.md`; các đợt kiểm tra nền ở `checks/verification-v14.md` và `checks/verification-v15.md`. Đã kiểm tra mã/DOM, số liệu và hình học; chưa kiểm tra GPU, chạm thật, trình đọc màn hình hay thẩm định phát âm bằng loa trên thiết bị. GitHub Actions đã chạy thành công bộ kiểm tra mã/DOM và triển khai lên GitHub Pages ngày 16/10/2026.

Nguồn cấu hình Pages: https://github.com/actions/starter-workflows/blob/main/pages/static.yml

## Kiểm chứng bản AI cục bộ v20

`npm run check` có kiểm tra riêng `checks/local-ai.mjs`: mock WebGPU/worker, chọn f16/f32, luồng streaming, dừng tải/dừng trả lời, định dạng ảnh, theo dõi ảnh ở lượt hỏi tiếp, giữ bản nháp khi lỗi và xác nhận không có lệnh gọi API nhà cung cấp trong luồng cục bộ. Kiểm tra tài nguyên mạng thực được lưu ở `checks/local-ai-assets-v20.json`. Đã so sánh font đóng gói trùng byte với tệp người dùng gửi và kiểm tra các glyph tiếng Việt.

Giới hạn: môi trường hiện tại không có phiên kiểm thử trình duyệt/WebGPU; chưa xác nhận được suy luận GPU và chất lượng câu trả lời thực tế. Không cam kết mọi điện thoại/trình duyệt chạy được. Qwen là mô hình nhỏ, khả năng lập luận không tương đương ChatGPT; phải đối chiếu công thức/số liệu. Mô hình ảnh là Phi 3.5 Vision, cần khoảng 4,5–7 GB VRAM theo cấu hình thư viện. Thông báo lỗi hoặc thiếu WebGPU không được thay bằng câu trả lời AI giả.

## Bản v21 — chat đơn giản và phân cấp chữ

Đã gỡ hoàn toàn lệnh nhập mô-đun AI cục bộ khỏi `dist/assistant.js`; không có tải trọng số khi mở chat hoặc gửi câu hỏi. Chỉ hai nút trong panel: Đóng và Gửi/Dừng. Hỗ trợ Enter để gửi, Shift+Enter xuống dòng, IME, câu hỏi theo từng bài, giữ bản nháp khi lỗi, không xóa nội dung mới đang gõ khi câu trả lời cũ đến.

Kiểm tra DOM/transport của panel dùng phản hồi giả lập để kiểm tra giao thức; không phải bằng chứng AI thật hoạt động. Mọi câu trả lời trong sản phẩm chỉ được hiển thị sau khi backend trả về thành công. Không kết nối được backend thì thông báo và giữ câu hỏi. Việc không tải mô hình phía học sinh cần một máy chủ AI hoạt động và tài nguyên/chi phí tương ứng.

## Trợ lý Gemini

Mở website, chọn **Trợ lý**, nhập câu hỏi rồi bấm **Gửi**. Chatbox gửi kèm thông số và bảng đo gần nhất của bài đang mở để trợ lý giải thích theo dữ liệu. Không tải mô hình AI về thiết bị. Giao diện hiện tại hỏi đáp bằng văn bản; backend có bộ kiểm tra ảnh nhưng panel chưa có nút đính kèm.

API chạy tại `https://vat-li-lab-assistant-api.itsqanh.chatgpt.site/api/chat`, cho phép nguồn `https://lequocanhaz.github.io`. Máy chủ giới hạn toàn web 100 lượt/ngày, mỗi địa chỉ IP 40 lượt/ngày và 4 lượt/phút. Nhiều người cùng mạng có thể dùng chung địa chỉ IP và hạn mức. Hạn mức của Google có thể thấp hơn giới hạn của website. Không tự đổi sang nhà cung cấp hoặc mô hình trả phí khác khi hết hạn mức.

Runtime được cấu hình `AI_PROVIDER=gemini`, `GEMINI_MODEL=gemini-3.5-flash-lite`, `GEMINI_API_KEY_ENCRYPTED` trong secret của máy chủ. Cơ chế RSA/D1 giải mã chỉ trong bộ nhớ phía máy chủ. Không có khóa trong frontend hoặc repository. Không đưa khóa vào ảnh, cuộc trò chuyện, URL hay commit. `server/ai-handler.mjs` cũng hỗ trợ `GEMINI_API_KEY` dạng runtime secret nếu môi trường khác sử dụng cách đó; chỉ cần một dạng khóa Gemini.

Trang thiết lập và các endpoint nhận khóa tạm đã tắt, trả HTTP 404. Bản mã hóa tạm đã xóa sau khi chuyển vào runtime secret. Không bật `GEMINI_SETUP_ENABLED` trong lúc máy chủ được chia sẻ công khai. Thay khóa bằng phần quản lý runtime secret hoặc một quy trình quản trị có bảo vệ tương đương.

Để tự chạy backend với Node.js 24, lưu cấu hình server vào tệp biến môi trường riêng đã gitignore, rồi chạy `node --env-file=.env.local server/start.mjs`. GitHub Pages chỉ phục vụ frontend, không thực thi server. `dist/ai-config.js` chỉ chứa URL endpoint công khai, tuyệt đối không chứa API key.

Theo phạm vi chủ website xác nhận, tính năng Gemini dành cho người từ 18 tuổi. Nếu đổi sang phục vụ người dưới 18 tuổi phải xem lại nhà cung cấp và điều khoản. Hạn mức miễn phí tùy mô hình, tài khoản và thời điểm; không đồng nghĩa dùng không giới hạn. Dữ liệu ở gói miễn phí có thể được Google dùng để cải thiện dịch vụ; tránh gửi dữ liệu cá nhân hoặc nhạy cảm. Tài liệu: https://ai.google.dev/gemini-api/terms, https://ai.google.dev/gemini-api/docs/pricing, https://ai.google.dev/gemini-api/docs/api-key.

`npm run check:assistant` kiểm tra panel, giao thức OpenAI/Gemini, ngữ cảnh, lịch sử, ảnh phía API, thay khóa, lỗi hạn mức/quyền truy cập/mô hình, phản hồi bị chặn/rỗng/cắt dở, timeout và quy trình nhập khóa bằng khóa tổng hợp. `npm run check` kiểm tra thêm mã, tài nguyên, DOM và trạng thái 300 bài. Không thay thuật toán Vật lí, mô hình, âm thanh hoặc font trong đợt kết nối Gemini này.

Đã kiểm thử suy luận Gemini thật ngày 17/10/2026: API trả HTTP 200, giải thích đúng lực Coulomb còn F/4 khi khoảng cách tăng gấp đôi và tính đúng I = 2 A theo thông số U = 6 V, R = 3 Ω. Kiểm tra HTTP ẩn danh xác nhận CORS/preflight hoạt động, nguồn lạ bị từ chối, câu hỏi rỗng bị chặn và toàn bộ đường thiết lập đều trả 404. Việc kiểm tra HTTP và dữ liệu không thay cho kiểm thử hình ảnh, GPU hoặc thao tác trực tiếp trên trình duyệt; các phần đó chưa được kiểm tra lại trong đợt này. Chuỗi module frontend dùng cache v23 để tải cấu hình mới.

### Sửa gửi câu hỏi trên iPhone · v23

Đã thay việc giữ tham chiếu fetch gốc trên đối tượng chatbox bằng hàm gọi `globalThis.fetch(...)`, giữ đúng receiver Window mà WebKit yêu cầu. Trước bản sửa, kiểm tra mô phỏng yêu cầu receiver Window tái hiện lỗi trong ảnh người dùng và không gửi được yêu cầu; sau bản sửa kiểm tra này gửi và nhận câu trả lời thành công. Lỗi mạng được trình bày bằng tiếng Việt, câu hỏi vẫn được giữ. Chuỗi boot/app/assistant đổi sang v23 để tránh mã cũ trong bộ nhớ đệm. Đây là kiểm tra hồi quy bằng DOM/transport, chưa phải kiểm thử trực tiếp trên iPhone hoặc Safari thật.

### Khả năng phục hồi kết nối · v24

Backend thử lại tối đa hai lần với khoảng chờ tăng dần và một hạn chờ chung 50 giây, chỉ khi lỗi mạng hoặc Gemini trả 408/500/502/503/504. Không thử lại lỗi khóa, quyền, khu vực hoặc hết hạn mức; không chuyển nhà cung cấp hay bật thanh toán. Một câu hỏi chỉ tiêu thụ một lượt trong bộ đếm của web, nhưng mỗi lần gọi lại vẫn tính vào hạn mức phía Google. Nhật ký chỉ lưu loại lỗi, mã HTTP và số lần thử, không lưu câu hỏi, phản hồi hoặc khóa API.

Ngữ cảnh trợ lý bổ sung tổng số thí nghiệm và thống kê lớp/chủ đề, được tính trực tiếp từ danh mục đang dùng. Bộ kiểm tra dùng tình huống 503 → 503 → 200, giới hạn lần thử, hủy trong lúc chờ và lỗi vĩnh viễn để xác minh hành vi; không đại diện cho kiểm tra trên iPhone thật.

Ngày 17/10/2026, runtime chuyển sang Gemini 3.5 Flash-Lite để ưu tiên độ trễ thấp sau khi ghi nhận 503 từ Gemini 3.8 Flash và một lượt hỏi chờ quá hạn. Cấu hình thanh toán và nhà cung cấp được giữ nguyên.

## Trợ lý Vật lí mở rộng · v27

Trợ lý hỗ trợ câu hỏi Vật lí ngoài chương trình THPT và các câu hỏi phổ thông, sử dụng ngữ cảnh bài đang mở khi liên quan. Có đồng hồ máy chủ cho ngày/giờ, múi giờ theo thiết bị và dự phòng Việt Nam. Đã bổ sung hướng dẫn giải bài, nêu giả thiết/đơn vị, dữ kiện thiếu, phân biệt mô phỏng với thực nghiệm, nguồn SI BIPM và danh mục đọc thêm. Không có fine-tuning hay duyệt web trực tiếp; không nạp toàn bộ lịch sử ChatGPT hoặc bí mật vào chatbot công khai. Xem [phạm vi, nguồn và kiểm thử](server/PHYSICS_TUTOR.md).

## Giao diện và không gian khảo sát · v28

Đã thêm giao diện sáng thống nhất cho nút, thẻ ảnh, bộ lọc và bàn thí nghiệm; giữ Product Sans, chỉ in đậm/viết hoa các tiêu đề chính. Cả 300 bài có nút hình chiếu 2D/3D giữ nguyên dữ liệu. Có 13 bài dùng trục có vạch chia vật lí và 62 bài dùng trục chỉ hướng, được chú giải riêng; đồ thị thêm trục qua 0 khi miền khảo sát chứa 0. Xem [thiết kế, nguồn và cách kiểm tra](docs/INTERFACE_V28.md).

## Giao diện, chuyển cảnh và lưới · v31

Giao diện chuyển sang font Inter Variable đóng gói sẵn, có tiếng Việt và các độ đậm thực. Tiêu đề, tên thí nghiệm, nhãn và số đo có phân cấp riêng; bỏ quy tắc ép tất cả về nét thường. Thư viện, bộ lọc, thẻ bài, thanh công cụ và tab được chỉnh lại khoảng cách, trạng thái chọn, viền và nút. Mở bài, chuyển tab và hộp thoại có hiệu ứng ngắn; tắt khi cài đặt chuyển động hoặc hệ điều hành yêu cầu giảm chuyển động.

Đã bỏ các dòng trang trí “Mô hình · Dữ liệu · Bằng chứng”, “Thay đổi · Quan sát · Giải thích”, mã bài trong đầu bảng và các lời nhắc lặp trên banner, bảng thông số, đồ thị. Hướng dẫn thao tác, điều kiện mô hình, đơn vị và các chức năng học tập vẫn truy cập được.

Cả 300 đồ thị có lưới chính–phụ, vạch chia theo bước số dễ đọc và nút **Lưới** riêng. Số trên trục đồ thị tăng lên 18 px, tên trục 19 px. Trục trong mô hình dùng chữ 16 px theo màn hình, thích ứng khi đổi camera, thu/phóng và thay kích thước; giảm mật độ nhãn khi thiếu chỗ và giữ chữ trong khung. Mô hình có ít nhất hai trục có thể bật/tắt lưới tọa độ. Lưới theo đúng phép đổi đơn vị của từng trục; lưới định hướng vẫn được chú thích là không dùng để đọc số đo. Trạng thái lưới được lưu theo bài và đi cùng phiên xuất/nhập.

Tham khảo bố cục và thành phần: [Dribbble UI/UX](https://dribbble.com/tags/ui-ux-design), [Dribbble UI elements](https://dribbble.com/tags/ui-elements), [shadcn Tabs](https://ui.shadcn.com/docs/components/tabs), [Radix Segmented Control](https://www.radix-ui.com/themes/docs/components/segmented-control). Không đưa ảnh hoặc mã nguồn của các mẫu Dribbble vào sản phẩm.

Kiểm tra: `npm run check`, gồm 300 tuyến DOM, bật/tắt và lưu/khôi phục lưới, đơn vị lưới mô hình, số trên 300 đồ thị, cỡ chữ qua các camera/zoom và 1.800 cấu hình CSS trên sáu độ rộng. Có đối chiếu hình chiếu CPU của mô hình sóng ở 360 và 1.200 px; đây không phải ảnh chụp trình duyệt. Môi trường hiện tại không có công cụ browser QA được hỗ trợ, nên chưa xác nhận pixel WebGL, thao tác cảm ứng thật hoặc Safari/iPhone.
