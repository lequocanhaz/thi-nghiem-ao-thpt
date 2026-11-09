# Quanh Lab v77 — thư viện gọn hơn, ưu tiên hoạt động quan sát

Ngày bàn giao: 09/11/2026. Nhánh: `feat/curated-library-v77`.

## Thay đổi thực tế

Theo yêu cầu mới của chủ dự án, trang chủ ưu tiên **40 thí nghiệm chính** thay vì giới thiệu cả 300 mục ngang nhau. **260 bài còn lại** nằm trong kho bổ trợ mở theo yêu cầu. Đây là quyết định biên tập phạm vi nhập môn, không phải kết luận rằng 260 bài đều sai hoặc 40 bài đã được nghiệm thu toàn diện. Yêu cầu mới thay thế ràng buộc cũ về số lượng bài phải xuất hiện ở thư viện chính; nguồn khoa học và dữ liệu cũ vẫn được bảo toàn.

- Bộ chính bao phủ cơ học (11), dao động/sóng (8), điện học (8), quang học (4), nhiệt học (4), điện từ/hạt nhân (5). Không thêm bài chỉ để đạt một chỉ tiêu số lượng.
- Mặc định chỉ tìm trong bộ đang chọn. Nếu không có kết quả nhưng kho bổ trợ có bài phù hợp, có nút tìm tiếp ở kho đó; từ khóa và bộ lọc được giữ.
- Bộ chọn được lưu trong URL `?collection=archive`; Back/Forward và các URL cũ vẫn hoạt động. Bộ lọc chỉ hiện các chủ đề có bài trong bộ, trừ chủ đề đang lọc cần giữ để người học bỏ lọc.
- Đã lưu/Gần đây và tuyến khảo sát truy cập được bài của cả hai bộ. Số đếm cá nhân phản ánh các kết quả hiện tại. Phiên, thông số, bảng đo, ghi chép và dữ liệu nhập/xuất dùng nguyên schema cũ.
- Trang bài bổ trợ có nhãn gọn và đường về thư viện chính. Sáu chuyên đề có liên kết tới bài nhập môn liên quan; không tuyên bố chức năng của chúng đã được tích hợp vào bài chính.
- 10 bài có hạn chế cụ thể được ghi rõ trên thẻ, trong lab và trang nội dung tĩnh. 250 bài bổ trợ khác không bị gắn nhãn hỏng khi chưa có bằng chứng.
- Thanh kéo tham số tổng quát trong sân 3D mặc định tắt ở phiên mới. Vẫn có công tắc bật lại, ô nhập số và kéo trực tiếp các đối tượng được hỗ trợ. Lựa chọn hiển thị đã lưu trước đó được giữ.
- Quan hệ lý thuyết phụ mặc định gập; mở theo nhu cầu, giữ lựa chọn khi đổi tham số/ngôn ngữ. Bảng đo, đồ thị dữ liệu và chú giải tia của 11 mô hình quang chuyên biệt không bị gỡ.
- Cập nhật giới thiệu, metadata và danh mục tĩnh để phản ánh bộ chính nhỏ hơn. Canonical, DNS, thương hiệu, banner hố đen, ảnh xem trước gốc và sách không đổi.

## Audit và quyết định

Rà soát Vật lí và trực quan độc lập đã được thực hiện bởi `curation_physics77` và `curation_visual77`. Agent QA `curation_qa77` kiểm tra trình duyệt sau tích hợp. Báo cáo nguồn không phải nghiệm thu giáo viên hoặc kiểm thử phần cứng.

- [Danh sách đủ 300 ID và phân loại cuối](selection.json): 40 chính + 250 bổ trợ + 10 cần hoàn thiện.
- [Rà soát Vật lí](physics-review.md): đề xuất ban đầu 40/258/2, lý do chọn và phân biệt các mục tiêu liên quan. Tám hạn chế hình mạch được bổ sung từ rà soát trực quan sau đó.
- [Rà soát trực quan](visual-review.md): xem 160 ảnh gốc, mở/chạy ngắn 8 bài desktop và 3 bài mobile Chromium. Không dùng việc chưa được kiểm thử để gọi bài hỏng.

