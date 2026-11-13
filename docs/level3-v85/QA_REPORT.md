# QA độc lập bàn nhiệt 3D — v85

Ngày 2026-11-13. Baseline trước thay đổi: `4e129ebf2b7e9cbdfcaa50d68636fe6e12eed67a`.

**8/8 nhóm kiểm thử trình duyệt cuối đạt, 0 lỗi JavaScript không xử lí.** Mã runtime có cùng SHA-256 giữa cả tám nhóm, không đổi trong từng ca. Đây là bằng chứng phần mềm cho hai hoạt động A/B trong cùng ID `calorimetry`, không nghiệm thu toàn bộ 300 bài hoặc thiết bị thật.

## Bằng chứng 3D thực

Chromium **156.0.8078.79**, WebGL2 `OpenGL ES 3.0 Chromium`; renderer:

```text
ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)
```

SwiftShader là bộ dựng **phần mềm**, không phải phép đo GPU phần cứng. Không chỉ kiểm tên tệp hoặc sự có mặt của canvas: ca cuối kiểm WebGL context thật, thống kê scene có **48 mesh nhìn thấy / 9.644 tam giác / 97 draw calls**, pixels canvas 1050×609 có **7.848 màu**. Orbit đổi ma trận camera và ảnh dựng, trong khi trạng thái vật lí giữ nguyên; wheel zoom cũng không đổi physics. Đã xem ảnh dựng có khối, chiều sâu và bóng của cốc, bình, cân và đầu dò.

Kết quả và hash đầy đủ được lưu trong [verification-summary.json](evidence/verification-summary.json). Ảnh đã chọn: [bàn nước và đầu dò desktop](evidence/water-probe-desktop.png), [vật rắn tối desktop](evidence/solid-desktop-dark.png), [vật rắn tối mobile](evidence/solid-mobile-dark.png).

Hash module 3D của candidate đã kiểm:

```text
b43a9eae69d0024267a72e5a3863a69b1da39ad0d793fea0fd0e19c215f400db
```

## Các nhóm đã thực sự chạy

| Nhóm | Kết quả kiểm |
| --- | --- |
| Render và camera | WebGL/pixels/mesh thật; orbit và wheel đổi hình/camera, không đổi trạng thái vật lí hoặc dữ liệu cũ. |
| A — nước và đá | Native pointer raycast đặt bình, kéo cốc, xoay bằng **tâm gizmo** và rót đủ 0,2kg; đá ngoài bình bị từ chối; đầu dò trên nước chưa nhúng không cho số nước; nhúng đúng có số chỉ. Giữ số người học tự nhập. |
| B — vật rắn | Chuyển tay trần bị từ chối; kẹp→bể→kẹp→nước qua native 3D input; nhiệt vật tăng hữu hạn 20→49,8373°C sau 5s, không nhảy ngay 90°C; nước ấm lên. |
| VI/EN, sáng/tối, logo | Đổi EN và tối vẫn dựng 3D, giữ số đo; logo về home gỡ canvas cũ và đánh dấu renderer disposed; mở lại pilot/reload giữ dữ liệu. Không có canvas bị nhân đôi. |
| 2D và bàn phím | Lựa chọn 2D tường minh có SVG/bàn phím hoạt động; 2D→3D→2D giữ nguyên số đo. Không coi fallback là bằng chứng render 3D. |
| Hủy thao tác | Native mouse down/move rồi injected pointercancel hoặc browser releasePointerCapture trả vị trí, không tạo drop giả; physics giữ nguyên khi dừng. Đây là fixture vòng đời input, không phải ngắt cảm ứng trên máy thật. |
| Mobile và hai điểm chạm | 320×568, 390×844, 844×390: CDP touch kéo cốc thật, bàn phím xoay/rót; hai điểm chạm đổi camera mà không đổi physics; không tràn body, nút HTML tối thiểu 44px; canvas có pixels dựng thật. |
| Không có WebGL / mất context | `WEBGL_lose_context` làm fallback 2D và giữ số đo; bàn phím tiếp tục dùng được. Một browser khác chạy native `--disable-webgl` cũng mở 2D sử dụng được và giữ legacy storage. Các console error WebGL không khả dụng trong ca cưỡng bức này là dự kiến, không phải lỗi JS không xử lí. |

Trong các ca có thay đổi vật chất, đã kiểm residual khối lượng <1e-8kg và năng lượng <1e-5J. Đây là kiểm hồi quy trên hành trình, không thay thế oracle độc lập của agent physics.

Fixture `thpt-lab-v1` chứa cả calorimetry và một bài khác được so **nguyên byte** trước/sau. Các phép đổi trạng thái đi qua pointer, keyboard hoặc điều khiển HTML công khai; harness chỉ đọc `data-projections`/ma trận view để chọn tọa độ và đọc session đã lưu. Không gọi controller để thay physics.

## Lỗi ban đầu và tái kiểm

Lượt A đầu tiên click tâm vòng xoay đã raycast trúng bình phía sau: góc cốc vẫn0, thời gian0, nước trong bình0 và cốc còn0,2kg. UI agent sửa ưu tiên proxy gizmo được chọn trước mesh nền, đồng thời giữ actual mesh hit ưu tiên cho dụng cụ đang chọn. Tái kiểm riêng **tâm gizmo** đạt; lượt aggregate cuối cũng kiểm tâm này và đạt.

Raw failure và ảnh giữ ở `work/thermal-three-v85/first-ice/`; ca đó có source UI đang đổi, nên không trình bày là lỗi còn tồn tại của candidate cuối. Các lượt ban đầu khác có source change được giữ riêng. Report cuối ở `work/thermal-three-v85/final/report.json`; tám ca cùng source fingerprint, không phải tập hợp PASS từ các source khác nhau. Bản tóm tắt được chọn đã được đưa vào `evidence/verification-summary.json`.

## Lệnh và phạm vi nghiệm thu

```sh
python3 -m py_compile checks/browser-thermal-three-v85.py
python3 checks/browser-thermal-three-v85.py --out work/thermal-three-v85/final
```

Hàm kiểm tra cần Python Playwright, Pillow, Chromium và server HTTP đang phục vụ `dist/`. Có `--only`, `--url`, `--out`, `--chromium`; `--swiftshader` dùng khi cần chọn phần mềm tường minh. Trong lượt cuối, Chromium mặc định đã báo SwiftShader như trên.

Agent QA không chạy lại full npm. Agent chính đã chạy mandatory `npm run check`, kết quả EXIT0 và lưu log; các bộ Node/security/legacy2D riêng thuộc báo cáo tích hợp của agent chính. Không cộng các bộ đó vào tám nhóm WebGL ở đây.

Không còn blocker QA đã biết trong phạm vi nâng pilot A/B sang 3D. Đề nghị giữ **calorimetry PARTIAL**, 299 bài **NOT TESTED**, tổng300. Render 3D thật không tự biến các gate hoặc giáo viên/thiết bị thật thành PASS.

Chưa kiểm iPhone/Safari/Android vật lí, bàn phím ảo OSK, GPU phần cứng, hiệu năng P95/FPS trên điện thoại hoặc giáo viên. Kéo dụng cụ bị ràng buộc theo mặt phẳng XY của bàn; không tuyên bố đây là mô phỏng rigid-body sáu bậc tự do, va chạm tổng quát hay CFD. Phương trình và chứng cứ nghiệm thu Vật lí thuộc lớp rà soát độc lập, không suy ra từ hình ảnh đẹp hoặc pixels canvas.
