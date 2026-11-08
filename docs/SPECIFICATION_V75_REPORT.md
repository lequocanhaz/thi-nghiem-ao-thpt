# Đặc tả — chú giải, đồ thị quan sát và 61 quan hệ nền tảng v75

Mốc đối chiếu: `5f9149f8b07a240bd2c959b216f1908cc2b643b8`. Đợt này sửa hai P2 còn mở trong v74 và thực hiện đối chứng số học của nhóm D theo đặc tả. Phạm vi nhóm được lấy đúng từ `experiments.slice(60).filter(e => e.extra !== true)` (61 ID), không lấy tùy tiện các STT 061–121.

## Sửa thực tế

- Bổ sung cặp dịch chính xác của câu “Trục định hướng · không dùng để đọc số đo” và hướng dẫn liên quan. Chuyển VI/EN giữ nguyên mô hình, tham số, ghi chép và bảng đo; không dịch nội dung người học hoặc hội thoại AI.
- Ghép màu nền/chữ của `#conceptObservation`, chú giải, số trục, số đọc và bảng lý thuyết trong chế độ đêm. Nền trắng cố định theo ID trước đây đè theme được thay bằng cặp màu theo vùng đọc.
- Dùng xanh sáng cho đường lý thuyết và cam sáng cho điểm trạng thái hiện tại trong chế độ đêm; biểu tượng chú giải khớp chính xác với đường/điểm. Giữ cách mã hóa bằng hình đường và điểm, không chỉ dựa vào màu.
- Ghép nền/chữ của tiêu đề bảng cố định, hàng bảng, chú thích và focus. Đường mốc 0 ban ngày cũng được tăng tương phản. Các swatch chú giải quang học chỉ sáng hơn trong HTML đêm, giữ hue và nét đứt; không đổi tia hay ảnh trong canvas.

Chỉ đổi CSS theo vùng và cặp dịch; không sửa solver, renderer, số liệu, schema phiên, ảnh, sách hoặc backend. Kiểm provenance của 300 preview v74 vẫn đạt trên nguồn hiện tại; không cần tái xuất vì không có nguồn dựng hình thay đổi.

## Đối chứng số học độc lập

Hai agent Vật lí chia đúng 31 + 30 ID và phản biện chéo. Nhóm A có 306 ca, 2.979 so sánh; nhóm B có 2.510 so sánh. Tổng **5.489 so sánh số mới**, mỗi ID có tối thiểu ba cấu hình, thêm mốc số literal, ca biên/đối xứng và đối chiếu thứ tự–giá trị thô từng cột bảng. Reference dùng định luật/cân bằng và SI riêng, không gọi helper công thức của sản phẩm.

- [Nhóm A](spec-v75/physics-a.md) · [Số liệu A](spec-v75/physics-a.json)
- [Nhóm B và phản biện A](spec-v75/physics-b.md) · [Số liệu B](spec-v75/physics-b.json)
- [Phản biện B](spec-v75/physics-a-cross-review-b.md)

Không coi việc công thức đại số khớp là mọi lựa chọn thiết kế đều hiện thực được. **voltmeter_design còn lỗi miền vật lí đã tái hiện**: Umax=0,1 V, Ig=10 mA, Rg=1.000 Ω đều thuộc miền điều khiển, nhưng cần điện trở phụ −990 Ω và mô hình chưa đánh dấu không hợp lệ. Vôn kế điện trở phụ thụ động cần Umax ≥ Ig Rg = 10 V ở cấu hình này. Không sửa bằng kẹp về 0 Ω, không coi điện trở âm là thiết kế hợp lệ. ID này được ghi PARTIAL/mở vấn đề miền; đợt này chưa sửa solver hoặc khóa phụ thuộc các biến.

Tracker giờ có đối chứng riêng cho 121/300 ID; 120 ID có các ca reference đạt và một ID còn vấn đề miền nêu trên. Vẫn còn 179 ID chưa có bộ đối chứng riêng trong chuỗi v72–v75. Đây không phải nghiệm thu toàn cảnh, mọi miền, giáo viên hoặc thiết bị thật.

## Kiểm chứng và phần còn lại

