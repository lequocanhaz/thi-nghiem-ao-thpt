# Quanh Lab — triển khai đặc tả UI/UX Phase 01 v79

Nguồn: “Đặc tả hoàn thiện giao diện & trải nghiệm người dùng”, phiên bản 1.0 ngày 10/11/2026 do chủ dự án cung cấp; yêu cầu triển khai theo P0 → P1 → P2. Đối chiếu với main c14c259 trước sửa, không coi mọi mục đề xuất trong tài liệu là lỗi đã được quan sát.

## Quyết định thiết kế và inventory

Giữ Manrope tự phục vụ, logo, banner hố đen, ảnh mô hình và palette trung tính sáng/tối đã có. Indigo/xanh lá trong Word là gợi ý, không thay đồng loạt màu nhận diện/khoa học. Dùng các token sẵn có `--ql-*`, `--ux-*` và thêm token mục tiêu chạm/nhãn/focus trong `ui-foundation-v79.css`. Bo góc/spacing tiếp tục theo hệ thống đang chạy.

| Màn hình | Hiện trạng đối chiếu | Thay đổi |
|---|---|---|
| Thư viện | Có tìm kiếm không dấu, lớp/chủ đề, bộ lọc nâng cao, trạng thái rỗng, thử lại ảnh, phân trang | Hiện nhãn loại hoạt động từ metadata hiện có; vùng chạm và focus rõ hơn |
| Thí nghiệm | Có mô hình, thông số mở mặc định, số đo, bảng, đồ thị, 2D/3D, zoom, toàn màn hình | Mobile dùng cùng node số đo sau thông số; desktop/fullscreen đưa node về khung mô hình; tăng vùng chạm/cỡ nhãn, giới hạn cuộn bảng |
| Sách | Đủ 388 trang, 85 bài mục lục; lưu vị trí đọc, loading/error/retry | Hiện tên bài/chương đang đọc ngoài select hẹp; “Đọc tiếp” dùng trang đã lưu thật; chỉ cho chọn hai trang khi khả dụng |
| Trợ lý | Có thread/draft/ảnh riêng theo thí nghiệm; không tự mở bàn phím cảm ứng | Giữ lỗi/scroll khi render và mở lại; chặn phím tác động lab phía sau; thêm AI theo ngữ cảnh sách |
| Tài khoản | Có hồ sơ/đổi tên/đăng xuất từ v78 | Hiện ảnh Google do Firebase trả về, fallback chữ cái khi thiếu/lỗi; URL HTTPS Google allowlist |

Tài liệu Word mô tả 300 thí nghiệm; bản live đã tuyển chọn 40 bài chính + 260 bài bổ trợ từ v77. Giữ cả 300 route/ảnh/bài học và cách phân nhóm hiện tại, không phục hồi danh mục dày chỉ để khớp mô tả cũ.

## Backlog theo ưu tiên

| Mã | Mức | Xử lý trong bản này | Kiểm chứng |
|---|---|---|---|
| UX-01 / LIB-01 | P0 | Header và tài khoản giữ lối truy cập; vùng chạm/nhãn rõ | Đo header theo viewport; profile fixtures |
| UX-02 / LAB-02 | P0 | Tiêu đề/công cụ co giãn, input/table/graph nằm trong khung; giữ diện tích mô hình | Chromium sáu viewport; kiểm resize/fullscreen |
| UX-03 | P0 | Mobile mô hình → thông số → số đo → dữ liệu; cùng DOM/state | Kiểm node identity, giá trị và dòng đo qua resize |
| UX-04 / LAB-03–05 | P0 | Điều khiển chính ≥44px, nhãn14px, ô số16–18px; giữ đơn vị/giới hạn | Browser đo target, regression tham số/ghi số liệu |
| UX-05 / LIB-08 | P0 | Giữ loading/empty/error/retry thật; sửa lỗi AI bị mất khi render, tăng readability/focus | Search empty/reset, auth/AI error fixtures, theme checks |
| UX-06 | P1 | Nhãn hoạt động từ dữ liệu thật, lựa chọn thư viện và focus nhất quán | Library selection/search tests và ảnh |
| UX-07 | P1 | Sách: tên bài hiện rõ, đọc tiếp đúng trang, trạng thái hai trang trung thực | book-ux-v79 + book/touch/capture regression |
| UX-08 | P1 | AI giữ lỗi/scroll/draft từng ngữ cảnh; hỗ trợ sách/trang/bài; nút bỏ ảnh44px | assistant-ux-v79 + Chromium fixtures |
| UX-09 | P1 | Ảnh Google thật từ snapshot, fallback an toàn | profile-avatar-v79 + load/error browser fixtures |
| UX-10 | P2 | Focus3px, forced colors, reduced motion cho UI, target ảnh và thông báo | CSS/media + bàn phím/scroll kiểm trực tiếp |

