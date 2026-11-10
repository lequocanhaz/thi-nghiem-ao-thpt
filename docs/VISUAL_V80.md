# Quanh Lab — tinh chỉnh giao diện v80

Yêu cầu: tiếp tục làm gọn header, rõ phân cấp phòng thí nghiệm, bớt khung lồng nhau, cải thiện thẻ thư viện và hồ sơ. Đây là chỉnh giao diện hiện hữu, không thay nhận diện hoặc mô hình.

## Hướng thiết kế trước khi triển khai

- Palette: nền #FFFFFF, mặt phụ #F3F6FB, chữ #18212E, chữ phụ #526176, viền #D8DEE7, hành động/focus #245BD7; giữ bảng màu khoa học/ảnh gốc. Theme tối có cặp nền/chữ riêng.
- Type: giữ Manrope tự phục vụ; tiêu đề/mô hình có trọng tâm, nhãn phụ thấp hơn một cấp, không thêm font trang trí.
- Bố cục: header có Thư viện/Sách/AI là điểm đến chính, tài khoản luôn hiện, tiện ích ở native details; màn hình điện thoại có brand+tài khoản+tùy chọn trên, ba điểm đến rõ chữ dưới. Phòng thí nghiệm giữ một khung mô hình chính, thông số nhẹ viền phân cách, hành động Chạy/Ghi điểm dễ thấy. Hồ sơ ưu tiên avatar/tên/email rồi một vùng sửa tên.
- Đã tự đối chiếu: tránh chia mọi thông tin thành card giống nhau; giữ nét đặc trưng Quanh Lab ở mô hình/ảnh/brand, không thêm gradient hoặc hoạt ảnh trang trí. Các đường kẻ còn lại phục vụ nhóm thao tác.

## Thực hiện

Header dùng lại nút/link gốc, không clone để giữ listener, auth state, lựa chọn ngôn ngữ và AI opener. Chờ locale/account/theme mount trước khi chuyển node. Menu hỗ trợ Escape/ngoài menu và không giữ focus như modal; account và AI vẫn truy cập trực tiếp. Thứ tự DOM đổi theo breakpoint để Tab theo thứ tự hiển thị. Trang sách dùng cùng pattern nhưng chỉ hiển thị tiện ích thật sự có.

CSS workspace/card riêng, giữ mô hình/camera/ảnh/banner và dữ liệu. CSS profile riêng, chỉ thay bố cục và phân cấp; giữ xác thực và lưu tên như v79.

## Phạm vi và kiểm tra

- Agent ui thực hiện riêng workspace/card, kiểm trước/sau 390/1440 và bound 320/768/1024, sáng/tối; canvas giữ diện tích gốc. Xem VISUAL_V80_UI.md.
- Agent textbook rà soát chỉ đọc 8 trường hợp shelf/reader tại320/390/768/1440: chọn ngôn ngữ/theme/đọc trang/AI vẫn đúng và không tràn header.
- Agent ai rà soát chỉ đọc lab và sách390 coarse pointer: nút AI gốc giữ listener/ngữ cảnh/draft/focus khi resize; menu mở không chặn AI sau sửa vị trí dropdown.
- Agent qa tạo header-ui-v80.mjs kiểm mount muộn, giữ node/listener, thứ tự DOM theo breakpoint, locale/theme, Escape/outside, active destination, observer ổn định. LinkeDOM không tôn trọng bộ lọc childList cho attribute trong MutationObserver, test lọc record theo hành vi trình duyệt; không đổi runtime vì đặc tính mô phỏng này.
- Root kiểm trực quan profile sáng/tối390: dialog trong viewport, danh tính lớn hơn, form quản lý yên hơn; Firebase/AI thật không được gọi để ghi dữ liệu trong các fixture.

Các CSS mới chỉ nằm trong phạm vi header/workspace/card/profile. Banner, phương trình, renderer, metadata,300 route và388 trang sách được giữ. Header tiếp tục ẩn khi trình chiếu và in. Bộ hồi quy đầy đủ và GitHub Actions phải đạt trước phát hành. Chromium/SwiftShader, viewport/reflow và fixtures không thay nghiệm thu thiết bị thật hay Safari.

## Kết quả bản ghép cuối

QA tổng hợp64/64PASS và0pageerror:56 trường hợp header (320/360/390/768/1024/1440, sáng/tối, VI/EN, thư viện/sách, thêm720×450DPR2),4 luồng thao tác sâu và4 lab. Input số16px, tương phản21:1 sáng và11.17:1 tối; avatar được đo>=24px và không bịclip. Present/print ẩnheader, thoát trở lại bình thường; utility Escape/outside và original listener được kiểm thực. Báo cáo có provenance trong work/visual-v80/report.json, không tính các timeout do harness chờ nhầm locale ẩn là kết quả đạt.

Bộ Node/DOM mới chạy trong npm check; các phép thử trình duyệt dùng Firebase/AI fixtures và reflow mô phỏng. Không khẳng định OAuth hay inference thật, Safari hoặc thiết bị vật lý đã được nghiệm thu. Banner/media/mô hình/dữ liệu và cơ chế chat v79 không đổi.

Xác nhận trước phát hành: `npm run check` hoàn tất exit0 trên Node24, `node checks/site-security-v63.mjs` đạt, `git diff --check` đạt. Source được fetch main trước push; tài nguyên KaTeX và báo cáo audit sinh cục bộ không đưa vào commit.
