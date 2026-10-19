# Quanh Lab · Quy chuẩn ảnh minh họa khoa học v41

## Mục tiêu
Thay ảnh chụp mô hình 3D trước đây bằng **ảnh minh họa 2D được vẽ riêng cho từng thí nghiệm**, theo phong cách hình mẫu điện trường do người dùng phê duyệt: nền trắng/xanh rất nhạt, đường nét vector xanh dương, điểm nhấn cam/đỏ và xanh; không có nút bấm, nhãn lớp hoặc thẻ UI.

**Không lấy lại ảnh chụp từ mô phỏng làm thumbnail. Không biến 1 sơ đồ thành 300 hình có tiêu đề khác nhau.**

## Nguyên tắc vật lí bắt buộc
1. Trường và lực: chiều vectơ, chiều đường sức điện, điểm đặt phải phù hợp với cấu hình. Với một cặp điện tích dương-âm, đường sức đi từ dương sang âm, không chĩa ngược về dương.
2. Mạch điện: nguồn, điện trở và ampe kế mắc nối tiếp khi khảo sát định luật Ôm; vôn kế mắc song song với điện trở được đo.
3. Sóng: họa tiết chỉ thể hiện hiện tượng theo mô hình sóng; nếu biểu diễn giao thoa, khoảng cách vân và vị trí cực đại/cực tiểu phải tính từ mô hình nguồn và hiệu đường đi.
4. Cơ học: hướng gia tốc, lực, chuyển động phải tuân theo mô hình và hệ trục đã chọn.
5. Đồ thị: dữ liệu và đại lượng phải xuất phát từ phương trình của thí nghiệm, không vẽ trang trí tùy ý.

## Tiêu chuẩn sản phẩm
- Tệp chính: SVG (vector); tệp tối ưu web: WebP ở tỉ lệ 16:10, ưu tiên 960×600; tùy chọn PNG chất lượng cao.
- Nền không tối hơn #eaf6ff; nét chính #087be6; màu đánh dấu #ff6345 và #317dff; ít đổ bóng/không giả vật liệu 3D.
- Không title, logo, badge, caption và các thành phần UI nằm trong hình.
- Mỗi ID phải có bản vẽ riêng, không dùng ảnh placeholder chung.
- Kiểm tra tự động số ID, kích thước, tệp tồn tại, hình trắng/hỏng; kiểm tra chuyên môn theo nhóm trước khi nhập main.
- Những thí nghiệm không có bộ dựng chính xác phải để tình trạng `needs-review`, **không tự đánh dấu hoàn thành**.

## Mẫu tham chiếu cần phát triển đầu tiên
- `electric`: đường sức của điện tích điểm theo định luật Coulomb.
- `ohm`: sơ đồ nguồn–ampe kế–điện trở–vôn kế.
- `interference`: biên độ giao thoa từ hai nguồn kết hợp cùng pha.

## Trạng thái
Định hướng này thay thế PR #14 (`feat/real-physics-thumbnails-v40`), đã đóng vì cách dựng 3D không đúng phong cách yêu cầu. Đợt chạy 300 ảnh trước đó lưu thành công 10/300; 290 ảnh lỗi, nên **không sử dụng số 300 để báo hoàn thành**.
