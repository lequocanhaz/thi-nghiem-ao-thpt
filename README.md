# Vật lí Lab · 300 bài khảo sát

Website thí nghiệm Vật lí tiếng Việt cho lớp 10–12 và các bài mở rộng có nhãn. Mã nguồn độc lập HTML/CSS/JavaScript, Three.js và tài nguyên âm thanh/font đóng gói trong `dist/`. Không cần máy chủ ứng dụng hay khóa API khi chạy.

Website: https://lequocanhaz.github.io/thi-nghiem-ao-thpt/

## Xuất bản bằng GitHub Pages

1. Tạo repository mới, ví dụ `thi-nghiem-ao-thpt`, trên tài khoản của bạn. Đưa **nội dung bên trong thư mục này** lên nhánh `main`, gồm cả `.github/workflows/pages.yml` và toàn bộ `dist/`.
2. Mở **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Mở **Actions**, chạy workflow “Kiểm tra và xuất bản website” hoặc đẩy một commit mới lên `main`.
4. Chỉ khi workflow và bước triển khai thành công, lấy đường dẫn thật trong trang Pages hoặc kết quả deployment. Kho này đã được cấu hình GitHub Pages; lần triển khai đầu tiên thành công ngày 16/10/2026.

GitHub Free hỗ trợ Pages từ repository công khai; Pages từ repository riêng tư phụ thuộc gói tài khoản. Chọn Public đồng nghĩa người khác có thể đọc và tải mã nguồn. Tài liệu chính thức: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

## Chỉnh sửa về sau

- Giao diện: `dist/interface.css`, `dist/views.js`, `dist/app.js`.
- Dụng cụ/3D: `dist/scene3d.js`, `dist/apparatus.js`, `dist/banner.js`, các tệp `*-scenes.js`.
- Nội dung và mô hình: các tệp `*-catalog.js`, `dist/models.js`, `dist/physics.js`.
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

Chi tiết bằng chứng kiểm tra ở `checks/verification-v14.md`. Đã kiểm tra mã/DOM, số liệu và hình học; chưa kiểm tra GPU, chạm thật, trình đọc màn hình hay thẩm định phát âm bằng loa trên thiết bị. GitHub Actions đã chạy thành công bộ kiểm tra mã/DOM và triển khai lên GitHub Pages ngày 16/10/2026.

Nguồn cấu hình Pages: https://github.com/actions/starter-workflows/blob/main/pages/static.yml
