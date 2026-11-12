# Phiếu nghiệm thu sư phạm — pilot nhiệt lượng kế L3

**Trạng thái nghiệm thu giáo viên: NOT TESTED cho cả A và B.** Tài liệu này là kế hoạch, nội dung gợi mở và rubric để giáo viên sử dụng; chưa có chữ ký, thử nghiệm lớp học hay quan sát học sinh thực tế. Agent tự rà soát nội dung không được thay bằng nghiệm thu giáo viên.

Phạm vi: hai hoạt động mở rộng dưới **ID catalog hiện hữu `calorimetry`**: `ice` (A, nước–đá) và `solid` (B, nhiệt dung riêng vật rắn). Mô hình trộn hai lượng nước cũ được giữ riêng. Hai hoạt động không tạo thêm hai ID vào tổng 300 và chưa được coi là hai lab L3 đã PASS.

Nguồn yêu cầu: đặc tả QL-L3-SRS-001 và yêu cầu chủ dự án lưu tại `docs/level3-v84/source-request.txt`. `dist/l3/thermal-protocol.js` cung cấp giao thức VI/EN; không điền nhiệt độ cân bằng hoặc giá trị vật liệu tham chiếu khi học sinh vừa mở bài.

## Mục tiêu và đối chiếu sách hiện có

Các đường dẫn dưới đây lấy từ metadata `dist/books/catalog.json` (lớp 12, Kết nối tri thức). Đây là ánh xạ mục tiêu, không khẳng định nguyên văn thí nghiệm trong sách hoặc đã OCR trang quét. Không sửa 388 trang/85 bài mục lục.

| Hoạt động | Mục tiêu học tập | Bài và trang tệp hiện có | Phạm vi đối chiếu |
|---|---|---|---|
| A — Nước và đá | Nhiệt độ và nhiệt lượng; năng lượng chuyển thể; cân bằng khi tan hết hoặc còn đá | Bài 1: trang tệp 8, trang in 6; bài 2: tệp 12, in 10; bài 3: tệp 17, in 15; bài 5: tệp 26, in 24 | Dùng số đo và pha quan sát để lí giải; không gọi đây mặc định là đo nhiệt dung riêng vật rắn |
| B — Vật rắn và nước | Xác định nhiệt dung riêng bằng trao đổi nhiệt và đánh giá phép suy ra | Bài 2: tệp 12, in 10; bài 3: tệp 17, in 15; bài 4: tệp 22, in 20 | Cân/gia nhiệt/đo/chuyển vật bằng kẹp; không thay bằng thao tác đá tan |

Giáo viên cần xem trực tiếp các trang liên quan và xác nhận mức độ phù hợp với chương trình/lớp đang dạy. Việc ánh xạ metadata này chưa xác nhận hiệu quả sư phạm.

## Tiến trình A — nước và đá

1. Người học đặt bình, cân các lượng chất, rót lượng nước đã chọn và ghi điều kiện đầu thực sự trong bình.
2. Người học dự đoán ảnh hưởng của **lượng đá** tới đường nhiệt độ–thời gian và phần đá còn lại. So sánh riêng khác có thể thay **cường độ khuấy**; không đổi nhiều biến cùng lúc mà vẫn gọi là đối chứng.
3. Người học đưa đá qua miệng bình, phân biệt thả vào bình và thả trên bàn. Dụng cụ đo phải được nhúng đúng; số đo ngoài nước vẫn được lưu với trạng thái không hợp lệ.
4. Người học tự khuấy, tự đọc và nhập ít nhất năm thời điểm khác nhau. Tiêu chí dữ liệu phần mềm dùng các số đo cách nhau ít nhất một giây mô phỏng để năm lần bấm liên tiếp không bị coi là năm bằng chứng độc lập.
5. Người học tạo lượt mới, đổi một biến và ghi ít nhất hai thời điểm ở lượt đối chiếu; giáo viên có thể yêu cầu năm điểm ở cả hai lượt khi cần so sánh quá trình rõ hơn.
6. Người học dùng bảng/đồ thị và quan sát pha để kiểm tra dự đoán, tự lập cân bằng năng lượng nếu suy ra nhiệt nóng chảy riêng, rồi viết kết luận và giới hạn. Chỉ xuất kết quả sau khi có dữ liệu thật.

