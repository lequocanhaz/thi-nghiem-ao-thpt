# Đối chứng độc lập nhóm A — 31 quan hệ nền tảng v75

Chọn đúng 31 ID đầu của `experiments.slice(60).filter(e => e.extra !== true)`, không coi STT 061–091 là cùng phạm vi. Đọc yêu cầu S7 theo ID trong hồ sơ nguồn v72. Kiểm công thức giải tích qua các cân bằng Newton, công–năng lượng, tổng hợp điều hòa, định nghĩa điện thế/điện dung; các reference không gọi helper khoa học của sản phẩm. Mỗi bài có bộ giá trị literal tính riêng để kiểm cả reference lẫn sản phẩm. Hằng số g=9,81 m/s² và các hằng số điện theo mô hình công bố.

Ca kiểm gồm mặc định, toàn cận dưới/trên, từng tham số tại hai cận với các biến khác giữ mặc định, ca literal; thêm triệt tiêu hai vectơ, nút sóng ở nhiều thời điểm, quét một chu kỳ năng lượng lò xo, hai tụ bằng nhau và điểm sát nguồn lưỡng cực. Kiểm đủ cột bảng thô từ các reference; null tại đúng điện tích điểm là trạng thái không xác định được giữ nguyên, không ép thành số 0. Có kiểm cân bằng Newton hai vật Atwood, bảo toàn công ròng rọc, áp suất đáy, năng lượng và điện tích/điện áp hệ tụ.

Đơn vị kiểm tường minh: cm²→m², mm→m, g/m→kg/m, mg→kg, µC/nC/fC, pF/µF, nJ, kPa, dB so với 10⁻¹² W/m². Không lấy chuỗi định dạng làm đầu vào.

Chưa tái hiện lỗi số học trong phạm vi ca kiểm. Đây không phải kết luận toàn cảnh đã đúng, đã hỗ trợ mọi tình huống ngoài miền, hoặc đã được giáo viên/thiết bị thật nghiệm thu. Ví dụ: hồ sơ lưỡng cực đề nghị điểm đối xứng/điện thế bằng 0, nhưng tham số hoành độ hiện chỉ dương; kiểm này không tự mở rộng miền điều khiển. Bài máy ép hiện đối chứng lực/áp suất, không chứng nhận hình ảnh hành trình. Bài vận tốc trôi hiện đối chứng độ lớn và đơn vị, không nghiệm thu hướng chuyển động các chấm trên hình. Các yêu cầu này phải giữ trạng thái kiểm cảnh/tương tác/sư phạm riêng.

Số đếm ca/so sánh và đầu vào–đầu ra literal từng ID: [physics-a.json](physics-a.json). Có thể chạy `node checks/spec-foundation-a-v75.mjs`; `--write` chỉ cập nhật báo cáo thuộc nhóm A.
