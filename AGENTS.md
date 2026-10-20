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

- Theo yêu cầu của chủ dự án: sau khi hoàn tất thay đổi và kiểm tra đạt, tự commit và đẩy lên GitHub nhánh `main`, không hỏi xác nhận lặp lại. Fetch trước khi đẩy, giữ thay đổi đồng thời và chỉ đưa các tệp thuộc công việc vào commit; không đưa khóa hoặc tài nguyên KaTeX sinh cục bộ vào git. Theo dõi GitHub Actions/Pages và chỉ báo đã cập nhật web khi triển khai thành công.

## Điều phối Multi-Agent Quanh Lab

Dự án có 5 sub-agent chuyên biệt được khai báo trong `.codex/config.toml`:

- `physics`: Kiểm tra mô hình Vật lí, phương trình, đơn vị, đồ thị, số liệu và tính chính xác khoa học.
- `ui`: Kiểm tra giao diện, không gian thí nghiệm 2D/3D, camera, zoom, responsive và cảm ứng.
- `textbook`: Phụ trách sách giáo khoa Vật lí 10/11/12, lật trang, mục lục theo bài và điều hướng.
- `ai`: Phụ trách trợ lý AI, backend, bảo mật API và hiển thị công thức LaTeX/KaTeX.
- `qa`: Kiểm thử, phát hiện lỗi hồi quy, đánh giá phạm vi kiểm tra và xác nhận chất lượng.

Quy trình làm việc:
1. Agent chính đọc `AGENTS.md`, `CODEX_HANDOFF.md` và xác định phạm vi yêu cầu trước khi giao việc.
2. Giao nhiệm vụ cho sub-agent phù hợp khi công việc cần chuyên môn độc lập. Không gọi cả 5 agent nếu nhiệm vụ chỉ liên quan một lĩnh vực.
3. Với thay đổi ảnh hưởng mô hình Vật lí hoặc dữ liệu khoa học, yêu cầu `physics` rà soát.
4. Với thay đổi ảnh hưởng giao diện, camera, zoom hoặc cảm ứng, yêu cầu `ui` rà soát.
5. Với thay đổi ảnh hưởng sách giáo khoa, yêu cầu `textbook` rà soát.
6. Với thay đổi ảnh hưởng trợ lý AI hoặc backend, yêu cầu `ai` rà soát.
7. Sau các thay đổi runtime, giao `qa` đánh giá kiểm thử và nguy cơ hồi quy trước khi phát hành.
8. Agent chính tổng hợp kết quả, giải quyết xung đột và chịu trách nhiệm về thay đổi cuối cùng.
9. Khi nhiều agent làm việc song song, phân chia phạm vi tệp rõ ràng; không để các agent đồng thời ghi đè cùng một tệp.
10. Không được tuyên bố đã kiểm tra trên iPhone/Safari thật nếu chỉ chạy mô phỏng hoặc kiểm thử Node.
11. Không tự ý xóa, tái tạo hoặc thay thế `dist/`, 300 thí nghiệm, 300 bài soạn, 388 trang sách, 85 mục lục bài học hoặc 301 tệp âm thanh.
12. Không commit, push hoặc deploy chỉ vì hoàn tất việc phân công agent. Việc phát hành thay đổi runtime phải tuân thủ quy trình kiểm tra và triển khai đã quy định phía trên.
13. Báo cáo rõ agent nào thực sự được gọi, kết quả kiểm tra và những phần chưa xác minh. Không giả định đã gọi sub-agent khi chưa thực hiện.
