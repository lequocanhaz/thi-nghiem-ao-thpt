# Nhiệt lượng kế v87 — hiệu chuẩn hình học và thao tác nhân quả

Ngày làm việc: 14/11/2026 (UTC+7). Nền mã trước sửa: `3e6830793302a451586d7c9c600ca889ac8bc9ef` (v86). Phạm vi: hai hoạt động của cùng ID `calorimetry`, không phải hai ID mới. Tài liệu chi phối và snapshot danh mục P0 vẫn ở `../level3-v84/`.

## Kết quả thực hiện

- Bình và cốc có kích thước SI gắn với dung tích thực. Lòng bình64 cạnh có thể tích đúng capacity; 600mL không còn vẽ như bình khoảng3,19L. Mesh nước kín trừ đúng phần vật chiếm chỗ; cùng geometry dùng cho sơ đồ2D, tiếp xúc và3D.
- Mặt nước cốc theo trọng lực và lượng nước còn lại. Nghiêng25°/31° không tự rót khi nước chưa tới mép; dòng rót hữu hạn bị giới hạn bởi lượng vượt mép. Hình không cấp số đo nhiệt.
- Đá nguồn là khối có thể tích theo khối lượng/917kg/m³. Cho chọn viên1–100g; viên không lọt miệng bị từ chối có lý do. Đá trong bình là khối gộp tương đương giữ thể tích; không giả là nhiều khối rigid body.
- Va chạm dùng bao hình3D và đường quét trước khi nhận vị trí: thành/đáy/vành bình, bàn, cân, giá cốc, khay và bể. Học sinh phải nhấc cốc khỏi giá trước khi nghiêng, đưa đá ra khỏi gầm cân trước khi nhấc. Kéo dụng cụ vẫn trên mặt phẳngXY; đây không phải thao tác6DOF.
- Kẹp bám mẫu theo kích thước thật, kể cả mẫu1g. Nút gia nhiệt không chuyển mẫu vào bể thay học sinh. Kẹp rỗng không thể chuyển/cân mẫu từ xa; mẫu đang trong kẹp không được đưa riêng về giá.
- Đầu dò chỉ đo nước khi đủ ngập và tránh thành/đáy. Chỉ số có độ phân giải và đáp ứng hữu hạn; giữ riêng số người học nhập. Khuấy chỉ tính từ đường chuyển động được chấp nhận, không tính vòng kéo bị vật cản chặn.
- Thả mẫu xuống bàn cần một đường rơi đứng trống tới mặt bàn; không giữ mẫu lơ lửng, không đẩy mẫu xuyên qua dụng cụ. Có nút Cận cảnh bình/cân/nhiệt kế và điều khiển chính xác/2D.
- Không làm rơi thời gian mô phỏng khi main thread gián đoạn: tích lũy phần chưa xử lý, chia nhỏ bước tính; pause/visibility giữ hành vi chủ động dừng.

## Audit lỗi được sửa

| Mức | Lỗi | Xử lý |
|---|---|---|
| P1 | Hình lòng bình không khớp dung tích; cốc/ngập vật vẽ sai lượng | Geometry SI dùng chung; oracle đo trực tiếp các tam giác WebGL |
| P1 | Cốc nghiêng dưới mép vẫn rót | Thể tích giữ được dưới mép mở theo góc và trọng lực |
| P1 | Chỉ xét hình chiếuXY bỏ lọt thân cốc chạm mặt trụ | Bao có bề sâu và quét đường kéo/xoay |
| P1 | Nước tràn tính cả phần đá nổi ngoài nước | Archimedes và nhánh đá chạm đáy; ledger khối lượng/nhiệt lượng |
| P1 | Đá cao chạm đáy tan dần gây vượt dung tích rồi dừng mô hình | Tính tràn trong từng bước nhiệt, ghi điều kiện và nhiệt lượng ra |
| P1 | Tràn rút cạn node gần làm trao đổi nhiệt mắc kẹt | Modev2 rút tỉ lệ hai node, lấy enthalpy riêng từng node |
| P1 | Kẹp rỗng có thể cân/chuyển mẫu ở xa | Yêu cầu kẹp thực sự đang giữ mẫu |
| P1 | Import có thể chuyển vật chất giữa các ngăn mà vẫn cân ledger | Kiểm giới hạn riêng cốc, kho đá và hoạt động; từ chối, không sửa tệp |
| P1 | Hiệu chuẩn có thể làm mất bản gốc/đổi nghĩa số đo cũ | Bản sao byte nguyên vẹn trước migration; lỗi quota chặn ghi đè |
| P2 | Recovery gắn nhầm vào details đóng; mẫu tách khỏi kẹp khi recovery | Đúng nhóm hành động và guard mẫu đang được kẹp |
| P2 | Chọn lượt mới vẫn giữ công cụ cũ; cân không bỏ tải khi nhấc | Reset lựa chọn bình, load theo thao tác thực tế |

