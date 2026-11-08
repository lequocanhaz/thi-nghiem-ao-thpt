# Quanh Lab — trải nghiệm sản phẩm v76

Đợt này cải thiện luồng sử dụng và cách trình bày trên mã hiện có. Mốc trước sửa: `d2d421a13965d5f35a7cb42320b9c858cf8a223e` (v75). Không thay solver, renderer, ảnh xem trước, video banner, font/nhận diện hoặc schema phiên.

## Vấn đề đã tái hiện

- Ohm ở390×844: nút Chạy nằm khoảng y875, dưới màn hình đầu; người học phải đi qua nhiều hàng camera trước khi chạy.
- Bảng thông số nằm xa mô hình và có khung cuộn lồng làm phần điều chỉnh R khó thấy.
- Ghi điểm mở dữ liệu nhưng bảng ở xa vị trí đang xem; bấm nút Dữ liệu có thể đóng lại vùng cần tới.
- Bảng một dòng vẫn cao360px; header dữ liệu xuống nhiều hàng và tab Nguồn bị cắt trên mobile.
- Card thư viện lặp chủ đề, môn, lớp, hình thức tương tác và phân loại chương trình trong mỗi mục.
- Kệ sách mobile quá dài để thấy lớp12; ô chọn lớp có thể cắt chữ ở320px.
- Thanh kéo thông số báo giới hạn560px nhưng CSS chỉ cho chiều rộng thực tế340px.

## Thay đổi thực tế

### Không gian thí nghiệm

Thu gọn phần đầu trang; giữ tên bài và mô tả ngắn. Chạy/Ghi điểm nằm sát mô hình trước công cụ camera. Các điều khiển thời gian, tốc độ, bước, lặp và reset vẫn là node hiện có, được gom trong native details trên điện thoại và hiển thị trực tiếp trên desktop. Menu mở ngay phía trên nút, có cuộn, Escape và đóng ngoài menu. Trên desktop, click Chạy hoặc Escape trong điều khiển không được đóng một details có nút mở đang ẩn.

Thanh công cụ hiện có trở thành lối chuyển nhanh Mô hình/Thông số/Dữ liệu trên mobile. Đích Thông số và Dữ liệu được mở rõ ràng rồi nhận focus, không toggle đóng khi bấm lại; không thay hash route hoặc tự cuộn khi đang ghi liên tiếp. Không mở bàn phím số chỉ vì đi tới bảng thông số trên thiết bị cảm ứng. Thanh ẩn khi chat, fullscreen hoặc trường nhập cần không gian; vẫn có nút thoát trình chiếu trên cảm ứng.

Bảng thông số mobile co theo nội dung thay vì cuộn lồng trong khung thấp. Bảng dữ liệu co theo số hàng và giữ giới hạn cuộn cho bảng dài; năm tab cùng nhìn thấy. Các bộ điều khiển camera320px nằm trong một hàng; thông báo ghi số liệu nằm phía trên thanh chuyển nhanh. Dải kéo bảng thông số desktop khớp giới hạn300–560px thực tế.

Vòng tròn dao động giữ nguyên tương tác và hệ tọa độ; phần giải thích thang đo được đặt sau hành động Chạy. Không bỏ chú thích tỉ lệ hoặc thay số đo.

### Thư viện và sách

Card ưu tiên ảnh gốc, chủ đề/lớp, tên, mô tả ngắn và hai hành động mở/xem trước. Bớt metadata lặp; công thức, điều kiện, thông tin học tập vẫn truy cập qua xem trước và trang bài. Giữ ảnh, chức năng lọc, trạng thái đã lưu và phân trang.

Kệ sách mobile dùng hàng bìa–nội dung gọn, thấy đủ ba lớp trong489–550px. Điều khiển đọc nhóm rõ theo trang và zoom, giữ44px; ô chọn lớp320px không cắt tên. Nền nút vô hiệu hóa được ghép màu trong chế độ đêm. Bổ sung đúng nhãn “Thí nghiệm ↗” sang EN; không dịch hay lọc trang sách gốc.

## Ngôn ngữ thiết kế

Manrope và font toán hiện có; tiêu đề rõ, thân bài đọc theo nhịp1,55–1,7. Khoảng cách nhóm dùng8/12/16/20px. Màu bề mặt: trắng/xám nhạt ở ngày, `#212121`/`#2f2f2f` ở đêm; chữ `#20242a`/`#ececec`, chữ phụ `#59616c`/`#b8b8b8`. Focus xanh có tương phản; màu vật lí và màu trong ảnh giữ nguyên. Bo góc12–14px cho vùng nội dung,8px cho điều khiển. Không thêm font, icon ảnh, gradient hoặc hoạt ảnh trang trí.

