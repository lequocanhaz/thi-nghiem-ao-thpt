# Rà soát độc lập vật lí, hình học và dữ liệu v86

Agent `thermal_collision86` viết module và oracle hình học riêng. Agent `thermal_review86` rà soát độc lập mô hình/nhập phiên rồi kiểm integration cuối; root tích hợp. Không có nghiệm thu giáo viên hoặc thiết bị thật.

## Kết quả

- Không đổi phương trình nhiệt, thông số oracle, khối lượng hoặc nhiệt lượng để khớp ảnh.
- Chặn cốc dựa cả thân/vòi và đường kéo/xoay; model chỉ được rót sau khi pose hợp lệ. Không tìm thấy bypass mới qua kéo, xoay, rót trực tiếp hoặc snap lên cân trong lát cắt này.
- Tại `(300,112),60°`, cổng miệng cốc cũ trả đích bình nhưng hình bao thân chạm vành. Chặn này cần thiết. Tại `(410,130),60°`, kiểm XY chấp nhận lòng rỗng thay vì chặn cả khối hộp.
- Hủy thao tác giữ góc và dừng mô hình; đường trả lại pose đầu nếu không hợp lệ bị từ chối, giữ pose hợp lệ hiện tại.
- Phiên cũ sai pose được giữ nguyên; khôi phục phải do người học yêu cầu. Sự kiện mới ghi `positionM` theo mét, không gọi tọa độ canonical là SI.
- Rà soát phát hiện và sửa lỗi validation: chuỗi/thiếu/null/nonfinite ở thể tích và residual, residual giả không khớp ledger. Validator không tự chữa hoặc chuẩn hóa đầu vào.
- Rà soát integration phát hiện và sửa thêm giới hạn nhật ký: không được thêm sự kiện thứ5.001 rồi tạo backup không nhập lại được.

## Kiểm tra đã chạy độc lập

- `node checks/thermal-collision-v86.mjs`:7.175 so sánh hình học,5.708 chứng cứ va chạm và16 ca sweep, PASS.
- `node checks/thermal-derived-state-v86.mjs`:58 state hợp lệ,56 state sai và62 tệp nhập sai; giữ classic nguyên bản, PASS.
- Các test nhiệt và notebook v84 cũng được chạy lại; kết quả full suite trong QA report.

## Giới hạn chặn tuyên bố hoàn thành

Bảo thủ2,5D không đồng nghĩa chứng nhận khe hở bán kính3D. Ví dụ cốc `(420,220),90°` được solver XY chấp nhận; điểm trên mặt trụ thực có tọa độ tương đối với tâm bình khoảng `(x=.0675,z=.042,y=.128)m` đạt bán kính.0795m, lớn hơn bán kính lòng danh nghĩa.076m. Điều này phản ánh phần hình học thể tích chưa được hiệu chuẩn và kiểm xuyên đầy đủ theo trụcZ. Không tuyên bố đã sửa mọi xuyên vật3D.

Hình bao xoay có thể từ chối gần tiếp tuyến. Chưa kiểm đầy đủ các dụng cụ khác, bình rỗng đang kéo, lòng mesh/dung tích,6DOF hoặc CFD. Hệ số trao đổi nhiệt chưa hiệu chuẩn dụng cụ thật. Backup lỗi được kiểm riêng bằng4 ca Chromium cho cảhai hoạt động: JSON hiện tại giữ draft mới, tải bản gốc byteexact, chặn thay phiên trước khi sao lưu, quota giữ bản trước và cho xuất RAM.

Giữ `calorimetry` PARTIAL; không nâng cổng nghiệm thu từ kiểm source/CPU hoặc browser phần mềm.
