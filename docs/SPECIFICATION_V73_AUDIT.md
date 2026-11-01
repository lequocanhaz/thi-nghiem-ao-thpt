# Kiểm định tiếp đặc tả — 52 bài gốc còn lại (v73)

Mốc mã được kiểm: `f668fe2d6efc384543270790253ff1d1fd4085db`. Đợt C của đặc tả: 22 bài 009–030 và 30 bài 031–060, bổ sung sau tám bài lõi đã đối chứng ở v72. Không thay solver, renderer, ảnh, bảng số liệu, phiên người dùng hoặc giao diện.

## Đã kiểm

Hai agent Vật lí độc lập viết các oracle giải tích và rà soát chéo bộ kiểm của nhau. Bộ mechanics có 2.708 phép kiểm số, bộ discovery có 807, tổng 3.515 phép kiểm số mới cho 52 ID. Mỗi ID có ít nhất ba cấu hình xác định; bài có thời gian được kiểm thêm trạng thái đầu/giữa/cuối. Thử số cố định bổ sung bảo toàn động lượng, năng lượng, dấu của lực/dòng và các quy đổi SI. Không dùng ngưỡng sai số này cho solver số, Monte Carlo hoặc nghiệm thu sư phạm.

- [Oracle mechanics và số đếm từng ID](spec-v73/mechanics-report.json): chuyển động, lực, va chạm, dao động, sóng, mạch điện, từ và phóng xạ. Góc nhỏ của con lắc là xấp xỉ được công bố, không kiểm như nghiệm phi tuyến chính xác.
- [Oracle discovery và số đếm từng ID](spec-v73/discovery-report.json): rơi tự do, công/xung lượng, thủy tĩnh, quang, nhiệt, điện trở, cảm ứng, Lorentz và AC. Thử ảnh ở vô cực, tia sát góc giới hạn/TIR, hạt trung hòa, đổi dấu điện tích và cực tiểu vân.
- Chuyển đổi kiểm riêng: kPa·L = J, cm²→m², mm²→m², mg→kg, µC→C, nm/mm trong giao thoa; bảng giữ giá trị số thô và đơn vị theo đúng bài.

Các miền được đọc trước khi kết luận lỗi: beta tối đa 1,5 nhỏ hơn omega0 tối thiểu pi/2 trong bài dao động tắt dần; tốc độ chuyển động tròn có cận dưới dương. Không ép số hữu hạn vào ảnh ở vô cực hoặc biến một trạng thái ngoài miền điều khiển thành lỗi sử dụng hiện tại.

## Phát hiện còn mở

`damped.envelope` trả `a exp(-beta t)`, là hệ số suy giảm, **không phải biên bao nghiêm ngặt** của nghiệm có vận tốc ban đầu bằng 0. Với a=0,1 cm, T=4 s, beta=1,5 s^-1, t=1 s, |x| lớn hơn giá trị trường này; biên bao giải tích có thêm omega0/omegaD. Ca tái hiện và biên đúng được lưu trong oracle mechanics, mục `knownIssues` của báo cáo.

Trường hiện không được dùng ở bảng số, meter hoặc đồ thị của bài; x/v/năng lượng được kiểm đúng. Chưa đổi ngữ nghĩa API hoặc sinh lại 300 ảnh chỉ để đổi trường chưa hiển thị. Theo dõi **chờ làm rõ ngữ nghĩa**, không ghi “không còn lỗi” hoặc coi trường này là biên đúng. Việc chỉnh renderer/solver sau này phải có đánh giá độc lập và tái sinh preview theo quy trình hiện hành.

## Kiểm tra trình duyệt đại diện

QA độc lập **12/12 ngữ cảnh PASS**, 6 bài × 390/1440 px × 3 cấu hình = 36 trạng thái có đối chứng Python độc lập: damped, collision, refraction, lens, phasechange, lorentz. So sánh cả giá trị gốc của hàng đo và các ô bảng đang hiển thị, có quy đổi dấu thập phân VI và ký hiệu khoa học. Kiểm canvas, ghi ba dòng, đổi ngôn ngữ, reset/step và giữ số liệu; không tràn ngang hoặc lỗi JavaScript. Thời gian slider được lượng tử hóa theo step thực tế; kiểm kỳ vọng dùng snapshot thời gian thực đã ghi, không dùng chuỗi đã format làm số đầu vào.

Phát hiện **P2 còn mở**: ở lens sau khi đổi EN, một số nhãn vẫn tiếng Việt như “Khoảng cách ảnh”, “Chiều cao ảnh”, “Phát tia”, “Minh họa chậm”, “Nhập số”. Số liệu và trạng thái được giữ đúng; không tuyên bố đã hoàn thiện song ngữ.

[Báo cáo QA](spec-v73/browser-review.md) · [36 trạng thái và số liệu](spec-v73/browser-qa.json) · [Ảnh lens390](spec-v73/lens-390.png) · [Ảnh nóng chảy1440](spec-v73/phasechange-1440.png)

## Giới hạn nghiệm thu

Tracker `docs/spec-v72/coverage.json` chỉ nâng trạng thái kiểm số trong phạm vi các ca trên; tiêu chí cảnh, chương trình, sư phạm và thiết bị thật vẫn để chờ. Sau đợt này có đối chứng riêng cho 60/300 bài, còn 240 bài chưa có bộ đối chứng riêng ở chuỗi v72–v73. Các kiểm cũ toàn hệ thống vẫn giữ nguyên, không dùng số đếm kiểm tra để tuyên bố giáo viên đã ký duyệt.

Không đổi runtime trong đợt audit này. `npm run check` hoàn tất với mã thoát 0; bảo mật và bảo toàn banner cũng đạt. Kết quả GitHub CI và trạng thái hợp nhất được ghi trong PR. Kiểm Chromium giả lập không chứng nhận Safari/iPhone/Android thật.