| Ưu tiên | Vấn đề xác nhận | Cách xử lý trong v77 | Còn lại |
| --- | --- | --- | --- |
| P1 | Hình mạch dùng chung không diễn tả đủ cấu trúc của 8 bài: potentiometer, voltage_divider, kirchhoff_loop, diode_model, meter_loading, max_power, battery_series, battery_parallel | Đưa khỏi bộ mặc định, ghi hạn chế hình rõ ràng | Cần dựng đúng linh kiện/cực tính/cách mắc; chưa sửa renderer |
| P1 | voltmeter_design có tổ hợp UI hợp lệ cho điện trở phụ −990 Ω, thiếu kiểm tra tính khả thi | Không đưa vào bộ chính; cảnh báo rõ miền không thể thiết kế bằng điện trở phụ thụ động | **Chưa sửa solver hoặc miền tham số**. `limit` cũ vẫn nói điện trở phụ dương trong toàn miền và cần được sửa cùng mô hình, kiểm thử độc lập |
| P2 | deBroglie có công thức bước sóng nhưng hình chỉ đổi kích thước cụm hạt | Không đưa vào bộ chính; cảnh báo không suy bước sóng từ kích thước hình hạt | Cần biểu diễn sóng và quan hệ bước sóng–động lượng đúng |
| P2 | Các ray kéo tham số phụ không nhãn dễ bị hiểu là dụng cụ | Tắt mặc định ở phiên mới, giữ công tắc | Người đã lưu bật ray vẫn giữ lựa chọn cũ |
| P2 | Nhiều lớp thông tin và quan hệ lý thuyết làm phần quan sát dài | Gập quan hệ phụ, thu gọn nhãn bài bổ trợ, chủ đề không có bài không hiện | Cần tiếp tục rà soát sân điện trường và vị trí nhãn tại các pha đặc biệt |

Giữ `gas` và `decay`: chúng có mô hình riêng. Chấm khí minh họa xu hướng, không đếm phân tử thật; số đọc phân rã là kỳ vọng và hạt 3D là mẫu minh họa. Điều kiện mô hình gốc vẫn được giữ.

## Thiết kế và kiến trúc

Dùng lại font, typography, bo góc, bảng màu trung tính và các token hiện có `--ux-*`, `--catalog-*`. Nút chọn bộ có vùng bấm tối thiểu 46 px, trạng thái `aria-pressed`, focus rõ, dòng mô tả ngắn và số lượng thật. Kho bổ trợ không tranh ưu tiên với bộ mặc định; cảnh báo quan trọng hiện trực tiếp.

`dist/library-selection-v77.js` là lớp biên tập độc lập với `experiments`, mô hình tính và renderer. Thay đổi bộ ưu tiên không cần xóa bài, sửa phương trình hoặc tạo lại ảnh. `selectionInfo` tách bài chính, bài bổ trợ có mục tiêu liên quan và bài có hạn chế đã xác định. Danh mục tĩnh được sinh từ cùng lớp này, vẫn giữ 300 URL và sitemap 305 URL. Ngữ cảnh frontend gửi tới trợ lý có thêm số lượng/bộ ID chính; chưa kiểm chứng câu trả lời AI thực sau thay đổi này.

Tệp chính thay đổi: `dist/app.js`, `views.js`, `language-ui.js`, `observation-view.js`, `boot.js`, `index.html`, hai trang giới thiệu, danh mục và 10 trang nội dung có cảnh báo; module/CSS chọn bộ mới; generator danh mục; kiểm thử Node/DOM/Playwright và tài liệu này. Không thay mô hình, công thức, âm thanh, ảnh xem trước hoặc dữ liệu sách.

## Kiểm thử

