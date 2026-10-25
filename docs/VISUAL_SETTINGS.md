# Thiết lập hiển thị v54

## Phạm vi đã triển khai

Một menu `Hiển thị` nằm cạnh lựa chọn 2D/3D trong mỗi phòng thí nghiệm. Menu dùng `<details>` và các nhãn biểu mẫu thật, không thay vùng thông số hoặc dựng lại phiên đo.

- **Tiêu chuẩn:** kế thừa nhãn, lưới và đường phụ của bài đang mở.
- **Tương phản cao:** tăng tương phản chữ, khung và điều khiển quanh mô hình. Không dùng bộ lọc CSS để đổi màu điện tích hay màu vật lí.
- **Trình chiếu lớp học:** yêu cầu nhãn mô hình, chữ số đọc lớn và chế độ teacher của renderer; ẩn lưới để giảm nhiễu. Việc vào/thoát bố cục trình chiếu do ứng dụng điều phối.
- **Giảm chuyển động phụ:** tắt chuyển động phụ qua cờ `motion` và chuyển tiếp trang trí trong phòng thí nghiệm. Không dừng thời gian mô phỏng, sửa phương trình hoặc thay số đo.

Nhãn/lưới/quỹ đạo có ba lựa chọn: `Theo thiết lập bài`, `Hiện`, `Ẩn`. `Theo thiết lập bài` giữ công tắc hiện có của bài thay vì ghi đè hàng loạt. Quỹ đạo áp dụng với mô hình đã hỗ trợ công tắc đường phụ; đây không phải bộ tạo vệt mới cho cả 300 bài.

Lưu lựa chọn trong khóa riêng `quanh-visual-v1`. Mã này không ghi/xóa `thpt-lab-v1`, không sửa cấu trúc bản ghi, thông số, thời gian hoặc camera. Khi storage bị chặn/hỏng, giao diện vẫn có cấu hình mặc định.

## Tích hợp

- `visualPreset(mode)` trả cấu hình mới, không sửa cấu hình truyền vào.
- `updateVisualSetting(current, key, value)` nhận `mode`, `contrast`, `reducedMotion` (boolean), hoặc `labels/grid/trajectory` (`inherit/on/off`).
- `visualRenderConfig(config, settings, {presentation,motion})` tạo bản sao cấu hình renderer và công tắc; không sửa state vật lí. Trình chiếu đang bật luôn được giữ.
- `applyVisualAppearance(stageShell, settings)` chỉ thêm dữ liệu/lớp cho phòng thí nghiệm.
- `syncVisualSettings(document, settings)` cập nhật lựa chọn tại chỗ sau đổi preset, giữ node và focus.
- Ứng dụng tải `visual-settings.css`, lưu sở thích riêng và nối `change` qua `data-visual-setting`.

## Kiểm tra và giới hạn

`node checks/visual-settings-v54.mjs` kiểm tra 4 preset, storage riêng và lỗi storage, dữ liệu lạ, kế thừa công tắc, nhãn trợ năng, cùng 1.200 phép đánh giá mô hình không đổi kết quả (300 bài × 4 chế độ). Đây là kiểm tra Node/DOM, không phải bằng chứng hình ảnh WebGL hay cảm ứng thật. Kiểm thử trình duyệt/state/camera thuộc vòng tích hợp của QA.

Chưa triển khai thanh chỉnh bán kính hạt, marker, thang vectơ, mật độ đường sức, viền hoặc nền tối chung cho cả hai renderer. Không đưa các điều khiển chưa nối renderer lên giao diện. Tương phản cao của menu này hiện điều chỉnh phần giao diện; cải thiện vật liệu/hạt khí thuộc bản sửa hình học riêng và chưa được tổng quát cho toàn bộ 300 mô hình.
