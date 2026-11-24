# Quanh Lab V95 · Năm bàn thực hành 3D

V95 chuyển năm bàn V94 sang Three.js và mở 3D mặc định. Mỗi bàn có hình học, dụng cụ và vùng thao tác theo bài. Nút 2D mở sơ đồ và các điều khiển bàn phím. Khi WebGL không mở được hoặc mất ngữ cảnh, bài chuyển về sơ đồ. Có thể chọn 3D để thử lại.

| ID | Dụng cụ và thao tác 3D | Kiểm chứng trên sổ đo |
|---|---|---|
| `ohm` | Bộ nguồn, ampe kế, vôn kế, điện trở và công tắc có vỏ và cọc cắm 3D. Kéo từng đầu dây, hoặc chọn đầu dây và chọn cọc. | Điện áp và dòng chỉ xuất hiện theo điều kiện mạch. Khi giữ 10 Ω và đặt 6 V, mạch hợp lệ đo 0,6 A. |
| `lens` | Ray, vật sáng, kính hội tụ và màn trong không gian. Kéo ba dụng cụ dọc theo ray và đọc ảnh trên màn. | Ray và trạng thái nhòe dùng phép tính quang hình. Cấu hình 0,24 m vật và 0,24 m màn cho ảnh rõ với mẫu 1. |
| `oscillation` | Lò xo, khối trên ray và tấm pha 3D. Kéo rồi thả khối để chạy và bấm đồng hồ. | Ray và tấm pha đọc cùng trạng thái thời gian của đồng hồ. Số đo chu kì phản ánh thời điểm học sinh bắt đầu và chốt. |
| `lever` | Cân có trục, móc treo, tải rời, khay và hai chốt. Kéo tải lên đúng móc hoặc trả về khay. | Móc bận từ chối tải thứ hai. Tải 0,5 kg cách trục 1,2 m cân bằng với tải 1 kg cách 0,6 m ở phía đối diện. |
| `gas` | Xi lanh trong suốt, pít-tông di động, thước và bảng áp suất–thể tích. Kéo pít-tông tới vị trí cần đo. | P và V dùng mô hình khí đẳng nhiệt V94. Các hạt có vai trò minh hoạ vùng có khí. |

Nút **Xoay góc nhìn** chuyển chuột hoặc cảm ứng sang camera. Chọn lại nút để cầm dụng cụ. Dùng **Vừa bàn** để đưa toàn bộ dụng cụ về khung. Các nút + và − thay đổi khoảng cách camera. Escape hủy thao tác kéo. Khi ngừng chuyển động, cảnh tĩnh chỉ dựng lại theo tương tác, kích thước hoặc màu giao diện.

Mỗi cảnh gọi các hành động SI và điều kiện phép đo đã có từ V94. Toạ độ con trỏ dùng để chọn dụng cụ hoặc điều chỉnh vị trí, còn kết quả tính từ trạng thái mô hình. Cả hai cách nhìn ghi chung sổ tay và phiên. Cài đặt chọn 2D lưu theo bài, tách khỏi dữ liệu thí nghiệm.

## Tệp chính

- `practice-view.js` quản lý nút chọn chế độ, yêu cầu tải module, camera và trạng thái dự phòng.
- `practice-three.js` quản lý khung WebGL, chọn vật thể, pointer capture, khung camera và thu hồi tài nguyên.
- Năm tệp `*-practice-three.js` dựng dụng cụ theo từng bài. Cầu nối ở `oscillation-practice.js` chia sẻ đồng hồ và thao tác thả với cảnh.
- `practice-runner.js`, `practice.css`, `app.js`, `boot.js`, `index.html` nối trình dựng với bố cục và cache.
- `checks/browser-practice-three-v95.py` thử thao tác 3D theo từng bài, chuyển góc nhìn, giữ số đo và dự phòng khi WebGL bị tắt. Kiểm thử V94 chọn 2D để tiếp tục bảo vệ luồng cũ.

Năm agent `ohm_3d`, `lens_3d`, `oscillation_3d`, `lever_3d` và `gas_3d` phụ trách các cảnh và kiểm theo bài. Agent `practice_v95_qa` chuẩn bị kiểm camera, bố cục và vòng đời. Agent chính kiểm lại theo snapshot chốt.

Danh mục vẫn có 300 ID. Trạng thái cấp 3 gồm 0 PASS, 6 PARTIAL, 294 NOT TESTED và 0 BLOCKED. Giáo viên và thiết bị thật còn chờ nghiệm thu.

## Kết quả kiểm thử

| Bộ kiểm | Kết quả |
|---|---|
| `python checks/browser-practice-three-v95.py` | Năm luồng thao tác 3D đạt trên Chromium 154.0.8037.57. Mạch Ohm kéo và hủy kéo bằng cảm ứng mô phỏng. Bốn bài khác dùng chuột và bàn phím cho các bước đọc, lưu và hủy. Cả năm giữ số đo khi chuyển 2D rồi tải lại. Luồng thứ sáu ghi số đo khi Chromium tắt WebGL. [Bản ghi](evidence/browser-3d.json) |
| `python checks/browser-practice-v94.py --url http://127.0.0.1:4201` | Năm luồng 2D đạt, gồm lưu số đo và tải lại. Bài khí thử nhập sai, xuất CSV/JSON, nhập lại đúng phiên và VI/EN. [Bản ghi](evidence/browser-2d.json) |
| Camera và mất ngữ cảnh | 20 bố cục của năm bài tại 320, 390, 768, 1440 px. Thu phóng, xoay, vừa bàn và đổi màu đạt. Mất ngữ cảnh WebGL chuyển sang 2D và cho phép ghi tiếp. Sau khi mở lại 3D và tải lại, sổ tay có đủ ba số đo. [Bản ghi](evidence/camera-and-fallback.json) |
| Hình học chốt cân | Cả hai vị trí chặn và thao tác tải được kiểm bằng hình học mô hình. [Bản ghi](evidence/lever-stop-geometry.json) |
| `node checks/banner-preservation-v51.mjs` và `node checks/site-security-v63.mjs` | Giữ 300 ID, tài liệu học và tài nguyên bảo vệ. Kiểm bảo mật tài nguyên tĩnh đạt. |

[Ảnh mạch Ohm](evidence/ohm-390.png) · [Ảnh thấu kính](evidence/lens-1440.png) · [Ảnh lò xo](evidence/oscillation-1024.png) · [Ảnh cân đòn](evidence/lever-390.png) · [Ảnh xi lanh](evidence/gas-1440.png)