Các lỗi bổ sung từ review độc lập được sửa trước lượt kiểm thử cuối; các báo cáo trước đó chỉ là chẩn đoán, không dùng thay nghiệm thu mã cuối.

## Bảo toàn dữ liệu và kiến trúc

Xem [ARCHITECTURE.md](ARCHITECTURE.md). Model nhiệt giữ `thermal.nodes.v1`, mở nhánh apparatus tường minh `thermal.geometry.v2` cho hình học/tràn; phiên không có marker vẫn đọc theo semantics cũ. Không tăng trạng thái300 bài bằng script. Không thay backendAI, đăng nhập, sách, âm thanh, logo/banner hay solver cổ điển.

| PASS L3 | PARTIAL | NOT TESTED | BLOCKED | Tổng |
|---:|---:|---:|---:|---:|
| 0 | 1 (`calorimetry`, hai hoạt động) | 299 | 0 | 300 |

Đây là trạng thái audit đã kiểm chứng, không suy ra từ số bài mở được. Giáo viên, thiết bị thật và các cổng còn thiếu chưa được nghiệm thu.

## Tự kiểm chứng

1. Mở `#lab/calorimetry?l3=ice`, đặt bình; nhấc cốc khỏi giá, đưa phía trên miệng. Nghiêng25°: nước chưa chảy. Nghiêng đủ tới mép: nước mới vào bình; đưa ra ngoài: nước đổ ra bàn được ghi là mất.
2. Chọn đá20g, kéo ra trái khỏi gầm cân rồi nhấc lên trên miệng bình và thả vào giữa. Đặt đầu dò trong nước, khuấy, ghi ít nhất5 điểm. Xuất CSV và JSON; nhập lại/reload phải giữ nguyên số đã nhập.
3. Với200g nước40°C,20g đá0°C,Ccal=0: cân bằng đóng khoảng29,0996085°C. Chưa đồng đều/đầu dò chưa ổn định có thể đọc khác; không tự sửa số học sinh để khớp đáp án.
4. Với200g nước20°C,100g đá: cân bằng0°C, còn khoảng49,94012g đá. Đây là ca không đủ nhiệt làm tan hết.
5. Với590g nước40°C và20g đá trong bình600mL: tràn10g nước, nhiệt lượng ra1672J. Với580g nước và20g đá: không tràn. Lượt có tràn được ghi đổi điều kiện, không coi là lặp có kiểm soát.
6. Mở `#lab/calorimetry?l3=solid`: cân vật, gắp vào bể, gia nhiệt, đo nhiệt độ ban đầu, gắp sang nước và khuấy. Kẹp rỗng không được cân/chuyển vật từ xa. Không dùng đá thay vật rắn.

## Giới hạn còn lại

