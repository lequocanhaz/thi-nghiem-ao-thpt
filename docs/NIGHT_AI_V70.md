# Trợ lý AI và màu đêm v70

Ảnh người dùng cho thấy tin nhắn sáng trên nền trắng trong chế độ đêm. Nguyên nhân là nền cố định trong `app.css` không được ghép với màu chữ từ giao diện đêm. Tương phản trường hợp tái hiện trước sửa khoảng 1,03:1.

## Thay đổi

- `assistant-theme-v70.css` ghép nền/chữ cho khung chat, tin nhắn, công thức, composer, gợi ý, nút, ảnh và thông báo lỗi. Câu trả lời dùng nền trong suốt, tin nhắn người dùng dùng nền riêng.
- Bảng màu đêm chung: nền `#212121`, bề mặt `#2f2f2f`, header `#171717`, ô nhập/tin nhắn `#303030`, chữ `#ececec`, chữ phụ `#b4b4b4`, viền `#4d4d4d`. Giữ màu đồ vật khoa học, ảnh, font và logo.
- Nhãn, nền đọc toàn màn hình và thông báo tải/lỗi của sách được ghép màu đêm. Không lọc hoặc sửa trang sách gốc.
- Entry dùng phiên bản CSS mới; guard banner chỉ bỏ qua đúng link stylesheet mới, giữ nguyên baseline banner.

## Kiểm chứng

- Agent AI: 8/8 tổ hợp 390/1440 px × ngày/đêm × VI/EN; câu trả lời dài, LaTeX, ảnh, lỗi/thử lại, draft, focus; không lỗi JavaScript. Phản hồi giả lập, không gọi nhà cung cấp.
- Agent UI/QA: 8/8 tổ hợp 320/390/1440/1920 px × VI/EN; đổi sáng/tối giữ nội dung, không tràn ngang, dao động liên hệ vẫn hiển thị; contrast chữ được chọn sau sửa tối thiểu 6,10:1.
- Agent sách: 12/12 tổ hợp kích thước/theme/lớp; lỗi/thử lại và toàn màn hình; giữ trang/zoom/mục lục. Tương phản chữ được chọn tối thiểu 6,12:1.
- Các kiểm tra trình duyệt dùng Chromium headless, viewport giả lập; không xác nhận phần cứng iPhone/Safari thật hoặc toàn bộ WCAG.
- Bản này sửa lỗi hiển thị AI, không thay khóa/provider/backend. Backend Sites riêng đã được sửa allowlist ở phiên bản 8, source commit `7bb4f333546e38d013718e1a20d31fcc09f52227`; GitHub Pages không tự triển khai backend. Bản sao server trong kho này chưa được đồng bộ từ Sites.

## Ảnh và báo cáo

[Trước sửa](night-v70/before.png) · [Sau sửa](night-v70/after.png) · [Chat mobile](night-v70/mobile-chat.png)

[QA chat](night-v70/assistant-qa.json) · [QA UI](night-v70/ui-qa.json) · [Rà soát sách](night-v70/books-review.md)

Kết quả kiểm tra tổng và triển khai được ghi trong PR phát hành sau khi hoàn tất; không suy ra từ các fixture rằng mọi câu hỏi AI đều luôn trả lời thành công.
