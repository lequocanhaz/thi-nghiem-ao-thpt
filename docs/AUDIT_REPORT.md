# Kiểm toán Quanh Lab V5.0 — mốc ưu tiên v54

Ngày kiểm tra: 25/10/2026. Mã được kiểm tra là working tree sau bản v53; mã nền `4863af019a4cde215fd2f02b8b51f56922fe1f51`. Hash của các tệp khoa học và danh sách đầy đủ từng ID nằm trong [audit-v54-inventory.json](./audit-v54-inventory.json). Đây là kiểm toán có phạm vi, chưa phải nghiệm thu toàn bộ yêu cầu V5.0.

## Phạm vi và kết quả

| Lớp kiểm tra | Kết quả thực tế | Giới hạn |
|---|---|---|
| Danh mục | PASS: 300 ID duy nhất; lớp 10: 68, lớp 11: 156, lớp 12: 76 | 300 mục không đồng nghĩa 300 physics engine độc lập |
| Khởi tạo, dữ liệu, biểu đồ | PASS: 304 cấu hình mặc định, gồm bốn chế độ điện và hai chế độ tụ; không exception, không sửa input, không số không hữu hạn, bảng đúng schema, đồ thị có biên hữu hạn | Kiểm schema và số mặc định không chứng minh định luật đúng |
| Tương tác tham số | PASS: cả 300 mục có ít nhất một thay đổi tham số làm thay đổi kết quả tính ở một trạng thái thử | Không phải kiểm đủ mọi thao tác chuột/cảm ứng hoặc mọi tham số |
| Dụng cụ đo, đồ thị | Có định nghĩa readout, bảng và đồ thị cho 300 mục; không mục nào chỉ có ảnh mà không có tính toán | Định nghĩa không bảo đảm dụng cụ hiển thị/hiệu chuẩn đúng trong mọi cảnh |
| Kiểm số độc lập toàn danh mục | 280 VERIFIED theo tiêu chí hữu hạn của harness, 20 PARTIAL, 0 FAILED; xem định nghĩa bên dưới | Không đổi PARTIAL thành PASS, không suy rộng thành chứng nhận khoa học toàn miền |
| Sửa lỗi ưu tiên | Điện thế lưỡng cực, RC ghép tầng, trường lớp điện, miền quỹ đạo, miền cyclotron và độ lớn lực thành phần đã có kiểm số riêng đạt | Hình học/UX/WebGL xem báo cáo của nhóm tích hợp; không suy ra từ kiểm số |
| Trình duyệt, hình học | NOT TESTED bởi script inventory này | Bằng chứng riêng ở `VISUAL_QA.md`, `MOBILE_TEST_REPORT.md`; không xác nhận Safari/thiết bị thật |
| Chuyên gia/giáo viên duyệt 300 bài | NOT TESTED | Chưa có người duyệt độc lập hoặc dữ liệu lớp học |

Các phép thử độc lập thực tế đã xét **40.453 trạng thái**, trong đó **39.147 trạng thái** có đối chiếu Vật lí, với **143.974 so sánh Vật lí đạt**, **895 kiểm đơn vị đạt**, **3.544 kiểm đồ thị** và **395.911 kiểm mapping số liệu**. Không có so sánh Vật lí/đơn vị thất bại trong tập mẫu. Đây là số phép kiểm ở các tầng khác nhau, không cộng chúng thành số thí nghiệm độc lập. Tập mẫu dùng seed 20261020, mặc định/cận/giữa/preset và mẫu có seed; mục tiêu ít nhất 100 trạng thái đối chiếu hợp lệ mỗi cấu hình khi oracle có đủ phạm vi.

**VERIFIED/PASS số học** ở đây chỉ nghĩa các đại lượng có oracle đã khớp trên tập mẫu và miền đã khai báo. Nó không chứng minh mọi số thực, mọi bước tích phân, hình ảnh, nội dung bài soạn hay kết quả học tập. Các trạng thái ngoài miền bị loại không được tính là phép đo hợp lệ. **PARTIAL** có thể do miền loại trừ đã biết, thiếu oracle cho một số đầu ra hoặc bộ giải phi tuyến/ngẫu nhiên cần kiểm chứng chuyên sâu; không mặc định là lỗi sản phẩm.

## Các bộ giải và hình minh họa

Mọi mục đi qua `models.js:evaluate`. Các bài atlas/expansion có callback theo bài; các bài nền dùng nhánh ID và một số hàm chung trong `physics.js`/`discovery-models.js`. Renderer dùng lại họ cảnh, ví dụ `thermal_statistics`, `collision`, `field`, `orbit`; dùng chung họ cảnh không có nghĩa dùng chung phương trình.

Có **9 bài quang học dùng thời gian chuyển động minh họa**: `reflection`, `refraction`, `tir`, `lens`, `mirror`, `prism`, `young`, `diffraction`, `polarization`. Chúng vẫn có đầu vào, phép tính, bảng và đồ thị; thời gian đốm sáng không được dùng đo tốc độ ánh sáng. Không gọi chúng là ảnh tĩnh hoặc động lực học ánh sáng định lượng.

Các bài tĩnh sử dụng quy trình thay đổi tham số có kiểm tra đầu ra; bài động sử dụng thời gian. Inventory ghi rõ `interaction.playback`, nguồn tính, họ renderer và `rendering.illustrativeClock` cho từng ID. Chưa đếm “số solver độc lập” theo số ID hoặc tên họ cảnh vì đó là các khái niệm khác nhau.