- Chromium 154/SwiftShader: **18/18** trường hợp chọn bộ đạt, đủ 320/375/390/414/430/768/1024/1440/1920 px × sáng/tối, cùng **4/4** luồng sâu. Duyệt đủ hai bộ có 300 ID duy nhất, không giao nhau; tìm từ khóa chỉ có ở kho bổ trợ, URL/Back/Forward, phiên cũ và Đã lưu/Gần đây.
- Thêm **4/4** luồng sâu đạt với kiểm tra trực tiếp tiền tố liên kết có dấu hai chấm và nhãn optgroup EN/VI ở 390/1440 px; giữ thông số, bảng đo, ghi chép. Cả ba lượt không ghi nhận lỗi JavaScript/HTTP, hash mã nguồn đầu/cuối giữ nguyên; tổng 26 lượt thực thi (18 chọn bộ, 4 luồng sâu và 4 luồng sâu bổ sung).
- Quan hệ phụ mặc định gập, giữ lựa chọn mở qua VI/EN; chú giải tia `ray_slab` vẫn mở. Thanh kéo phụ tắt ở phiên mới, bật bằng công tắc và khôi phục đúng lựa chọn đã lưu sau reload.
- [Báo cáo trình duyệt](browser-report.json), [kiểm tra song ngữ bổ sung](browser-locale-report.json), [các viewport bổ sung](browser-widths-report.json), [review QA độc lập](qa-review.md).
- Review AI độc lập: fixtures offline Gemini/OpenAI giữ được metadata bộ chính, không gọi mạng. Context thư viện 1.244 ký tự; mẫu 12 dòng đo lớn nhất được thử là 7.443 ký tự, dưới giới hạn 40.000. `selectionPolicy` chỉ là ngữ cảnh, không bảo đảm hành vi trả lời của AI thật.
- `node checks/library-selection-v77.mjs`, kiểm tra security và bảo toàn banner đã đạt. **`npm run check` cuối đã đạt (exit 0)**, gồm Node/DOM, 300 route, phương trình, hình học, phiên, sách, assets, AI fixtures và relay. Bộ kiểm tra vẫn bảo toàn 300 ID, 388 trang sách, 85 bài mục lục và 301 audio; đây không phải xác nhận chất lượng toàn bộ 300 mô hình.

## Ảnh trước/sau

Ảnh trước chụp production v76 trước triển khai; ảnh sau chụp nhánh v77 bằng Chromium. Không thay ảnh thí nghiệm nguồn.

| Viewport | Trước | Sau |
| --- | --- | --- |
| 390 px, tối | [Trước](screenshots/before-390-dark.png) | [Sau](screenshots/after-390-dark.png) |
| 1440 px, sáng | [Trước](screenshots/before-1440-light.png) | [Sau](screenshots/after-1440-light.png) |

[Kho bổ trợ](screenshots/archive-1440-light.png) · [Bài bổ trợ mobile](screenshots/supplementary-390-dark.png).

## Việc chưa nghiệm thu và hướng tiếp theo

- Chưa kiểm thử iPhone/Safari thật, Android thật, bàn phím ảo hoặc lớp học với giáo viên/học sinh.
- Chưa tái thiết kế đầy đủ 10 bài có cảnh báo; chưa chứng nhận khoa học/UX cho toàn bộ 40 hoặc 300 bài.
- Các vấn đề quang học nhìn iso nhỏ, lớp đường sức/lưới điện trường và nhãn M/A/H chồng ở pha đặc biệt vẫn là việc tiếp theo.
- Đợt này không triển khai backend AI, OAuth, tài khoản hoặc thanh toán; không thêm analytics hay thu dữ liệu cá nhân.
- Để chuyển giao thương mại: nghiệm thu từng hoạt động trong bộ chính với tiêu chí quan sát–thao tác–đo–giải thích, thử lớp học, sửa mô hình có hạn chế bằng oracle độc lập và hoàn tất kiểm kê quyền sử dụng từng tài nguyên. Không lấy số lượng bài làm chỉ số chất lượng.
