# Sửa đường bao dao động tắt dần và nhãn thấu kính v74

Bản sửa xử lý hai vấn đề đã ghi nhận trong [audit v73](SPECIFICATION_V73_AUDIT.md). Báo cáo v73 và các bằng chứng cũ vẫn giữ nguyên như lịch sử; trạng thái hiện tại được ghi ở đây và tracker 300 bài.

## Đường bao dao động tắt dần

Với nghiệm vận tốc đầu bằng 0, `x = a exp(−βt)[cos(ωd t) + (β/ωd) sin(ωd t)]`, biên bao đúng là `|a|ω0/ωd exp(−βt)`. Trước sửa, trường `envelope` chỉ trả `a exp(−βt)` và không chặn được mọi li độ. Trường nay dùng biên đúng; giá trị cũ được giữ với tên rõ nghĩa `decayCoefficient`.

Không đổi công thức tính x, v, gia tốc, năng lượng hoặc số liệu đo. Miền điều khiển hiện hành vẫn dưới tới hạn; không tuyên bố thêm hỗ trợ tới hạn hoặc quá tắt dần. Các đại lượng li độ/đường bao dùng cm, năng lượng giữ SI như trước.

Phản biện độc lập dùng dạng pha với `δ = atan2(β, ωd)`, không lấy công thức triển khai làm oracle: 108.108 trạng thái và 1.719 thời điểm tiếp xúc biên đạt; 540.540 giá trị t/x/v/acc/energy giữ nguyên bit. Bộ hồi quy mới có thêm 28.463 phép kiểm, gồm 1.575 trạng thái và 225 điểm tiếp xúc. Oracle v54/v73 được sửa đúng trường này, không bỏ các kiểm cũ. Baseline bảo toàn v64 giữ nguyên; các thay đổi được phép lưu tiền nhiệm, SHA chính xác, lý do và bộ kiểm trong manifest phản biện v74.

## Nhãn VI/EN của thấu kính

Bổ sung cặp nhãn chính xác cho khoảng cách ảnh, chiều cao ảnh, phát tia, minh họa chậm và “Nhập số ↗”, cùng tên truy cập liên quan. Dấu mũi tên là phần của nhãn đầy đủ, không dùng thay thế chuỗi mơ hồ hay regex dịch nội dung người học.

Một lỗi truy cập khác được tái hiện khi chuyển ngôn ngữ: chữ minh họa chậm đã đổi nhưng `aria-valuetext` của thanh tiến trình còn tiếng Việt. Đồng bộ có mục tiêu ngay trong sự kiện đổi ngôn ngữ; không gọi lại bộ giải, không tua thời gian, không dựng lại canvas và không xóa dữ liệu. Các giá trị cũng cập nhật đúng trong lần refresh tiếp theo.

Ghi chú/phiếu dự đoán, nội dung chat AI, số người học nhập và công thức không bị dịch lại. Không đổi hệ thống sách hoặc backend AI.

## Ảnh và bộ nhớ đệm

Tái xuất đủ 300 preview từ LabScene thật vào `previews/v74`, giữ các bộ ảnh cũ. Generator và manifest lưu nguồn, camera, trạng thái và SHA-256; guard mới kiểm đúng 300 ID và nguồn thực tế. Không sửa hash để bỏ qua bước tái xuất. Module thay đổi và chuỗi nhập liên quan dùng phiên bản 74 để không dùng mã cũ trong cache.

## Phạm vi nghiệm thu

Bản sửa chỉ đóng hai vấn đề phần mềm nêu trên trong các ca đã kiểm; không đóng phiếu giáo viên, thiết bị thật hoặc mọi yêu cầu của 300 bài. Kiểm Chromium/SwiftShader và phép tính CPU không chứng nhận phần cứng iPhone/Safari/Android.

- [Phản biện Vật lí](fixes-v74/physics-review.md) · [Kết quả độc lập](fixes-v74/physics-review.json) · [Hồi quy đường bao](fixes-v74/envelope-tests.json)
- Kết quả kiểm UI/QA, ảnh, CI và HTTPS được bổ sung trong PR phát hành khi hoàn tất.

## Phát hiện ngoài phạm vi còn mở

Rà soát UI còn thấy câu chú giải trục “Trục định hướng · không dùng để đọc số đo” chưa đổi EN và phần đồ thị quan sát có chú giải màu/nền chưa tối ưu trong chế độ đêm. Đây là các mục P2 khác hai lỗi gốc, được lưu trong tracker; không tuyên bố toàn trang đã hoàn thiện song ngữ hoặc đạt toàn bộ tiêu chí tương phản.

UI: 4/4 ngữ cảnh 390/1440 × sáng/tối đạt cho các nhãn mục tiêu, cộng 2/2 ca kiểm tên/giá trị truy cập ngay sau đổi ngôn ngữ, step và chỉnh tham số. Ghi số liệu, ghi chú và tải lại giữ trạng thái. [Ma trận UI](fixes-v74/ui-matrix.json) · [Truy cập](fixes-v74/ui-accessibility.json) · [Mobile](fixes-v74/lens-390-en.png) · [Desktop](fixes-v74/lens-1440-en.png).

## Kết quả QA độc lập

8/8 ngữ cảnh thấu kính/dao động tắt dần × 390/1440 px × sáng/tối đạt; 24 trạng thái được đối chiếu Python độc lập, 150 phép so sánh số đạt (sai số tuyệt đối lớn nhất khoảng 1,78×10⁻¹⁵). Thêm 2/2 ca xác minh tên/giá trị truy cập sau refresh. Đổi VI/EN, 2D/3D, reset, step và tải lại giữ bảng đo/ghi chép; không lỗi JavaScript hoặc tràn ngang trong phạm vi thử. [QA](fixes-v74/qa-review.md) · [Số liệu](fixes-v74/qa-report.json) · [ARIA sau refresh](fixes-v74/qa-accessibility.json).

Tái xuất đủ 300/300 ảnh thực tế thành công, nguồn ổn định, không lỗi; **300/300 tệp ảnh có byte giống bộ v65**, nên bản sửa không đổi hình ảnh đang quan sát. Snapshot v74 mới liên kết đúng nguồn khoa học đã sửa, giữ toàn bộ ảnh v65 và các phiên bản trước. [Đối chiếu preview](fixes-v74/preview-verification.json).

`npm run check` đã hoàn tất với mã thoát 0 trên bản sửa cuối; các kiểm bảo mật, nguồn/tài nguyên và bảo toàn banner đều đạt. Kết quả CI/triển khai và kiểm tra HTTPS trực tiếp được ghi ở PR phát hành.
