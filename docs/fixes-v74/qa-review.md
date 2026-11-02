# QA độc lập v74

- PASS 8/8: lens và damped ×390/1440 px ×light/dark, VI→EN→VI.
- 24 trạng thái có đối chứng Python độc lập (nghiệm đặc trưng phức cho dao động, phương trình thấu kính mỏng); kiểm số gốc từng hàng đo.
- PASS 2/2 bổ sung sau sửa tên accessible clock: lens/damped390light, đổi thời gian gây refresh rồi kiểm `aria-label=Experiment time`, giá trị minh họa đúng EN; không nới assertion.
- Đổi 2D/3D, locale, reload, reset và step giữ các hàng đo. Phiếu dự đoán có HTML giả định vẫn là chuỗi người dùng và được giữ nguyên.
- Lens: năm nhãn hết VI trong EN; đổi về VI đúng; `aria-valuetext` cùng ngôn ngữ ngay khi đổi locale và sau refresh.
- Không tràn ngang, 0 lỗi JavaScript. Đã xem ảnh390dark: canvas/đối tượng gốc giữ màu, giá trị và điều khiển không bị che.
- Post-check tất cả số từ hai báo cáo dùng rel_tol2e-8/abs_tol2e-12 đều đạt; script tái sử dụng đã dùng ngưỡng này.
- Lỗi ARIA thật đã được phát hiện và parent sửa bằng targeted sync, không rebuild/reset. Hai lỗi selector ban đầu thuộc harness đã sửa, không coi là lỗi sản phẩm.
- Chỉ Chromium/SwiftShader giả lập, không phải phần cứng Safari/iPhone/Android hoặc nghiệm thu giáo viên. Không gọi AI. Envelope nội bộ được kiểm toán độc lập bởi nhóm Vật lí; browser kiểm bảo toàn kinematics/energy đang hiển thị.
