# Biên soạn bài học Quanh Lab

Mục tiêu: mỗi mô hình có một hoạt động học có thể thực hiện, giải thích được nguyên nhân và giới hạn, rồi mở rộng thành hệ sinh thái thí nghiệm. Không lấy đủ số trường dữ liệu làm bằng chứng bài học đã đúng khoa học hoặc học sinh đã hiểu.

## Cấu trúc hiện hành

- `dist/lessons/batch-01.js` đến `batch-10.js`: 300 bài riêng, mỗi tệp 30 bài theo thứ tự danh mục. Mỗi dòng gồm `id|goal|explanation|investigation|misconception|question|answer`. Không đặt ký tự `|` hoặc xuống dòng trong một trường; kiểm tra từ chối dòng không đủ bảy trường và ID trùng.
- `dist/lessons/catalog.js`: ghép bài, chọn biến điều khiển có thật, thêm kiến thức chuẩn bị, điều kiện và phạm vi nguồn. ID phải trùng danh mục mô phỏng; không đổi ID đã lưu phiên.
- `dist/lessons/formulas.js`: LaTeX tường minh tương đương cho chín biểu thức cũ lỗi chuyển đổi và sửa tên ký hiệu hiển thị dãy bi Newton; không đổi phép tính.
- `dist/lessons/references.js`: nguồn chính thức, URL, ngày truy cập, SHA-256 bản đã đọc và ánh xạ từng bài. Hash giúp truy vết phiên bản tài liệu; không chứng nhận diễn giải đúng.
- `dist/lesson-loader.js`: chỉ tải danh mục bài soạn khi vào thí nghiệm. Lỗi hoặc quá 15 giây cho thử lại; không xóa bảng đo hay ghi chép.
- `dist/lesson-view.js`: hiển thị bài trong hướng dẫn và tab Mô hình; lời giải nằm trong `<details>` đóng mặc định. Bài soạn không chứa HTML; mọi văn bản được escape.
- `docs/lessons-v50.md`: bảng đủ 300 bài để người biên tập kiểm tra và phân công chuyên gia sau này.

## Tiêu chuẩn cho từng bài

1. Mục tiêu nêu điều học sinh phải giải thích hoặc suy ra; tránh chỉ “quan sát mô hình”.
2. Giải thích chuỗi nguyên nhân, dấu, đơn vị, điều kiện giữ cố định và miền dùng công thức. Tách quy luật vật lí khỏi hiệu ứng hình minh họa.
3. Quy trình dùng đúng tên/miền biến thật, nêu các lượt khảo sát và số liệu cần ghi. Không yêu cầu giá trị ngoài điều khiển. Thời điểm phải thuộc khoảng chạy; biểu đồ cần đọc đúng trục và bộ dữ liệu cùng điều kiện.
4. Có lỗi nhận thức cụ thể, câu hỏi vận dụng và lời giải có lý do. Không coi tự đánh dấu tiến độ hoặc bấm xem lời giải là đánh giá năng lực.
5. Ghi nguồn đúng nội dung đã đọc. Nguồn nguyên lý nền không được gắn nhãn là thẩm định một biến thể nâng cao. Khi thiếu nguồn trực tiếp, nêu rõ giới hạn và ưu tiên đối chiếu thêm trước khi dùng để đánh giá học sinh.
6. So với phép tính độc lập/giới hạn đặc biệt; đối chiếu với mô hình thực tế và điều kiện của bài. Khớp số liệu do cùng phương trình sinh ra không kiểm chứng thực nghiệm độc lập.
7. Kiểm tra bằng bàn phím, điện thoại, chuyển bài nhanh, lỗi mạng, ghi chép và xuất/nhập phiên; giữ audio, sách, LaTeX và accessibility.

## Trạng thái biên tập và phát triển tiếp

Bản v50 có bài soạn cho 300/300 mô hình và kiểm tra tự động toàn danh mục. Chưa có giáo viên/chuyên gia độc lập ký duyệt 300 bài, chưa thí điểm lớp học và chưa đồng bộ lại 301 tệp âm thanh theo văn bản mới. Không gắn trạng thái “đã thẩm định” khi chưa có người phản biện, ngày duyệt, phạm vi và minh chứng.

Các bài phi tuyến, ổn định nổi, điện tử, truyền sóng và hiện đại cần ưu tiên phản biện sâu. Không tự gán mọi bài mở rộng vào từng tiết sách hoặc khẳng định có nội dung Hóa/Sinh khi danh mục chưa có. Ba sách hiện có vẫn là tài nguyên gốc.

Khi phát triển hệ sinh thái: thêm nguồn và phản biện theo ID → bổ sung thí nghiệm đối chứng/đo thật → thử với học sinh và giáo viên → điều chỉnh theo lỗi thực tế → phát hành phiên bản bài soạn có lịch sử. Không thay đổi phương trình mô hình trong một commit chỉ biên tập nội dung.

## Kiểm tra trước khi xuất bản

```sh
npm run check:lessons
npm run check
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node checks/browser-lessons-v50.mjs
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node checks/browser-library-v49.mjs
```

Hai lệnh Playwright là kiểm thử Chromium tùy chọn ngoài CI mặc định. CI kiểm tra Node/DOM/hình học; không thay thế Safari, cảm ứng phần cứng, giáo viên phản biện hoặc thực nghiệm thật.
