# Tinh chỉnh workspace và thư viện v80

Phạm vi riêng của agent UI: `dist/workspace-polish-v80.css`. Không sửa JavaScript, header, hồ sơ, `app.css`, banner, renderer, dữ liệu hay ảnh mô hình.

## Hướng trình bày

- Mô hình giữ khung ngoài duy nhất và diện tích đang có. Thanh đổi chế độ/công cụ nhẹ, Chạy dùng xanh đặc và Ghi điểm có viền xanh/nền nhạt; nút camera và công cụ phụ lùi về màu trung tính.
- Thông số dùng tiêu đề, khoảng trắng và divider thay cho nhiều hộp lồng nhau. Giữ giá trị trực tiếp, slider, giới hạn, preset và phần mở rộng. Dock kết quả giữ một khung ngoài; bảng/đồ thị bên trong dùng đường phân cách.
- Mobile giữ cùng node số đọc do v79 di chuyển và thanh điều hướng dưới. Số đo nổi bật bằng typography, không thêm số liệu hay sửa đơn vị.
- Thẻ thư viện giữ thumbnail gốc và metadata; tăng thứ bậc tên/mô tả và phân biệt Mở thí nghiệm với Xem trước. Không thay phân loại hay số lượng bài.

## Kiểm tra

Ảnh trước/sau và phép đo Chromium/SwiftShader nằm trong `work/ui80/`. Việc kiểm tra ở đây chỉ chứng minh hiển thị trong trình duyệt mô phỏng, không thay thế Safari/iPhone/Android hay hiệu năng GPU thật. QA độc lập kiểm bản ghép sau khi root gắn stylesheet và header mới.

## Kết quả vòng riêng UI

- Trước/sau ở 390 và 1440 px: thư viện và Ohm không tràn ngang; thumbnail giữ `contain` nên không cắt dụng cụ. Card mẫu ở `work/ui80/card1440.png`.
- Bounded checks Ohm ở 320/768/1024 px: không tràn ngang; nút/summary thực sự hiển thị đạt 44 × 44 px. Canvas 1440 vẫn ~960 × 600 px; canvas 390 vẫn 364 × 360 px như trước. CSS không đặt kích thước mới cho canvas.
- Giao diện tối: kiểm liên hệ dao động 390 và thư viện 1440. Sửa specificity của night theme cũ để Ghi điểm giữ màu viền/tint và thông số không khôi phục khung xám lồng.
- Bằng chứng: `work/ui80/remaining.json`, `bounds.json`, `dark-final.json`, các PNG trước/sau. Các ảnh riêng UI chụp bằng stylesheet được inject trước khi root ghép header, nên không coi đây là nghiệm thu header v80.

Không chạy lại toàn bộ npm check và không commit/push từ agent UI; agent chính điều phối kiểm tra hợp nhất và phát hành.
