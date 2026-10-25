# Giao diện Quanh Lab v53

Tinh chỉnh giao diện hiện có theo yêu cầu chủ dự án; không thay mô hình Vật lí, danh mục, bài soạn, sách, âm thanh, logo, font hoặc banner.

## Thay đổi

- Tên bài giữ cách viết gốc thay cho ép chữ hoa; dùng Manrope 700 và nhãn phụ dễ đọc hơn. Thẻ giảm thông tin lớp/trạng thái lặp, giảm khung phụ.
- Thẻ chưa có ảnh mô hình hiển thị công thức thật từ catalog KaTeX, có nhãn “Quan hệ khảo sát”. Không tải WebGL để tạo thẻ trang chủ. Pipeline ảnh mô hình/cache cũ vẫn hoạt động sau khi mở bài; không khôi phục bộ ảnh đã bị hoàn tác trước đây.
- `.controls-rail` giới hạn sticky vào hàng chứa mô hình, tránh đè lên panel dữ liệu mở rộng ở hàng sau. Cùng node điều khiển được chuyển qua breakpoint, giữ giá trị, sự kiện và dữ liệu phiên.
- Chạy/Ghi điểm đặt trước vùng mô hình trong thứ tự DOM; công cụ phụ nằm trong native details. Các menu phiên/bố cục hỗ trợ Escape và bấm ngoài. Giữ nút đặt lại góc nhìn, trình chiếu, hướng dẫn, camera, 2D/3D và các công cụ hiện có.
- “Phiên” phân biệt trạng thái lưu trên thiết bị với tải bản sao JSON và mở phiên từ tệp. Trạng thái chỉ báo đã lưu khi localStorage ghi thành công.
- Trợ lý có ba gợi ý theo bài/thư viện. Bấm chỉ bổ sung vào nháp, giữ hình ảnh, không tự gửi hoặc gọi API; tham số lấy tại thời điểm bấm.
- Liên kết mở trực tiếp `#library`/`#main` khởi tạo thư viện đầy đủ; chỉ bỏ qua dựng lại khi giao diện đã được khởi tạo, không nhầm ba thẻ HTML ban đầu với thư viện đang hoạt động.
- Entrypoint/CSS/views/assistant dùng phiên bản URL v53; các tài nguyên không đổi giữ URL cũ.

## Kiểm tra

```sh
npm run check
```

Các kiểm tra cũ về chữ hoa/weight800, menu đã bỏ và cấu trúc sticky được cập nhật theo hành vi mới. Kiểm bảo toàn giữ nguyên hash banner/media, phần stylesheet gốc, font, logo, 300 ID, bài soạn, sách và âm thanh. Phần CSS thêm không được chứa selector ghi đè banner/nhận diện hoặc import stylesheet ngoài.

Kiểm tra trình duyệt tùy chọn: phục vụ `dist/` tại `http://127.0.0.1:4173/`, chuẩn bị Python Playwright và Chromium `/usr/bin/chromium`, rồi chạy:

```sh
python3 checks/browser-interface-v53.py
python3 checks/browser-catalog-math-v53.py
```

Artifact nằm trong `/tmp/quanh-ui-v53-qa/` và `/tmp/quanh-ui-review/`, không ghi đè báo cáo kiểm định cũ. Trình duyệt chặn mọi request ngoài origin cục bộ. Các phép kiểm bao gồm sticky/dock không giao nhau khi cuộn, giữ node/ghi chép/số đo qua breakpoint, nhập/xuất JSON thật, menu bàn phím, gợi ý trợ lý không tự gửi, hiển thị nút Chạy trên mobile và bố cục công thức của đủ 300 thẻ ở ba độ rộng.

## Giới hạn

Chromium headless/SwiftShader và viewport mô phỏng không chứng minh FPS phần cứng hay hành vi Safari/cảm ứng thật. Không gọi AI thật, không xác nhận chất lượng câu trả lời backend. Đợt giao diện không sửa sáu nhóm vấn đề khoa học đã ghi trong kiểm định audit-300 và không chứng nhận sư phạm độc lập cho toàn bộ bài học. Chỉ được báo đã lên web sau khi push và GitHub Pages triển khai thành công.

Kết quả trình duyệt của đợt này: 8/8 nhóm QA đạt, không có page error hoặc request ngoài origin. Kiểm tra riêng toàn bộ danh mục đạt 900 trường hợp (300 thẻ × 320/390/1440 px), không cắt công thức theo chiều dọc hoặc tràn ngang trang. Đây là bằng chứng bố cục và tương tác trong Chromium, không phải xác nhận 60 FPS hoặc kiểm thử thiết bị thật.

Benchmark kế thừa v52 chạy với `QUANH_PERF_ASSERT=1` cũng đạt cả năm kịch bản điện trường/sóng, gồm DPR2 và CPU4 giả lập: không dựng lại model, ô số đọc hoặc nút Chạy trong khoảng đo; SVG sóng được giữ. CPU4 vẫn có long task, nên không tuyên bố đã hết giật hoặc đạt 60 FPS. JSON của lượt này nằm ở `/tmp/quanh-ui-review/performance-v53.json`.

Bộ `npm run check` bản cuối hoàn tất với mã thoát 0, gồm hồi quy 300 route, 61.200 khung playback, 17.185 khung ray xe, 300 công thức KaTeX, sách/cảm ứng mô phỏng, trợ lý và relay fixtures. Kiểm tra cold anchor mới cho `#library` và `#main` đều đạt.
