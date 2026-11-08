# Đối chứng độc lập 30 quan hệ nền tảng — nhóm B v75

Phạm vi lấy chính xác từ `experiments.slice(60).filter(e => e.extra !== true).slice(31)`: 30 ID, không suy ra theo số thứ tự 61–121. Đã đối chiếu có hồ sơ của đúng ID trong đặc tả Word nhập ở v72. Không sửa mã runtime.

`checks/spec-foundation-b-v75.mjs` kiểm 2.510 so sánh số, gồm trạng thái mặc định và thay từng tham số tới hai cận hiện hành; bài khung dây có thêm các thời điểm ở mép và hai phía mép; hãm từ thêm các thời điểm. Mỗi ID có ít nhất ba bộ tham số hợp lệ. So sánh cả đầu ra bộ giải và thứ tự/giá trị số thô của từng cột bảng. Thêm 30 mốc số đơn giản và các bất biến động lượng, trực giao vận tốc, cân bằng năng lượng/nhiệt, bảo toàn điện tích. Một số mốc tách đơn vị/bảo toàn có thể ở ngoài miền UI và được ghi rõ trong mã; các ca phát hiện lỗi miền đều thuộc miền UI đã công bố.

Oracle dùng KCL nút cho chia áp/tải vôn kế, cân bằng lực/mômen, động lượng trước va chạm và năng lượng sau va chạm, định luật Faraday với độ dài phần giao hình học, điện trở nhiệt nối tiếp và các phép đổi đơn vị SI. Không gọi compute của catalog hoặc sao kết quả mặc định để làm giá trị kỳ vọng. Tolerance `2e-10 + 2e-10 |expected|` áp riêng các quan hệ giải tích này, không dùng cho Monte Carlo, tích phân số hay nghiệm thu giáo viên.

Quy đổi được kiểm riêng: cm²→m² và mWb; g/m, mm và mW; nC/pF và nJ; µF/µC/µJ; mA/A và mW; MeV/J/pJ. Độ hụt khối dùng hằng số xấp xỉ 931,494102 MeV/u theo quy ước mô hình hiện hành, không coi đây là hằng số SI xác định chính xác. Các quan hệ chuẩn đối chiếu theo cân bằng Newton và OpenStax University Physics volumes 1–2 (https://openstax.org/details/books/university-physics-volume-1, https://openstax.org/details/books/university-physics-volume-2).

## Lỗi miền thật, chưa sửa

**`voltmeter_design`: FAIL về ràng buộc thiết kế**, trong khi phép tính điện trở theo biểu thức đại số khớp.

Bộ điều khiển hiện cho phép đồng thời Umax=0,1 V, Ig=10 mA và Rg=1.000 Ω. Điện kế ở toàn thang đã cần `Ig Rg = 0,01 A × 1.000 Ω = 10 V`, lớn hơn điện áp muốn đo. Một điện trở phụ thụ động không thể làm dụng cụ đạt toàn thang ở 0,1 V. Mô hình hiện trả `Rp = Umax/Ig − Rg = −990 Ω` mà không có `domainValid:false` hoặc thông báo không thể thiết kế, dù điều kiện catalog nói điện trở phụ dương trong toàn miền.

Điều kiện tồn tại thiết kế thụ động là `Umax >= Ig Rg` với Ig đổi từ mA sang A; khi bằng nhau không cần điện trở phụ (0 Ω), nếu muốn điện trở phụ dương thì phải dùng dấu >. Không sửa bằng kẹp điện trở về 0 vì sẽ cho số đo và thiết kế giả. Cần giới hạn phụ thuộc hoặc báo miền không hợp lệ, giữ dữ kiện người dùng và giải thích cách tăng thang U/giảm Ig hoặc Rg.

Bộ kiểm có ca tái hiện rõ ràng và báo `PARTIAL-reference-cases-pass-domain-constraint-fails` cho ID này; PASS của chương trình kiểm không có nghĩa coi điện trở âm là hợp lệ. Kết quả máy đọc ở [physics-b.json](physics-b.json).

Chưa kiểm mọi cảnh 3D, ray/vector, phần cứng iPhone/Safari/Android hoặc thẩm định chương trình–sư phạm. Không ký đạt hoàn toàn cho 30 hồ sơ chỉ từ đối chứng số học này.

## Phản biện chéo nhóm A

Đã đọc và chạy độc lập `checks/spec-foundation-a-v75.mjs`: 31 ID, 306 ca, 2.979 so sánh đạt. Xác nhận selector nhóm A/B không trùng và hợp thành đúng 61 ID nền tảng sau 60 bài gốc. Các biến đổi độc lập của chồng chất điều hòa, phản xạ tại đầu cố định, hai điện tích trái dấu và KCL/cân bằng lực phù hợp; quy đổi mg→kg, g/m→kg/m, cm²→m² và pF/nJ được kiểm tường minh. Xử lý null ngay tại vị trí điện tích điểm là đúng giới hạn của mô hình; hai ca sát điểm kì dị kiểm số hữu hạn với sai số tương đối, không thay null bằng số 0. Các mốc literal có kiểm cả oracle và sản phẩm; bất biến năng lượng, công và Newton cung cấp kiểm bổ sung cho biểu thức giải tích.

Không phát hiện blocker trong bộ đối chứng A. Đây là phản biện tính đúng của các ca được chạy, không ký duyệt toàn bộ cảnh hoặc chương trình.
