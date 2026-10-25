# Trạng thái DNS và phát hành

Ngày kiểm: 26/10/2026. Tên miền do người dùng đăng ký: `physicslab.tech`.

## Bằng chứng quan sát được

- GitHub Pages: `cname=physicslab.tech`, `https_enforced=false`; trường URL trả `http://physicslab.tech/`.
- GET mới tới URL GitHub Pages với query kiểm tra trả301và `Location: https://physicslab.tech/...`; phản hồi cũ được cache từng trả200, nên không dùng cache làm bằng chứng website đang truy cập được.
- DNSGoogle trả NOERROR/Status0 với SOA, không có Answer cho truy vấn A, AAAA và CNAME của apex. Chưa có bằng chứng tên miền trỏ tới Pages.
- HTTPS tên miền chưa truy cập thành công từ executor. API healthPages trả403do quyền tích hợp; không suy ra có quyền thay DNS hoặc chứng chỉ.
- Main đã có các commit riêng chuyển canonical/OG/robots sang domain và đổi tiêu đề banner. Bản hợp nhất giữ các thay đổi đồng thời; generator trang thí nghiệm theo canonical hiện hữu, không tạo một migration domain khác.

Một workflow Pages thành công chỉ chứng minh artifact đã được xuất bản; không tự chứng minh DNS, chứng chỉ hoặc website công khai hoạt động.

## Việc cần thực hiện ở nhà cung cấp DNS

Nếu tiếp tục dùng custom domain, cấu hình apex `@` tới GitHub Pages bằng bốn bản ghi A theo [tài liệu GitHub](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site):

| Loại | Tên | Đích |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Rà các bản ghi xung đột của apex trước khi thay. Không ghi đường dẫn `/thi-nghiem-ao-thpt/` vào giá trị DNS. Nếu cần `www`, GitHub hướng dẫn dùng CNAME `www` tới `lequocanhaz.github.io`; cấu hình đó là lựa chọn bổ sung, không được tự tạo trong đợt này.

Sau khi DNS công khai trả đúng, chờ GitHub cấp chứng chỉ trong Settings → Pages, bật Enforce HTTPS khi khả dụng, rồi kiểm lại TLS/HTTP, redirect và asset thật. Chỉ đánh dấu domain nghiệm thu khi HTTPS200, các module/CSS/KaTeX/trang sách tải đúng và nội dung khớp commit phát hành.

## Phương án tạm thời cần lựa chọn của chủ dự án

Agent đã hỏi có cho phép tạm gỡ custom domain trong Pages để khôi phục URL GitHub Pages, hay giữ cấu hình để chủ tên miền sửa DNS. Chưa tự thay thiết lập chuyển hướng vì prompt yêu cầu xác minh DNS/HTTPS trước thay đổi. Cũng chưa tự sửa tài khoản DNS bên ngoài vì không có kết nối được cấp quyền.

Nếu chọn khôi phục URL cũ, cần đồng bộ lại canonical/OG/sitemap/trang giới thiệu theo lựa chọn đó và kiểm lại redirect. Nếu chọn giữ domain, mã nguồn/PR/CI có thể hoàn tất độc lập nhưng nghiệm thu truy cập website vẫn chờ DNS/HTTPS.
