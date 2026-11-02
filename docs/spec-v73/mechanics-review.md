# Đối chứng độc lập — 22 bài gốc 009–030

`checks/spec-core-mechanics-v73.mjs` dùng hằng số chuẩn và biểu thức giải tích viết độc lập, không gọi helper Vật lí của production để tính kỳ vọng. Kiểm từng trường đầu ra được công bố và từng cột số liệu thô đối với min/default/max, cùng đầu–giữa–cuối miền thời gian khi bài có đồng hồ.

Bổ sung ca số cố định: Newton F=6N,m=2kg cho a=3m/s²,x(1s)=1,5m; va chạm đàn hồi hai khối lượng bằng nhau đổi vận tốc; đòn bẩy cân bằng mômen hai phía 11,772N·m; lực từ 0,5N. Kiểm bảo toàn động lượng, hệ số phục hồi và năng lượng mất khi e=0/0,5/1; dấu lực/gia tốc/dòng điện; nửa đời; năng lượng con lắc theo xấp xỉ góc nhỏ; đổi cm sang m trong năng lượng; năng lượng dao động tắt dần không tăng qua 603 trạng thái.

Không phát hiện sai phương trình trong các cấu hình đã kiểm. `damped` chỉ cho beta≤1,5s⁻¹, trong khi ω₀ nhỏ nhất=π/2s⁻¹, nên miền hiện tại vẫn dưới tắt dần; công thức không được dùng như lời cam kết xử lý tới hạn/quá tắt dần. `pendulum` chỉ cho góc≤15°, năng lượng và chu kỳ là xấp xỉ góc nhỏ. `collision` khi hai xe không tiếp cận không có va chạm, không ép thời gian va chạm vô hạn thành hữu hạn.

Giới hạn: CPU và số liệu thô, không kiểm hình học cảnh, tương tác trình duyệt, phần cứng thật hay nghiệm thu giáo viên. Các oracle không chứng minh toàn bộ đặc tả của từng bài đã hoàn thành.

Bổ sung sau phản biện chéo: trường `damped.envelope` được kiểm là hệ số suy giảm hiện hành, không chấp nhận như biên bao nghiêm ngặt. Ca gần tới hạn tái hiện khác biệt và biên giải tích đúng nằm trong `knownIssues` của báo cáo mechanics; mục này còn mở như mô tả tại báo cáo chính v73.
