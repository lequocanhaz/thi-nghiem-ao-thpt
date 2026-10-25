# Kiểm chứng Vật lí — V5.0, đợt ưu tiên v54

Đối chiếu các lỗi đã tái hiện trong `checks/audit-300/reports/issues.json`. Đợt này sửa mô hình tính và miền áp dụng của năm bài; không chứng nhận rằng toàn bộ 300 bài đã chính xác hoặc nghiệm thu sư phạm.

| Bài | Lỗi gốc | Sửa mã | Trạng thái hiện tại |
|---|---|---|---|
| `potential_pair` | Dùng `x-a` có dấu làm khoảng cách vô hướng, sai dấu điện thế giữa hai nguồn | `dist/atlas-catalog.js`: dùng độ dài `abs(x±a)`; điểm nguồn trả `null`, không phát `Infinity` | PASS kiểm số độc lập; TeX đã sửa trị tuyệt đối; bài soạn hiện có đã nhắc đúng khoảng cách và được giữ nguyên; browser kiểm hai phía/giữa nguồn đạt |
| `two_stage_rc` | Ngưỡng gần bằng tuyệt đối `1e-8` thay các hằng số thời gian nhỏ, khác nhau thành bằng nhau | `dist/expansion-catalog.js`: công thức convolution ổn định bằng `expm1`, tỉ số không thứ nguyên và chuỗi Taylor cho thời gian rất nhỏ | PASS đối chiếu tích phân độc lập, đổi thứ tự tầng, bằng nhau/gần bằng nhau/thang thời gian khác nhau |
| `charged_plane` | Dải loại trừ epsilon loại nhầm trường hợp có `x≠0` nhưng nhỏ | Chỉ xem đúng `x=0` là điểm không xác định; mọi tọa độ khác 0 dùng nhánh giải tích có dấu | PASS hai phía tới số dưới chuẩn nhỏ nhất, mật độ âm/dương/0; đúng tại mặt lớp điện vẫn `null` |
| `elliptic_orbit` | Miền tham số có quỹ đạo đi vào hành tinh được mô tả là Trái Đất | Công bố Trái Đất có bán kính quy ước 6371 km; yêu cầu `a(1-e)≥6371 km`. Ngoài miền trả ba readout `null` cùng cảnh báo | PASS kiểm miền và vis-viva; bản tích hợp chặn đo/chạy/step và ẩn mô hình ngoài miền; browser kiểm khôi phục và bảo toàn bảng đạt |
| `cyclotron` | Tham số mở rộng cho tốc độ cổ điển vượt c trong mô hình phi tương đối tính | Công bố miền xấp xỉ `v_classical≤0.1c`; ngoài miền trả frequency/energy/turns `null` và thông báo, không gán kết quả cổ điển như số đo hợp lệ | PASS đối chiếu chu kì, động năng, số vòng và miền; bản tích hợp chặn đo/chạy/step và ẩn mô hình ngoài miền; browser kiểm khôi phục và bảo toàn bảng đạt |

Dữ liệu miền chung do compute cung cấp:

- `domainValid`: boolean; `domainMessage`: thông báo giải thích miền.
- Quỹ đạo: `pericenter` bằng km. Điểm nằm đúng bề mặt bán kính quy ước được phép trong mô hình không có khí quyển; đây không phải tính quỹ đạo vệ tinh thực có khí quyển hay địa hình.
- Cyclotron: `classicalSpeed` bằng m/s, là đại lượng chẩn đoán miền của công thức cổ điển, không phải số đo tốc độ hợp lệ khi vượt miền.
- Giá trị đọc `null` ngoài miền phải hiển thị dấu chưa xác định và cảnh báo, không tự biến thành 0. Không xóa số đo/ghi chép cũ của người dùng.