## Bố cục và component rules

- Desktop: canvas chính + thông số bên cạnh, vùng dữ liệu có thể mở rộng; không clone điều khiển hoặc renderer.
- Mobile: một cột, toolbar chuyển tới Mô hình/Thông số/Dữ liệu; bảng có cuộn riêng; tab dữ liệu xuống dòng thay vì chữ quá nhỏ.
- Sách: lớp/mục lục + dòng tên bài đọc, toolbar trang/zoom với nút thay cử chỉ, trạng thái tải/lỗi và vị trí đã lưu.
- AI: tên ngữ cảnh và số trang từ metadata; nội dung trang quét chỉ được phân tích khi người dùng gửi ảnh/trích đoạn. Không tạo câu trả lời giả.
- Tài khoản: ảnh Google của tài khoản đang đăng nhập; không hiển thị email/hồ sơ ra vùng công khai. Không tải ảnh từ URL tùy ý.

## Nghiệm thu và giới hạn

Agent ui phụ trách nền giao diện và responsive; textbook phụ trách sách; ai phụ trách trợ lý; qa kiểm thử các luồng ghép; agent chính ghép entry/cache, bố cục mobile, avatar và kiểm tra phát hành. Các báo cáo/ảnh browser được sinh dưới `work/` để tránh đưa tài nguyên tạm vào source.

Chạy `npm run check` và `node checks/site-security-v63.mjs` trước phát hành. Bộ browser bổ sung: `python3 checks/browser-ui-spec-v79.py` với server4173. Ma trận 320/360/390/768/1024/1440: 30/30 trường hợp; thêm5/5 kiểm reflow720×450CSSpx/DPR2 tương ứng diện tích1440×900 ở mức phóng200%, không đánh đồng với thao tác zoom thật của trình duyệt. Kiểm bổ sung5/5 trường hợp chữ tính toán tăng gấp đôi,6/6 mẫu dao động/thấu kính2D–3D,2/2 kiểm sâu số đo/avatar,2/2 header sách sau sửa cuối. Không có lỗi JavaScript trong các báo cáo này.

Lượt thử ban đầu dùng root CSS `zoom:2` tạo khác biệt giữa kích thước dvh và kích thước dialog, làm hộp tài khoản vượt viewport; lỗi tiếp theo ở chat do hộp tài khoản còn mở. Giữ nguyên kết quả thô tại work/ui-spec-v79-csszoom-raw, không tính là trường hợp đã đạt. Báo cáo cuối ghi provenance và tách phép thử này khỏi reflow/đọc chữ lớn. Chưa có chứng nhận browser-toolbar zoom thật.

Các điểm chưa thể nghiệm thu đầy đủ:

- Android/iPhone/Safari thật, bàn phím ảo và GPU thiết bị thật chưa có trong môi trường này; viewport/SwiftShader không thay thế thiết bị.
- OAuth Google, ghi tên Firebase và inference AI production không dùng tài khoản người dùng để nghiệm thu; bài test dùng transport/SDK fixtures, không báo là giao dịch thật.
- Hội thoại/draft/ảnh giữ theo ngữ cảnh trong bộ nhớ từng trang. Điều hướng tải toàn bộ trang hoặc reload chưa có cơ chế đồng bộ hội thoại; không thêm hệ lưu trữ chat/backend vì nằm ngoài phạm vi đặc tả.
- Giữ banner chuyển động và mô phỏng khoa học hiện có; reduced motion mới chỉ scope vào chrome giao diện. Không tuyên bố toàn website đã được chứng nhận WCAG AA.
- Giữ nguyên khoa học/dữ liệu; kiểm UI mẫu và regression300 bài không phải thẩm định khoa học độc lập hay pixel-level cho mọi mô hình.
