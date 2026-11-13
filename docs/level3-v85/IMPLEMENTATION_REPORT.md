# Bàn nhiệt lượng kế 3D — v85

Ngày 13/11/2026 (UTC+7). Yêu cầu trực tiếp mới: bàn thực nghiệm phải là 3D; bản SVG v84 chưa đúng ý người dùng. Phạm vi lần này là hai hoạt động của ID `calorimetry`, không phải nâng đồng loạt 300 bài.

## Thay đổi

- `dist/l3/thermal-three.js` và `thermal-three.css`: renderer Three.js tự lưu trữ thư viện, mesh dụng cụ, nước/đá, ánh sáng, raycast thao tác, xoay/thu phóng camera. Mặc định mở 3D khi có WebGL; có sơ đồ 2D và đường phục hồi nếu không khởi tạo hoặc mất context.
- `thermal-pilot.js`: nối renderer với cùng các action/model/đầu dò/sổ tay v84, lưu tùy chọn góc nhìn và camera ngoài dữ liệu vật lí, hủy tài nguyên khi chuyển trang/hoạt động/ngôn ngữ. Chọn dụng cụ, nút di chuyển chính xác và bàn phím vẫn dùng được.
- `apparatus-registry.js`: dòng rót chỉ vào bình nếu miệng cốc nằm trên/cùng vành bình (`y ≤ 156`) và trong khẩu độ ngang. Miệng cốc dưới vành không được coi là rót xuyên thành bình. Mô hình trao đổi nhiệt không đổi.
- `thermal-view.js`: thêm giới hạn về kích thước hình minh họa; giữ SVG để tương thích và phục hồi. Boot/app/index chuyển cache phiên bản85, lối vào bàn 3D hiện rõ trong bài cũ.
- `checks/`: harness 3D mới; harness v84 chọn rõ 2D để tiếp tục kiểm tương thích; thêm ca miệng cốc dưới vành. Không sửa solver cũ, backend AI, đăng nhập, sách, audio hoặc 300 ID.

## Hợp đồng không gian và giới hạn

Đây là mesh 3D với camera phối cảnh và raycast, không phải ảnh SVG phủ lên canvas. Mặt phẳng thao tác đứng của v84 được bảo toàn: `X=(x−400)/1000`, `Y=(348−y)/1000`, `Z=0`. Camera thay đổi góc quan sát, không đổi khối lượng/nhiệt độ. Đầu dò tại origin; đầu que khuấy cách origin10 đơn vị xuống dưới. Cốc nghiêng quanh trụcZ với dấu âm, để miệng cốc và dòng rót khớp điều kiện vật lí hiện hữu.

Chuyển động dụng cụ bị ràng buộc trên mặt phẳng thao tác, chưa phải cầm tự do sáu bậc tự do hoặc mô phỏng va chạm vật rắn đầy đủ. Kích thước dụng cụ được phóng đại để dễ chọn; dung tích/khối lượng lấy từ mô hình SI, không suy từ thể tích mesh hay pixel. Mặt nước/đá biểu diễn trạng thái và trộn, không phải CFD. Hệ số truyền nhiệt chưa hiệu chuẩn bằng dụng cụ thật.

## Trạng thái cấp độ3

| Trạng thái | Số ID |
|---|---:|
| PASS | 0 |
| PARTIAL | 1 (`calorimetry`, hai hoạt động) |
| NOT TESTED | 299 |
| BLOCKED | 0 |
| Tổng | 300 |

3D không tự làm tăng trạng thái nghiệm thu. Giáo viên, điện thoại thật/iPhone Safari và P95/30FPS trên thiết bị mục tiêu chưa được xác minh.

## Kiểm thử và phát hành

`npm run check` hoàn tất exit0. `node checks/l3-thermal-physics-v84.mjs` đạt61.503 assertion; `node checks/l3-data-interaction-v84.mjs` đạt cả cổng rót dưới vành. `python3 checks/browser-thermal-three-v85.py --out work/thermal-three-v85/final` đạt8/8 nhóm trên source đóng băng (hash trước/sau không đổi), Chromium156.0.8078.79/ANGLE SwiftShader. Năm ca browser2D tương thích cũng đạt; bốn cấu hình UI1440/320/390 VI/EN sáng/tối không tràn ngang hoặc lỗi JavaScript. Security306HTML/496publictextassets vàdiffcheck đạt.

Kết quả cụ thể nằm trong `QA_REPORT.md` và `PHYSICS_REVIEW.md`. Các báo cáo Chromium/SwiftShader là kiểm phần mềm, không phải thử GPU hoặc chạm điện thoại thật. Trạng thái main/CI/Pages/live chỉ được xác nhận sau push bằng workflow và smoke test riêng.

## Demo

Mở `/#lab/calorimetry?l3=ice`, đặt bình, chọn cốc, kéo miệng cốc lên trên bình và nghiêng để rót. Cân/thả đá, nhúng đầu dò vào phần nước, khuấy rồi tự ghi ít nhất5 điểm. Đổi sang Xoay góc nhìn và kiểm rằng camera đổi nhưng số liệu không đổi. Đổi sang Sơ đồ2D hoặc reload: số đo vẫn được giữ. Với0,2kg nước40°C và0,02kg đá0°C, cân bằng lí tưởng khoảng29,1°C; không ép số chỉ hữu hạn có độ trễ thành nghiệm lí thuyết.

Ưu tiên tiếp: nghiệm thu sư phạm và thiết bị thật; điều chỉnh usability/camera theo kết quả đó; hoàn thiện tương tác không gian/va chạm nếu cần; sau đó mới nhân rộng archetype sang các nhóm vật lí khác theo đặc tả.
