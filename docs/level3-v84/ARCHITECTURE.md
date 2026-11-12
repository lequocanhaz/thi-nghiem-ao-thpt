# Hợp đồng mở rộng Level 3 — pilot v84

Ngày 12/11/2026, nền `6aba10b`. Vanilla ES modules được giữ nguyên. Đây là lớp mở rộng đầu tiên cho một archetype nhiệt, chưa phải toolkit đã nghiệm thu cho mọi miền Vật lí.

## Luồng và mô-đun

| Tệp trong `dist/l3/` | Trách nhiệm thực tế |
|---|---|
| `interaction-core.js` | Pointer capture, kéo/đặt, xoay, tích phân góc đường khuấy, bàn phím, hủy/lost capture và camera hai ngón trên nền bàn |
| `apparatus-registry.js` | Hình học bàn theo mét, phép chiếu SVG 1000 đơn vị/m, vùng nhận, giao tia rót với miệng bình, tiếp xúc đầu dò theo mặt chất lỏng |
| `thermal-physics.js` | Hai nút nước hữu hạn, nước đá ở 0°C, vật rắn, bể điều nhiệt, đầu dò trễ và ledger khối lượng/năng lượng |
| `measurement-engine.js` | Tách giá trị dụng cụ, giá trị HS nhập và true state; K là đơn vị dữ liệu nhiệt kế, °C là hiển thị |
| `thermal-protocol.js` | VI/EN riêng hai hoạt động, biến điều khiển/kiểm soát, điều kiện bằng chứng và checklist giáo viên chưa nghiệm thu |
| `data-notebook.js` | Nhiều trial, trace tự động riêng với số HS ghi, đồ thị từ số HS nhập, CSV/JSON, schema/kiểu/miền/pose import, lưu phiên cũ riêng |
| `thermal-view.js`, `thermal.css` | SVG chỉ hiển thị state; cập nhật cùng node khi chạy/kéo; hitbox thích ứng ≥45 CSS px qua zoom/resize |
| `thermal-pilot.js` | Điều phối action → physics → observe → notebook/view; autosave, undo chuẩn bị, chế độ học và vòng đời route |

```ts
interface LabV3 {
  id: string; existingCatalogId: string;
  activity: 'ice' | 'solid';
  applyAction(state: PhysicalStateSI, event: LabAction): ActionResult;
  step(state: PhysicalStateSI, dtSeconds: number): PhysicalStateSI;
  observe(state: PhysicalStateSI): InstrumentObservation;
  limitations: string[];
}
interface LabEvent {
  schemaVersion: 1; labId: 'calorimetry'; sessionId: string;
  simTimeS: number; actionType: string; targetId: string;
  payloadSI: object; accepted: boolean; reason: string; undone?: boolean;
}
interface LabSession {
  schemaVersion: 'lab.session.v3'; modelVersion: 'thermal.nodes.v1';
  catalogId: 'calorimetry'; activity: 'ice' | 'solid';
  physicalState: PhysicalStateSI; apparatusState: ApparatusViewState;
  trials: Trial[]; legacySessions: ClassicSession[];
}
```

Hợp đồng viết theo kiểu TypeScript để đọc/kiểm tra; không chuyển dự án sang TypeScript. Physics dùng kg, s, J, W và nhiệt dung J/K; nhiệt độ °C trong model là tọa độ affine, hiệu nhiệt độ là K. Quan sát/xuất số nhiệt kế có K và tên hiển thị °C riêng. Tọa độ client/pixel không được dùng suy ra nhiệt độ hoặc khối lượng. Apparatus view state và camera chỉ là biểu diễn; vùng tiếp xúc đã khai báo trong registry quyết định placement rồi mới gọi model.

## Tương thích và tích hợp

- Hai route mở rộng là `#lab/calorimetry?l3=ice` và `#lab/calorimetry?l3=solid`, **cùng một catalog ID**, không thêm ID 301. `#lab/calorimetry` vẫn là mô hình hai lượng nước cũ và có liên kết vào bàn mới. Thao tác rời pilot hủy RAF/capture/listener; phiên mới được lưu trước khi trở về router cũ.
- Hook sớm trong `route()` được loại đúng chuỗi khi kiểm hash router lịch sử; phần router cũ còn lại, banner/media/scene/solver/catalog vẫn đối chiếu hash. Đây là ngoại lệ tích hợp được rà soát, không reset baseline.
- Mô-đun nhiệt/CSS chỉ tải khi vào pilot. Camera/renderer cũ không bị chuyển thành solver nhiệt. AI nhận ID hoạt động riêng, đúng ngữ cảnh ngay cả lúc module đang tải; chỉ gửi metadata và tối đa 12 số HS nhập, không gửi true c, Teq hay state ẩn.
- Storage mới: `quanh-l3-calorimetry-ice-v1`, `quanh-l3-calorimetry-solid-v1`. Không xóa `thpt-lab-v1` hoặc các key cũ. Phiên `thpt.session.v1` được giữ riêng và xuất lại nguyên payload; không diễn giải số hai lượng nước thành số đo đá/vật rắn.
- Import parse JSON thuần, không eval/replay mã. Kiểm schema, model/activity, số hữu hạn, kiểu văn bản/mode, kích thước mảng, camera, khối lượng HS ghi và tiếp xúc đầu dò khớp hình học trước thay phiên. Trước nhập phiên thay thế có xác nhận và tải bản sao phiên đang mở.
- Trace mỗi giây mô phỏng có source tự động; chỉ số HS tự nhập qua thao tác Ghi mới có method manual. CSV phân biệt hai nguồn và giữ các giá trị sai/điểm loại với lí do. Giá trị người học không bị sửa thành giá trị model.

## Giới hạn P1 còn mở

- Nước đá ban đầu 0°C; không có CFD, sôi/bay hơi, đá dưới 0°C hoặc thất thoát nhiệt của bình ra phòng. Bể điều nhiệt của B là nguồn nhiệt độ cố định; năng lượng trao đổi được tính vào ledger.
- Hệ số dẫn/trộn là tham số minh họa mô hình hai nút, chưa hiệu chuẩn với dụng cụ thật. Chuyển động mặt nước/đá chỉ là biểu diễn từ state, không đo được vận tốc dòng chảy từ hình.
- Bình có mẫu được giữ cố định; dịch chuyển không hợp lệ bị từ chối rõ ràng. Undo/redo hữu ích ở bước chuẩn bị, không xóa chuỗi số liệu sau khi đã chạy/ghi; cần lượt mới để đối chiếu.
- Có giới hạn 20 trial, 500 số tự ghi/trial, 5000 event/trial, 10000 trace/trial và import 1,5 MB. Khi gần đầy chương trình dừng thời gian và nhắc xuất; việc quản lí kho nhiều phiên lớn/archival và các ca cực hạn dung lượng chưa nghiệm thu.
- Thiết bị thật, P95/30 FPS trên điện thoại mục tiêu, hiệu chuẩn thực, nghiệm thu giáo viên và toolkit đa ngành chưa được xác minh. Các lớp này không được suy ra PASS từ unit/browser giả lập.
