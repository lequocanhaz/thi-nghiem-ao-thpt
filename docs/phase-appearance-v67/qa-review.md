# QA phát hành PR43

Agent thực hiện: `/root/release_qa`. Chỉ đọc runtime; bằng chứng ở thư mục này.

**PASS phạm vi hành vi.** Chưa có blocker runtime được ghi nhận. CSS menu/placeholder chỉnh sau lượt QA được giao agent UI kiểm riêng ở ba độ rộng; xem `SUMMARY.json` để đối chiếu hash và phạm vi.

- Hai browser check đã commit đều PASS:320,375,390,414,430,768,1024,1440,1920px; vòng tròn nằm ngay trong viewport; đổi theme/VI–EN, ghi dữ liệu, chạy/dừng, reload, không tràn ngang; mouse drag, bàn phím và sách nhớ theme.
- Kiểm độc lập390/1440 dùng instance WebGL thật trong Chromium: xe, điểmM, hình chiếuH, đồ thị và x/v/a khớp phương trình; vận tốc chiếu bằng thành phần ngang của tiếp tuyến. T=3s,t=20s, các preset0/90/180/270/360° và slider359° chọn đúng pha ở chu kì cuối chưa đủ. Ghi một dòng/notes giữ qua locale/theme/reload/play. CDP touch390 đạt.
- Nhãn EN cuối đúng `Displacement / Velocity / Acceleration`; đơn vị đọc số `cm / cm/s / cm/s²`, khớp vòng tròn và engine.
- Relation320/390/1440: góc liên tục, điện tích rời rạc, đồ thị giữ node/focus, bảng, VI–EN, ngắt cực điện thế, không tạo marker hữu hạn tại cực đều PASS.
- Không có pageerror, consoleerror, HTTPerror hoặc request nhà cung cấp trong hai lượt QA cuối.

Lượt đầu assertion chờ cố định350ms bị FAIL một lần ở375 dưới tải Chromium đồng thời. Bằng chứng được giữ ở `original-checks.json`.375 kiểm riêng bằng điều kiện chuyển động PASS; chín độ rộng với điều kiện tương tự PASS; sau đó hai script đã commit (đã đổi sang điều kiện chờ chuyển động tối đa8s) đều PASS trên nguồn cuối. Không sửa runtime để làm assertion đạt.

Hash bảy tệp runtime khớp ngay khi kiểm độc lập390/1440 kết thúc. Sau đó chỉ `lab-extras-v67.css` đổi do sửa placeholder, ghi chú storage, summary và mobilevisualpanel; toàn bộ JavaScript giữ hash. Các sửa CSS menu này chuyển agent UI kiểm có mục tiêu, không giả định là nằm trong lượt QA trước đó.

Giới hạn: Chromium154/SwiftShader và viewport/CDP cảm ứng giả lập; chưa kiểm iPhone/Safari/Android thật, bàn phím ảo hoặc GPU/FPS phần cứng. Không thực hiện OAuth/Firebase thật. Còn một số nhãn VI trong EN; không chứng nhận dịch đầy đủ hay toàn bộ300 mô hình.
