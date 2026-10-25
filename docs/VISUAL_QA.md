# Kiểm tra hình học v54

Ngày kiểm tra: 25/10/2026. Phạm vi thay đổi: cân đòn, khí lí tưởng và xi-lanh Boyle. Báo cáo này không xác nhận toàn bộ đồ họa của 300 thí nghiệm đã đạt mọi yêu cầu V5.0.

## Mô hình và sửa lỗi

| Khu vực | Trước sửa | Hành vi sau sửa | Trạng thái |
| --- | --- | --- | --- |
| Cân đòn | Thanh dài cố định trong khi cánh tay đòn được mở rộng; tải nằm ngoài thanh. Tải và dây quay cùng thanh, làm sai phương trọng lực và khoảng cách vuông góc dùng tính mômen. | Dùng mô hình B: `l1/l2` là khoảng cách vuông góc tuyệt đối từ trục đến đường tác dụng trọng lực. Thanh bao hết các điểm treo, dây thẳng đứng, tải đứng thẳng; độ nghiêng chỉ báo dấu mất cân bằng. Không đổi `mg*l`. | PASS — ràng buộc mesh và mômen độc lập |
| Khí lí tưởng | Đệm hạt cố định lớn hơn bề rộng bình khi thể tích ở cực tiểu; hạt có thể vượt thành. | Bán kính hiển thị và khoảng chạy lấy theo kích thước bình; kiểm tra cả bán kính hạt thay vì chỉ tâm. Tăng kích thước/màu hạt ở miền thông thường. | PASS — ma trận instance thực |
| Boyle | Piston đi xa hơn xi-lanh cố định khi tăng thể tích; nắp có thể chồng ở thể tích nhỏ. | Chiều dài xi-lanh, vị trí vòng/giá đỡ đi theo thể tích; độ dày nắp và bán kính hạt thích ứng. Hạt nằm giữa hai mặt nắp. | PASS — bao mesh thực và mặt nắp |
| Chuyển động hạt | Nguy cơ sửa đệm bằng wrap làm xuất hiện dịch chuyển tức thời. | Pha phản xạ liên tục; hạt mẫu đảo chiều thành phần vận tốc pháp tuyến ở thành. | PASS — 1.800 bước thời gian trên instance thực |
| Camera thủ công | Nguy cơ căn lại hình khi chạy hoặc sửa tham số. | Giữ vị trí camera, tâm pan và mức zoom sau zoom thủ công, khi chạy/dừng và đổi tham số biên. | PASS — 72 khung bằng đường cập nhật scene thật, 2D/3D |

`PARTICLE_DISPLAY_RADIUS` là bán kính đồ họa. Các hạt là mẫu minh họa, không phải bộ giải va chạm phân tử cứng; số lượng mẫu không phải số phân tử thực. Sửa màu/kích thước/vị trí hiển thị không tham gia các phép tính `pV=nRT`, vận tốc rms hoặc áp suất Boyle. Không xác nhận mô phỏng va chạm hạt–hạt thực.

## Bằng chứng tự động

Đã chạy các lệnh sau trên mã đang sửa:

```sh
node checks/geometry-v54.mjs
node checks/playback-v32.mjs
node checks/spatial-view.mjs
```

Kết quả:

- `geometry-v54`: PASS 179 trạng thái cân đòn, gồm tổ hợp biên chung và mẫu liên tục xác định bằng seed; 40.682 vị trí/bán kính hạt; 1.800 bước kiểm tra không teleport; 72 khung giữ camera thủ công.
- `playback-v32`: PASS đủ 300 bài có thay đổi dụng cụ thực, 631 điều khiển, 221 tiến trình điều khiển và 79 tiến trình thời gian/phát xạ. Đây là hồi quy hành vi, không phải chứng nhận khoa học độc lập của 300 bài.
- `spatial-view`: PASS dựng đủ 300 dụng cụ trong camera trực giao và Canvas projection, chuyển 2D/3D, phục hồi camera 3D, quy ước tọa độ và hành vi tương tác thay thế. Bao gồm 13 profile có tỉ lệ đo và 62 profile chỉ định hướng.

Các phép kiểm tra hình học dùng `BufferGeometry`, `InstancedMesh` và phép biến đổi thế giới thực của mô hình; kiểm tra mômen độc lập bằng tích khoảng cách ngang với lực trọng trường. Không chỉ so sánh kết quả helper với chính helper.

Đã xem trực quan các ảnh do QA tạo tại `/tmp/quanh-physics-v54/`: cân đòn ở 1440/390 px, khí và Boyle tại `V=0,2/50 L` ở 1440 px. QA xác nhận canvas khí có context WebGL2 SwiftShader thực, không mất context, không có thông báo Canvas fallback. Trong các ảnh này không thấy tải vượt thanh hoặc hạt vượt bình. Tuy nhiên thanh/vật liệu còn nhạt và hạt tại thể tích cực nhỏ rất khó thấy hoặc bị nắp che; đây là phần phải tiếp tục cải thiện, chưa đủ căn cứ đánh dấu mục độ rõ toàn bộ đối tượng là PASS.

## Giới hạn và phần chưa xác minh

- Kiểm tra ở trên là CPU/DOM, không phải bằng chứng ảnh WebGL hoặc hiệu năng GPU. Kiểm thử trình duyệt được QA báo riêng trong `MOBILE_TEST_REPORT.md`.
- NOT TESTED: iPhone/iPad thật, Safari/iOS, thiết bị Android thật và máy chiếu lớp học.
- NOT TESTED: độ tương phản đo trên pixel ở mọi góc nhìn/zoom, occlusion toàn bộ nhãn của 300 bài, FPS phần cứng thấp, rò bộ nhớ qua phiên dài.
- NOT IMPLEMENTED trong phạm vi này: Visual Settings chung, chế độ High Contrast/Reduced Motion theo V5.0, mật độ/vệt hạt do người dùng chỉnh, điều chỉnh thang hiển thị từng nhóm vectơ.
- Việc giảm bán kính hạt tại thể tích cực nhỏ là cần để giữ hình học đúng; không bảo đảm mọi hạt đều có kích thước dễ quan sát ở mọi mức zoom. Cần đánh giá tiếp bằng thiết bị thật và thiết lập hiển thị chung.
- Chỉ ba mô hình đồ họa được sửa ở đây. Hồi quy toàn danh mục không tương đương rà soát sư phạm độc lập từng mô hình.

## Bổ sung từ QA tích hợp

Menu Hiển thị đã được nối vào app và kiểm Chromium12/12 nhóm, gồm bốn preset giữ camera/thời gian/rows trên1440/390. Xem MOBILE_TEST_REPORT.md và VISUAL_SETTINGS.md. Điều này không chứng nhận vật liệu/độ rõ mọi mesh hoặc đủ mọi thanh chỉnh trong V5.0.
