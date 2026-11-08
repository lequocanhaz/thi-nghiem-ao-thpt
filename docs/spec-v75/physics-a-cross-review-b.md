# Phản biện chéo nhóm B bởi người viết nhóm A

Đã đọc và chạy độc lập `checks/spec-foundation-b-v75.mjs`: 30 ID đúng nửa sau của 61 quan hệ nền tảng; 2.510 phép so sánh số học đạt trong các ca reference. Các reference bảng dùng số thô từ định luật vật lí và quy đổi SI, không lấy kết quả bộ giải làm kỳ vọng. Đã rà soát cách giải chia áp bằng KCL, phản lực qua cân bằng lực/mômen, động lượng/năng lượng va chạm, công điện/tụ, công suất nhiệt và Faraday theo từng đoạn. Các điểm ở mép khung dây là biên lí tưởng bỏ quá độ theo giới hạn công bố; không diễn giải đạo hàm trơn ngay tại cạnh.

Các literal anchor là kiểm đại số đơn vị; một số cố ý không nằm trong miền UI và đã được tác giả giới hạn phạm vi trong báo cáo. Các ca mặc định/cận của từng tham số mới là kiểm miền điều khiển hiện hành; không coi việc literal đại số đạt là nghiệm thu khả dụng.

Xác nhận lỗi miền thực của `voltmeter_design`: Umax=0,1 V, Ig=10 mA, Rg=1000 Ω đều được miền tham số cho phép, nhưng điện kế đã cần 10 V tại dòng toàn thang. Điện trở phụ thụ động cần không âm; đầu ra −990 Ω không có dấu báo miền không hợp lệ là lỗi thật. Báo cáo ghi PARTIAL/FAIL ràng buộc miền, không che dưới chữ PASS reference. Bài ammeter_shunt không có lỗi tương tự trong miền hiện hành: Ig tối đa 2 mA nhỏ hơn cận dưới dòng cần đo 10 mA.

Không có blocker đối với bộ kiểm/ghi nhận của nhóm B. Không phản biện hoặc nghiệm thu toàn bộ cảnh WebGL, thiết bị thật, chương trình và sư phạm qua phép kiểm số này. Không sửa runtime trong công việc phản biện.
