# Quanh Lab — hệ thống giao diện v59

Phạm vi: giao diện HTML/CSS/ES modules hiện hữu. Không đổi logo, phông chữ, ảnh xem trước, video hố đen, dữ liệu sách hoặc phương trình để đạt hiệu ứng thị giác. Đây là chuẩn đang áp dụng và nền tảng để tiếp tục hợp nhất CSS; không tuyên bố toàn bộ stylesheet lịch sử đã được viết lại.

## Tokens

Các token mới được khai báo trên `body` trong `dist/app.css`; các định nghĩa nhận diện ban đầu được bảo toàn.

| Nhóm | Token | Giá trị |
|---|---|---|
| Chữ | `--ql-ink`, `--ql-secondary` | `#101318`, `#4b5563` |
| Nền | `--ql-surface`, `--ql-subtle` | `#fff`, `#f5f7fa` |
| Viền | `--ql-border` | `#dce1e8` |
| Hành động, focus | `--ql-action`, `--ql-focus` | `#111214`, `#2459d8` |
| Bo góc | `--ql-radius-control/card/dialog` | 8 / 16 / 20 px |
| Khoảng cách | `--ql-space-1/2/3/4/6/8/12` | 4 / 8 / 12 / 16 / 24 / 32 / 48 px |
| Chữ | `--ql-caption`, `--ql-body` | .8125rem / 1rem |
| Tiêu đề mục | `--ql-section` | `clamp(26px,3vw,36px)` |

Manrope tự phục vụ tiếp tục là phông chính. Số đo dùng chữ số tabular. Giữ nguyên LaTeX, MathML và đơn vị SI. Màu chủ đề hiện hữu `--accent`/`--soft` được dùng trong phạm vi thẻ/chủ đề; không thêm palette neon hoặc gradient trang trí.

## Components và hành vi

- **Header:** nhận diện bên trái; thư viện, sách, hướng dẫn, trợ lý, VI/EN và cài đặt luôn truy cập được. Mobile hai hàng, các nút locale có vùng chạm ít nhất 44×44 px.
- **Nút:** một hành động chính mỗi ngữ cảnh; hành động phụ dùng secondary/ghost. Hover, pressed, disabled và focus được giữ. Ngôn ngữ hành động nêu rõ hậu quả.
- **Thư viện:** tìm kiếm có nhãn; hỗ trợ tiếng Việt có/không dấu, tiếng Anh, hiện tượng, tham số và một bộ alias dụng cụ có chọn lọc. Lớp, chủ đề và bộ lọc đang dùng luôn nhìn thấy; lựa chọn nâng cao nằm trong native `details`. Không suy diễn liên kết bộ sách khi chưa có dữ liệu.
- **Thẻ:** giữ slot ảnh và công thức thật. Liên kết tiêu đề/nút mở riêng với nút yêu thích; vùng công thức dài có thể focus và cuộn bằng bàn phím, tránh tương tác lồng nhau trong liên kết.
- **Không gian mô phỏng:** nhóm công cụ nằm ngoài hình vẽ. Mobile ưu tiên quan sát mô hình trước dãy điều khiển dài. Desktop dãy điều khiển được thu gọn khi có đủ chiều rộng. Giữ 2D/3D, zoom, camera thủ công và nút Vừa mô hình.
- **Dialog dữ liệu:** xóa bảng hoặc nhập đè phiên cần xác nhận rõ số dòng và hậu quả, ưu tiên focus nút giữ dữ liệu; có tải bản sao và khôi phục bảng vừa xóa.
- **Sách:** nhãn trường luôn hiện, phân biệt số trang tệp và trang in; có loading, lỗi inline/thử lại, phím điều hướng giới hạn trong vùng đọc, fullscreen fallback có focus/Tab/Escape.
- **AI:** vai trò tin nhắn, đang trả lời/lỗi/hủy/timeout được phân biệt; giữ bản nháp và ảnh khi thất bại. Trên cảm ứng, Enter xuống dòng và nút Gửi gửi yêu cầu.
- **Trang thông tin sản phẩm/thí nghiệm:** `product.css` là stylesheet nhỏ cho nội dung tĩnh, dùng cùng phông, màu, nhịp khoảng cách và hình logo; không tải engine mô phỏng hoặc tracker.

## Accessibility và responsive

Quy tắc thiết kế: focus rõ, nhãn có nghĩa, reduced motion, không dùng màu làm tín hiệu duy nhất và không yêu cầu kéo là cách điều chỉnh duy nhất. Bộ kiểm trình duyệt dùng 320/375/390/414/430/768/1024/1440/1920 px và một số màn hình ngang. Kiểm axe tự động có phạm vi được ghi trong báo cáo phát hành; không tương đương chứng nhận WCAG 2.2 AA hoặc thử screen reader/thiết bị thật.

Skill UI/UX Pro Max được dùng theo các nguyên tắc đã đọc. Bundle tìm kiếm của skill không có trong executor; không trình bày đây là kết quả tra cứu cơ sở dữ liệu design-system. Các lựa chọn trên được kiểm với sản phẩm hiện hữu và bằng chứng trình duyệt.
