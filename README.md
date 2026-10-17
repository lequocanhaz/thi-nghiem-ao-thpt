# Vật lí Lab · 300 bài khảo sát

Website thí nghiệm Vật lí tiếng Việt cho lớp 10–12 và các bài mở rộng có nhãn. Mã nguồn độc lập HTML/CSS/JavaScript, Three.js và tài nguyên âm thanh/font đóng gói trong `dist/`. Thí nghiệm và dữ liệu chạy trực tiếp trong trình duyệt. Chatbox v21 chỉ có nhập câu hỏi và Gửi/Dừng, dùng máy chủ suy luận. Không tải mô hình AI hoặc yêu cầu WebGPU. Endpoint máy chủ hiện chưa được bật; lần kiểm tra API ngày 17/10/2026 (giờ Việt Nam) vẫn trả HTTP 429 `billing_not_active`.

Website: https://lequocanhaz.github.io/thi-nghiem-ao-thpt/

## Xuất bản bằng GitHub Pages

1. Tạo repository mới, ví dụ `thi-nghiem-ao-thpt`, trên tài khoản của bạn. Đưa **nội dung bên trong thư mục này** lên nhánh `main`, gồm cả `.github/workflows/pages.yml` và toàn bộ `dist/`.
2. Mở **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Mở **Actions**, chạy workflow “Kiểm tra và xuất bản website” hoặc đẩy một commit mới lên `main`.
4. Chỉ khi workflow và bước triển khai thành công, lấy đường dẫn thật trong trang Pages hoặc kết quả deployment. Kho này đã được cấu hình GitHub Pages; lần triển khai đầu tiên thành công ngày 16/10/2026.

GitHub Free hỗ trợ Pages từ repository công khai; Pages từ repository riêng tư phụ thuộc gói tài khoản. Chọn Public đồng nghĩa người khác có thể đọc và tải mã nguồn. Tài liệu chính thức: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

## Giao diện và banner · v18

Banner dùng video NASA thực 1920 × 1080 có chuyển động, đóng gói MP4/WebM để không lệ thuộc link nóng. Banner tự phát lặp lại, bỏ các nhãn nguồn/độ phân giải và nút phát/dừng; giữ nút toàn màn hình. Tự thử lại sau tương tác khi trình duyệt chặn tự phát, và khôi phục khi quay lại trang. Nguồn và credit trong `dist/video/NOTICE.txt`. Đây là hình dựng mô phỏng của NASA, không phải phép đo hay bộ giải tương đối rộng chạy trực tiếp.

Chữ nội dung trên nền sáng chuyển sang đen; chữ trên banner tối dùng trắng, màu đại lượng Vật lí vẫn có quy ước riêng. Banner dùng tiêu đề và lời dẫn trực tiếp, không có khẩu hiệu trang trí. Font sử dụng đúng bốn tệp Product Sans OTF được cung cấp. Các nút kéo 3D giữ liên kết đại lượng độc lập; điều chỉnh trực tiếp, bàn phím và ô số dùng chung trạng thái. 629 miền thông số ở 270 bài được mở rộng sau khi giữ các ràng buộc áp dụng. Bảng điều khiển và số liệu vẫn điều chỉnh kích thước được; “Khoảng thanh trượt” dùng để tập trung một khoảng trong miền hợp lệ.

Hộp Trợ lý v21 bỏ chọn mô hình, Tải AI, tiến độ tải, nút giải phóng GPU, bảng ngữ cảnh và các công cụ phụ. Chỉ giữ hỏi, gửi/dừng, hội thoại và đóng. Không tải ngầm WebLLM hoặc trọng số. Các mô-đun cục bộ cũ được giữ dưới dạng mã chưa được nhập bởi giao diện đang dùng, để bảo toàn khả năng tham khảo. Đổi font về Product Sans Regular cho nội dung; các cấp tiêu đề dùng Product Sans Bold do người dùng cung cấp. Backend cần hoạt động trước khi có câu trả lời thật; giao diện không giả lập AI khi thiếu kết nối.

Giữ 300 bài, phương trình, mẫu thiết lập, các nguồn OpenStax và 12 tài liệu quốc tế, chức năng đo/đồ thị/A-B/quét biến/xuất nhập phiên và âm thanh đã có. 79 bài chạy theo thời gian, các bài còn lại khảo sát bằng thông số.

Kiểm tra: `npm run check`, `npm run check:models`, `npm run check:framing`, `npm run check:audio`. Phạm vi và giới hạn ở `checks/verification-v18.md`. Kiểm tra DOM/hình học không thay thế ảnh chụp hoặc thao tác trình duyệt thực.

## Chỉnh sửa về sau

- Giao diện: `dist/refinement.css` (v17), `dist/expansion.css` (v16), `dist/visual.css` (v15), `dist/interface.css`, `dist/views.js`, `dist/app.js`.
- Dụng cụ/3D: `dist/scene3d.js`, `dist/apparatus.js`, `dist/banner.js`, các tệp `*-scenes.js`.
- Nội dung và mô hình: các tệp `*-catalog.js`, `dist/models.js`, `dist/physics.js`.
- Chatbox: `dist/assistant.js`. Endpoint: `dist/ai-config.js`. Backend được giữ trong `server/`; chưa được bật cho frontend khi tài khoản API chưa có thanh toán hoạt động.
- Các bản thuyết minh tiếng Việt: `dist/audio/vi13/`, mục lục đoạn đọc trong `dist/voice-index.js`.
- Dùng GitHub Desktop hoặc trình biên tập của bạn, commit và push lên `main`; workflow kiểm tra rồi cập nhật website. Có thể trao đổi yêu cầu sửa trong cuộc trò chuyện và cung cấp đúng URL repository đã cấp quyền.

