# V90 — nhìn rõ nước, thao tác gọn hơn

Ngày 17/11/2026 (UTC+7). Nền main: `d70de0d8b807ad89c0cb22ca64794397d31f41e1`.

## Vấn đề và thay đổi

Nước V89 có trong cốc nhưng quá nhạt dưới ánh sáng 3D; bình nhận nước thực sự còn rỗng. Luồng rót yêu cầu biết trước cách nâng, đặt và xoay cốc, trong khi bảng điều khiển hiển thị quá nhiều lựa chọn. Không giải quyết vấn đề này bằng cách tự điền nước vào bình.

- Nước có thân xanh và mặt thoáng rõ hơn ở sáng/tối. Vật liệu thân/mặt thoáng dùng các tam giác của **cùng mesh SI**, không thêm đĩa giả, không đổi thể tích hay vị trí mặt nước. 2D có đường mặt thoáng theo trọng lực, ngắt đúng phần mẫu xuyên mặt nước và không vẽ khi rỗng. Giữ kính/nước trong suốt và chọn được que.
- Bàn chiếm toàn chiều ngang. Phía trên có lượng nước thực đang nằm trong cốc/bình và một hành động chính theo trạng thái: **Đặt bình → Đưa cốc đến bình → Rót nước / Dừng rót**. Thông tin lượng nước là trạng thái mô hình, không được gọi là số cân do học sinh đo.
- Nút rót bật/tắt rõ nghĩa; người học chọn lúc dừng, lượng nước truyền theo tốc độ hữu hạn hiện hữu. Hết nguồn tự dừng và mở lại các thao tác khác. Dừng/Escape vẫn hoạt động khi nhật ký đầy. Đổi trang, nhập phiên, đổi renderer/ngôn ngữ hoặc cầm trực tiếp sẽ kết thúc thao tác hỗ trợ phù hợp.
- Chọn 1/5/10/20 g hoặc giá trị chính xác hiện hữu, nhấn **Thả … g đá** nhiều lần; chọn **Nhúng nhiệt kế**, **Đặt que vào nước**, rồi **Khuấy một vòng**. Vẫn cầm và vẽ vòng tròn trực tiếp được. Vật rắn có **Gắp mẫu → Đặt vào bể nóng → Gia nhiệt mẫu → Đo nhiệt độ bể → Gắp mẫu → Thả mẫu vào nước**. Đầu dò trong bể tránh chạm mẫu, kể cả mẫu nổi lớn.
- Di chuyển có hỗ trợ đi theo các đoạn nâng–đưa ngang–hạ đã kiểm tra trước. Trong chuyển động vẫn chạy sweep hiện hữu trên từng đoạn/mẫu; không xuyên giá/vành bình, không tự sửa pose phiên cũ hoặc ép dụng cụ vừa bình. Nếu đường đi/độ sâu nước không phù hợp, báo nguyên nhân và giữ phương án kéo trực tiếp.
- Khuấy có hỗ trợ vẽ một vòng thật của que qua các vị trí ướt hợp lệ trước khi áp dụng tác động khuấy. Nhật ký ghi `assisted-placement`/`named-target`, không giả rằng học sinh đã thực hiện pointer drag. Chưa tự coi thao tác này là bằng chứng đủ cấp 3.
- Sau khi chọn đích trong bình, camera cận cảnh bình; **Vừa bàn** luôn ở toolbar. Kéo trực tiếp, cân/trừ bì, mũi tên chính xác, góc nghiêng, chế độ học, camera/2D/3D vẫn ở **Dụng cụ & điều chỉnh** hoặc **Góc nhìn & hiển thị**. Tham số lượt mới nằm trong disclosure, giữ số đo/ghi chép/CSV/JSON và xác nhận nhập/lượt mới.

## Tương thích và bảo toàn

Không thay byte của tám module physics/geometry/spatial/motion/ice-portions/measurement/notebook/protocol cốt lõi so với main. Giữ 300 ID, công thức, 388 scan, 85 mục lục, 301 âm thanh, banner, AI/auth và đường bài Nhiệt dung riêng. Không đổi schema/key phiên; load/import cũ giữ lượng chất, pose và số đo. Bình không được tự nhận nước khi mở bài. Các phần đá vẫn thuộc mô hình nhiệt tương đương, chưa trôi/va chạm độc lập hoặc CFD.

Hoạt động hỗ trợ được phân biệt với kéo tay. Khi chạy đường đặt dụng cụ, đồng hồ mô phỏng dừng; các thay đổi vật chất vẫn chỉ qua action vật lí hợp lệ. Người học phải nêu giả thuyết trong assessment, đọc và ghi số đo của mình. Không sinh đáp án/cân bằng nhiệt sẵn hoặc tự hoàn tất nhiệm vụ.

## Kiểm thử và bằng chứng

