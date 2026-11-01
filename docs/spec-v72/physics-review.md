# Rà soát khoa học độc lập: đặc tả 001–008

Ngày rà soát: 31/10/2026. Phạm vi: `dist/physics.js`, adapter `dist/models.js`, cột dữ liệu `dist/measurements.js`, tham số danh mục và các yêu cầu S5/S7 của tám ID đầu theo số phiếu (không lấy tám mục đầu theo thứ tự lớp trong tài liệu).

## Kết quả

`node checks/spec-core-v72.mjs`: **PASS 208** phép kiểm giá trị chuẩn, tính chất và hợp đồng cột. Không phát hiện sai phương trình trong phạm vi các ca này; không sửa solver hoặc renderer để tạo ra thay đổi hình thức.

| ID | Bằng chứng định lượng |
| --- | --- |
| energy | 1 kg,10 m:98,1 J; năm mốc thời gian trong cùng lượt rơi, bảo toàn K+U và bảng ghi; hai miền biên m/h; không rơi dưới mặt đất sau thời điểm kết thúc |
| oscillation | A5 cm,T2 s: năm pha phần tư; vmax15,707963 cm/s và amax49,348022 cm/s²; a=−ω²x và bất biến quỹ đạo pha ở ba chu kì |
| wave | v2 m/s,f1→2 Hz: λ2→1 m; điểm cách λ cùng pha và λ/2 ngược pha; chu kì tại ba tần số |
| electric | 1 nC tại0,P0,2 m:224,6887948075 N/C; q0±1 nC đổi F nhưng không đổi E; khoảng cách gấp đôi giảm E bốn lần; hai điện tích bằng nhau triệt tiêu tại trung điểm; dưới1,2 cm trả null |
| ohm | R10 Ω,U0/2/4/6/8 V:I0/0,2/0,4/0,6/0,8 A; độ dốc I–U0,1 A/V; U/I tại0 được lưu null, không phải0 Ω |
| capacitor | R2 kΩ,C1000 µF:τ2 s; t0/τ/3τ cho cả nạp/phóng, dấu dòng, năng lượng; đổi A→mA và J→mJ trong bảng |
| boyle | V2/4/6/8/10 L:p300/150/100/75/60 kPa; pV600 kPa·L; T300 K |
| gas | n1 mol,V10 L,T300/600 K:p249,43387854/498,86775708 kPa; p/T không đổi; kiểm phụ thuộc n và V |

Mỗi ID còn được kiểm mặc định/min/max hợp lệ và số cột bảng khớp nhãn. Điện tích có hình học nguồn tách nhau khi kiểm biên điện tích; trường hợp trùng nguồn được thử riêng, không ép solver trả số hữu hạn tại điểm kì dị.

Sai số dùng cho các nghiệm giải tích này là `abs≤1e−11+|expected|·1e−11`, riêng lực nC có ngưỡng tuyệt đối1e−20 để không che lỗi SI. Đây không phải ngưỡng áp dụng chung cho solver số hoặc Monte Carlo.

## Phần chưa nghiệm thu

- Ca chuẩn toán học không chứng minh các dụng cụ/đường sức/vectơ, điểm môi trường hay nhãn thực tế đọc được trên màn hình.
- Chưa xác minh camera không đổi h bằng thao tác trình duyệt trong đợt rà soát này; cần UI/QA kiểm đồng bộ cảnh–readout–bảng và vòng tròn–vật dao động.
- Chưa có ảnh ba cấu hình cho từng bài, phiếu học sinh thực nghiệm, giáo viên ký duyệt, thử điện thoại Android/iPhone Safari thật.
- Vì các điều kiện đóng phiếu trong đặc tả chưa đủ, tám phiếu chỉ có trạng thái **kiểm số đạt trong phạm vi trên**, không được ghi đã nghiệm thu hoàn toàn.

## Rà soát phân nhóm điều kiện dữ liệu

Đã phát hiện và yêu cầu sửa hai nguy cơ tạo hồi quy trộn điều kiện: bỏ qua thời gian khi trục x là tham số; coi các cột đại lượng tức thời là tham số đầu vào ban đầu (energy.h0, decay.n0, collision.v1/v2, pendulum.angle). Sau sửa, thời gian chỉ được thay đổi tự do khi chọn trục thời gian; các alias này giữ trong biến kiểm soát. Đây là biện pháp bảo thủ: có thể chặn cả một số quan hệ suy diễn hợp lệ, nhưng không tự nhận hai điều kiện khác nhau là cùng một thí nghiệm.

Kiểm lại `node checks/data-session-v72.mjs` đạt. Phép thử độc lập thêm: bốn chế độ điện, mỗi chế độ ba hình học khác nhau. Đồ thị độ lớn theo r1 được nhóm chung ở chế độ0/1 (một nguồn, đối xứng xuyên tâm); chế độ2/3 hai nguồn giữ riêng ba hình học. Điểm có x/y null hoặc vô hạn được loại trước khi phân nhóm; ba điểm Ohm hợp lệ vẫn khớp đúng, không bị hàng lỗi làm sai nhóm. Charge/discharge của RC có khóa chế độ riêng. Không sửa giá trị đo, solver hay hàng dữ liệu trong quá trình phân nhóm.

Kết luận trong phạm vi kiểm số: hai blocker đã được giải quyết; không phát hiện blocker còn lại đối với cơ chế phân nhóm bảo thủ này. Không xác nhận nội dung nhập từ tệp bên ngoài là dữ liệu thực nghiệm đáng tin chỉ vì snapshot có cấu trúc hợp lệ.

Rà soát fixture DOM cuối: nguồn q1 được đặt4 nC trước khi ghi cả bốn chế độ và bốn khoảng cách bổ sung. Năm điểm E–r trong chế độ1 vì vậy cùng điện tích nguồn, thỏa E=kq1/r² dù hướng không gian khác nhau. Ghi thêm q1=8 nC phải chặn khớp chung nhưng vẫn giữ đủ sáu điểm; sau phép thử chỉ bỏ hàng vừa thêm để tiếp tục kiểm lưu/khôi phục tám hàng gốc thuộc bốn chế độ. Điều chỉnh fixture này sửa một giả định trộn điện tích của phép thử cũ, không nới lỏng solver hoặc bỏ kiểm bảo toàn dữ liệu.