## Truy vết tệp

- `dist/product-ux-v76.css`: header, catalog, studio, bảng và điều khiển responsive.
- `dist/books-ux-v76.css`: kệ sách và thanh đọc.
- `dist/views.js`, `dist/app.js`: destination mở/focus, nhóm playback và đặt công cụ camera; giữ node và dữ liệu.
- `dist/language-ui.js`, `dist/book-language.js`: cặp dịch chính xác.
- Entry và boot dùng phiên bản76 cho tệp thay đổi; module khoa học giữ phiên bản đã kiểm.
- Guard banner chỉ bỏ qua đúng hai link CSS mới, không thay baseline tài nguyên.
- `checks/browser-product-ux-v76.py`: phép thử browser cho các luồng thao tác thực tế.

## Bằng chứng và giới hạn

Ảnh trước được chụp từ HTTPS v75; ảnh sau từ bản mã v76 trong môi trường kiểm thử.

| Khu vực | Trước | Sau |
| --- | --- | --- |
| Thí nghiệm390px | [Ảnh](product-ux-v76/workspace-before.png) | [Ảnh](product-ux-v76/workspace-after.png) |
| Thí nghiệm desktop | [Ảnh](product-ux-v76/desktop-before.png) | [Ảnh](product-ux-v76/desktop-after.png) |
| Thư viện | [Ảnh](product-ux-v76/catalog-before.png) | [Ảnh](product-ux-v76/catalog-after.png) |
| Kệ sách390px | [Ảnh](product-ux-v76/books-before.png) | [Ảnh](product-ux-v76/books-after.png) |

Kết quả kiểm tra cuối và bằng chứng được ghi bên dưới. Các kiểm Chromium/SwiftShader là giả lập, không xác nhận phần cứng Safari/iPhone/Android hoặc bàn phím ảo thật. Không coi kiểm thử tự động là chứng nhận toàn bộ WCAG, thẩm định sư phạm hoặc đánh giá đẹp của người dùng. Miền thiết kế vôn kế và các phần chưa kiểm định trong đặc tả vẫn để mở; đợt này không sửa mô hình đó.

## Kết quả kiểm thử cuối

- `npm run check` đạt; kiểm bảo mật, bảo toàn banner, 300 preview và dữ liệu sách đạt. Lỗi hồi quy focus tablet trong lượt đầu đã được sửa ở hành vi mở thông số, không nới kỳ vọng kiểm thử.
- Browser trên nguồn ổn định: **9/9 viewport** 320/375/390/414/430/768/1024/1440/1920, **4/4 luồng sâu** Ohm/dao động/điện trường/thấu kính. Giữ số liệu và notes qua đổi tham số, VI/EN, 2D/3D, reset, xuất CSV/PNG và tải lại; fullscreen100Tab mỗi luồng; chat chỉ mở cục bộ, không gọi AI. Không lỗi JavaScript hoặc HTTP trong phạm vi kiểm.
- QA độc lập cuối **2/2** trên390/1440 và nguồn ổn định, xác nhận native playback desktop không đóng ngoài ý muốn, menu mobile đúng chỗ, Data lặp lại giữ focus/hàng, thoát trình chiếu cảm ứng và resize560px thật.
- Kiểm riêng320/390 xác nhận nút Chạy dao động nằm trên thanh chuyển nhanh, menu không bị che và toast nằm phía trên thanh.
- Sách: **8/8 ngữ cảnh**,24 lượt đọc theo lớp;2/2 lỗi ảnh→thử lại/fullscreen. Giữ trang39/zoom125%/mục lục/URL/trạng thái, không tràn hoặc lỗi JavaScript. Kiểm dữ liệu sách Node cũng đạt.

[Workspace QA](product-ux-v76/workspace-qa.json) · [Phản biện cuối](product-ux-v76/final-review.md) · [Focus và bố cục](product-ux-v76/focus-layout-qa.json) · [Resize](product-ux-v76/resizer-qa.json) · [Sách](product-ux-v76/books-review.md)

Các lượt cũ có lỗi đã được giữ ở thư mục làm việc; kết quả nêu trên dùng lượt cuối sau sửa. Trạng thái CI/Pages và xác minh HTTPS được ghi ở PR sau khi hoàn tất, không suy ra từ screenshot cục bộ.