- `checks/thermal-water-v90.mjs`: 37 ca mesh, 1.500 tam giác mặt thoáng, 40 ca sơ đồ; tích phân thể tích độc lập, phủ material groups chính xác, hướng/độ cao mặt thoáng và nước rỗng/nghiêng.
- `checks/thermal-assist-v90.mjs`: 742 assertions; đường đi/nội suy và bất biến dữ liệu, nhúng đúng chất, vòng khuấy, thiếu/cạn nước, pose sai, bình 100 ml, cốc nguồn 2 kg, chuyển mẫu bằng kẹp, đầu dò bể với mẫu nổi lớn.
- Direct renderer trước/sau: 8 ca fresh/filled × sáng/tối × 1050/390 px, giữ thể tích. Đây là fixture renderer; luồng học sinh được kiểm riêng bằng public controls.
- `checks/browser-thermal-simple-v90.py`: luồng mặc định thu gọn, rót một phần và dừng, rót tiếp đến hết, thêm mẫu, đầu dò, khuấy, nhập số đọc, JSON/import/reload; hai hoạt động và 2D/3D/390/1440 px.
- `checks/browser-thermal-regression-v90.py`: hồi quy controls cũ, chủ động mở các disclosure để kiểm toàn chức năng; không thay state/model. Native grip/khuấy dưới nước và viewport được kiểm riêng.

Các lần chạy bị dừng để sửa lỗi hoặc có source thay đổi chỉ là chẩn đoán, không tính vào bộ cuối. Kết quả cuối, log và manifest nằm trong `evidence/`; CI/Pages/live chỉ được xác nhận sau khi có bằng chứng phát hành riêng.

Agent thực gọi: `water90` triển khai/rà vật liệu và đường mặt nước; `simple90_review` rà độc lập khoa học, đường thao tác, giới hạn dữ liệu và lifecycle, viết unit đường đi. Agent chính tích hợp controller/bố cục, chạy browser/suite và phát hành.

| PASS cấp 3 | PARTIAL | NOT TESTED | BLOCKED | Tổng |
|---:|---:|---:|---:|---:|
|0|1 — calorimetry|299|0|300|

Chưa nghiệm thu iPhone Safari/Android thật, giáo viên, P95/FPS thiết bị hoặc WCAG đầy đủ. Chromium/SwiftShader và viewport/cảm ứng giả lập không thay cho phần cứng thật. Chưa tuyên bố 300 lab hoàn tất.

## Tệp thay đổi và lý do

- `dist/l3/thermal-assist.js`: kế hoạch đặt dụng cụ và vòng khuấy, không sửa state.
- `dist/l3/thermal-pilot.js`: luồng thao tác gọn, điều khiển rót/gia nhiệt, animation có sweep, lifecycle, disclosures và bản dịch VI/EN.
- `dist/l3/thermal-three.js`, `thermal-view.js`: nước rõ hơn trên cùng hình học SI, mặt thoáng 2D.
- `dist/l3/thermal.css`: bố cục toàn bàn, vùng thao tác, responsive và trạng thái.
- `dist/index.html`, `boot.js`, `app.js`: URL cache V90.
- `checks/thermal-water-v90.mjs`, `thermal-assist-v90.mjs`, `browser-thermal-simple-v90.py`, `browser-thermal-regression-v90.py`: kiểm chứng hành vi mới và tương thích.
- `package.json`: chạy hai unit mới trong suite; `CODEX_HANDOFF.md`: bàn giao.
- Báo cáo, manifest và ảnh trong thư mục này.

Tiếp theo ưu tiên nghiệm thu điện thoại thật và giáo viên; chỉ xây nhiều viên đá trôi độc lập khi có mô hình nổi/tiếp xúc và oracle tương ứng. Không nhân giao diện hỗ trợ sang lab khác bằng script và gọi đó là hoàn thành cấp 3.

## Kết quả cuối trước phát hành

`npm run check` đạt exit0 trong690,62giây, manifest nguồn ổn định. 4/4luồng mới, 1/1assessment/Escape, 5/5nativegrip, 18/18viewport và 7/7nhóm hồi quy đạt trên cùng runtime. Directrenderer8/8 có hash hai module renderer trùng nguồn cuối; ảnh trước/sau là cùng fixture để so màu, không phải bằng chứng luồng học sinh. Security306HTML/504publictextassets vàdiffcheck đạt. Các report có SHA256 và phiên bản Chromium154.0.8037.57/SwiftShader.

Các controls cũ được kiểm sau khi chủ động mở disclosure; luồng mới được kiểm từ giao diện thu gọn mặc định. Nhập số đọc33,4°C trong fixture kiểm giữ nguyên dữ liệu người học, không phải tuyên bố đó là số đúng của nhiệt kế. Không có pageerror; ca cố ý tắt WebGL có consoleerror dự kiến và fallback vẫn dùng được.

CI/Pages và website thật được xác minh riêng sau commit; xem PR/báo cáo phát hành để biết kết quả cuối.
