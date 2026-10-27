# Kiểm tra miền lấy mẫu rời rạc

Mã đang chuẩn bị sửa trường hợp tổng quát trong `sampleRelation`: khi biên miền không nguyên, làm tròn các điểm đều có thể tạo một số nguyên nằm ngoài miền. Điểm rời rạc giờ được lọc theo miền; nếu số lượng số nguyên trong miền không vượt quá số mẫu, các số nguyên hợp lệ được lấy đầy đủ. Nếu miền không chứa số nguyên, không tạo điểm giả.

Đây là sửa hợp đồng lấy mẫu, không phải thay đổi phương trình hoặc số đo. Tại thời điểm đối chiếu, năm thí nghiệm dùng lựa chọn rời rạc (`charge_quantization`, `pulley`, `string_resonance`, `battery_series`, `battery_parallel`) có cùng danh sách điểm như mã trước sửa trên miền catalog hiện tại. Trường hợp biên không nguyên được kiểm thử riêng; không khẳng định đây là lỗi đã ảnh hưởng các miền hiện tại.

Đã cập nhật chuỗi query-version đến module thay đổi để trình duyệt tải mã mới. Đã xuất đủ 300 ảnh bằng LabScene vào `work/previews-v66-final`: 300/300 thành công, nguồn ổn định trong khi chụp và tất cả ảnh trùng byte với ảnh v65 hiện hành. `dist/previews/v65/manifest.json` được lấy từ lần xuất thực tế này; ảnh cũ không bị thay thế. Trường commit trong manifest chỉ ghi HEAD lúc bắt đầu, còn các hash nguồn ghi đúng trạng thái workspace chưa commit khi chụp.

Các kết quả kiểm thử, review độc lập và phát hành cần được cập nhật theo phiên làm việc. Không dùng tài liệu này để kết luận rằng toàn bộ 300 mô hình đã được kiểm nghiệm khoa học hoặc rằng iPhone/Safari đã được kiểm thử trên thiết bị thật.
