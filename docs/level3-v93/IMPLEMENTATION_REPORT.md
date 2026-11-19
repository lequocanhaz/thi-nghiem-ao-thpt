# Bàn nhiệt lượng kế V93

Phạm vi gồm nước–đá và nhiệt dung riêng của vật rắn trong mục `calorimetry`. Bố cục dùng mô hình và số đo bên trái, thao tác bên phải trên desktop. Trên điện thoại, thao tác nằm ngay dưới mô hình và trước mục đo, ghi số liệu.

| Chức năng | Hành vi |
|---|---|
| Khuấy nước | Một lần nhấn lập đường nhúng đầu que và khuấy trọn một vòng. Từng đoạn qua bộ kiểm va chạm hiện có. Mô hình chỉ ghi thao tác khuấy sau khi thực hiện xong vòng trong nước. Escape hủy chuyển động đang thực hiện. |
| Châm nước | Nút chính đổi thành Châm nước vào cốc khi nước cấp đã cạn. Khi còn nước, có thể dùng Châm đầy cốc. Thao tác đưa cốc về tư thế thẳng nếu đường xoay hợp lệ, cấp nước ở nhiệt độ nguồn và giữ nguyên số đo, thời gian, mẫu cùng lượt hiện tại. Học sinh điều khiển lần rót tiếp theo. |
| Đồ họa | Xanh cyan đánh dấu nước và mặt thoáng. Viền xanh làm rõ đá. Que khuấy có tay cầm hổ phách, mẫu rắn có màu đồng và bể nóng có sắc ấm. Hiệu ứng mặt nước phản ánh cường độ khuấy của mô hình, được giản lược khi giảm chuyển động. |
| Dữ liệu | Nước bổ sung được ghi trong sự kiện và sổ cân bằng khối lượng, nhiệt lượng. CSV thêm cột `mass_in_kg` ở cuối. Phiên cũ dùng giá trị không bổ sung khi thiếu trường mới. |

Dung lượng châm theo khối lượng cấp đã cấu hình cho cốc. Nếu lượt đặt khối lượng cấp bằng 0, cấu hình một lượt có nguồn nước. Rót thêm nước qua miệng bình vẫn tuân theo dung tích, phần tràn và điều kiện đo của mô hình. Hiệu ứng chỉ minh họa chuyển động trộn và dùng mặt thoáng từ hình học hiện hành.

## Thử thao tác

1. Đặt bình lên bàn, đưa cốc đến bình và rót nước.
2. Chọn **Khuấy nước** để xem que tự nhúng và khuấy. Có thể kéo que trực tiếp hoặc dùng bàn phím.
3. Nhúng nhiệt kế, ghi số đo. Khi cốc cạn, chọn **Châm nước vào cốc** và kiểm tra số đo cũ trong sổ tay.
4. Rót thêm bằng hành động chính hoặc chọn lượng rót theo gam.

## Mã nguồn và nghiệm thu

- `thermal-pilot.js`, `thermal-assist.js`, `thermal.css` cập nhật bố cục và điều khiển bàn thực nghiệm.
- `thermal-physics.js`, `measurement-engine.js`, `data-notebook.js` cập nhật hành động châm và sổ cân bằng.
- `thermal-three.js`, `thermal-view.js` cập nhật vật liệu và hiệu ứng 3D, 2D.
- `checks/thermal-refill-v93.mjs`, `checks/thermal-assist-v90.mjs`, `checks/browser-thermal-bench-v93.py` kiểm bảo toàn, đường đi của que, bố cục và giữ phiên qua tải lại.

Danh mục nghiệm thu cấp độ 3 gồm 300 ID, với 0 PASS, 1 PARTIAL, 299 NOT TESTED và 0 BLOCKED. Kiểm tra thiết bị iPhone/Android thật, nghiệm thu giáo viên và benchmark phần cứng còn mở.

## Kết quả kiểm thử

| Bộ kiểm | Kết quả |
|---|---|
| `node checks/thermal-refill-v93.mjs` và `node checks/thermal-assist-v90.mjs` | Lần lượt đạt 590 và 1.030 kiểm tra mô hình, dữ liệu và đường khuấy. |
| `python checks/browser-thermal-bench-v93.py --url http://127.0.0.1:4199` | 3/3 luồng đạt trên Chromium 154.0.8037.57. Một lần nhấn khuấy, châm lại 200 g, giữ nguyên lượt và số đo khi tải lại ở 320, 390 và 1440 px. [Bản ghi](evidence/interaction.json) |
| `python checks/browser-thermal-viewports-v87.py --url http://127.0.0.1:4199 --swiftshader` | 18/18 bố cục. Chín độ rộng từ 320 tới 1920 px trên hai bài. [Bản ghi](evidence/viewports.json) |
| Các nhóm camera, bàn phím, đổi sang 2D và hủy kéo | 3/3 nhóm hồi quy. [Bản ghi](evidence/camera-and-input.json) |
| Rà soát giao diện và đồ họa | 16 bố cục dựng hình và 9 phép thử hiệu ứng, kích thước, khung cận cảnh. [Đồ họa](evidence/graphics.json) · [Kích thước và hiệu ứng](evidence/motion-and-size.json) |
| Rà độc lập thao tác và dữ liệu | Escape và nút Dừng di chuyển đều hủy vòng khuấy. Châm 75 g giữa lượt, xuất CSV và nhập JSON của V92 và V93 đạt. [Bản ghi](evidence/cancel-refill-and-compat.json) |

[Ảnh nước–đá trước](evidence/ice-before-390.png) · [Ảnh nước–đá sau](evidence/ice-after-390.png) · [Ảnh cận cảnh khi khuấy](evidence/ice-mixing-390.png) · [Bố cục desktop](evidence/solid-desktop.png) · [Bể nóng chế độ tối](evidence/solid-dark-1050.png)

Rà soát vật lí và dữ liệu do agent `acceptance91_science` thực hiện. Agent `acceptance91_ux` phụ trách đồ họa và camera. Agent `thermal_v93_qa` tái hiện lỗi hủy bằng Escape, kiểm lại bản sửa và kiểm tương thích phiên.