## Hai mươi mục còn PARTIAL trong kiểm số

| ID | Khoảng trống/miền loại trừ |
|---|---|
| `lens`, `mirror` | Khoảng cách vật hoặc tiêu cự bằng 0 là điểm suy biến; kiểm các trạng thái hợp lệ không xác nhận xử lí hình ảnh tại mọi suy biến |
| `gyroscope` | Tỉ số tiến động chậm Ω/ω > 0,1 ngoài xấp xỉ |
| `elliptic_orbit` | Cận điểm nhỏ hơn 6371 km đi vào Trái Đất; miền này bị chặn, không gọi là nghiệm vệ tinh hợp lệ |
| `siphon` | Áp suất đỉnh dưới áp suất hơi; giả thiết cột chất lỏng liên tục không còn hợp lệ |
| `stokes_settling` | Reynolds thử > 0,1 ngoài miền Stokes |
| `large_pendulum` | Oracle chưa kiểm độc lập đầy đủ `theta`, `angularSpeed` của chuyển động phi tuyến |
| `parametric_oscillation` | Oracle chưa bao phủ `x`, `v`, `energy`; một số đơn vị đầu ra chưa được đối chiếu độc lập |
| `duffing`, `van_der_pol` | Oracle mới bao phủ các ca giới hạn/đặc biệt; chưa đủ trạng thái kiểm độc lập động lực học phi tuyến |
| `water_refraction` | Một số trạng thái không có tia truyền thực trong mô hình nước nông |
| `charged_plane` | Điểm chính xác trên mặt điện tích lí tưởng không có một giá trị trường duy nhất |
| `coaxial_capacitor` | Cần bán kính ngoài lớn hơn bán kính trong |
| `voltmeter_design` | Điện trở nhân dương yêu cầu Umax > Ig·Rg |
| `rectifier_filter` | Xấp xỉ gợn nhỏ chưa được xác nhận khi gợn vượt 20% |
| `cyclotron` | Tốc độ cổ điển > 0,1c ngoài xấp xỉ công bố |
| `wave_plate` | Phương trục lớn không xác định khi phân cực tròn |
| `brownian_motion` | Chưa có oracle độc lập đầy đủ cho quỹ đạo mẫu `x,y,z,sample`; kiểm thống kê riêng không chứng minh từng quỹ đạo |
| `van_der_waals` | Thể tích mol phải lớn hơn thể tích loại trừ b |
| `poisson_counting` | Chưa có oracle từng số đếm mẫu; kiểm thống kê phân phối là bằng chứng riêng |

## Thay đổi so với kiểm toán cũ

Báo cáo lịch sử `checks/audit-300/reports/` được giữ nguyên. Không chạy lại `run.mjs` vào thư mục báo cáo cũ và không đổi trạng thái của bằng chứng trước sửa.

Harness độc lập lịch sử được sử dụng **chỉ đọc** để đánh giá mã hiện tại. Hai adapter oracle được áp dụng trong bộ nhớ, có thể xem ở `checks/audit-v54.mjs --independent`: (1) điều kiện hình học Trái Đất hữu hạn `a(1−e)≥6371 km`; (2) tính độc lập các diagnostics mới `pericenter`, `classicalSpeed` và metadata miền. Các công thức oracle dùng hằng số của bộ test, không lấy từ sản phẩm. Không áp dụng các kết luận focused cũ vốn ghi lỗi theo trạng thái trước sửa; các ca tái hiện cụ thể được kiểm lại bởi `physics-v54.mjs` và `electric-components-v54.mjs`.

Nguồn oracle đã được đóng kèm tại `checks/independent-v54/` để có thể chạy lại từ checkout sạch, không phụ thuộc thư mục audit lịch sử chưa tracked. Chỉ sao chép các hàm tham chiếu/harness; giữ nguyên các báo cáo lịch sử. Kiểm inventory mặc định không tự chạy oracle; lệnh `--independent` thực sự chạy đối chiếu lại.

## Cách chạy và tái lập

```sh
node checks/audit-v54.mjs
node checks/physics-v54.mjs
node checks/electric-components-v54.mjs
node checks/expansion-300.mjs
# Chạy các tham chiếu đã đóng kèm và ghi báo cáo mới:
node checks/audit-v54.mjs --write --independent
```

Không dùng `--write` trong CI thường lệ để tránh sinh diff chỉ vì thời gian/hash. Chỉ lệnh có `--write` mới ghi `docs/audit-v54-inventory.json`; không thay đổi mã website hoặc báo cáo lịch sử. `--scientific=/đường/dẫn/kết-quả.json` có thể nhập kết quả độc lập đã chạy riêng; nhập tệp không phải tự chạy lại oracle. Dữ liệu kiểm tra mới không ghi âm thanh, sách hoặc phiên localStorage.

## Các pha tiếp theo của V5.0

Visual Settings và nền tảng glossary/i18n đã có kiểm tra riêng. Dịch hoàn chỉnh VI/EN của 300 bài/UI, các thiết lập bán kính/nền/vectơ đồng bộ renderer và đánh giá sư phạm vẫn cần hoàn tất; xem các báo cáo chuyên môn. Báo cáo này không chứng nhận các phần đó đã hoàn tất. Việc phát hành do đầu mối tích hợp quyết định sau kiểm hồi quy đầy đủ, QA và CI/Pages thành công.
