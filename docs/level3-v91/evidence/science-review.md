# Rà soát độc lập khoa học / dữ liệu V91

Phạm vi: hai hoạt động nhiệt hiện tại, không phải 300 lab; không sửa runtime hoặc dữ liệu thật. Tái hiện bằng Chromium headless và public controls trên server local4196. Fixture phiên là JSON do module SI/notebook hiện hữu tạo, có parseSession/validateState trước khi mở. Không dùng setter debug để thay model đang chạy.

## P1 — kết quả tính tràn làm hỏng khả năng lưu/xuất phiên

Bài vật rắn, nhập calculator: mw=0.2 kg, Ccal=1e308 J/K, ms=0.1 kg, Tw=20°C, Ts=80°C, Tf=40°C. Mọi đầu vào đều hữu hạn, nhưng phép tính csolid tràn sang Infinity. Controller lưu nó vào trial.calculation rồi autosave không serialize được, nút JSON ném pageerror.

Lệnh đỏ đã chạy:

`python work/thermal-v91/science/calculator-overflow.py --url http://127.0.0.1:4196 --out work/thermal-v91/science/calculator`

Output: `display="∞ J/(kg·K)"`, `pageErrors=["Nonfinite number"]`, status bảo người dùng xuất JSON nhưng chính JSON cũng lỗi. Exit1 vì assertion khóa symptom này.

Hướng sửa: kiểm kết quả hữu hạn và dương trước khi ghi trial; báo lỗi nhập/tính cụ thể, giữ kết quả hợp lệ trước đó và dữ liệu đo. Không thay phương trình hoặc làm tròn để che overflow. Kiểm thêm ms cực nhỏ vì mẫu số có thể underflow.

## P1/P2 — trạng thái rót sau restore không khớp nút Dừng/Escape

Phiên hợp lệ đã lưu cốc nghiêng100° và hướng vào bình. Mở lại rồi nhấn Tiếp tục: mô hình thực sự rót nhưng nút chính vẫn ghi Rót nước; Escape không dừng vì controller chỉ xét assistedPour trong RAM, flag này không có khi restore/manual tilt.

Lệnh đỏ đã chạy:

`python work/thermal-v91/science/tilted-restore.py --url http://127.0.0.1:4196 --out work/thermal-v91/science/tilted`

Output sau Escape: nước0.03733947835933436→0.06548626874817627kg, thêm0.028146790388841908kg. Không pageerror; đây là lỗi điều khiển/trạng thái, không sai phương trình.

Hướng sửa: khả năng Dừng và nhãn rót phải phản ánh actual angle/flow/running, kể cả dữ liệu restore hoặc thao tác manual. Không tự dựng thẳng cốc khi load vì đó là đổi pose đã lưu ngoài ý muốn. Pause/Escape phải dừng được dòng đang chạy và giữ lượng đã truyền.

## P1/P2 — 20 lượt là ngõ cụt dù đã xuất phiên

Phiên hợp lệ đủ20trials, mỗi lượt có giả thuyết giữ lại. Nhấn Thử lại từ đầu → thông báo exportfirst. Xuất JSON thành công rồi thử lại vẫn cùng lỗi; không có đường tạo session mới qua UI.

Lệnh đỏ đã chạy:

`python work/thermal-v91/science/full-session.py --url http://127.0.0.1:4196 --out work/thermal-v91/science/full`

Output trước và sau export: `Chưa tạo được lượt mới: 20 trials maximum; export this session first`; count20,0pageerror, exit1. Download20trials được giữ trong `full/full-session.json`.

Hướng sửa: cung cấp tạo phiên mới tường minh sau archive/download, giữ nguyên bộ cũ; kiểm cancel/quota/export. Không xóa/reset localStorage để sửa. Phiên import đầy vẫn đọc/xuất được; chỉ cần đường tiếp tục an toàn.

## Điểm độc lập ban đầu theo rubric đã chốt

