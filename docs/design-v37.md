# Quanh Lab v37 — design review

## Brief

Trắng/đen là nền chính. Chữ tiêu đề lớn và đậm; màu phụ chỉ dành cho nhận diện, chủ đề và trạng thái. Cải thiện banner, logo, thẻ, khu vực lab và độ thẳng hàng của nút. Giữ 300 thí nghiệm và các công thức hiện có.

## References and decisions

| Nguồn đã tham khảo | Điều áp dụng |
| --- | --- |
| [Geist Buttons](https://vercel.com/geist/button) | Cùng chiều cao cho nhóm thao tác, phân cấp bằng nền/viền, icon có khung riêng. |
| [Geist Typography](https://vercel.com/geist/typography) | Phân cấp kích cỡ và độ đậm; nội dung đọc không dùng cùng trọng lượng với tiêu đề. |
| [Linear UI redesign](https://linear.app/now/how-we-redesigned-the-linear-ui) | Dùng nền trung tính và các đường phân chia có chủ đích để mô hình và nội dung nổi bật. |
| [Linear design refresh](https://linear.app/now/behind-the-latest-design-refresh) | Nhất quán hệ icon, mật độ bảng công cụ và cấp bậc thị giác. |
| [W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Kiểm tra cỡ 320 CSS px, đo clientWidth thực có trừ thanh cuộn. |
| [W3C Target Size Enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) | Chọn 44 px cho các nút chính; không tuyên bố toàn bộ website đạt WCAG. |

Đây là tham khảo nguyên tắc; không sao chép bố cục hoặc tài sản của các nguồn.

## Visual system

- White #fff; primary ink #000 / #111214; selected surfaces #f3f5fa; accent blue #3155d5.
- Manrope tải cục bộ; heading 750, tên thí nghiệm 800, heading nhỏ 700. Nội dung giữ độ đậm dễ đọc.
- Hero desktop: trái chữ, phải video. Dưới 900 px xếp dọc; ở 320 px CTA xếp thành hai hàng. Không phủ màu lên video.
- Nút tiêu chuẩn 44 px; CTA hero 48–50 px. Icon-only 44×44, padding 0, SVG 16–20 px tùy vai trò. Không nâng/lệch nút khi hover.
- Bảng lab và thẻ dùng viền mảnh, radius 12 px. Điều khiển mức hai nền trắng; chạy màu đen, ghi điểm xanh rất nhạt.

## Bugs verified while reviewing

1. Nút toàn màn hình banner trước đây kế thừa padding ngang 19 px: khung 44 px chỉ còn 4 px cho ký tự. Đồng thời min-height 46 px làm khung không vuông. Đã dùng SVG và khung 44×44 không padding.
2. Hai nút cuối bài tràn khi trình duyệt hiển thị scrollbar trên khung 320 px. Đã đổi flex tự giữ kích thước nội dung thành grid 2 cột minmax(0,1fr).
3. Chữ lớn 115% làm ba nút chế độ tràn khỏi khung hẹp. Đã đổi sang 3 cột co giãn, cho nhãn xuống hàng khi cần.
4. Phép đo innerWidth có thể bỏ sót 15 px dành cho scrollbar. QA dùng documentElement.clientWidth và so scrollWidth theo cùng hệ tọa độ.

## Verification workflow

`npm run check` bao gồm import/syntax, font/brand, 300 route/title/action contracts, CSS cascade ở 7 độ rộng, các luồng chạy/ghi/đồ thị/chat và hash của mô-đun khoa học/âm thanh.

`dist/review/v37/qa.html` là công cụ kiểm tra pixel trong trình duyệt thật, mở iframe canonical index. Bốn khung 320/390/768/1280 chạy qua trang chủ và 300 bài: 1.204 trường hợp. Kiểm tra tràn ngang, container vượt khung, hàng nút thẻ, khung/căn giữa icon và chiều cao/nội dung nút. Kết quả phải đọc sau khi trang báo Hoàn tất; lượt dừng giữa chừng không tính là pass.

Kiểm tra thủ công thêm: banner, thư viện, AI, chế độ khám phá/phân tích, chạy/dừng/ghi điểm, chữ lớn 115%, logo trên các nền. Môi trường cloud browser có thể chuyển sang đồ họa nhẹ. Đây không thay thế Safari hoặc thiết bị cảm ứng thật.