Biến độc lập được hỗ trợ: khối lượng đá; cách/cường độ khuấy trong phép đối chiếu riêng. Biến phụ thuộc: số chỉ nhiệt kế theo thời gian, nhiệt độ cuối và phần đá còn. Kiểm soát: khối lượng nước, nhiệt độ đầu nước/đá, nhiệt dung bình và điều kiện cách nhiệt. Nếu thay cách khuấy thì phải giữ cả lượng đá.

Các câu gợi mở phải để người học điều tra: “Nếu thả ra ngoài thì chất nào thực sự đã vào hệ?”, “Số chỉ khi rút đầu dò còn đại diện cho nước không?”, “Dữ liệu nào cho phép phân biệt quá trình đạt cân bằng và trạng thái cuối?”. Không hiện sẵn đáp án số hoặc kết luận rằng khuấy làm tăng nhiệt độ.

## Tiến trình B — nhiệt dung riêng vật rắn

1. Người học cân vật và nước, đo nhiệt độ nước đầu, gia nhiệt vật trong bể.
2. Người học tìm bằng chứng về nhiệt độ **vật ngay trước khi chuyển**. Không tự thay bằng nhiệt độ bể chỉ vì giao diện đang hiển thị nhiệt độ bể.
3. Người học dùng kẹp đưa vật qua miệng bình. Chuyển sai vị trí không được làm tăng khối lượng vật trong bình; chuyển chậm phải có điều kiện nhiệt tương ứng hoặc công khai mô hình không có tổn thất.
4. Người học nhúng đầu dò, khuấy, tự ghi tối thiểu năm thời điểm và giải thích vì sao chọn số đo cuối. Bảng phải giữ số nhập sai; không tự sửa số đo theo nghiệm lí tưởng.
5. Người học lập cân bằng năng lượng từ số đo của mình, lặp với khối lượng khác của cùng vật liệu hoặc nhiệt độ chuyển khác, kiểm soát các điều kiện còn lại.
6. Người học so sánh các giá trị suy ra và thảo luận nhiệt dung bình, vật nguội trong lúc chuyển, độ trễ đầu dò, đọc quá sớm hoặc tổn thất nhiệt.

Vật liệu tham chiếu/giá trị nhiệt dung riêng dùng trong solver hoặc oracle không được trở thành đáp án điền sẵn ở chế độ thực nghiệm/đánh giá. Công cụ tính chỉ được dùng số liệu người học cung cấp và phải phản hồi khi mẫu số hoặc điều kiện nhiệt không hợp lệ.

## Rubric giáo viên

Mức dùng cho từng tiêu chí: **0** = chưa có bằng chứng hoặc lí giải sai chưa sửa; **1** = có bằng chứng một phần nhưng còn nhầm lẫn/thiếu kiểm soát; **2** = dùng được dữ liệu, trình bày được lí do và nêu giới hạn phù hợp. Không cộng điểm theo số lần bấm hoặc độ dài đoạn văn. Chỉ giáo viên sau khi xem sản phẩm học sinh mới ghi mức; tất cả ô hiện tại là NOT TESTED.

