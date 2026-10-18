# Font giao diện hiện tại — v35

Manrope Variable (200–800), tải từ kho Google Fonts chính thức: https://github.com/google/fonts/tree/main/ofl/manrope. Font WOFF2 được tạo từ TTF bằng FontTools/Brotli, giữ đầy đủ glyph; giấy phép SIL OFL đi kèm tại `dist/fonts/MANROPE-LICENSE.txt`. Đã kiểm tra 146 ký tự tiếng Việt hoa/thường, gồm toàn bộ nguyên âm có dấu và Đ/đ. Bằng chứng SHA-256 nằm trong `checks/brand-font-v35.json`.

Kiểu chữ và phân cấp tham khảo ảnh MatterMore người dùng gửi: nội dung 400, nút/tiêu đề trang 500, tên thí nghiệm viết hoa 750, số đo và từ nhấn mạnh 700. Đây là font tương tự theo ảnh; không sử dụng tệp FT Sterling thương mại từ website MatterMore. Công thức MathML giữ font toán.

## Lịch sử v13


Dùng bốn tệp SVN-Product Sans do người dùng cung cấp ngày 16/10/2026: Regular, Bold, Italic, Bold Italic. Chuyển từ OTF sang WOFF2 bằng FontTools/Brotli, giữ bảng kí tự và tên gốc; đóng gói tại `dist/fonts/ProductSans-*.woff2`. Inter tiếp tục là font dự phòng. Giá trị đo vẫn giữ chữ số dễ đối chiếu; công thức MathML có font toán riêng.

Đã kiểm tra đủ 57 kí tự tiếng Việt phân biệt xuất hiện trong danh mục 300 bài trên cả bốn bản WOFF2, và đã xem bản vẽ kiểu chữ riêng từ tệp OTF. Đây là kiểm tra file và glyph, không phải ảnh chụp website.
