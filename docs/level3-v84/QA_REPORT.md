# QA độc lập P1 calorimetry, v84

Phạm vi: hai hoạt động mới nước–đá và vật rắn trong cùng một ID `calorimetry`; không tạo ID thứ 301. Browser automation qua Chromium cục bộ; có CDP mô phỏng hai điểm chạm, không phải điện thoại thật. Bản aggregate cuối sẽ ghi SHA-256 nguồn trước/sau từng ca trong `browser/final/report.json`.

## Lỗi thực đã phát hiện và yêu cầu sửa

1. **Rót bằng tay cầm xoay làm thất thoát sai hệ nhận.** Cốc ở (410,130), kéo góc đến khoảng60°, 0,069796kg bị ghi tràn và chỉ0,130204kg vào bình. Trong góc trung gian, miệng cốc nằm trên miệng bình nhưng bị yêu cầu nằm bên trong rectangle mới nhận nước. Agent chính sửa `pourTargetAt` theo tia rơi; QA kiểm các ca trên miệng/ngoài ngang/chưa đặt bình/dưới đáy và tái chạy handle thực. Artifact lỗi gốc: `browser/handle-first/`.
2. **Không gắp được vật sau cân.** Nhánh thả lên cân chạy trước nhánh kẹp gần vật, nên thả kẹp lên vật trên cân chỉ cân lại. Agent chính ưu tiên thao tác gắp, ghi sự kiện lấy khỏi cân và xóa tải cân. QA kiểm cân100g→kẹp→bể và cân không còn100g sau lấy mẫu. Artifact gốc: `browser/solid-scale-first/`.
3. **Import sai kiểu có thể phá thao tác assessment.** `hypothesis=42` được nhận rồi controller gọi `.trim()`. Agent chính thêm validation text/mode/draft/camera/apparatus trước thay phiên. QA kiểm Node và import UI bị từ chối, phiên hiện tại vẫn dùng được.
4. **Field khối lượng tự nhập mới cần kiểm kiểu khi import.** QA phát hiện `{studentMassesKg:{water:'200'}}` được nhận; đã gửi agent chính thêm kiểm kiểu/miền cho optional field này. Agent chính đã thêm validation optional plain object, chỉ khóa water/sample, số hữu hạn 0..2kg; node QA cuối PASS.

Các lỗi fixture được lưu riêng, không tính là lỗi runtime được sửa: đầu dò đặt đúng tâm vật phải là solid contact thay vì bath; chọn lại kẹp trước drag khi hai hit region chồng nhau; CSV hiện chứa cả source student và instrument-trace; `innerText` của bằng chứng trong details đóng không hiện; sai số biểu diễn float dùng tolerance phù hợp.

## Hành trình và dữ liệu đã xác minh riêng trước aggregate

- A: bố trí bình bằng Enter, cốc kéo+R hoặc handle xoay, nước chuyển hữu hạn; trừ bì đĩa5g rồi cân đá20g; đá ngoài bình không chuyển; đầu dò trên mặt nước/không khí và chạm thành không được coi là nhiệt nước; nhúng đúng phần nước mới có số chỉ.
- Khuấy: ngoài nước không có tác dụng; chuyển động vòng tròn trong nước làm cường độ khuấy đổi. Không dùng animation để suy ra nhiệt độ.
- B: chuyển trực tiếp bằng tay bị từ chối; kẹp→bể làm nóng hữu hạn, kẹp→nước làm nước ấm lên; số vật không nhảy ngay về90°C. Calculator ban đầu trống, kết quả dùng số đo do người học nhập, không điền đáp án cân bằng.
- Dữ liệu: giữ số nhập sai77,7°C cùng số chỉ dụng cụ riêng; invalid air reading vẫn được giữ với measuredValue null. Các thời điểm tự ghi tách khỏi trace tự động. Loại điểm có lí do làm giảm điểm vẽ, vẫn giữ dữ liệu gốc trong JSON/CSV. New trial không xóa lượt trước; JSON/CSV/import/reload/legacy import đã chạy qua UI.
- Legacy: fixture `thpt-lab-v1` gồm calorimetry và ohm so byte trước/sau hành trình vẫn nguyên. Classic `thpt.session.v1` được giữ riêng, không đổi nhãn thành nước–đá. A/B có session riêng, đổi A→B→A giữ đúng dữ liệu cùng catalogId.
- Hủy: actual mouse down/move, pointercancel được inject có ghi rõ và lost pointer capture qua browser API; thao tác trả vị trí, không tạo drop giả; trạng thái dừng không tự chạy tiếp.
- Viewport320×568,390×844,844×390: hành trình A và tự ghi qua pointer+keyboard đạt, không tràn body, nútHTML tối thiểu44px. Đây không phải bằng chứng OSK hoặc ngón tay thật.
- Camera: CDP hai điểm chạm pinch/pan làm viewBox đổi, không đổi model/positions; reload giữ camera, zoomout hit≥44px. Không mô tả là Safari/iPhone thật.
- N02 hữu hạn:0,2kg nước20°C +0,1kgđá,5sốđo; tại khoảng34,67s nước17,78°C còn0,09545kgđá, thỏa cận năng lượng độc lập mđá≥0,049940kg. **Không tuyên bố đã hội tụ đến cân bằng0°C.** Lượt0,06kg có2sốđo, giữ lượng nước/nhiệt đầu/bình/cách khuấy; UI nhận controlled repeat. Có một trial trống trước cấu hình, không biến nó thành lượt khảo sát.

