# Rà soát UI độc lập — phiếu khảo sát v72

Đã đọc AGENTS.md, CODEX_HANDOFF.md và kiểm tra tích hợp thật bằng Chromium headless/SwiftShader tại localhost:4173. Không sửa runtime.

## Kết quả

4/4 trường hợp đạt: 390/1440 px × ngày/đêm; không có lỗi JavaScript.

- Workbook đóng mặc định; Enter mở native details bằng bàn phím.
- Năm bước dùng progressive disclosure, không che mô hình hoặc di chuyển các điều khiển mô hình.
- Toàn bộ summary, textarea, select, button và vùng label checkbox đã đo có chiều cao ít nhất 44 px.
- Textarea/select có label liên kết ID; biến độc lập được loại khỏi nhóm giữ cố định.
- Không tràn ngang; workbook nằm sau phần mô hình, không có lớp phủ trên hình.
- Nội dung kết luận được giữ sau tải lại trang.
- Đã xem ảnh toàn trang 390 px đêm: nền/chữ đồng bộ giao diện; form một cột và nút theo chiều dọc.

P2 có thể tinh gọn tiếp: tiêu đề bước và label trường lặp cùng cụm từ (ví dụ “1. Dự đoán”). Đây không phải lỗi thao tác; giữ label tường minh hiện tại an toàn hơn xóa nhãn.

## Giới hạn

Bằng chứng `work/spec-v72/ui/report.json` và ảnh ở cùng thư mục. Đây là Chromium giả lập, không phải thiết bị Safari/iPhone thật; không chứng nhận toàn bộ WCAG hoặc khả năng học của học sinh. Kiểm ngôn ngữ/record/export chi tiết thuộc QA tích hợp riêng.

## Bổ sung ma trận viewport theo §3.7

10/10 trường hợp Ohm bổ sung đạt: 320/375/430/768/1024 px × ngày/đêm. Cùng các assertion thực tế về không tràn ngang, workbook nằm dưới mô hình, label liên kết, vùng điều khiển ≥44 px, Enter mở details, chọn biến độc lập/khóa biến giữ cố định và giữ kết luận sau reload.

Kết hợp lượt đầu: **14/14 ngữ cảnh**, phủ đủ 320/375/390/430/768/1024/1440 px ở cả hai theme; 0 lỗi JavaScript. Các ca bổ sung dùng Ohm, các ca 390/1440 dùng dao động; đây không phải kiểm riêng cả 300 mô hình ở mọi viewport. Chưa có kiểm máy thật.

Bằng chứng bổ sung: `work/spec-v72/ui-extra/report.json`, ảnh theo viewport/theme cùng thư mục. Script mở rộng `work/spec-v72/ui/extra.py`.
