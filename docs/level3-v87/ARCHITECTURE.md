# Hợp đồng hình học nhiệt v87

## Luồng nhân quả

Input chuột/cảm ứng/bàn phím → kiểm đường quét/miệng/điều kiện dụng cụ → action versioned → stateSI → phép đo → sổ/đồ thị →2D/3D. Render không quyết định nhiệt độ hoặc dữ liệu học sinh.

- `thermal-geometry.js`: pureSI, không import renderer/controller;64gon, hydrostatic grounding/floating, cupgravityclipping, spout và thể tích giữ được theo góc.1worldunit=1m; worldX=(canonicalX−400)/1000,Y=(348−canonicalY)/1000,Z=0.
- `thermal-apparatus.js`: tiếp xúc/initialposes đã hiệu chuẩn. Registry cũ giữ nguyên để xác thực phiên cũ.
- `thermal-spatial.js`: prism có bề sâu, thành trụ hữu hạn, box tĩnh và sweptpath. Vòng xoay chia≤2° với sagitta margin; không tự sửa vị trí sai. `benchRestPose` chỉ nhận đường hạ thẳng trống tới bàn.
- `thermal-physics.js`: hai node hữu hạn, SI và độC affine. `apparatusGeometryVersion='thermal.geometry.v2'` bật thể tích chiếm chỗ Archimedes/grounding và tràn khi thêm mẫu, rót hoặc tan. Tràn lấy tỉ lệ khối lượng từng node và ghi enthalpy từng node, không xóa một node khỏi mạng nhiệt. Legacy marker vắng giữ cách tính capacity trước đây để đọc phiên.
- `thermal-pilot.js`: điều kiện lặp đánh dấu khi setup thay đổi/tràn; `meltingSpillMassKg` phân biệt tràn diễn tiến với thao tác ban đầu. Lượt tràn không được tự đạt controlledrepeat. Frame backlog giữ thời gian chưa xử lý.
- `thermal-three.js`/`thermal-view.js`: cùng hình học. Getter chỉ đọc `canvas.thermalGeometry` trả tam giác thực để QA tích phân độc lập; không setter vật lí. Cận cảnh thay camera, không đổi state.

## Dung tích và số học

Lòng bình có A=32·sin(2π/64)·r², h=0,176m, V=A·h. Cốc cao0,1m, dung tích max(500mL,1,1×nguồn nước). Mật độ nước1000kg/m³, đá917kg/m³. Nước có mesh kín, trừ void của vật nhúng. Đá nguồn cube; đá trong bình là aggregate giữ thể tích, bề ngang giới hạn để thể hiện được trong bình. Vật rắn cube vớiρ cấu hình, không ép co mẫu cho vừa miệng.

Cốc cắt polyhedron theo mặt phẳng trọng lực,36 lần bisection cho mức mặt nước. Geometry bất biến được memoize theo khóa số thực chính xác, cache hữu hạn, không làm tròn state. Chỉ khi thể tích cần vẽ≤1e−14m³ thì bỏ mesh để tránh mặt suy biến Float32; khối lượng model/export không bị zero hoặc làm tròn.

## Migration không ghi đè bản gốc

Model/schema nhiệt vẫnv1; apparatus marker v2 là phần mở rộng. Phiên cũ được kiểm với geometry cũ trước khi nâng cấp. Bản gốc được giữ nguyên byte ở key có sessionID+timestamp duy nhất; kiểm không trùng trước ghi. Đổi contact đầu dò theo geometry mới, không đổi số đo/lượt cũ hay tự dời pose. Vị trí cũ xung đột cần người học chủ động đưa dụng cụ về giá.

Nếu sao lưu thất bại/quota: chặn ghi primary, giữ nguyên payload cũ; JSON từ RAM vẫn xuất được và người học có đường tải bản gốc trước khi thay phiên. Geometry không hỗ trợ không được ép sửa state/khối lượng để hợp lệ. Import không thực thi dữ liệu như mã; kiểm số hữu hạn, miền, nguồn cốc/kho đá, ledger, pose và contact.

Đường UI kiểm bản gốc và data-schema có fixture byte chính xác, quota, malformed import và reload. Không thay khóa lưu solvercổđiển, sách/tài khoản/AI.