Có 3 chế độ Khám phá/Phân tích/Trình chiếu. 79 bài có diễn biến thời gian; các bài còn lại khảo sát bằng thông số. Bảng đo, ghi chép, yêu thích và lịch sử được lưu **trên từng trình duyệt**, không có máy chủ đồng bộ. Chuyển tên miền không tự chuyển dữ liệu cũ: hãy xuất phiên JSON ở website cũ và nhập lại ở bài tương ứng trên website mới.

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

## Gemini — kết nối phía máy chủ cho người dùng từ 18 tuổi

`server/ai-handler.mjs` hỗ trợ Gemini bên cạnh OpenAI. Chatbox không tải mô hình về máy người dùng. Cấu hình trên **máy chủ**: `AI_PROVIDER=gemini`, `GEMINI_MODEL=gemini-3.8-flash`, và secret `GEMINI_API_KEY`. Có thể đổi `GEMINI_MODEL` sang một mô hình Gemini được tài khoản cấp quyền. Không tự đổi nhà cung cấp hoặc gọi API trả phí khác khi hết hạn mức.

Tạo khóa trong Google AI Studio tại https://aistudio.google.com/api-keys rồi lưu bằng phần quản lý secret của môi trường chạy server. Tuyệt đối không chèn khóa vào `dist/`, `ai-config.js`, GitHub Pages, commit, ảnh chụp màn hình hoặc cuộc trò chuyện. Server cũng hỗ trợ `GEMINI_API_KEY_ENCRYPTED` với cơ chế RSA/D1 đang dùng nếu môi trường đã thiết lập cơ chế này. Chỉ cần một trong hai dạng khóa Gemini.

Chạy server Node.js 24 với một tệp biến môi trường riêng, đã được gitignore, bằng `node --env-file=.env.local server/start.mjs`. Chỉ endpoint HTTPS `/api/chat` của server được đưa vào `dist/ai-config.js`. GitHub Pages không thực thi server; backend cần cho phép khách dự kiến truy cập và giữ CORS theo nguồn website. Backend Sites hiện vẫn riêng tư và endpoint frontend còn trống: **chưa có kết nối Gemini hoạt động trên website công khai**.

Luồng Gemini gửi câu hỏi, lịch sử và ngữ cảnh của bài đang mở; API server giữ khả năng nhận ảnh đã được kiểm tra định dạng. Panel hiện tại vẫn chỉ nhập câu hỏi và gửi. Khóa chỉ đi trong header đến Google, không nằm trong URL. Câu trả lời bị chặn, rỗng, cắt dở, lỗi quyền truy cập hay hết hạn mức đều trả lỗi rõ ràng; không hiển thị câu trả lời mô phỏng thay thế.

Theo phạm vi chủ website xác nhận, tính năng Gemini dành cho người từ 18 tuổi. Nếu đổi sang phục vụ người dưới 18 tuổi, phải xem lại nhà cung cấp và điều khoản. Hạn mức miễn phí phụ thuộc mô hình và tài khoản; không đồng nghĩa dùng không giới hạn. Dữ liệu ở gói miễn phí có thể được Google dùng để cải thiện dịch vụ; tránh gửi dữ liệu cá nhân, nhạy cảm. Tài liệu chính thức: https://ai.google.dev/gemini-api/terms, https://ai.google.dev/gemini-api/docs/pricing, https://ai.google.dev/gemini-api/docs/api-key.

`npm run check:assistant` kiểm tra cả panel, luồng OpenAI hiện có và adapter Gemini. Gemini đã được kiểm tra bằng fixture cho định dạng yêu cầu/phản hồi, lịch sử, ảnh, thay khóa, lỗi hạn mức, khóa sai, mô hình không khả dụng, nội dung bị chặn, phản hồi rỗng/cắt dở, dữ liệu upstream sai và timeout. Chưa có khóa Gemini trong môi trường nên chưa kiểm thử suy luận Gemini thật hay chất lượng câu trả lời. Không thay đổi 300 thí nghiệm, mô hình, dữ liệu hoặc font trong đợt này.

### Nhập khóa Gemini riêng tư

Backend Sites đã có trang `/setup/gemini`, chỉ mở trong lúc Site được xác nhận owner-private và `GEMINI_SETUP_ENABLED=1`. Trang nhập kiểu password mã hóa khóa bằng RSA-OAEP trong trình duyệt, kiểm tra metadata mô hình tại Google, rồi lưu ciphertext tạm thời tối đa một giờ. Agent chuyển ciphertext qua native Sites vào runtime secret và tắt cờ thiết lập trước khi cân nhắc chia sẻ backend. Không gửi khóa trong ảnh hoặc cuộc trò chuyện. Chưa có khóa mới hoặc suy luận Gemini thật được kiểm tra. `checks/gemini-setup.mjs` chỉ dùng khóa tổng hợp.
