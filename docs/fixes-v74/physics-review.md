# Phản biện Vật lí độc lập — sửa đường bao dao động tắt dần v74

**PASS — không có lỗi chặn phát hành trong bản sửa khoa học này.** Rà soát đúng thay đổi `dist/models.js`, không chỉnh runtime hoặc bộ kiểm do agent triển khai viết.

Với nghiệm vận tốc đầu bằng không, đặt `δ = atan2(β, ωd)`. Khi đó `x = A/cos(δ) · exp(−βt) · cos(ωd t − δ)` và `cos(δ) = ωd/ω0`. Biên độ của phần điều hòa là `|A|ω0/ωd`, nên cặp đường bao không âm `±|A|ω0/ωd · exp(−βt)` chặn mọi li độ. Đây là suy luận độc lập bằng dạng pha, không lấy công thức chặn từ mã triển khai làm oracle. Đường bao và li độ cùng đơn vị cm. `decayCoefficient=A exp(−βt)` giữ giá trị hệ số cũ, không được dùng làm chặn trên.

Đã đọc miền tham số runtime (bao gồm domain expansion): A từ 0,1 đến 50 cm, T từ 0,5 đến 4 s, β từ 0 đến 1,5 s⁻¹, t từ 0 đến 20 s. `βmax < 2π/Tmax`, nên toàn miền UI vẫn dưới tới hạn, không chia cho zero. Công thức không tuyên bố hỗ trợ nhánh tới hạn hoặc quá tắt dần.

Kiểm tra độc lập trong `review.mjs` và kết quả `report.json`:

- 108.108 trạng thái, phủ đầu/cuối miền và các mức giữa; oracle dạng pha, ràng buộc `|x| ≤ envelope`, đơn vị năng lượng SI.
- 1.719 thời điểm pha tiếp xúc xác nhận biên bao đạt đúng trị tuyệt đối của li độ, không chỉ là một chặn quá rộng.
- 540.540 giá trị t/x/v/acc/energy so với mã trước sửa tại commit `31b47fdfc85a1795d323aaedd1fc64aa7b30099d` giữ nguyên bit bằng `Object.is`.
- Sai khác lớn nhất giữa li độ runtime và nghiệm dạng pha: khoảng `3,78 × 10⁻¹³ cm`; không có trường hợp vượt biên bao trong bộ mẫu.
- Kiểm thêm A bằng 0/âm để xác nhận trường envelope không âm; đây là kiểm độ bền toán học, không coi là miền UI.
- Ca tái hiện trong miền hiện hành: A=1 cm, T=4 s, β=1,5 s⁻¹, t=1 s cho x≈0,522011 cm; hệ số cũ≈0,223130 cm không chặn được x; envelope mới≈0,751705 cm chặn đúng.
- Các bộ `damped-envelope-v74`, `spec-core-mechanics-v73`, `spec-core-v72`, `concept-physics-v64` đều PASS.

Giới hạn: kiểm giải tích CPU và đọc mã, không thay thế kiểm hình ảnh trình duyệt, phần cứng iPhone/Safari hoặc nghiệm thu giáo viên. Thay nguồn khoa học cần tái xuất ảnh theo quy trình kho; agent tích hợp phụ trách bước đó.