Các mặc định hiện tại đều hợp lệ: quỹ đạo `a=12000 km`, `e=0.3` có cận điểm 8400 km; cyclotron `B=0.5 T`, `r=10 cm` cho tốc độ cổ điển khoảng 0.016c. Không cần thay mặc định hoặc đổi công thức sang tương đối tính một cách ngầm định.

## Kiểm thử thực tế

- `node checks/physics-v54.mjs`: PASS; 773 phép so sánh số/miền có đếm cùng các assertion phụ về null/cảnh báo. Chuẩn điện thế tự tính khoảng cách Euclid. Chuẩn RC dùng tích phân convolution bằng adaptive Simpson độc lập, không gọi hàm tính sản phẩm làm oracle.
- `node checks/expansion-300.mjs`: PASS. Đã điều chỉnh kiểm schema để chấp nhận metadata miền có kiểu boolean/string rõ; nhánh ngoài miền bắt buộc có cảnh báo và toàn bộ readout null, không được ghi nhận là phép đo Vật lí đạt.
- Kiểm mô hình dùng Node, không xác nhận ảnh WebGL, thao tác cảm ứng, Safari, máy chiếu, FPS phần cứng hoặc hiệu quả học tập.
- Đã chạy lại đối chiếu số độc lập đủ 300 ID trên mã hiện tại bằng cách đọc harness lịch sử, ghi bằng chứng mới riêng: 280 VERIFIED theo tiêu chí mẫu/miền, 20 PARTIAL, 0 FAILED; 143.974 so sánh Vật lí đạt trên 39.147 trạng thái đối chiếu. Báo cáo audit-300 cũ không bị ghi đè. Xem `AUDIT_REPORT.md` và `audit-v54-inventory.json`; không suy rộng kết quả số sang UI/sư phạm. Lệnh `--independent` cần archive harness người dùng có sẵn, không phải phụ thuộc runtime hoặc CI mặc định.

## Cơ sở đối chiếu

Các định luật được dùng: cộng thế Coulomb vô hướng; đáp ứng của hai hệ tuyến tính bậc một ghép qua bộ đệm; định luật Gauss với lớp điện vô hạn; bài toán Kepler/vis-viva ngoài vật trung tâm hình cầu; lực Lorentz và động năng phi tương đối tính. Tích phân convolution RC và khai triển nhỏ được tính trong bộ test độc lập.

Nguồn nguyên lí: OpenStax University Physics Vol. 2, phần electric potential, Gauss's law, RC circuits, motion of a charged particle in a magnetic field; University Physics Vol. 1, phần satellite orbits and energy; Vol. 3, phần relativistic energy. Danh mục nguồn nền hiện có trong `dist/lessons/references.js`. Không tuyên bố đã tải lại hoặc được tác giả/giáo viên ký duyệt những nguồn đó trong lượt kiểm số này.

## Trạng thái tích hợp và giới hạn

- DONE: TeX `potential_pair` dùng trị tuyệt đối; bài soạn batch-04 đã có cảnh báo không dùng khoảng cách có dấu và được giữ nguyên.
- DONE trong kiểm UI hiện tại: cảnh báo miền, chặn ghi điểm/chạy/step/ảnh và thanh thời điểm, đồ thị không tạo điểm0 từ null, quét bỏ trạng thái ngoài miền. Bảng cũ giữ nguyên. Chưa xác minh mọi phiên nhập lịch sử hoặc phản biện lại mọi số đo cũ.
- DONE ở desktop1440/mobile390 giả lập: ngoài miền thì canvas ẩn, có thông báo; trở lại miền hợp lệ khôi phục canvas và giữ bảng. Chưa xác minh Safari/thiết bị thật.
- Lỗi electric phần lực thành phần thuộc phần sửa của agent chính, không nằm trong năm sửa trên.
- Các mục PARTIAL trong kiểm toán cũ, bộ giải phi tuyến/ngẫu nhiên và phản biện sư phạm 300 bài vẫn cần quy trình riêng; không suy rộng từ năm bài sang toàn thư viện.
