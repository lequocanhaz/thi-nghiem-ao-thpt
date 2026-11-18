# Thang nghiệm thu nội bộ — chốt trước khi sửa V91

Phạm vi: hai hoạt động nước–đá và nhiệt dung riêng vật rắn thuộc ID `calorimetry`. Đây là điểm kiểm kỹ thuật có bằng chứng, không phải điểm khảo sát người dùng, chứng nhận WCAG, hay nghiệm thu 300 bài cấp 3.

Mỗi mục 1 điểm. Cho 1 khi các ca công bố của mục đạt và không còn lỗi đã biết; 0,5 khi luồng chính đạt nhưng còn lỗi có cách tránh; 0 khi bị chặn/sai khoa học/mất dữ liệu hoặc chưa kiểm. P2 đã xác minh trừ ít nhất 0,25 trong mục liên quan. Không chấm 9 nếu còn P0/P1 trong phạm vi phần mềm. Không đổi tiêu chí để khớp kết quả.

| Mục | Tiêu chí / bằng chứng tối thiểu |
|---|---|
|1|Kết quả vật lí: oracle độc lập, đơn vị, miền hợp lệ, không sửa đáp án theo hình|
|2|Lượng chất/năng lượng: thêm/tan/tràn, thể tích hình, số liệu phản ánh model|
|3|Chuẩn bị và phục hồi: mới/cũ, cốc/bình rỗng, hết nguồn, lượt mới giữ dữ liệu, có hành động rõ để tiếp tục|
|4|Tác động và vòng đời: rót/dừng/gia nhiệt/khuấy, hủy/chuyển chế độ, đồng hồ/trạng thái nhất quán|
|5|Đo và điều tra: nhúng đúng chất, sai thao tác có lý do, độ trễ, dự đoán/assessment, đọc/ghi thủ công|
|6|Sổ tay: CSV/JSON, nhập/tải lại, phiên cũ, nhập sai/quota không làm mất bản lưu|
|7|Hiển thị: nước/mẫu/dụng cụ/số chỉ rõ ở sáng/tối, camera không cắt dụng cụ đo đang dùng|
|8|Điều khiển phần mềm: bàn phím, focus, reduced motion, touch giả lập và bố cục 320–1920 px|
|9|Ổn định phát hành: hồi quy, fallback, console, security, CI/Pages và kiểm website thật|
|10|Nghiệm thu thực địa: điện thoại/iPhone Safari thật, đo hiệu năng thiết bị mục tiêu và giáo viên duyệt|

Mục 10 để **0 / NOT TESTED** nếu thiếu thiết bị hoặc người nghiệm thu. Vì vậy điểm phần mềm tốt nhất hiện có thể chứng minh là 9/10; chưa tương đương sẵn sàng cho mọi thiết bị/lớp học. Nếu mục 1–9 chưa đủ căn cứ thì phải chấm thấp hơn và tiếp tục sửa phần có thể thực hiện.

Đánh giá ban đầu và cuối phải ghi lỗi, ca kiểm, lệnh/log/hash, người rà độc lập và phần chưa kiểm. Không nâng trạng thái L3 vì điểm này.
