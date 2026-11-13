# QA v86

Phạm vi: hai hoạt động của `calorimetry`; không chứng nhận300 lab cấp3. Baseline HEAD71344a9. Agent `thermal_collision86` thực hiện hình học/oracle; `thermal_review86` rà soát dữ liệu/vật lí và integration; `thermal_qa86` thực hiện UI/browser với input chuột, bàn phím và CDPtouch; root kiểm storage và tổng hợp phát hành.

## Kiểm thử đã xác nhận

| Lệnh | Kết quả/phạm vi |
|---|---|
| `npm run check:thermal-v86` | PASS7.175 so sánh hình học+16 sweep;58 statehợp lệ/56 statebịloại/62 importbịloại |
| `node checks/l3-thermal-physics-v84.mjs` | PASS61.503 assertion, oracle nhiệt và bảo toàn; không chứng nhận thiết bị |
| `node checks/l3-data-interaction-v84.mjs` | PASS tương thích dữ liệu/tương tác |
| `node scripts/audit-level3-v84.mjs --check` | PASS300 ID duy nhất,300 học liệu,388 trang/85 mục lục/301 audio;0 L3 PASS,1 PARTIAL,299 NOT TESTED |
| `node checks/site-security-v63.mjs` | PASS306 HTML và497 public text assets |
| `python3 checks/browser-thermal-storage-v86.py` | PASS4 ca: bản gốc lỗi và quota cho A/B; Chromium 154.0.8037.57, desktop1440/mobile390,2D để cô lập lưu trữ; sourcehash trước/sau giống nhau |

`python3 checks/browser-thermal-v86.py --url http://127.0.0.1:4176 --out work/thermal-v86/final --swiftshader`: **11/11 nhóm PASS**, exit0, Chromium 154.0.8037.57/WebGL 2/ANGLESwiftShader;0 unhandled JavaScript. Manifest nguồn trước/sau giống nhau trong từng ca và xuyên suốt11 nhóm. [Report đầy đủ](evidence/browser-final.json), [storage4 ca](evidence/browser-storage.json), [ảnh và UI review](UI_REVIEW.md).

Có lượt trung gian đang sửa nguồn; [rawreport](evidence/intermediate-source-change.json) ghi rõ pilot đổi hash. Lượt đó không được tính làm bằng chứng nghiệm thu cuối. Lượtnpm khởi đầu trước bản sửa storage cũng đã dừng, không tính PASS. **Fullnpm cuối PASS**, exit0,709,54s, Node24.19.0; source manifest trước/sau giống nhau. [Manifest/kết quả](evidence/npm-check-final.json), [log nguyên bản](evidence/npm-check-final.log). Log có cảnh báo metrics font KaTeX tiếng Việt không làm thất bại bộ kiểm; không sửa hoặc lọc log để che cảnh báo.

## Thiết kế ca kiểm

- Sai miệng/thân cốc, kéo nhanh xuyên hai thành, xoay/cạnh mặt bàn; đúng rót, lòng bình mở, hủy thao tác không ép góc; đối chiếu lượng chất/ledger.
- Mouse1440 và CDPtouch390 riêng cho cả hai bài, có framebuffer để chứng minh WebGL hoạt động.
- Phiên cũ có cup pose sai: không tự dịch, không rót giả, nút khôi phục bằng bàn phím giữ readings và vật chất.
- Phiên5.000 events: thao tác bị từ chối không thêm5.001, export/import vẫn đúng.
- Import residual chuỗi/giả/thể tích thiếu bị từ chối, giữ nguyên byte storage.
- Backup storage: JSON luôn giữ draft RAM; bản gốc lỗi tải riêng byteexact; nhập thay bị chặn trước backup. Quota không làm mất bản lưu trước.
- Raycast/camera/zoom/resize, hành trình nước–đá và kẹp/vật rắn, VI/EN/theme/view/reload,2D keyboard, capture/cancel và WebGLfallback/contextloss trong harness3D.

## Chưa nghiệm thu và rủi ro

Chưa chạm thiết bị Android/iPhone thật, chưa Safari iOS/Edge hoặc GPU yếu thật, chưa giáo viên đánh giá. Không ghi P95≤100ms hoặc30FPS thành kết quả. Chromium CDPtouch là giả lập giao thức, không phải bằng chứng phần cứng.

Bình/cốc chưa hiệu chuẩn thể tích theo hình học. Collision là hình bao2,5D; chưa đảm bảo khe hở theo bán kính3D hoặc dụng cụ khác. Các giới hạn này giữ `calorimetry` PARTIAL. Xem PHYSICS_REVIEW và IMPLEMENTATION_REPORT.

Trình duyệt có thể từ chối/hủy tải tệp sau yêu cầu download; chương trình chỉ xác nhận đã yêu cầu tải xuống. Không cam kết tệp đã được lưu trên đĩa của người dùng.

Kiểm bổ sung A→B→A→B/reload: PASS, giữ hai tập readings32,1°C và23,4°C độc lập và bản classic nguyên byte. [Kết quả](evidence/browser-cross-activity.json), [script kiểm bổ sung](evidence/cross-activity.py) dùng lại phần helper của harness đã đóng băng; chỉ biên dịch mã kiểm thử tin cậy trong repo, không thực thi dữ liệu nhập. Chạy từ gốc repo với server4176.
