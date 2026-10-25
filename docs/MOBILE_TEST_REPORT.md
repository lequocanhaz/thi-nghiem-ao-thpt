# Kiểm thử trình duyệt v54

Ngày: 25/10/2026. Đây là kiểm tra chọn lọc trên Chromium 154.0.8037.57 headless, WebGL2 qua SwiftShader, desktop 1440×900 và viewport 390×844 có giả lập touch/mobile. Không phải iPhone, Android hoặc Safari thật.

## Cách tái hiện

Phục vụ `dist/` qua HTTP tại `127.0.0.1:4173`, chuẩn bị KaTeX theo `CODEX_HANDOFF.md`, rồi chạy:

```sh
python3 checks/browser-physics-v54.py
```

Cần Python Playwright và `/usr/bin/chromium`. Bài kiểm tra chặn mọi request ngoài localhost, không gọi AI/API trả phí. JSON/ảnh mới được ghi riêng tại `/tmp/quanh-physics-v54/`, không ghi đè báo cáo lịch sử `checks/audit-300/reports/`.

## Bằng chứng hiện tại

Lần chạy hoàn tất gần nhất: **PASS 12/12 nhóm, không pageerror, không request ngoài localhost**. Đã sửa oracle khí từ hằng R làm tròn 8,314 sang giá trị SI 8,314462618; sai số ban đầu là lỗi kiểm thử, không phải lỗi áp suất sản phẩm.

| Kiểm tra | Desktop 1440 | Mobile giả lập 390 | Phạm vi được chứng minh |
| --- | --- | --- | --- |
| Cân đòn | PASS | PASS | Năm tổ hợp l1/l2/m1/m2, gồm 0,02–10 m và 0,02–15 kg; số đo độc lập `9,81(m1*l1-m2*l2)` khớp; không NaN/Infinity |
| Khí/Boyle | PASS | PASS | V=0,2/50 L, chọn cả 2D/3D, canvas hiển thị, ghi áp suất đúng `nRT/V` hoặc `600/V` |
| Điện thế hai nguồn | PASS | PASS | Ba điểm UI giữa/ngoài nguồn; thêm x âm bằng module nạp trong trình duyệt, oracle khoảng cách tuyệt đối |
| Miền cyclotron/quỹ đạo | PASS | PASS | Cảnh báo hiện, mô hình ẩn, Play/Step/Record disabled; click DOM không thêm số đo; trở về miền hợp lệ ghi tiếp được, số đo cũ nguyên vẹn, không tràn chiều ngang |
| Quét tham số qua biên cyclotron | PASS | PASS | B quét 0,1–5 T tại r=10 cm: đúng 6/10 trạng thái hợp lệ được ghi, 4 bị loại và có thông báo, rows cũ giữ nguyên; cuối quá trình ngoài miền hiện cảnh báo |
| Thiết lập hiển thị cơ bản | PASS | PASS | Bốn preset, giữ state/thời gian/rows, node canvas/input, camera thủ công và keyboard focus; menu trong viewport 390; lưu riêng tùy chọn nhãn/lưới/quỹ đạo; Run vẫn tiến thời gian khi giảm chuyển động phụ |

Kiểm tra context riêng tại bài khí xác nhận `getContext('webgl2')` tồn tại, `isContextLost()=false`, renderer notice ẩn; ảnh hiện tại là WebGL2 SwiftShader chứ không phải Canvas fallback. Lần chạy 12/12 kiểm context thực tại mỗi lần mở lab; không mất context. Mọi lần đều dùng WebGL2, không chuyển sang Canvas fallback trong bộ này.

Ảnh đã xem: cân đòn ở 1440/390 px, khí và Boyle tại hai thể tích trên desktop, menu hiển thị 390 px. Bộ test còn ghi ảnh hai trường hợp cân đòn cực lệch, domain/sweep và các viewport tương ứng. Thanh/vật liệu còn nhạt, hạt ở thể tích cực nhỏ khó nhìn hoặc bị nắp che. Vì vậy kiểm hình học PASS không đồng nghĩa yêu cầu độ rõ toàn bộ thư viện đã đạt.

## Giới hạn

- Không kiểm 300 bài trực quan trên trình duyệt trong bộ này. Inventory, phép so sánh số và kiểm geometry CPU có báo cáo riêng; không cộng gộp thành chứng nhận 300 bài hoàn thiện.
- NOT TESTED: kéo touch vật lí trên thiết bị thật, xoay màn hình thật, Safari/WebKit, mất context GPU thực, máy chiếu lớp học, keyboard/screen-reader toàn bộ ứng dụng.
- NOT TESTED: FPS/độ trễ trên GPU điện thoại, profiling nhiệt/năng lượng, phiên dài để phát hiện rò bộ nhớ.
- NOT TESTED: VI/EN toàn giao diện, 300 bài song ngữ, giữ camera/time/rows khi đổi ngôn ngữ; chưa có tính năng hoàn chỉnh để nghiệm thu.
- Backend AI locale chỉ được kiểm fixtures riêng; GitHub Pages không triển khai backend riêng.

Camera được đo từ instance LabScene thật: wrapper tạm của thao tác zoom công khai lấy instance rồi tự phục hồi prototype ngay; so vị trí/quaternion/target/zoom trước/sau mỗi preset với ngưỡng 1e-8. Không thay physics engine hoặc kết quả tính trong test. Các tùy chọn kích thước hạt/marker, thang vectơ, nền tối và toàn bộ yêu cầu độ rõ của V5.0 chưa được bao phủ bởi các preset cơ bản.

QA không commit/push/deploy. Agent chính chịu trách nhiệm chạy kiểm tra tổng, tích hợp báo cáo cuối và theo dõi triển khai.

Kiểm tra bổ sung từ đầu mối tích hợp: Chromium390 khi truy cập thuộc tính localStorage ném SecurityError vẫn mở lab và áp dụng Hiển thị cho phiên hiện tại; có thông báo không lưu được và không pageerror. Đây là một ca bổ sung ngoài12 nhóm trong báo cáo browser JSON.
