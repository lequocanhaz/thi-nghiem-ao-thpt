# Khung thí nghiệm và liên hệ vòng tròn – dao động v69

Phạm vi: sửa bố cục chung của không gian thí nghiệm và thiết kế lại cách biểu diễn dao động điều hòa sau phản hồi về bố cục/cách thể hiện của v67. Không tuyên bố đã thiết kế lại hoặc nghiệm thu khoa học toàn bộ300 bài.

## Vấn đề và cách sửa

- v67 đặt hai minh họa cạnh nhau; mobile xếp nối tiếp, mô hình nhỏ và phần vòng tròn kéo dài. Cùng DOM viewport chưa làm rõ quan hệ hình chiếu.
- v69 dùng một SVG chung: M quay, H và vật lò xo cùng tọa độ ngang/cùng thang±A. Đường chiếu nối trực tiếp xuống vật. Lò xo có chiều dài dương, gắn đúng mép vật; bánh tiếp xúc ray.
- Chế độ **Liên hệ** là mặc định riêng cho dao động; 2D/3D vẫn mở mô hình hiện có. Chọn cách nhìn không thay phương trình, giá trị đo hoặc schema phiên. Ưu tiên hiển thị mới lưu riêng tại `quanh-shm-view-v69`.
- Mặc định chỉ bốn góc chính. Đồ thị, công thức, giải thích và các góc đầy đủ mở khi cần. Desktop: hình bên trái, đồ thị/pha bên phải; mobile: hình → Chạy/Ghi điểm → pha → số đọc → phần mở rộng.
- Thu gọn các chế độ học và tùy chọn thời gian thành nhóm có nhãn. Đóng popup khi nhấn ngoài/Escape; focus toàn màn hình loại mọi nội dung nằm trong details đóng hoặc vùng ẩn.
- Ngày/đêm là biểu tượng44px trong header, có aria-label/title theo VI/EN; không còn nút nổi đè lên hình. Header sách mobile hai hàng, giữ sách/ảnh gốc.
- Xuất PNG lấy đúng SVG đang nhìn, có màu và trạng thái hiện tại; không chụp model3D cũ bị ẩn.

## Ngôn ngữ thiết kế

Giữ Manrope và nhận diện Quanh Lab. Nền sáng `#fff`, nền phụ `#f5f7fa`, chữ `#101318`, chữ phụ `#4b5563`, nét/vectơ quay `#2563eb`, hình chiếu `#168b76`; vận tốc dùng màu cam riêng. Ban đêm dùng token giao diện hiện có và màu khoa học dễ đọc, không đảo màu sách/ảnh/3D.

Một vùng quan sát có ưu tiên rõ; giảm các hộp lồng và hàng công cụ lặp. Nút chính44px trở lên, số đọc tabular, nhãn/đơn vị tách khỏi giá trị tính. Việc co giãn đồ họa theo±A được ghi rõ: pixel không được dùng làm đơn vị cm.

## Thực thi

- `dist/shm-circle.js/css`: SVG liên hệ và điều khiển pha, giữ helper khoa học hiện có.
- `dist/app.js`, `views.js`: cách nhìn Liên hệ/2D/3D, tải renderer khi cần, nhóm công cụ, focus và đóng popup.
- `dist/studio-v69.css`, `lab-extras-v67.css`, `appearance-v67.js`: bố cục chung, header và ngày/đêm.
- `dist/studio-export-v69.js`: xuất đúng sơ đồ raPNG.
- Entry HTML/boot/query versions và các nhãn EN cập nhật đồng bộ.
- `checks/shm-linked-v69.mjs`, `browser-studio-v69.py`: kiểm hình học độc lập và luồng trình duyệt mới. DOM300 vẫn kiểm đầy đủ model bằng cách chọn3D rõ ràng cho dao động sau khi xác nhận defaultLiên hệ.

## Kiểm chứng và giới hạn

`npm run check` đạt; DOM sau sửa popup/focus đạt; kiểm assets, bảo mật public, banner và300 preview hiện hành đạt. Giữ300thí nghiệm/bài soạn,388trang sách,85bài mục lục và301âm thanh. Không đổi mô hình/phương trình/catalog hoặc ảnh thumbnail; không thay manifest nguồn để né kiểm tra.

Các báo cáo độc lập ở `studio-v69/` phân biệt rõ tác giả component, physics, UI, QA và sách. Các lỗi thực tế phát hiện gồm cảm ứng bị browser cancel, popup thời gian che nút xuất ảnh và Tab đi ra ngoài fullscreen qua nội dung details đóng; đã sửa và kiểm lại.

Chromium/SwiftShader giả lập không phải iPhone/Safari/Android thật, không phải FPS GPU phần cứng hoặc chứng nhận WCAG. Chưa đăng nhập Google/email bằng tài khoản thật; backendAI và cấu hình tài khoản hiện có không thuộc thay đổi này. Một nhãn điều hướng sách cũ còn tiếng Việt trong EN; không tuyên bố sách gốc đã được dịch. Các mục khoa học PARTIAL và quyền thương mại tài nguyên đã ghi ở các báo cáo trước vẫn chưa được nghiệm thu trong đợt này.

Bản phát hành được xác định bằng PR/CI/Pages tương ứng và kiểm HTTPS sau triển khai; ảnh và source trong repository tự nó không chứng minh đã lên web.

Ảnh bố cục trước/sau: [desktopv67](phase-appearance-v67/desktop-dark.png), [mobilev67](phase-appearance-v67/mobile-dark.png); [desktopv69](studio-v69/desktop-dark.png), [mobilev69](studio-v69/mobile-dark.png). NhãnM được kiểm riêng sau lớp halo cuối; không coi một ảnh là bằng chứng mọi trạng thái.

Hậu kiểm bố cục chung: cơ năng, điện trường, sóng và khí tại390/1440px đạt8/8 tình huống WebGL, đổi/khôi phục tham số, ghi số liệu, VI/EN và ngày/đêm; không tràn ngang hay lỗi JS/HTTP. Đây là kiểm mẫu bố cục, không phải nghiệm thu toàn300 mô hình. Xem `studio-v69/shared-layout-qa.json`.

Nút ngày/đêm dùng tên hành động thay đổi theo chế độ; đã bỏ `aria-pressed` để tránh đọc sai trạng thái. Tám tình huống trợ năng của header chính/sách, VI/EN và sáng/tối kiểm lại tên, title, Enter/Space, lưu chế độ và focus đều đạt; xem `studio-v69/theme-button-review.json`.
