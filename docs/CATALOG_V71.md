# Thư viện v71: một hệ bề mặt cho tìm kiếm và bộ lọc

Ảnh phản hồi của chủ dự án cho thấy nền trắng của ô tìm kiếm và nhóm lớp học còn sót trong chế độ đêm, nút chủ đề quá nặng, các đường chia sáng làm bố cục rời rạc.

`catalog-theme-v71.css` sửa đúng khu vực thư viện: tìm kiếm dùng một nền chung, input trong suốt, focus bao cả ô; nhóm lớp có nền/nhãn được ghép màu cho trạng thái chọn; nút chủ đề nhẹ hơn; đường chia dùng màu trung tính. Số lượng thí nghiệm, nhãn ảnh, khoảng cách thẻ và nhịp tiêu đề/mô tả được chỉnh đồng bộ. Mobile giữ vùng chạm44px và cho cuộn ngang danh sách chủ đề.

Không sửa ảnh xem trước gốc, dữ liệu, phương trình, banner, font/logo hoặc cơ chế lưu phiên. Nền trắng trong chính ảnh mô hình được giữ theo tài nguyên gốc, không đảo màu ảnh.

`npm run check`, security baseline và banner preservation đạt. Agent UI/QA độc lập kiểm16/16 tổ hợp320/390/1440/1920px × ngày/đêm × VI/EN: search/clear, lớp/chủ đề, lưu/bỏ lưu, lọc nâng cao và trạng thái rỗng đạt, không lỗiJS/tràn ngang. Tương phản chữ đo thấp nhất5,59:1. Xem [QA](catalog-v71/qa.json), [desktop](catalog-v71/desktop-dark.png), [mobile](catalog-v71/mobile-dark.png). Kết quả phát hành sẽ ghi trong PR sau khi kiểm chứng. Chỉ Chromium giả lập; không chứng nhận Safari/iPhone thật.
