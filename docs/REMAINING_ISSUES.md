> **Cập nhật26/10/2026:** phần bên dưới là báo cáo lịch sử v54. HEADv58 đã có VI/EN; các thay đổi và nghiệm thu mới nhất nằm trong [báo cáo v59](REDESIGN_V59_REPORT.md). Không dùng trạng thái “chưa có selector/EN” bên dưới làm kết luận cho bản hiện tại. Các20mục khoa học PARTIAL và giới hạn thiết bị thật vẫn được giữ.

# Những phần chưa hoàn tất hoặc chưa xác minh — V5.0/v54

Ngày: 25/10/2026. Báo cáo này ngăn việc hiểu một đợt sửa ưu tiên thành nghiệm thu toàn bộ yêu cầu V5.0. PASS chỉ có ý nghĩa trong phạm vi phép thử tương ứng.

| Ưu tiên | Hạng mục | Trạng thái | Bằng chứng còn thiếu / việc tiếp theo |
| --- | --- | --- | --- |
| Cao | Toàn bộ 300 bài đạt khoa học độc lập | NOT TESTED đầy đủ | Kiểm số mới có các mục PARTIAL; cần đối chiếu riêng miền phi tuyến/ngẫu nhiên, không gọi 300 mục catalog là 300 bộ giải độc lập. Xem `AUDIT_REPORT.md`. |
| Cao | Hoàn chỉnh VI/EN | NOT TESTED — chưa hoàn tất | Nền locale/glossary và AI allowlist không thay thế dịch toàn UI, 300 catalog/bài soạn, nhãn 3D, đồ thị, thông báo, SEO và kiểm chuyển khi đang chạy. |
| Cao | Độ rõ và Visual Settings đầy đủ theo V5.0 | NOT TESTED đầy đủ | Preset cơ bản đã PASS trên trình duyệt chọn lọc; chưa có tất cả kích thước hạt/marker, thang vectơ, nền tối, viền/mật độ/vệt hạt. Hạt tại V cực nhỏ còn khó thấy/che khuất; chưa nghiệm thu mọi góc/zoom hoặc Canvas fallback. |
| Đã kiểm | Preset hiển thị cơ bản | PASS có giới hạn | Bốn preset giữ state/time/rows/camera/focus/node; tùy chọn lưu riêng và menu không tràn 390 px. Chỉ Chromium/WebGL2 chọn lọc, không xác nhận độ rõ 300 bài. |
| Đã kiểm | Chặn ngoài miền trong quét số liệu | PASS | Test thực UI cả 1440/390 px xác nhận đúng 6/10 điểm cyclotron hợp lệ được lưu, 4 bị loại có thông báo, rows cũ nguyên vẹn. |
| Cao | Nghiệm thu sư phạm 300 bài | NOT TESTED | Cần giáo viên kiểm độc lập mục tiêu/quy trình/câu hỏi/lời giải/giới hạn và thí điểm lớp học. Nguồn nguyên lí không phải ký duyệt mọi biến thể. |
| Vừa | Kết quả trên iPhone/Android/Safari thật | BLOCKED trong môi trường hiện tại | Chỉ có Chromium máy chủ và viewport giả lập; cần thiết bị/browser thật. |
| Vừa | Độ mượt phần cứng thấp | NOT TESTED | SwiftShader không đo được FPS GPU điện thoại hay máy chiếu. Cần profiling interaction, frame time, nhiệt và phiên dài. |
| Vừa | 300 bài trực quan qua mọi biên/zoom | NOT TESTED đầy đủ | Hồi quy dựng cảnh CPU và chọn lọc browser không bao phủ occlusion/clipping/nhãn/tương phản toàn thư viện. |
| Vừa | AI locale trên backend production | NOT TESTED | Fixture không gọi provider. Backend là triển khai riêng; Pages không xuất bản server/khóa. |
| Vừa | Sách/audio tiếng Anh | NOT TESTED — chưa có bản mới | Giữ388 trang gốc và301 audio hiện có; không tuyên bố ảnh sách VI hoặc audio VI đã được dịch từ việc có selector. |
| Phát hành | Kiểm tra tổng và CI/Pages | PASS cổng cục bộ; CI theo commit | `npm run check` đã đạt cùng QA12/12 nhóm. Trạng thái CI/Pages của commit phát hành xem [GitHub Actions](https://github.com/lequocanhaz/thi-nghiem-ao-thpt/actions); chỉ xác nhận web mới khi triển khai thành công và tài nguyên live khớp. |

Các sửa được kiểm chọn lọc: cân đòn, bao hạt/bình Boyle, độ lớn lực thành phần, điện thế hai nguồn, miền quỹ đạo/cyclotron, RC hai tầng gần bằng nhau và lớp điện tại tọa độ nhỏ. Xem `PHYSICS_VALIDATION.md`, `VISUAL_QA.md` và `MOBILE_TEST_REPORT.md` để phân biệt bằng chứng số, geometry CPU và trình duyệt.

Các báo cáo lịch sử `checks/audit-300/` được bảo toàn. Không dùng kết quả cũ làm bằng chứng cho commit hiện tại nếu chưa chạy lại phần liên quan.