Kết quả kiểm UI/QA, kiểm tổng và triển khai được cập nhật sau khi hoàn tất, không mặc định từ mã nguồn. Kiểm trình duyệt dùng Chromium giả lập; chưa thử phần cứng Safari/iPhone/Android hoặc ký duyệt của giáo viên. Các yêu cầu S2 cảnh, S3 tương tác đặc thù, chương trình/YCCĐ và sư phạm của từng phiếu vẫn giữ trạng thái riêng; không nâng tất cả thành đạt vì có kiểm số.

## Rà soát UI độc lập

14/14 ngữ cảnh đạt tại 320, 375, 390, 430, 768, 1024 và 1440 px × ngày/đêm. Mỗi ngữ cảnh kiểm đồ thị liên tục, điểm rời rạc và chú giải quang học; câu chú giải định hướng chuyển EN/VI chính xác. Mẫu chữ thấp nhất 6,44:1; đồ họa SVG có ý nghĩa thấp nhất 3,63:1; swatch tia quang học đo qua pixel có tương phản thấp nhất 4,83:1. Đường/điểm khớp màu với biểu tượng chú giải, giữ nét liền/đứt và hình chấm. Không tràn ngang hoặc lỗi JavaScript trong phạm vi này.

Kiểm thêm bàn phím Enter mở bảng lý thuyết, cập nhật điểm giữ nguyên SVG và trạng thái mở, đổi tham số/ghi số liệu/VI–EN giữ hàng đã ghi. Câu hướng dẫn nguyên văn trong trường học sinh viết không bị dịch. [Rà soát](spec-v75/ui-review.md) · [Ma trận](spec-v75/ui-matrix.json) · [Tương tác](spec-v75/ui-followup.json) · [Đồ thị đêm390](spec-v75/relation-390-dark.png) · [Chú giải quang học đêm390](spec-v75/optics-390-dark.png).

QA độc lập phát hiện thêm swatch tia tới HTML ban ngày có tương phản 2,93:1. Đã làm tối riêng swatch HTML ban ngày 5%, giữ hue và nét; không đổi canvas. Kiểm lại 390/1440 px và đủ sáu màu palette đạt, mức thấp nhất 3,22:1; quy tắc màu đêm vẫn giữ nguyên. Đây là kiểm bổ sung sau ma trận ban đầu, không coi phép đo đêm thay thế kiểm ngày. [Màu sáng](spec-v75/ui-swatch-light.json) · [Ảnh sáng390](spec-v75/optics-390-light.png).

## QA độc lập và kiểm tra tổng cuối

Ma trận QA ban đầu có 20 ngữ cảnh, 18 đạt và hai thất bại: bộ chờ canvas cũ chưa nhận đúng trạng thái khởi động lạnh; nét HTML quang học ban ngày thiếu tương phản. Sau chỉnh bộ chờ và sửa màu đã mô tả, kiểm lại bốn ngữ cảnh vector_sum/ray_slab ×390/1440 px ban ngày đều đạt trên nguồn ổn định. Tổng hợp bao phủ đủ20 ngữ cảnh, không lỗi JavaScript; không gọi đó là một lượt20/20 trên cùng nguồn bất biến. Giữ nguyên báo cáo gốc để không che các thất bại ban đầu.

[Phạm vi tổng hợp](spec-v75/qa-summary.json) · [Ma trận ban đầu](spec-v75/qa-initial.json) · [Kiểm lại cuối](spec-v75/qa-followup.json)

Kiểm thao tác gồm mở bảng bằng bàn phím, đổi VI/EN/VI, giữ nguyên hàng đo và ghi chép tự viết, tải lại giữ dữ liệu, đối chiếu màu đường/điểm với chú giải và không tràn ngang. Kiểm mẫu không thay thế chứng nhận WCAG hoặc thiết bị thật.

`npm run check` cuối hoàn tất tới bước relay với mã thoát0. Log mới hơn nguồn CSS cuối; kiểm tra dịch thuật, hai nhóm đối chứng nền tảng, bảo mật, banner và300preview được chạy lại khi hoàn tất, đều đạt. Không thay solver, renderer hoặc ảnh; CI và kiểm HTTPS sau phát hành được ghi trong PR.