| Hoạt động | Tiêu chí | Bằng chứng cần xem | Mức/biên bản hiện tại |
|---|---|---|---|
| A | Thiết kế đối chứng | Một biến thay đổi rõ ràng; nước, nhiệt độ đầu, bình được kiểm soát hoặc sai lệch được thảo luận | NOT TESTED |
| A | Đo và quan sát pha | Tự đọc số chỉ đúng vị trí, chờ đáp ứng; phân biệt còn đá/tan hết, giữ điểm không hợp lệ với lí do | NOT TESTED |
| A | Lí giải | Dùng dữ liệu và quan sát pha kiểm tra dự đoán; phân biệt nhiệt nóng chảy riêng với nhiệt dung riêng | NOT TESTED |
| A | Sai số/giới hạn | Nhận diện ít nhất một vấn đề cụ thể và đề xuất kiểm tra lại | NOT TESTED |
| B | Đúng mục tiêu thí nghiệm | Cân/gia nhiệt/chuyển vật bằng kẹp; đo nhiệt dung riêng vật rắn | NOT TESTED |
| B | Nhiệt độ đầu và cuối có căn cứ | Phân biệt vật và bể; giải thích lựa chọn số đo cuối từ chuỗi nhiệt độ | NOT TESTED |
| B | Suy ra từ số đo | Cân bằng năng lượng, khối lượng và nhiệt độ tự ghi; so sánh hai lượt thay vì đọc đáp án có sẵn | NOT TESTED |
| B | Đánh giá độ tin cậy | Thảo luận đọc sớm, nhiệt dung bình, nhúng sai, nguội khi chuyển hoặc mất nhiệt | NOT TESTED |

## Điều kiện bằng chứng tự động và ranh giới của chúng

`evaluateEvidence(activity, session)` chỉ trả điều kiện dữ liệu và `readyForTeacherReview`; **luôn** giữ `teacherReview: 'NOT TESTED'`. Hàm không thay đổi dữ liệu, không tự cho điểm và không đánh dấu cổng L3 PASS.

- Chỉ tính số đo `method: 'manual'`, `valid: true`, không có lí do loại; `unit: 'K'`, giá trị đo và giá trị học sinh nhập hữu hạn, không âm. Giá trị K là dữ liệu chuẩn; giao diện có thể hiển thị °C. Không yêu cầu số tự ghi trùng số chỉ dụng cụ vì đọc nhầm cần được giữ để phân tích.
- Nhật kí phải có sự kiện đã được mô hình chấp nhận: đặt bình, rót khối lượng dương vào bình, thêm đá dương vào bình (A) hoặc đưa vật rắn vào nước (B). Lượt đối chiếu cũng cần tác động riêng. Sự kiện gốc đã bị hoàn tác (`undone: true`) không được tính vào bằng chứng bố trí/đưa mẫu; redo chỉ có hiệu lực khi sự kiện được khôi phục thực sự. Chỉ đo nước không có mẫu hoặc đếm click không đạt điều kiện tác động. Dùng cân được báo cáo riêng; nhật kí đặt lên cân chưa chứng minh học sinh đã đọc/ghi khối lượng.
- Chuỗi điều tra chỉ dùng số đo có nguồn đầu dò trong **nước**, sau khi mẫu đã được đưa vào, với snapshot điều kiện còn khớp trial. Số đo bể/vật rắn và số đo nước trước can thiệp vẫn được giữ để xác lập nhiệt độ đầu, nhưng không thay thế đường đo trao đổi nhiệt. Không cộng lẫn điểm trước/sau đổi lượng chất hoặc điều kiện giữa lượt. Nếu rót thêm sau khi mẫu đã bắt đầu trao đổi nhiệt, cờ `setupChangedDuringExchange` chặn suy luận đối chiếu mẻ đơn giản cho cả lượt; dữ liệu vẫn giữ nguyên để thảo luận, nhưng cần tạo lượt mới cho đối chiếu này.
- Có một chuỗi ít nhất năm thời điểm, cách nhau ít nhất một giây mô phỏng. Số lần click và trace tự động không đáp ứng điều kiện này.
- Lượt đối chiếu khác có ít nhất hai thời điểm tự ghi hợp lệ; thay biến khối lượng đá/cách khuấy cho A hoặc khối lượng/nhiệt độ chuyển vật cho B, kiểm tra các biến kiểm soát trong `conditionsSI`.
- Dung sai so sánh điều kiện phải được công khai, không dùng để chỉnh số đã ghi: khối lượng 0,001 kg; nhiệt độ nước/vật 0,2 K, đá 0,1 K; nhiệt dung bình 10⁻⁶ J/K; cường độ khuấy 0,02. Những giá trị này là tiêu chí so sánh dữ liệu, không phải bằng chứng thiết bị thực có cùng độ phân giải. Cần đối chiếu với cấu hình dụng cụ đã phát hành.
- Có trường dự đoán/phân tích/kết luận của người học. Kiểm tra trường không rỗng **không chứng minh** dự đoán được viết trước thí nghiệm, quyền tác giả hoặc lập luận đúng. Thời điểm viết cần nhật kí đáng tin và giáo viên quan sát; không được biến dấu kiểm này thành “đã đạt năng lực điều tra”.
- `conditionsSI` phải phản ánh lượng chất thực sự tham gia trao đổi và nhiệt độ trước tác động, không dùng cấu hình cốc/khay chưa được đưa vào bình để khẳng định đã làm thí nghiệm.

