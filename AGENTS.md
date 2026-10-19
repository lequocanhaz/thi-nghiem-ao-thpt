# Quanh Lab — hướng dẫn làm việc

Đọc `CODEX_HANDOFF.md` trước khi thay đổi. Đây là dự án có sẵn đang phát hành trên GitHub Pages, không phải yêu cầu tạo web mới.

- Giao tiếp với người dùng bằng tiếng Việt.
- `dist/` chứa mã nguồn frontend buildless và tài nguyên đang phục vụ. Không xóa nó như một thư mục build.
- Node.js 24. Cài `npm ci --ignore-scripts`, rồi KaTeX ghim theo workflow hiện tại; xem bàn giao để chuẩn bị tài nguyên khi xem trước. Chạy kiểm tra phù hợp, `npm run check` trước thay đổi runtime cần triển khai.
- Đọc `package.json` và `.github/workflows/pages.yml` thay vì đoán lệnh build/deploy.
- Giữ đủ 300 bài, công thức/đơn vị, âm thanh, 388 trang sách, mục lục từng bài và dữ liệu phiên người dùng. Áp dụng sửa chung khi lỗi ảnh hưởng cả danh mục.
- Kiểm tra Node/DOM/CPU không phải kiểm thử trình duyệt, cảm ứng thật hoặc Safari. Nêu rõ phạm vi đã kiểm tra.
- Fetch nhánh chính trước khi xuất bản, giữ thay đổi đồng thời; không force-push hoặc reset cứng để ghi đè.
- Giữ backend/khóa AI ở máy chủ. Không cần khóa để chạy frontend và kiểm tra bằng fixtures.
- Đọc các quy tắc môi trường hiện hành trước khi dùng công cụ xem trước hoặc trình duyệt; không sao chép giới hạn của một môi trường cũ sang môi trường khác.