- Mục1–2: có thể giữ1/mục nếu chạy lại oracle/volume/mass/energy hiện hữu trên nguồn cuối, chưa tìm sai phương trình mới.
- Mục3: tối đa0.5 vì full-session deadend (root còn đang kiểm empty-source).
- Mục4: tối đa0.5 vì restore/manual pour và trạng thái Dừng/Escape không nhất quán.
- Mục6: chưa thể chấm1 khi calculator có thể làm JSON/autosave không dùng được.
- Chưa thể chấm9/10 trước khi các lỗi này được sửa và harness chuyển xanh. Không biến điểm này thành PASS cấp3.

## Giới hạn

Đây là browser local thật, không phải iPhone/Android hay khảo sát giáo viên. Không kiểm mới phần cứng, P95/FPS hoặc nội dung AI/sách. Không tạo unit đơn giản chỉ lặp lại công thức vì lỗi ở chuỗi controller→trial→serialize/click; các harness browser chạm đúng callsite đã cung cấp. Root phụ trách tích hợp regression và sửa controller, sau đó cần kiểm nguồn cuối.

## Nghiệm thu độc lập sau sửa

Không còn P0/P1/P2 **đã xác minh** chưa xử lí trong phần khoa học/dữ liệu đã rà. Lỗi mới phát hiện lúc kiểm ngân sách — nút Loại điểm vẫn đổi RAM trong chế độ chỉ đọc nhưng JSON giữ snapshot cũ — đã được root khóa cả UI và handler, rồi kiểm lại đúng ca cũ.

Nguồn chốt: `work/thermal-v91/science/edge-accepted/report.json`:6/6groups PASS, sourceStable=true, toàn bộ sourceAfter SHA khớp runtime khi chốt. Tệp test do agent này tạo và đóng băng: `checks/browser-thermal-edge-v91.py`. Không sửa runtime.

Node đã tự chạy độc lập và đạt: calibrated-oracles-v87; thermal-overflow-v87 (76.379 assertions); thermal-geometry-v87 (18capacity/201cup/94hydro/12spout/61pour/38guard); thermal-compartments-v87 (180states/8invalidstates/8invalidimports). Bảy module vật lí/đo/protocol còn lại không đổi byte so main; notebook đổi chính sách kích thước có giới hạn, schema/kiểm loại/bảo toàn dữ liệu cũ giữ nguyên.

Đề xuất điểm các mục1–6 theo rubric đã chốt:

| Mục | Điểm | Căn cứ |
|---|---:|---|
|1|1|Hai oracle độc lập29,0996085°C và0,04994012kgđá; calculator overflow/underflow bị từ chối trước khi ghi, giữ kết quả4180 trước đó|
|2|1|Oracle bảo toàn/overflow và tích phân thể tích mesh đạt; coremodel không đổi|
|3|1|20lượt có cancel byteexact, archive mới giữ20lượt, reload; nearfull snapshot rồi phiên mới writable; root có luồng phục hồi bình/cốc rỗng và cần chạy lại cùng nguồn chốt|
|4|1|Cốc nghiêng restore: nhãnDừng, Escape vàmainStop dừng đúng mass; cancel/archive/quota giữ trạng thái; root tiếp tục fulljourneys/lifecycle trên nguồn chốt|
|5|1|Kiểm độc lập compartment/probe chống trạng thái giả, manual33,4°C đọc sai vẫn giữ; các luồng assessment/độ trễ/nhúng hiện hữu cần đạt lại bộ tích hợp cuối|
|6|1|Overflow không poison phiên; snapshots1.503.021pretty và1.997.000minified được đọc/export/archive byteexact; readonly ngăn cả forced-click đổi số đo/pose,CSV giữ dữ liệu; quota/cancel giữ primary|

Đây là điểm đề xuất cho sáu mục trong phạm vi agent đã rà, dựa trên các ca công bố; chốt phát hành vẫn cần fullsuite/browserintegration của root trên nguồn đóng băng. Không suy ra tổng9/10 từ riêng báo cáo này, không chấm mục7–10 và không nâng trạng tháiL3. Thiết bị thật/giáo viên vẫn NOT TESTED.
