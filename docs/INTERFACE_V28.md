# Giao diện và biểu diễn không gian · v28

## Thiết kế

Giao diện sáng với trắng, xanh dương và màu nhận diện theo chủ đề; đường viền nhẹ, nút cùng hệ thống trạng thái, ảnh mô hình lớn hơn và bố cục thích ứng. Giữ font Product Sans đang đóng gói. Chỉ `.primary-heading`, tiêu đề cửa sổ và tiêu đề trợ lý dùng chữ đậm viết hoa. Tên thí nghiệm trong thẻ, tiêu đề bảng, nhãn, nút và nội dung dùng nét thường. Không thay video động, âm thanh, thuật toán hoặc thư viện 300 bài.

Nguồn tham khảo đã xem ngày 17/10/2026:

- [Dribbble · UI/UX](https://dribbble.com/tags/ui-ux-design): tham khảo phân cấp, nhóm điều khiển và khoảng trắng. Đã xem các mẫu dashboard AirlineSim/Haulix của Phenomenon và Shorelines của Ramotion. Không đưa ảnh, logo hay mã của các mẫu vào sản phẩm.
- [Brilliant · Science](https://brilliant.org/science/): tham khảo cách vào hoạt động học và dùng nội dung ngắn.
- [PhET · Research](https://phet.colorado.edu/en/research): ưu tiên thao tác, phản hồi và biểu diễn hỗ trợ học; ảnh giao diện đẹp chưa chứng minh hiệu quả học tập.
- [Three.js · OrthographicCamera](https://threejs.org/docs/pages/OrthographicCamera.html) và [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html): hình chiếu, zoom, dịch hình và thao tác chạm.

## Cách dùng

Trong phòng thí nghiệm, chọn **3D** hoặc **2D** cạnh mô hình. 2D là hình chiếu vuông góc của cùng mô hình, giữ nguyên độ sâu trong dữ liệu và các phương trình. Chọn Trước (XY) hoặc Trên (XZ) trong Góc nhìn. Nút 3D phục hồi góc nhìn không gian trước đó. Nền ở 2D dùng để dịch hình; phóng/thu vẫn hoạt động. Thiết bị chạm cần bật tương tác để dùng vùng mô hình, có thể cuộn trang khi tắt.

Nút **Trục** chỉ có ở bài có cấu hình trục. Có 13 cấu hình có vạch chia theo đơn vị vật lí và 62 cấu hình chỉ hướng. Chú giải nằm ngoài vùng mô hình; màu luôn có tên trục và đơn vị bổ sung. Trục chỉ hướng không được dùng để đo chiều dài. Hình chiếu 2D không biến mô hình 3D thành một mô hình vật lí phẳng mới; các đối tượng khác độ sâu có thể chồng lên nhau.

Các cấu hình đã gắn thang số: điện tích/điện trường, cơ năng, dao động điều hòa, dao động tắt dần, sóng cơ, sóng dừng, chuyển động đều, biến đổi đều, định luật II Newton, ném ngang, ném xiên, tròn đều và giao thoa sóng. Các phép đổi tọa độ bám cách dựng tương ứng, bao gồm phân biệt cm với m và chiều dài dây thay đổi. Ví dụ điện trường: 8 đơn vị mô hình = 1 m; dao động: 0,12 đơn vị mô hình = 1 cm. Trục x và u của sóng có đơn vị khác nhau.

Đồ thị giữ nhãn đại lượng/đơn vị, thêm đường qua 0 khi 0 nằm trong miền khảo sát; không vẽ gốc 0 giả bên ngoài miền dữ liệu. Chữ đồ thị lớn hơn và có vùng cuộn riêng trên màn hình hẹp.

Cách biểu diễn, mặt phẳng và trạng thái trục được lưu theo từng bài, có trong phiên xuất/nhập. Chuyển 2D/3D không xóa số liệu, không đặt lại thời gian hoặc thay phương trình. Chế độ đồ họa nhẹ là lựa chọn hiệu năng riêng, có thể dùng cả ở 2D và 3D.

## Kiểm tra

- `npm run check`: kiểm tra hồi quy toàn bộ mã, tài nguyên, DOM, trạng thái và 300 bài.
- `npm run check:spatial`: dựng 300 dụng cụ với OrthographicCamera thật của Three.js, chiếu bằng CPU/Canvas; kiểm tra khung hình, tọa độ, nhãn, zoom, mặt phẳng kéo và phục hồi camera 3D.
- DOM kiểm tra cả 300 luồng chuyển 2D/3D, điều chỉnh số, ghi dữ liệu và giữ trạng thái; kiểm tra lưu riêng mặt phẳng/trục và nhập phiên.
- Kiểm tra cấu trúc/CSS ở các mốc 360, 768 và 1440 px; không thay thế đo bounding box hoặc xem trang trong trình duyệt.

Môi trường hiện tại không có công cụ xem trước trình duyệt được hỗ trợ. Không tuyên bố đã kiểm tra pixel WebGL, bố cục trình duyệt thực hoặc thao tác thật trên iPhone. Tính phù hợp sư phạm cần được đánh giá thêm với người học, đặc biệt khi dùng trục chỉ hướng và hình chiếu có các vật chồng nhau.
