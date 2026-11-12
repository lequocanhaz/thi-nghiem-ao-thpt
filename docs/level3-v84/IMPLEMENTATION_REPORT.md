# Kết quả P0 và pilot P1 — Level 3 v84

Ngày 12/11/2026 (UTC+7). Nguồn yêu cầu và SHA-256 ở `source-provenance.json`; văn bản người dùng và đặc tả gốc đã được giữ riêng. Nhận định trong Word là yêu cầu mục tiêu, không được coi là bằng chứng website đã đạt.

## Phần đã làm

P0 đọc catalog thực từ snapshot Git `6aba10b`, sinh đủ 300 bản ghi JSON/CSV và dashboard chỉ đọc. Đã xác minh đủ 300 bài soạn, 388 trang sách, 85 mục lục và 301 audio. Nhóm 221 `isDriven` là quy trình nội suy tham số tự động. Trong nhóm còn lại chỉ 63 có output thay đổi trong probe theo thời gian, 9 visual-only và 7 chưa quan sát output đổi theo t; không gọi cả 79 là solver động lực học. Chi phí/rủi ro và thiết kế L3 riêng của 299 bài chưa được triage/duyệt.

P1 đã thêm hai hoạt động thao tác thực trong ID `calorimetry`: nước–đá và nhiệt dung riêng vật rắn. Có kéo/đặt/rót bằng góc cốc, cân/trừ bì, đầu dò đúng/sai, khuấy vòng, kẹp/bể/vật rắn, số HS tự ghi, nhiều lượt, đồ thị, CSV/JSON, nhập/reload và VI/EN. Mô hình hai lượng nước cũ vẫn mở được. Không thay backend AI, schema phiên cũ hoặc thêm 300 bản sao UI.

## Trạng thái 300 ID

| Trạng thái L3 toàn lab | Số ID |
|---|---:|
| PASS | 0 |
| PARTIAL | 1 (`calorimetry`, gồm 2 hoạt động) |
| NOT TESTED | 299 |
| BLOCKED | 0 |
| Tổng | 300 |

Cả tám gate của pilot vẫn PARTIAL; F1–F4 có bằng chứng phần mềm nhưng không được gọi là nghiệm thu toàn lab. F5, giáo viên và thiết bị thật giữ NOT TESTED. Không có “300/300 cấp độ 3”. Dashboard/CSV lấy trạng thái có kiểm toán từ JSON, không có nút chấm PASS hàng loạt trong UI học sinh.

## Kiểm thử và bằng chứng

- `node checks/l3-thermal-physics-v84.mjs`: 61.503 assertion độc lập đạt; residual tối đa khoảng **1,317×10⁻⁹ J** và **9,55×10⁻¹⁵ kg** trong fixture. N-01 đạt **29,0996085254°C**; N-02 cân bằng còn **0,0499401198 kg đá**. Thay khuấy đổi thời gian hội tụ, không đổi nghiệm cân bằng lí tưởng. Đây là kết quả model, không phải nhiệt độ thực đo ngoài đời.
- `node checks/l3-data-interaction-v84.mjs`: giữ số HS đọc nhầm, số đo đặt sai, JSON/CSV/legacy, kiểm kiểu/pose/mass/camera, HTML escaping, pointercancel/lost capture và cleanup đạt.
- QA Chromium **156.0.8078.79**: 12/12 ca cuối đạt qua recheck có provenance. Gồm A/B, rót bằng handle, sai thao tác, cân→gắp, nhiều trial/nhập/xuất/reload, loại điểm có lí do, N-02 hữu hạn + lượt đối chiếu, viewport mobile và CDP hai điểm chạm. Sau đó có một ca riêng kiểm đồng bộ tiếp xúc đầu dò khi vật di chuyển và từ chối JSON pose mâu thuẫn. Không gọi 13 ca là cùng một source hash.
- N-02 UI chỉ đo một thời điểm hữu hạn: khoảng 33 s, nước còn gần 17,7°C và đá gần 0,0953 kg; không tuyên bố đã đạt cân bằng 0°C chỉ từ ảnh đó. Oracle cân bằng là lớp bằng chứng khác.
- UI kiểm A/B VI/EN sáng/tối, camera/zoom giữ state và hitbox ≥45 CSS px; AI fixture 2 ca kiểm thread/draft/pending/context và không lộ đáp án ẩn; review sư phạm phần mềm 4 ca không điền sẵn đáp án và giữ draft khi đổi ngôn ngữ. Những review này không thay cho thầy/cô nghiệm thu.
- `npm run check` đã hoàn tất exit0; targeted tests sau các sửa liên quan cũng đạt. Security, banner/science/assets preservation và diff check đạt. Bằng chứng tổng hợp/hash nguồn ở `evidence/verification-summary.json`; chi tiết lỗi thật, lỗi fixture và các lượt kiểm lại ở `QA_REPORT.md`.

