# Quanh Lab — hoàn thiện các khoảng trống UI/UX v81

Ngày11/11/2026. Tiếp tục đặc tả UI/UX Phase01 do chủ dự án cung cấp, trên main909ff94; giữ phần header/nhận diện đã đạt ởv80. Agent ui và qa kiểm lại các mục chưa được chứng minh thay vì coi mọi yêu cầu trong Word là lỗi.

## Vấn đề đã tái hiện và xử lý

| Mục | Bằng chứng trước sửa | Thay đổi |
|---|---|---|
| LAB07 / AC07 | Ohm320/390/768 chọn đồ thị “Trạng thái đã ghi” khi0rows chỉ hiện trục/chú giải mặc định, không giải thích | Đồ thị phân biệt chưa có điểm, dòng thuộc chế độ khác và không có cặp số hữu hạn; có hành động ghi điểm thật, không dựng trục số khi chưa có dữ liệu |
| LAB07 / AC06 / AC11 | Tên trục dài dễ cắt; Ohm720 có chữ trục y vượt mépSVG2px, stress chữSVG làm trầm trọng hơn | Đưa tên trục/đơn vị ra HTML tự xuống dòng ngoài vùng clipSVG; sốtick, miền, tọa độ, điểm và hồi quy giữ nguyên. Hiện giá trị/đơn vị của điểm được chọn, hoặc điểm duy nhất |
| UX02 / UX04 | Tăng chữHTML×2 tại320 làm icon/nhãn toolbar chen nhau dù khung nút không tràn | Xếp icon trên chữ, cho nhãn xuống dòng, đo chiều cao thanh bằng ResizeObserver; reserve khoảng đáy/toast theo chiều cao thật. Không quan sát mỗi lần SVG đổi |
| UX07 / AC07 | Ảnh sách lỗi ở320×568: thông báo/nútThử lại nằm y991–1103 dưới vùng trống | Giữ cùng node cảnh báo/nút, đưa cạnh vùng trang sách; cuộn tới thông báo chỉ nếu ngoài viewport. Giữ trang/zoom đã tải khi thay trang lỗi |
| UX08 / AC08 | Gửi ởOhm rồi chuyển library trước503: lỗi chỉ hiện ở ngữ cảnh đang xem, trở vềOhm không có hướng thử lại | Lưu lỗi vào thread gốc, giữ draft/ảnh; phản hồi của bài trước không ghi đè thông báo của bài hiện tại |
| UX08 | AI trên kệ sách ghi “Thư viện thí nghiệm”; VI→EN lúc chat mở có thể còn nhãnVI do thứ tựlistener | Nhãn/gợi ý kệ sách đúngVI/EN; render sau các listener ngôn ngữ đồng bộ |
| AC08 / điều hướng | Chuyển tài liệu hoàn toàn có thể làm mất Map hội thoại/draft/ảnh. Cả nhấnbrand hoặc linkkệ sách đang chọn cũng có thể reload | Khi có nội dungAI, liên kết cùngtab dẫn tới tài liệu khác/reload hỏiỞ lại/Mởởtabmới/Chuyểnởtabnày. Không chặn SPAhash, link_blank, download, modifierclick hoặc link đã được xử lý nội bộ |

## Quyết định phạm vi

Đặc tả loại trừ thay đổi backend/cơ chế lưu trữ. Bản này **không thêm lưu trữ hội thoại**. Hộp điều hướng nói rõ chat/draft/ảnh/phản hồi chờ chỉ thuộc trang hiện tại; mởtabmới giữ nguyên tài liệu nguồn và yêu cầu đang chờ. Chat ở trang đích độc lập. Không tuyên bố đồng bộ hoặc phục hồi sau reload/Back tạo tài liệu mới. NútChuyểnởtabnày là lựa chọn có chủ ý sau giải thích.

Chỉ thay UI ở ranh giới hiển thị dữ liệu: `graph-feedback-v81.js`, CSS; không sửa `analytics.js`, `plot-grid.js`, solver, giá trị đo, domain hoặc schema bảng. CTA dùng hàmGhiđiểm hiện có; nếu không có trạng thái hợp lệ thì bị vô hiệu hóa. Khi bàn phím kích hoạt CTA, focus chuyển tới điểm thật mới hoặc hành động phục hồi còn phù hợp.

## Kiểm thử và trách nhiệm

- Agent ui: tái hiện graph-empty/textresize; sửa toolbar+insets và CSSempty. Kiểm320/390 chữ×2 và landscape; thanh~110px được reserve110px, ẩn khi nhập/chat thì inset0, đổi route disconnect observer cũ.
- Agent textbook: sửa cảnh báo sách; Node và6caChromium gồm320×568/390dark/844×390/768/1440dark/chữ×2 đều đạt. RetryEnter chỉ báo thành công sau tải ảnh, giữ trang25. Kiểm qua lại OhmU9/1row ↔ sách42 giữ dữ liệu/position.
- Agent ai: sửa nhãn kệ sách và lỗi thread gốc; Node/Chromium xác nhận locale đang mở, draft/ảnh và context yêu cầu. Rà guard chỉ đọc: Stay/newtab giữ pending và ảnh, phản hồi về đúngOhm; draftMap cũ của ô đã xóa không gây cảnh báo giả.
- Agent qa: browser-ui-gaps-v81.py kiểm các hồi quy cụ thể, không chạy lại toàn bộ64headercase không liên quan. Root: graphfeedback, guard điều hướng, tích hợp/cache, kiểm hồi quy và phát hành.

Các phép tăngcomputedfont hoặc reflowDPR2 không phải thao tác zoom thật trên Safari/điện thoại. Chỉ có Chromium trong môi trường hiện tại; WebKit/Firefox executable không có, không gọi đây là nghiệm thu đa engine. OAuth/Firebase/inference thật không được dùng cho fixtures. Các timeout ban đầu do harness đọc thanh đang ẩn được giữ làm artifact và không được tính là lỗi runtime hay kết quả đạt.

## Kết quả bản ghép cuối

QA11/11PASS,0pageerror: các trạng thái empty/noncompatible/nonfinite;0→1 điểm bằngEnter focus điểm thật sau rebuild;24rows keyboard/bảng cuộn2chiều; tên trục/captionHTML đủ đơn vị/chữ×2/shortviewport; retry sách320×568; điều hướngStay/Escape/newtab/Continue và brandreload. Báo cáo tổng hợp có provenance tại work/ui-gaps-v81/report.json. Các bộ Node mới graph-feedback, assistant-navigation, assistant-context và book-recovery được đưa vào npmcheck.

Trước phát hành: `npm run check` hoàn tất exit0 trên Node24; `node checks/site-security-v63.mjs` đạt; `git diff --check` đạt. Fetch main trước push. Không commit tài nguyên KaTeX hoặc báo cáo audit tạm do kiểm tra sinh ra.
