# Vòng tròn trong vùng tương tác và ngày/đêm

Thay đổi ngày 29/10/2026 được xây dựng trên bộ vòng tròn/vectơ quay đã có ở main `5b75f2e`, giữ phần hiển thị số khoa học và các thay đổi tài khoản trước đó. Không tạo hai vòng tròn cho cùng một thí nghiệm.

- `#shmCirclePanel` nằm trong `.stage-viewport` cùng mô hình dao động điều hòa. Desktop rộng hiển thị cạnh mô hình; màn hình hẹp xếp dưới mô hình trong cùng vùng thao tác. Có góc đặc biệt, hình chiếu, đồ thị và số đọc liên kết với thời điểm chung.
- Giữ đúng phân biệt sư phạm: M quay là biểu diễn toán học, vật lò xo chỉ chuyển động trên trục x. Đồ thị và số đọc lấy cùng mô hình, không sửa phương trình hoặc số liệu đã ghi.
- Sửa chọn pha khi đã ở giới hạn cuối phiên; sửa thanh pha chưa cập nhật sau khi kéo vòng tròn nếu trước đó thanh nhập còn giữ focus.
- Nút ngày/đêm có ở trang chính và sách, lưu bằng khóa riêng `quanh-appearance-v1`. Không thay dữ liệu phiên thí nghiệm. Ảnh sách và ảnh mô hình không bị đảo màu; vùng mô hình giữ bảng màu khoa học hiện có.
- Stylesheet vòng tròn được tải rõ ràng; cập nhật phiên bản import để tránh dùng mã cũ trong cache.

Kiểm tra: các pha đặc biệt và 1.449 trạng thái đối chiếu với bộ tính dao động; Chromium/SwiftShader tại 320,375,390,414,430,768,1024,1440,1920px; không tràn ngang tài liệu. Kiểm kéo vòng tròn, thanh pha bằng bàn phím, đồng bộ khi Chạy, giữ số liệu qua đổi giao diện và lưu ngày/đêm khi tải lại sách. Đây là kiểm tra giả lập, chưa phải iPhone/Safari thật hoặc đo FPS phần cứng.

Ảnh ở `phase-appearance-v67/` ghi bố cục được kiểm tra; các tinh chỉnh tương phản chữ phụ được bổ sung sau ảnh chụp đó. Không coi ảnh là bằng chứng cho mọi màn hình và mọi trạng thái.

Rà soát độc lập trước phát hành được thực hiện bởi các agent `release_physics`, `release_ui`, `release_books` và `release_qa`. Kết quả và phạm vi được ghi trong `phase-appearance-v67/`. Ghi chú trước đó cho rằng công cụ sub-agent không khả dụng là không chính xác; đợt này đã gọi agent thực tế và kiểm tra trên mã cuối.

Các lỗi phát hiện trong rà soát và đã sửa:

- Vectơ vận tốc chiếu từng thêm độ dài tối thiểu cho dễ nhìn; nay lấy đúng thành phần ngang của vectơ tiếp tuyến, gồm góc rất nhỏ. Thêm kiểm độc lập `checks/shm-projection-v68.mjs` vào `npm run check`.
- Sửa nhãn đại lượng EN không chèn đơn vị m/s vào số đo cm/s; giữ đơn vị catalog và các giá trị tính toán.
- Ghép lại màu chữ/nền trong chế độ đêm cho header, số đo/đơn vị, bảng tham số, hướng dẫn, thư viện và sách; làm rõ trạng thái 2D/3D được chọn. Sửa màu placeholder, thông tin phiên và nút Hiển thị khi mở; giữ popup Hiển thị trong màn hình điện thoại.
- Nút ngày/đêm theo dõi ngôn ngữ trang sách ngay; nhãn accessible của vùng vòng tròn theo VI/EN.

Bộ kiểm tra bảo toàn 300 thí nghiệm/bài soạn, 388 trang sách, 85 mục lục bài học và 301 âm thanh. Bản này cũng chứa sửa lấy mẫu rời rạc từ PR40; xem `RELATION_SAMPLING_V66.md`. Không coi các kiểm thử này là phản biện khoa học toàn bộ 300 bài.

Còn chưa nghiệm thu: thiết bị iPhone/Safari/Android thật, bàn phím ảo, FPS GPU phần cứng và đăng nhập Google/email bằng tài khoản thật. Một nhãn điều hướng sách cũ còn tiếng Việt trong giao diện EN. Bản quét sách gốc giữ tiếng Việt, không tuyên bố đã dịch nội dung trang.

Trạng thái triển khai cuối xem [PR43](https://github.com/lequocanhaz/thi-nghiem-ao-thpt/pull/43) và workflow gắn với commit đã merge. Việc có mã hoặc ảnh trong repository tự nó không chứng minh website đã được triển khai.

Kết quả trước merge: `npm run check` đạt (exit0), kiểm bảo vệ banner và visual-settings sau CSS menu cuối đạt. UI47/47 và18 trạng thái tương phản; QA9 viewport; sách12/12; physics không có blocker trong phạm vi nêu trên. CI trên commit phát hành và kiểm HTTPS sau deploy được gắn trong PR.
