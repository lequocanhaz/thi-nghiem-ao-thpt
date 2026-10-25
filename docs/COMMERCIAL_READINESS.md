# Chuẩn bị chuyển giao và thương mại hóa

Ngày rà soát:26/10/2026. Đây là kiểm kê kỹ thuật/tài nguyên có phạm vi, không phải kết luận pháp lí hoặc xác nhận sản phẩm đã sẵn sàng cấp phép thương mại.

## Những nền tảng đã có

- Mã nguồn HTML/CSS/ESM và workflow Pages có thể chuyển giao; backend AI được tách riêng.
- 300 thí nghiệm,300 bài soạn VI, lớp học tập EN, bảng/đồ thị, xuất dữ liệu và bản sao phiên.
- Trang giới thiệu VI/EN,300 trang vào có metadata/MathML/schema và sitemap.
- Kiểm thử tự động về catalog, khoa học, dữ liệu, sách, trợ lý, DOM và browser scenarios.
- Không thêm hệ thống bán hàng, thanh toán, tài khoản hoặc thu thập dữ liệu cá nhân trong đợt này.

## Kiểm kê quyền và nguồn

| Tài nguyên | Bằng chứng hiện có | Điều kiện trước chuyển giao thương mại |
|---|---|---|
| Mã nguồn riêng/học liệu của dự án | Kho Git và tên chủ dự án Lê Quốc Anh | Kho chưa có LICENSE chung; thống nhất phạm vi sở hữu/cấp phép bằng văn bản |
| Three.js | `dist/vendor/THREE-LICENSE.txt` | Giữ thông báo MIT khi phân phối |
| WebLLM | `dist/vendor/WEBLLM-LICENSE.txt` | Giữ các điều khoản/thông báo hiện hữu; kiểm model weights riêng nếu được sử dụng |
| KaTeX | Gói ghim0.16.45, thông báo trong bản phân phối | Giữ giấy phép/fonts khi đóng gói; không nhầm thư mục sinh CI là mã nguồn bị thiếu |
| Manrope/Inter | Các tệp `dist/fonts/*-LICENSE.txt` | Giữ thông báo và điều khoản phông |
| Video hố đen | `dist/video/NOTICE.txt`, NASA SVS 13326, ghi credit và chính sách nguồn | Rà lại ngoại lệ/quyền theo nguồn; không ngụ ý NASA bảo trợ |
| Hình artwork khác | `dist/images/NOTICE.txt` | Phân biệt hình tạo riêng và video NASA; không quy quyền sở hữu từ tên tệp |
|301 âm thanh tổng hợp | `dist/audio/vi13/NOTICE.txt`, công cụ/giọng/nguồn | Xác minh điều khoản dịch vụ/giọng và quyền phân phối lại bản thu thương mại |
|388 trang sách,85 bài mục lục | Ảnh sách và catalog nguyên gốc trong kho | Cần xác nhận quyền phát hành/phân phối thương mại với chủ quyền; nhãn bản mẫu 11/12 không tự cấp quyền |
| Nguồn khoa học ngoài | `sources.js`, references và linkOpenStax/MIT | Ghi nguồn, rà điều khoản từng trích đoạn/tài nguyên; link nguồn không chứng nhận solver |

Không tự cấp LICENSE chung cho nội dung mà quyền chưa được xác minh. Việc website đang truy cập công khai không đồng nghĩa được bán hoặc tái phân phối mọi tài nguyên.

## Thứ tự giai đoạn tiếp theo

1. **Nghiệm thu khoa học/sư phạm:** thuê giáo viên/chuyên gia độc lập duyệt 20 mục PARTIAL, mô hình còn thiếu oracle, lời giải và bản EN; ghi người duyệt, phạm vi và ngày.
2. **Thử lớp học:** quan sát học sinh/giáo viên thực hiện nhiệm vụ dự đoán–đo–giải thích; đo hoàn thành nhiệm vụ và lỗi thao tác với sự đồng ý phù hợp. Không suy ra hiệu quả học tập từ số trang hoặc benchmark.
3. **Thiết bị thật:** iPhone Safari, Android Chrome và máy yếu; vuốt/zoom/pan, bàn phím ảo, screen reader và đánh giá FPS/bộ nhớ dài hạn.
4. **Quyền và hợp đồng:** làm rõ sách/âm thanh/logo/mã nguồn, phạm vi cấp phép, hỗ trợ/bảo trì, mô hình trách nhiệm AI và điều khoản riêng tư.
5. **Domain và vận hành:** hoàn tất DNS/HTTPS, chuyển canonical/sitemap sau xác minh, theo dõi lỗi và lập quy trình backup/rollback. Chỉ thêm analytics sau khi quyết định mục đích, dữ liệu tối thiểu và cách xin đồng ý phù hợp.
6. **Thử phương án kinh doanh:** ưu tiên pilot trường học/giáo viên và gói triển khai/hỗ trợ có điều kiện cấp phép rõ. Tài khoản, thanh toán và dữ liệu lớp học cần yêu cầu sản phẩm/hạ tầng riêng trước khi xây.

Không đưa giá bán, chỉ số sử dụng, chứng nhận WCAG hoặc tuyên bố chất lượng học tập chưa có bằng chứng vào nội dung sản phẩm.
