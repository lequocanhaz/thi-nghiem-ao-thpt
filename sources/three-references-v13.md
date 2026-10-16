# Tham khảo dựng hình và banner

Đã xem các khung hình trải đều theo thời gian của video người dùng gửi (252,12 s), gồm cảnh vật thể tách lớp, chuyển từ lắp ghép sang bố cục phân rã theo cuộn, phần hướng dẫn tạo ảnh/video. Không đưa video, sản phẩm tai nghe, thương hiệu hoặc âm thanh của video vào website. Banner dùng ba dụng cụ Vật lí thật từ bộ mô hình của dự án; đây là cảnh giới thiệu, các liên kết mở mô phỏng để đo.

Nguồn đã đối chiếu:

- Three.js / `mrdoob/three.js`: https://github.com/mrdoob/three.js — đặc biệt mã `examples/jsm/environments/RoomEnvironment.js` và các ví dụ vật liệu. Dự án đang đóng gói Three.js r186; giữ phiên bản hiện có.
- Tài liệu RoomEnvironment: https://threejs.org/docs/pages/RoomEnvironment.html — phòng chiếu sáng tổng hợp, PMREM và environment map cho vật liệu PBR. Banner dùng ánh sáng này; giải phóng phòng/môi trường khi rời trang.
- MeshPhysicalMaterial: https://threejs.org/docs/pages/MeshPhysicalMaterial — chất liệu, chi phí transmission/clearcoat và vai trò ánh sáng môi trường. Giữ chi tiết dụng cụ, hạn chế hiệu ứng để không tăng tải không cần thiết.
- `pmndrs/drei`: https://github.com/pmndrs/drei — đã đọc README/phân loại helpers, xem định hướng ScrollControls/PresentationControls. Không thêm React hay phụ thuộc này vào dự án ES module hiện có; xử lý vị trí tách mô hình, di chuột, giảm chuyển động và cuộn bằng mã riêng. Một số đường dẫn mã chi tiết GitHub không truy xuất được trong phiên.
- `gfxfundamentals/threejsfundamentals`: https://github.com/gfxfundamentals/threejsfundamentals — đối chiếu mục đích hướng dẫn Three.js, quản lý canvas và kích thước. Không sao chép mô hình trang web khác.

Banner có góc nhìn giới thiệu, thanh điều chỉnh tách các mô hình, dừng chuyển động, kiểm tra vùng nhìn và Canvas khi không có WebGL. Không mô tả là đã train AI. Các phương trình và thuật toán thực nghiệm không bị thay đổi để tạo hiệu ứng banner.
