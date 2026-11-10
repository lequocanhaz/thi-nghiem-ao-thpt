# Hồ sơ tài khoản v78

- Sau khi Firebase khôi phục phiên, header hiển thị avatar chữ cái và nút Hồ sơ tài khoản (màn hình nhỏ: avatar với accessible name).
- Hồ sơ hiển thị tên/email/phương thức đăng nhập/trạng thái xác minh thực, chỉnh tên qua Firebase updateProfile. Không tạo hồ sơ giả hoặc database song song.
- SDK Auth vẫn dùng local bundle, Google popup helper chỉ dùng khi chọn Google. UI gọi prepare lúc cài để header nhận ra phiên cũ. Auth client vẫn giữ hợp đồng lazy khi dùng độc lập.
- SVG Google bỏ stroke kế thừa từ CSS button toàn cục, giữ bốn màu. Form điện thoại gọn hơn, có theme đêm và quản lý tài khoản thu gọn; xóa tài khoản vẫn cần xác nhận.
- SDK/account JS/CSS đều tăng query v78 để cập nhật bộ nhớ đệm. Banner guard chỉ chuẩn hóa query account, không đổi baseline banner/media.

## Kiểm chứng

Agent ui rà soát giao diện/a11y và phát hiện cache SDK/focus summary/focus sau lưu; đã sửa. Agent qa bổ sung kiểm thử adapter/DOM và rà soát rủi ro hồi quy.

- `npm run check`: gồm `checks/account-profile-v78.mjs`, adapter và các kiểm tra hiện có.
- `node checks/site-security-v63.mjs`.
- `python3 checks/browser-account-profile-v78.py` với HTTP server phục vụ dist trên port 4173: Chromium headless, 390/1280px, trang chủ/sách, sáng/tối, VI/EN, restore sau reload, đổi tên/lỗi mạng, disclosure/xác nhận xóa, đăng xuất, focus và không tràn ngang. SDK được thay bằng fixture qua route; không tạo tài khoản thật. Ảnh kiểm tra sinh tại work/account-profile-v78.

Chưa nghiệm thu Google OAuth thật, email reset hoặc lưu tên trên Firebase production, thiết bị điện thoại/Safari thật. Dữ liệu thí nghiệm vẫn lưu trên trình duyệt, chưa đồng bộ đám mây.
