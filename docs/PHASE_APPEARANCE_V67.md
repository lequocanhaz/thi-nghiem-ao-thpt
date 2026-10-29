# Vòng tròn trong vùng tương tác và ngày/đêm

Thay đổi ngày 29/10/2026 được xây dựng trên bộ vòng tròn/vectơ quay đã có ở main `5b75f2e`, giữ phần hiển thị số khoa học và các thay đổi tài khoản trước đó. Không tạo hai vòng tròn cho cùng một thí nghiệm.

- `#shmCirclePanel` nằm trong `.stage-viewport` cùng mô hình dao động điều hòa. Desktop rộng hiển thị cạnh mô hình; màn hình hẹp xếp dưới mô hình trong cùng vùng thao tác. Có góc đặc biệt, hình chiếu, đồ thị và số đọc liên kết với thời điểm chung.
- Giữ đúng phân biệt sư phạm: M quay là biểu diễn toán học, vật lò xo chỉ chuyển động trên trục x. Đồ thị và số đọc lấy cùng mô hình, không sửa phương trình hoặc số liệu đã ghi.
- Sửa chọn pha khi đã ở giới hạn cuối phiên; sửa thanh pha chưa cập nhật sau khi kéo vòng tròn nếu trước đó thanh nhập còn giữ focus.
- Nút ngày/đêm có ở trang chính và sách, lưu bằng khóa riêng `quanh-appearance-v1`. Không thay dữ liệu phiên thí nghiệm. Ảnh sách và ảnh mô hình không bị đảo màu; vùng mô hình giữ bảng màu khoa học hiện có.
- Stylesheet vòng tròn được tải rõ ràng; cập nhật phiên bản import để tránh dùng mã cũ trong cache.

Kiểm tra: các pha đặc biệt và 1.449 trạng thái đối chiếu với bộ tính dao động; Chromium/SwiftShader tại 320,375,390,414,430,768,1024,1440,1920px; không tràn ngang tài liệu. Kiểm kéo vòng tròn, thanh pha bằng bàn phím, đồng bộ khi Chạy, giữ số liệu qua đổi giao diện và lưu ngày/đêm khi tải lại sách. Đây là kiểm tra giả lập, chưa phải iPhone/Safari thật hoặc đo FPS phần cứng.

Ảnh ở `phase-appearance-v67/` ghi bố cục được kiểm tra; các tinh chỉnh tương phản chữ phụ được bổ sung sau ảnh chụp đó. Không coi ảnh là bằng chứng cho mọi màn hình và mọi trạng thái.

Chưa có review độc lập của các sub-agent physics/UI/QA theo AGENTS.md: công cụ gọi sub-agent không khả dụng trong phiên này. Trạng thái phát hành phải xem PR tương ứng; không suy ra đã lên website từ việc mã có trong workspace.
