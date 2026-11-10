# UI/UX v79 — workspace và thành phần giao diện

Phạm vi: đặc tả Phase 01 của chủ dự án ngày 10/11/2026. CSS mới nằm trong `dist/ui-foundation-v79.css`; không sửa `app.css`, banner, renderer, phương trình, dữ liệu học liệu hay dữ liệu phiên.

## Các sửa đổi

- P0: chuẩn hóa nút, summary, select và ô nhập số trong phòng thí nghiệm ở chiều cao tối thiểu 44 px; nút đổi 2D/3D và camera có chiều rộng tối thiểu 44 px. Nhãn thông số 14 px, ô số 16–18 px; giá trị, đơn vị và giới hạn sẵn có được giữ.
- P0: tiêu đề dài, breadcrumb, bộ chọn thí nghiệm, thanh công cụ và nút điều hướng cho phép xuống dòng. Panel thông số tablet không còn vùng cuộn lồng bị giới hạn 56vh.
- P0/P1: bảng cuộn trong khung riêng; vùng dữ liệu, biểu đồ và các cột có min-width 0. Tab dữ liệu mobile xuống dòng với nhãn 13 px; tránh ép năm nhãn vào năm ô hẹp.
- P1: hiện lại các nhãn tương tác được sinh từ metadata hiện có; không phân loại mới dựa trên tên bài. Nhóm chọn thư viện có trạng thái chọn bằng chữ đậm và đường nhấn ngoài màu nền.
- P2: focus bàn phím 3 px, scroll margin tránh thanh công cụ cố định; forced-colors dùng Highlight. Reduced motion chỉ áp dụng chrome giao diện, không tắt chuyển động mô phỏng khoa học.

## Bố cục

Desktop giữ mô hình và thông số bên cạnh nhau, giữ resizer. Mobile giữ mô hình và playback ở đầu; agent chính tổ chức cùng node thông số/số đọc/dữ liệu theo luồng thao tác. CSS hỗ trợ `.experiment-work > .readouts` khi node số đo được chuyển ra sau thông số; không sao chép node có trạng thái.

## Kiểm tra trực quan

Bằng chứng Chromium/SwiftShader ở `work/ui79/` (không đưa tài nguyên tạm vào git). Script `work/ui79/audit.py` đo overflow, target thực sự hiển thị và độ cao vùng mô hình ở thư viện/định luật Ohm, các viewport 320/360/390/768/1024/1440. Nội dung trong details đóng được loại khỏi phép đo target.

Ảnh bổ sung: `dark-oscillation390.png` kiểm giao diện tối và mô hình SVG liên hệ dao động. `.stage-viewport` có `display:contents` trong chế độ này nên bounding rect bằng 0; ảnh xác nhận SVG vẫn hiển thị và không suy ra canvas bị mất từ rect wrapper.

Đo trực tiếp: thư viện và Ohm không tràn ngang ở 320/360/390/768/1024/1440 px; các nút/summary header và lab thực sự hiển thị ở 320/360/390/768 px đạt 44 px. Desktop 1440 có canvas ~960 × 600 px, thông số hiển thị cùng mô hình. Kiểm phóng đại bằng CSS zoom 200% tại viewport 1024 không tràn ngang; đây là phép thử xấp xỉ, không thay thế browser zoom thật.

Một lượt kiểm lens và một lượt Ohm 1024 trong cùng browser context timeout chờ `#visual canvas`; những lượt đó không được tính đạt. Ohm 1024 thử lại bằng browser mới có canvas 3D và không tràn ngang. QA độc lập phụ trách ma trận cuối sau khi ghép thay đổi JS và các khu vực khác.

Không coi kiểm DOM, viewport cảm ứng, zoom CSS hoặc SwiftShader là nghiệm thu Android/iPhone/Safari thật, bàn phím ảo thật hay hiệu năng GPU. Không có chỉnh sửa hằng số, mô hình hoặc preview nên không tuyên bố nghiệm thu khoa học.