## Checklist nghiệm thu độc lập còn phải làm

| Mục | Cách kiểm tra thực tế | Trạng thái |
|---|---|---|
| Câu hỏi, thuật ngữ VI/EN và mục tiêu A/B phù hợp | Giáo viên đối chiếu chương trình và đọc giao thức | NOT TESTED |
| Không lộ đáp án ngay khi mở | Mở cả ba chế độ, nhất là thực nghiệm/đánh giá; kiểm biến tham chiếu vật liệu | NOT TESTED |
| Học sinh tự bố trí và thao tác có nhân quả | Quan sát một học sinh hoặc giáo viên chạy quy trình đúng và quy trình sai | NOT TESTED |
| Người học phân biệt trạng thái thật/số chỉ/số ghi | Cố ý nhúng sai, chưa chờ đáp ứng và nhập lệch; xem sổ tay và phản hồi | NOT TESTED |
| Có hai điều kiện tan hết/còn đá ở A | Học sinh tự chọn điều kiện và giải thích dữ liệu, không xem oracle trước | NOT TESTED |
| Có lượt lặp có kiểm soát và kết luận dựa dữ liệu | Xem hai trial, đồ thị, phép tính, bản CSV/JSON và kết luận | NOT TESTED |
| Có thử thao tác bàn phím/chuột/cảm ứng | Quan sát thao tác trên thiết bị đại diện, nêu thiết bị/browser/phiên bản | NOT TESTED |
| Giáo viên phản hồi và người học có thể sửa kết luận | Lưu nhận xét/phiên bản nhận xét và sản phẩm sửa, không xóa dữ liệu cũ | NOT TESTED |

Thông tin biên bản khi thực sự thử: commit/model version; ngày; hoạt động/chế độ; thiết bị và trình duyệt; người nhận xét theo vai trò/định danh tối thiểu; đường dẫn phiên/screenshot nếu được phép; từng mục đạt/chưa đạt; vấn đề cần sửa. Không ghi sẵn tên giáo viên, chữ ký, trường hoặc PASS giả.

## Ghi chú oracle chỉ dành cho kiểm định, không đưa lên màn hình mở đầu

N-01 trong tài liệu dùng 29,100 °C là **số làm tròn**, không phải nghiệm thập phân chính xác. Với dữ kiện đã cho, phép tính độc lập là `(0,20×4180×40 − 0,020×334000) / ((0,20+0,020)×4180)` ≈ 29,0996085254 °C. Không đổi công thức để khớp đúng 29,100 ở mọi chữ số.

N-02: đá còn `0,10 − (0,20×4180×20)/334000` ≈ 0,0499401198 kg ở 0 °C. Các con số này là ca kiểm định mô hình, không là dữ liệu học sinh hoặc đáp án tự điền. B cần oracle độc lập theo tham số vật rắn và điều kiện chuyển thực tế; “mô hình giữ c tham chiếu” không chứng minh người học đã đo được c.

Bằng chứng test phần mềm, physics oracle, browser và thiết bị phải được báo cáo riêng ở các báo cáo kỹ thuật tương ứng. Phiếu này vẫn NOT TESTED cho đến khi có nghiệm thu giáo viên thật.
