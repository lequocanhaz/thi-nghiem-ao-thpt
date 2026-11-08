# Rà soát giao diện quan sát và chú giải tọa độ v75

Đã sửa bằng CSS scope `#conceptObservation` và hai cặp nhãn dịch chính xác. Không sửa solver, renderer, hình ảnh, font hoặc schema phiên. Nền trắng cố định của vùng quan sát từng thắng token đêm; nay nền/chữ/bảng/summary/tick/đường/điểm đi cùng token riêng. Đường lý thuyết và mẫu rời rạc giữ cùng màu xanh; điểm hiện tại và khóa chú giải giữ cùng màu cam. Chú giải quang học giữ hue và nét liền/đứt, tăng độ sáng chỉ trong HTML ở chế độ đêm; không lọc canvas hoặc ảnh.

## Kiểm tra thực tế

- **14/14 ngữ cảnh PASS**: 320/375/390/430/768/1024/1440 px × sáng/tối; Chromium headless/SwiftShader. Trong mỗi ngữ cảnh mở thật vector_sum (liên tục), charge_quantization (rời rạc) và ray_slab (quang học); đổi VI/EN và kiểm câu chú giải tọa độ.
- Chữ, note, heading, summary, nhãn trục và ô bảng được đo từ computed foreground/background: nhỏ nhất **6,4367:1**. Tick và nét/điểm/trục/đường zero: nhỏ nhất **3,6283:1**. Đường và điểm trùng chính xác màu khóa chú giải tương ứng.
- Không tràn ngang hoặc lỗi JavaScript trong ma trận. Nhãn orientation và tooltip có bản dịch nguyên văn; không dùng thay chuỗi con trong nội dung người học.
- Follow-up 390 px: Enter mở bảng lý thuyết; thay góc giữ nguyên SVG và phần mở; ghi một dòng rồi đổi ngôn ngữ giữ snapshot đo; dự đoán chứa đúng câu nhãn vẫn giữ nguyên vì là nội dung tự viết.
- Đo swatch quang học từ pixel Canvas2D của computed CSS màu thực: nhỏ nhất **4,8324:1** trên nền đêm; nguồn hue, nét dashed/solid được giữ.

## Bằng chứng và giới hạn

`report.json`, `followup.json`, ảnh relation/optics ở 390/1440 sáng/tối. Hai ảnh đêm được xem trực quan, chữ/bảng/đồ thị có cùng bề mặt trung tính, không còn nền trắng lệch màu. Các harness ban đầu chọn core lens thay vì mô-đun quang học v65, và chờ chart trước khi stage vào viewport; sửa chỉ ở work harness, không coi đó là lỗi sản phẩm.

Kiểm ba loại đồ thị dùng chung không phải nghiệm thu độc lập cả 95 quan hệ, WCAG toàn bộ site hoặc phần cứng Safari/iPhone/Android. Node test chỉ xác minh dịch nguyên văn/whitespace và không dịch chuỗi con của văn bản tự viết.

## Bổ sung phản biện độc lập: swatch quang học chế độ sáng

QA độc lập phát hiện tia tới màu gốc `#d98220` trên trắng chỉ khoảng 2,93:1; phép đo graphics ban đầu của ma trận trên chỉ bao phủ SVG quan hệ, còn pixel swatch quang học mới đo chế độ tối. Đã sửa CSS **chỉ swatch HTML chế độ sáng** thành 95% màu nguồn + 5% đen, giữ hue, nét liền/đứt và toàn bộ canvas/renderer. Quy tắc đêm giữ nguyên.

Kiểm bổ sung **2/2 PASS** ở 390/1440 px sáng với ray_slab thật, cùng fixture CSS đủ sáu màu chuẩn của palette quang học (bao gồm phản xạ và ảnh ảo không xuất hiện trong trạng thái slab đang thử). Tia tới đạt **3,2178:1**; mọi swatch trong palette đều ≥3:1. Không lỗi JavaScript. `swatch-light.json` và `optics-light-final-{390,1440}.png` là bằng chứng cuối cùng sau sửa. Min 3,6283:1 bên trên là nhóm SVG quan hệ; min chung với swatch quang học sáng sau sửa là 3,2178:1.