## Giới hạn nghiệm thu

Đề nghị trạng thái **calorimetry PARTIAL**, 299 bài còn lại NOT TESTED; tổng vẫn300. Giáo viên/thiết bị thật NOT TESTED. Các checkmark chỉ kiểm metadata, không chấm chất lượng dự đoán/lập luận hay xác minh tác giả HS. Không tuyên bố 8 gate PASS hoặc toàn bộ300 bài Level3.

Chưa có kiểm Safari/iOS/Android vật lí, giáo viên, hiệu năng thiết bị thấp hoặc CFD. Physics oracle của agent physics là lớp bằng chứng riêng; QA này kiểm hành trình và dữ liệu chứ không thay thế nghiệm thu Vật lí độc lập.

## Kết quả chốt trên candidate frozen

12/12 ca đạt sau một lần sửa fixture chọn Scale trước action contextual. Raw aggregate `browser/final/report.json` vẫn giữ 1 FAIL harness này; `browser/final-rechecks/report.json` chỉ chạy lại A đạt. `browser/accepted-report.json` là bản tổng hợp có provenance, không giả raw run đầu toàn PASS. Nguồn runtime có cùng SHA-256 giữa 12 ca, không đổi trong ca; 0 pageerror.

Ca CDP cuối cũng chứng minh khi giữ dụng cụ, ngón thứ hai không đổi camera. Có DOM synthetic2touch riêng; malformed camera bị từ chối. Partial pour→pause→cốc đứng không để stream giả và không tự chuyển thêm nước.

Khối lượng HS nhập cố ý199g nước/21g mẫu được lưu0,199kg/0,021kg trong studentMassesKg và hai cột CSV riêng; điều kiện vật lí vẫn0,2kg/0,02kg, không tự sửa số HS. Các ô ban đầu trống.

N02 aggregate tại32,998s: nước17,7134°C, đá còn0,0953153kg; cận năng lượng0,0499401kg. Đây là điểm hữu hạn theo hành trình, không nghiệm thu hội tụ cân bằng.

Node `checks/l3-data-interaction-v84.mjs` PASS sau sửa validation cuối; Python harness kiểm cú pháp PASS. Agent QA không chạy full npm; agent chính phụ trách mandatory suite và release.

## Rà soát cuối về tiếp xúc đầu dò

Sau aggregate12ca, agent chính sửa thêm đồng bộ tiếp xúc theo hình học thực: đầu dò không đi theo vật nếu hình không di chuyển. Một ca bounded mới (`browser/contact-final/report.json`) PASS trên nguồn ổn định: làm nóng vật trong bể, đầu dò chạm vật, kẹp chuyển vật ra bàn nhưng đầu dò giữ nguyên vị trí→placement chuyển về bath; valid pose export/reload/import đạt; file cố ép placement=solid sai hình học bị từ chối trước thay phiên. Không chạy lại toàn bộ12ca. Do đó không tuyên bố13ca cùng một hash nguồn: report riêng lưu hash sau sửa.

Node QA thêm ca water contact trong physical state nhưng vị trí đầu dò ngoài bình, bị từ chối khi import; toàn bộ node data/interactions PASS. Cú pháp Python và diff check đạt. Trạng thái Level3 vẫn PARTIAL; giáo viên và thiết bị thật NOT TESTED.
