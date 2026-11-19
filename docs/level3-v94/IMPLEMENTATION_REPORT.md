# Quanh Lab V94 · Năm bàn thực hành trực tiếp

Các bài trong lô này mở bàn thực hành bằng nút **Thực hành trực tiếp** trên trang mô hình. Nút **Mô hình và bài học** mở lại không gian 2D/3D và học liệu của ID tương ứng. Hai hoạt động nhiệt lượng kế tiếp tục dùng bản V93.

| ID | Tự bố trí và tác động | Số đo và khảo sát |
|---|---|---|
| `ohm` | Chọn hoặc kéo các đầu dây tới cọc. Đóng/ngắt nguồn, sửa chỗ mắc sai. Mạch kiểm ngắn mạch, chiều cực và cách mắc đồng hồ. | Ghi U và I khi mạch hợp lệ. Giữ R, thay U, đối chiếu các điểm I–U. |
| `lens` | Dịch vật, thấu kính và màn trên ray. Đổi mẫu kính hội tụ. Màn thể hiện các trạng thái lệch nét, ảnh ảo, chùm song song hoặc ảnh ngoài ray. | Ghi khoảng cách từ vật và màn đến kính khi trong dung sai nét 0,5 cm. Đổi khoảng cách vật và dùng hai cặp đo để ước lượng tiêu cự. |
| `oscillation` | Kéo vật lệch khỏi cân bằng rồi thả. Bấm và chốt đồng hồ theo vòng tròn pha đồng bộ. | Ghi biên độ, thời lượng, số chu kì và chu kì trung bình quan sát được. Đổi khối lượng, giữ độ cứng. Sai lệch do thời điểm bấm đồng hồ là một phần của phép đo. |
| `lever` | Treo từng tải vào móc trên đòn hoặc trả về khay. Thay khối lượng khi tải ở khay. Móc đã có tải từ chối tải thứ hai. | Đọc cánh tay đòn vuông góc và mômen có dấu. Tìm hai tải khác nhau cho mômen cân bằng. Góc nghiêng biểu diễn trạng thái tì vào chặn trong mô hình tĩnh. |
| `gas` | Đẩy hoặc kéo pít-tông giữa hai chặn 2 và 10 L. Có nút và điều khiển bàn phím để chỉnh theo nấc. | Đọc P và V ở 300 K với 0,24 mol khí. Kiểm tích PV với nhiệt độ và lượng chất cố định. P/V hiển thị theo độ chia thiết bị. |

Bàn dùng trạng thái khoa học và phép đo của từng bài. Sổ tay ghi số chỉ khi học sinh chọn **Ghi số đo**, ghi phiên theo lượt và vẽ các điểm đo theo trục chọn. Mỗi lượt giữ dự đoán, phân tích, kết luận, cấu hình từng phép đo và nhật ký thao tác có phiên bản. Có xuất CSV, xuất JSON và nhập lại JSON đúng ID. Phiên thực hành có khóa lưu riêng cho từng bài. Tiếng Việt và tiếng Anh dùng cùng trạng thái phiên.

Lô này dùng một khung trang và sổ tay dùng chung. Các phép tính, điều kiện đo, công cụ và thao tác nằm trong module riêng theo ID. Cấu hình học sinh tiếp tục lưu khi đổi trang hoặc tải lại. Cơ chế nhập giới hạn kích thước, xác thực số hữu hạn và kiểm tra cấu hình bằng bộ kiểm của bài. Nhập đè cần xác nhận trong giao diện.

## Tiến độ cấp 3

| PASS | PARTIAL | NOT TESTED | BLOCKED | Tổng |
|---:|---:|---:|---:|---:|
| 0 | 6 | 294 | 0 | 300 |

Sáu ID PARTIAL gồm `calorimetry` và năm bài nêu trên. Còn chờ nghiệm thu của giáo viên, thiết bị Android và iPhone Safari thật, cùng đo hiệu năng phần cứng. V94 cung cấp nhiệm vụ khảo sát và sổ tay, còn chế độ đánh giá chuyên biệt theo từng bài nằm ngoài lô này.

Ưu tiên kế tiếp là sóng cơ với nguồn xung và đầu dò di chuyển, rồi điện trường với điện tích và đầu dò có miền đo. Tiếp theo áp dụng dụng cụ đã kiểm cho các bài dùng cùng nguyên lí, với một kịch bản sai, ca biên và oracle riêng theo ID.

## Tệp và phân công

- `app.js`, `boot.js`, `index.html` nối điều hướng, tải lười và cache. `practice-runner.js`, `practice-session.js`, `practice.css` phụ trách khung, sổ tay và lưu phiên.
- Các module `*-practice.js` và `*-practice.css` hiện thực bàn theo bài. Các tệp kiểm tương ứng ở `checks/`.
- Các agent `ohm_practice`, `lens_practice`, `oscillation_practice`, `gas_practice` và `lever_practice` phụ trách từng bàn và phép kiểm khoa học. Agent `practice_v94_qa` gặp giới hạn phiên trước khi giao kết quả. Agent chính thực hiện kiểm tích hợp, rà bố cục và phát hành.

## Chứng cứ kiểm thử

| Bộ kiểm | Kết quả |
|---|---|
| `node checks/practice-session-v94.mjs` | Năm schema thực hành, chống nhập nhầm ID, giữ giá trị của học sinh, kiểm đầu vào và 300 ID duy nhất. |
| `node checks/ohm-practice-v94.mjs` | 222 kiểm tra về topo, ngắn mạch, đầu đo, độ chia và lưu trạng thái. |
| `node checks/lens-practice-v94.mjs` | 3.691 kiểm tra giao tia, nhòe, ảnh thật/ảo, chặn ray và miền đo. |
| `node checks/oscillation-practice-v94.mjs` | 2.891 kiểm tra về quỹ đạo, pha, đồng hồ và trường hợp đầu vào sai. |
| `node checks/lever-practice-v94.mjs` | 94 kiểm tra cho mômen có dấu, cánh tay đòn, móc đã có tải và bảo toàn trạng thái. |
| `node checks/gas-practice-v94.mjs` | 801 trạng thái thể tích, áp suất và bảo toàn PV, cùng kiểm chặn và dữ liệu. |
| `python checks/browser-practice-v94.py` | 5 luồng trên Chromium 154.0.8037.57 ở độ rộng 320, 390, 768, 1440 px. Giữ số đo khi tải lại. Ca khí kiểm CSV/JSON, dữ liệu nhập sai, nhập lại đúng và VI/EN. [Bản ghi và mã băm](evidence/browser.json) |
| Kiểm độc lập đầu vào | [Mạch Ohm](evidence/ohm-circuit-input.json) · [Pít-tông](evidence/gas-piston-input.json) · [Cân đòn](evidence/lever-input.json) |
| `node scripts/audit-level3-v84.mjs --check` | Ma trận và dashboard khớp 300 ID, 388 trang sách, 85 mục lục, 301 âm thanh. [Ma trận](../level3-v84/catalog-audit.json) |

[Ohm trên mobile](evidence/ohm-390.png) · [Thấu kính trên desktop](evidence/lens-1440.png) · [Dao động lò xo](evidence/oscillation-768.png) · [Pít-tông](evidence/gas-390.png) · [Cân đòn ở 320 px](evidence/lever-320.png)