- Chưa công bố hoàn thànhL3 hoặc300 bài. Chưa có nghiệm thu giáo viên và thiết bị đại diện.
- KéoXY với camera3D; bao va chạm bảo thủ, không solver rigidbody, nghiêng/lật, tiếp xúc dụng cụ–dụng cụ tổng quát hoặcCFD. Bao của đầu dò tập trung vào phần thân đo; chưa kiểm va chạm đầy đủ mọi bộ phận hiển thị như mànLCD. Không mô phỏng từng viên đá nổi độc lập.
- Đá gộp tương đương có thể nhô khỏi miệng. Hệ số truyền nhiệt minh họa; xả tràn lấy tỉ lệ hai node là xấp xỉ đại diện, không mô phỏng dòng tràn cục bộ của nước phân tầng.
- Chỉ đá ban đầu0°C, bình cách nhiệt, không sôi/bay hơi/đá dưới0°C. Nhiệt kế không phản hồi nhiệt dung trở lại hệ.
- Nhãn/LCD nhỏ khi nhìn toàn bàn trên mobile; có Cận cảnh và readoutHTML. Chưa chứng nhậnWCAG đầy đủ, bàn phím ảo, iPhoneSafari/Android thật, P95≤100ms hay30FPS phần cứng.
- Lỗi miền `voltmeter_design` lịch sử nêu trong suite vẫn ngoài phạm vi; không tuyên bố đã sửa mọi lỗi khoa học của danh mục.

## Bước tiếp theo

1. Giáo viên nghiệm thu mục tiêu–đo–kết luận của hai hoạt động, thực hiện đầy đủ storyboard trên thiết bị thật.
2. Đo thao tác/FPS trên Android tầm trung và iPhoneSafari, sửa vướng mắc quan sát/mobile từ số đo thực.
3. Pilot đại diện điện/quang/cơ/sóng/khí/điện trường theo archetype kiểm chứng; từngID có oracle và evidence riêng.
4. Chuẩn hóa bàn giao/licensing và nguồn tài nguyên; chưa thêm thu tiền hoặc thu thập dữ liệu học sinh.

## Tệp thêm/sửa trong đợt này

- `CODEX_HANDOFF.md`
- `checks/browser-thermal-extra-v87.py`
- `checks/browser-thermal-migration-v87.py`
- `checks/browser-thermal-v87.py`
- `checks/browser-thermal-viewports-v87.py`
- `checks/calibrated-oracles-v87.mjs`
- `checks/thermal-compartments-v87.mjs`
- `checks/thermal-geometry-v87.mjs`
- `checks/thermal-motion-v87.mjs`
- `checks/thermal-overflow-v87.mjs`
- `checks/thermal-spatial-v87.mjs`
- `dist/app.js`
- `dist/boot.js`
- `dist/index.html`
- `dist/l3/data-notebook.js`
- `dist/l3/interaction-core.js`
- `dist/l3/thermal-apparatus.js`
- `dist/l3/thermal-geometry.js`
- `dist/l3/thermal-physics.js`
- `dist/l3/thermal-pilot.js`
- `dist/l3/thermal-spatial.js`
- `dist/l3/thermal-three.js`
- `dist/l3/thermal-view.js`
- `dist/l3/thermal.css`
- `docs/ARCHITECTURE.md`
- `docs/level3-v87/ARCHITECTURE.md`
- `docs/level3-v87/IMPLEMENTATION_REPORT.md`
- `docs/level3-v87/QA_REPORT.md`
- `docs/level3-v87/evidence/after-ice-dark-english.png`
- `docs/level3-v87/evidence/after-ice-desktop.png`
- `docs/level3-v87/evidence/after-ice-mobile320.png`
- `docs/level3-v87/evidence/after-solid-desktop.png`
- `docs/level3-v87/evidence/after-solid-transfer.png`
- `docs/level3-v87/evidence/before-browser.json`
- `docs/level3-v87/evidence/before-ice-desktop.png`
- `docs/level3-v87/evidence/browser-extra.json`
- `docs/level3-v87/evidence/browser-final.json`
- `docs/level3-v87/evidence/browser-migration.json`
- `docs/level3-v87/evidence/browser-storage.json`
- `docs/level3-v87/evidence/browser-viewports.json`
- `docs/level3-v87/evidence/npm-check-final.json`
- `docs/level3-v87/evidence/npm-check-final.log`
- `docs/level3-v87/evidence/verification-summary.json`
- `package.json`

Nhóm geometry/apparatus/spatial xác định kích thước và tiếp xúc; physics/controller/core xử lý nhân quả; notebook giữ dữ liệu; renderer/view/CSS thể hiện; entrypoints đổi cache version87; package/checks khóa hồi quy; docs/evidence phục vụ bàn giao. Hệ thống token hiện có được dùng lại, không viết lại framework hoặc bộ nhận diện.
