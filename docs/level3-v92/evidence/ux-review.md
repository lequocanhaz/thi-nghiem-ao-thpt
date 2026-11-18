# Rà soát giao diện độc lập

Chromium 154 với SwiftShader. Lượt kiểm sớm dùng bàn phím để mở công cụ, đặt vật lên cân, trừ bì và lấy vật ra ở 320 px chế độ tối 2D, 390 px chế độ sáng 3D và 1440 px chế độ sáng 3D. Cốc có số chỉ 250 g trước khi trừ bì và 245 g sau khi trừ 5 g. Khi trừ bì đĩa đá, số chỉ của viên đá là 10 g. Nút cân vật khác bị khóa trong lúc cân đang có đồ. Các nút mới đạt vùng chạm 44 px và bố cục vừa chiều rộng trang.

Rà soát phát hiện nhãn trừ bì tiếng Việt dễ gây hiểu sai. Nhãn đã được sửa để nói rõ số chỉ là khối lượng đang đặt trên cân trừ giá trị bì đã lưu. Ca xác minh tiếp theo mở bảng cân kiểm tra câu tiếng Anh và xác nhận nháp 50,125 g còn nguyên sau khi tải lại và chuyển VI sang EN. [Bản ghi kiểm tra nháp và ngôn ngữ](draft-locale.json)

Ở 320 px sáng, 390 px tối và 1440 px sáng, có thể mở đồ thị bằng bàn phím, đổi nguồn dữ liệu và đổi mốc thời gian. Trục, chú giải và bộ chọn vừa màn hình. Các thao tác xem đồ thị giữ nguyên dữ liệu của hai lượt. [Bản ghi đồ thị](comparison.json)

Phạm vi đánh giá gồm trình duyệt và kích thước màn hình mô phỏng. Thiết bị thật, thẩm định sư phạm, hiệu năng phần cứng và kiểm toán WCAG đầy đủ còn chờ nghiệm thu.
