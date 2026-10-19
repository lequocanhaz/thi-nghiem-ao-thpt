# Thư viện và công cụ lớp học · v49

Giữ nhận diện ManropeVariable/quanh-mark.svg, 300 mô hình Vật lí, ba sách/388 trang, banner video, công thức, bảng đo và phiên lưu hiện có.

## Thay đổi

- `index.html` có thư viện HTML tĩnh và liên kết sách ngay trước khi JavaScript tải. Giữ skip-link, `#main`, dialog và live status. Thêm canonical, Open Graph, Twitter Card và liên kết logo `./`.
- `boot.js` không chờ font trước khi khởi động. Lỗi tải ứng dụng vẫn giữ thư viện và hiện nút thử lại.
- `coordinate-profile.js` tách metadata hệ trục khỏi lớp dựng hình. `lab-loader.js` chỉ tải renderer khi mở thí nghiệm, có timeout 15 giây, retry và tiến trình theo số mô-đun thực sự hoàn tất (0/2, 1/2, 2/2), không phải phần trăm byte tải hay bộ đếm thời gian giả.
- Sau lỗi tải mô-đun, nút thử lại lưu phiên rồi tải lại trang để loại bỏ module import lỗi được trình duyệt cache. Lỗi WebGL có thể thử lại tại chỗ.
- Thẻ thư viện dùng cache ảnh đã có hoặc khung tên nhẹ; chỉ sinh ảnh mới từ mô hình khi renderer đã được tải sau lần mở bài đầu tiên. Giữ logic sinh thumbnail từ chính mô hình.
- Bộ lọc kết hợp môn/lớp/bộ sách, tìm kiếm tức thì, xử lý composition tiếng Việt và URL chia sẻ có hỗ trợ Back/Forward. Badge có môn, lớp và hình thức tương tác.
- Thanh công cụ nổi có đặt lại camera, trình chiếu và hướng dẫn native `details`. Hướng dẫn dùng dữ liệu mục tiêu/bước làm/công thức/giải thích/điều kiện của từng bài. Trình chiếu dùng chế độ có sẵn, ẩn header/footer, tăng chữ và nhãn mô hình; Escape đóng hướng dẫn trước khi thoát trình chiếu. Không sửa thông số hoặc xóa bảng đo.
- Khi chuyển tab, đang chạy sẽ tạm dừng và báo cho người dùng; không tự chạy tiếp. Cửa sổ xem trước có thêm mục tiêu học tập.

## Phạm vi dữ liệu

Kho hiện có **300 bài Vật lí**. Hóa học/Sinh học chưa có bài. Chưa có đối chiếu bài theo từng bộ sách, nên chọn một bộ sách sẽ có trạng thái không tìm thấy cùng ghi chú phạm vi. `catalog-filters.js` nhận `subject` và mảng `bookSeries` khi có dữ liệu đối chiếu; không tự suy ra sách từ khối lớp hay chủ đề GDPT 2018. Ba sách Kết nối tri thức ở thư viện sách được giữ riêng.

## Kiểm tra

`npm run check` gồm kiểm tra mới `checks/startup-library-v49.mjs` và các ca DOM mới trong `checks/dom.mjs`. Kiểm tra timeout/offline/retry của loader, graph import trang chủ không có Three.js, SEO/accessibility, lọc kết hợp, IME, công cụ sư phạm, giữ số liệu và tạm dừng tab ẩn.

Kiểm tra trình duyệt tùy chọn dùng Playwright 1.64.1 và Chromium hệ thống. Cài công cụ bên ngoài checkout, không sửa lockfile dự án:

```sh
npm install --prefix /tmp/quanh-browser-tools --ignore-scripts --no-save --package-lock=false playwright@1.64.1
# Khởi động server static trong một terminal riêng, từ gốc kho:
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
# Từ terminal khác:
PLAYWRIGHT_MODULE=/tmp/quanh-browser-tools/node_modules/playwright/index.mjs node checks/browser-library-v49.mjs
```

Bộ browser kiểm tra thư viện không tải WebGL, lọc và URL, mở bài Ohm/canvas, reset camera, teacher/guide/Escape, bề rộng 390 px, timeout 15 giây/retry giữ bảng đo, WebGL unavailable dùng Canvas 2D và lỗi app giữ HTML tĩnh. Nó dùng Chromium headless với SwiftShader; không chứng minh GPU phần cứng, iPhone/Safari, cảm ứng thật hoặc toàn bộ 300 bài đã được xem trực quan. Chưa xác minh crawler Zalo/Facebook hay triển khai công khai.