## Demo người học có thể tự kiểm

1. Mở `/#lab/calorimetry?l3=ice`. Viết dự đoán, đặt bình vào bàn. Kéo cốc sao cho miệng phía trên bình, dùng tay cầm xoay để rót; lượng nước trong cốc giảm đúng lượng chuyển/tràn.
2. Chọn Cân, đặt đĩa rỗng và trừ bì. Kéo viên đá lên cân, đọc 20 g; đưa vào bình. Thả ngoài miệng bình phải bị từ chối, không tăng đá trong bình.
3. Kéo đầu dò vào **phần nước**, không chỉ vào rectangle của bình. Khi ở không khí/thành bình không được đọc như nước. Đưa que vào nước và vẽ vòng tròn; chỉ động tác trong nước làm tăng trộn.
4. Dùng Tiến 1 s hoặc chọn tốc độ thời gian; tự đọc và nhập ≥5 số, không dùng trace tự động thay số HS ghi. Tạo lượt mới với lượng đá khác, giữ các biến còn lại, ghi thêm ≥2 số và giải thích.
5. Xuất CSV/JSON, reload hoặc nhập lại. Các số nhập sai và điểm loại vẫn có trong dữ liệu. Thử hoạt động B: dùng kẹp gắp mẫu vào bể, đo theo thời gian, rồi chuyển mẫu vào nước, khuấy/đo và dùng số riêng để tính c; không dùng đá tan thay việc đo c của vật rắn.

Với ca A mặc định 0,2 kg nước40°C và0,02 kg đá0°C, mô hình cách nhiệt có nghiệm cuối khoảng29,1°C. Với0,2 kg nước20°C và0,1 kg đá, không đủ nhiệt tan hết. Các số đo đầu dò có độ trễ/độ phân giải và có thể chưa đại diện toàn bình khi không trộn; không ép số HS thành nghiệm lí thuyết.

## Tệp và bước tiếp theo

Mã mở rộng trong `dist/l3/`; tích hợp nhỏ trong `app.js`, `assistant.js`, boot/index; inventory generator trong `scripts/audit-level3-v84.mjs`; hai regression Node và browser harness trong `checks/`. Những thay đổi khác ở đây là tài liệu/audit/bằng chứng, không phải solver cũ.

Job kiểm tra trong `.github/workflows/pages.yml` lấy lịch sử Git đầy đủ để đọc snapshot P0 cố định; checkout nông chỉ chứa commit mới sẽ không có object của `6aba10b`. Job deploy giữ quy trình hiện có. Dashboard `dist/review/level3-v84.html` là artifact quản trị chỉ đọc dùng cục bộ/offline; hardener hiện hữu chủ động bỏ thư mục `review/` khỏi Pages, quy tắc bảo mật này không bị nới. JSON/CSV và HTML tải về không chứa dữ liệu phiên học sinh.

Ưu tiên tiếp: (1) giáo viên duyệt pilot và kiểm điện thoại thật/hiệu năng, hiệu chuẩn; (2) hoàn thiện P1 theo phát hiện đó, kể cả quản lí phiên lớn; (3) chọn đại diện mạch/quang/cơ/sóng/khí/điện trường để thử archetype; (4) triage/nâng từng nhóm nhỏ của 299 ID còn lại. Chưa có bằng chứng thì không nâng trạng thái gate.

Trạng thái phát hành được xác nhận bằng workflow CI/Pages và kiểm tra live riêng sau push; tài liệu không tự suy từ local PASS rằng website đã cập nhật.
