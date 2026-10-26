# Hình học quang học v65

Phạm vi là 11 bài `ray_slab`, `apparent_depth`, `brewster`, `mirror_rotation`, `fiber_acceptance`, `lens_power`, `lenses_contact`, `magnifier`, `telescope`, `microscope`, `pinhole`. Đây là lớp dựng hình mới; các phương trình, miền tham số công khai, số đọc và cơ chế lưu phiên cũ được giữ nguyên.

`dist/optics-geometry-v65.js` chỉ tính dữ liệu hình học. Hàm `buildOpticsGeometry(id,state,outputs)` không sửa `state` hoặc `outputs`; không lấy số đọc làm đáp án hình học. Bộ kiểm độc lập đối chiếu kết quả dựng lại với `evaluate()` và với các tia thật trên hình.

## Quy ước tọa độ và hợp đồng dựng hình

- Mọi tọa độ x/y trong một cảnh dùng cùng đơn vị và cùng tỉ lệ tuyến tính. Bản mặt song song và các hệ kính dùng cm; độ sâu biểu kiến/lỗ nhỏ dùng m. Gương/Brewster chỉ cần độ dài tương đối. Sợi quang dùng kích thước minh họa cm, không phải tham số đường kính của sợi thật.
- Hướng truyền tia nằm trong `from → to`. `virtual` là đường kéo dài ngược, luôn nét đứt và không có mũi tên truyền năng lượng. `guide` là pháp tuyến/đường dựng, không phải chùm sáng thật.
- `elements` mô tả tâm và khẩu độ kính, mặt phân cách, môi trường, gương, lỗ và màn. Với hai kính mỏng sát nhau, hai kính có đúng cùng hoành độ; không thêm khoảng cách giả vào phép tính.
- `markers` dùng `(x,y)` làm chân mũi tên, `height` có dấu làm độ cao. Ảnh trung gian là một loại riêng. Tiêu điểm ảnh F′ của hệ phân kì nằm bên trái; đường kéo dài tia ló gặp tại F′.
- `image.kind='infinite'` không có tọa độ/chiều cao ảnh hữu hạn và không tạo mũi tên ảnh hữu hạn. Hệ có độ tụ tổng 0 dùng `kind='none',afocal:true`: không có tiêu điểm hữu hạn cho chùm tới song song.
- `arcs.start/end` là radian theo trục x dương và chiều ngược kim đồng hồ. `axisY=null` cho các cảnh không có trục quang học ngang.
- Khẩu độ kính, bề dày nét tia, đầu mũi tên, bề dày kính và giá đỡ không được suy ra là số đo của bài. Renderer được thêm ký hiệu giá đỡ hoặc điểm đánh dấu nhỏ để nhận ra chúng, nhưng giữ nguyên tâm kính, vật, ảnh, tiêu điểm và đường tia. Không kéo giãn độc lập trục x/y để làm vật kính ngắn tiêu cự lớn hơn.

## Đối chiếu từng bài

| ID | Dựng hình và kiểm chứng |
| --- | --- |
| `ray_slab` | Hai mặt tại y=0 và y=−h. Với không khí ngoài bản, `sin i = n sin r`; điểm ló `(h tan r,−h)`. Tia ló song song tia tới. Khoảng cách vuông góc giữa hai đường tia bằng `h sin(i−r)/cos r`, không phải chênh lệch x trên mặt dưới. Khi i=0 hoặc n=1, độ lệch bằng 0. |
| `apparent_depth` | Vật ở `(0,−h)`, ảnh biểu kiến tại `(0,−h/n)`. Dùng tia gần pháp tuyến với độ dốc ngang/dọc trong nước 0,035 và ngoài không khí bằng n lần giá trị đó. Đây là phép dựng gần trục `h′≈h/n`, không giả vờ là định luật Snell chính xác ở góc lớn. Sai lệch Snell tương đối của tia minh họa dưới 0,2% trong toàn miền n=1…1,8; góc ngoài không khí dưới 3,7°. |
| `brewster` | Dựng độc lập `iB=atan(n₂/n₁)` và góc khúc xạ theo Snell. Hai hướng phản xạ/khúc xạ vuông góc; hệ số biên độ Fresnel `r_p=0`. Chú thích nói rõ chùm tới không phân cực, tia phản xạ s còn tồn tại và thành phần p bằng 0. Nếu n₁=n₂, không vẽ chùm phản xạ thật: chỉ còn hướng dựng nét đứt và chú thích không có phản xạ. |
| `mirror_rotation` | Tia tới cố định ở 20° với pháp tuyến ban đầu. Pháp tuyến khi gương quay α là `(-sin α,cos α)`; phản xạ dùng vectơ `v=u−2(u·n)n`. Góc quay có dấu của tia phản xạ đúng +2α, kể cả α>20° khi tia đổi phía so với pháp tuyến. Không lấy trị tuyệt đối làm tia quay ngược. |
| `fiber_acceptance` | `NA=√(n_lõi²−n_vỏ²)`, môi trường ngoài n=1. Tia tới minh họa có góc bằng 0,8 góc nhận cực đại; khúc xạ ở đầu sợi theo Snell, phản xạ đúng tại y=±0,45 cm. Mỗi lần chạm thành có góc tới lớn hơn `asin(n_vỏ/n_lõi)`. Ló khỏi đầu kia cũng theo Snell. Nón nhận là đường dựng nét đứt, không phải các tia thêm được dẫn trong lõi. |
| `lens_power` | Chùm tới song song trục. Trong mô hình kính mỏng gần trục, độ dốc ló `q_out=q_in−y/f`; các tia gặp tại x=f. Tiêu cự cm đổi sang m trước khi so với độ tụ D. |
| `lenses_contact` | Hai phần tử cùng mặt phẳng: độ dốc đổi tổng cộng `−y(D₁+D₂)/100` khi chiều dài dùng cm. D>0 cho tiêu điểm thật; D<0 cho chùm phân kì và tiêu điểm ảo nét đứt; D=0 giữ nguyên chùm song song, không tạo tiêu điểm hữu hạn. Khi một kính có D=0, phần tử đó không làm đổi độ dốc. Bề rộng chùm được chọn theo cả tiêu cự từng kính để vẫn gần trục khi hai độ tụ lớn gần triệt tiêu. |
| `magnifier` | Vật ở x=−f. Mọi tia từ đỉnh vật đi qua kính có cùng độ dốc ló `−h/f`; ảnh ở vô cực. `25 cm/f` là bội giác góc với mắt sát kính, không được chuyển thành độ cao ảnh trên màn. |
| `telescope` | Hai kính cách `f₁+f₂`. Chùm tới nghiêng góc nhỏ tạo ảnh trung gian tại `(f₁,f₁q_in)`, đúng tiêu diện chung. Chùm ló song song với `q_out/q_in=−f₁/f₂`; ảnh cuối ở vô cực. Chọn góc tới sao cho cả hai độ dốc không vượt 0,04 trên toàn miền mở rộng, kể cả f₁<f₂. |
| `microscope` | δ là khoảng F′₁–F₂. Hai kính cách `f₁+δ+f₂`, không phải δ. Chọn vật cách vật kính `u=f₁(f₁+δ)/δ`; ảnh trung gian thật đảo cách vật kính `v=f₁+δ`, nằm ở tiêu diện trước của thị kính. Vì `1/u+1/v=1/f₁`, phóng đại có dấu của vật kính đúng `−δ/f₁`. Thị kính cho ảnh cuối ở vô cực; số đọc bội giác cũ là độ lớn `δ·25/(f₁f₂)`. Độ cao vật minh họa được chọn để tia vẫn gần trục trong toàn miền điều khiển. |
| `pinhole` | Ba điểm trên vật truyền thẳng qua cùng tâm lỗ tới màn. Độ cao ảnh có dấu `H=−h·d′/d`. Tọa độ dùng m, còn số đọc chiều cao ảnh dùng cm nên so với `100H`. Ảnh trên màn là ảnh thật đảo. Không dự đoán độ nhòe do nhiễu xạ/kích thước lỗ. |

Các mô hình kính mỏng và bội giác là xấp xỉ gần trục, không truy vết bề mặt kính thật hoặc quang sai. Chiều cao vật/chùm tia minh họa không phải tham số mới của catalog. Phạm vi mở rộng có thể làm một vật hoặc ảnh nhỏ dưới một pixel khi giữ tỉ lệ vật lí; ký hiệu/nhãn và zoom giúp tìm chúng, không đổi tọa độ để làm chúng lớn lên.

## Kiểm chứng tự động

Chạy:

```sh
node checks/optics-science-v65.mjs
node checks/optics-visual-v65.mjs
```

Lần chạy trên nhánh công việc ngày 26/10/2026:

- Khoa học: **381 trạng thái**, **2.948 đoạn hình học**, đủ 11 ID. Bao gồm mặc định, từng cực trị, mọi tổ hợp góc của miền đang được quảng bá sau mở rộng và 24 mẫu xác định được theo seed mỗi bài. Thêm các trường hợp triệt tiêu độ tụ, độ tụ âm, n₁=n₂ và gương quay qua pháp tuyến.
- Đối chiếu khoa học được dựng lại từ đầu mút tia: Snell, phản xạ vectơ/góc có dấu, khoảng cách vuông góc, giao/đường kéo dài, thấu kính mỏng, vật–ảnh trung gian, bội giác góc và quy đổi cm/m. Không lấy `geometry.values` làm đáp án của các phép thử tia.
- Tham số và số đọc đầu vào được đóng băng; giữ nguyên sau mỗi lần gọi helper. Hash **13 tệp khoa học/catalog/phiên** khớp manifest v64, không cập nhật baseline để bỏ qua thay đổi.
- Renderer CPU: **58 trạng thái**, **456 đoạn vẽ thực**, **232 phép chiếu** camera/Canvas. Bộ kiểm lấy đầu mút từ mesh/line thật rồi đối chiếu với tọa độ vật lí và phép biến đổi cùng tỉ lệ x/y; kiểm ảnh ở vô cực không có mũi tên ảnh hữu hạn và mặt chắn lỗ nhỏ còn phần đặc dương ở góc tham số kết hợp.
- Rà soát vật lí độc lập sau khi renderer chuyển sang giữ lại đối tượng: **192 lần cập nhật**, lặp ba vòng qua mặc định/các tổ hợp cực trị, phục hồi **132 đầu mũi tên thật** từ vị trí cone để kiểm cả chiều ảnh và chiều cao có dấu. Sau warm-up, không đổi object/geometry/material/position/dash-buffer khi quay lại những trạng thái này. Đối tượng của các nhánh hình học cũ được ẩn, không bị vẽ lại thành tia thừa.

Đây không phải kiểm nghiệm 300 mô hình, đánh giá của giáo viên, kiểm thử iPhone/Safari/Android thật hoặc đo FPS GPU phần cứng. Bằng chứng trình duyệt và ảnh xuất mới được ghi riêng bởi bước QA/phát hành; tài liệu này không thay cho bằng chứng đó.

## Nguồn nguyên lí đang có trong kho

Các nguồn OpenStax đã được ghi URL, ngày lấy 19/10/2026 và SHA-256 trong `dist/lessons/references.js`; đợt này không thay nguồn hoặc tuyên bố đã tải lại:

- [The Law of Reflection — m58509](https://github.com/openstax/osbooks-university-physics-bundle/blob/main/modules/m58509/index.cnxml)
- [Refraction — m58510](https://github.com/openstax/osbooks-university-physics-bundle/blob/main/modules/m58510/index.cnxml)
- [Total Internal Reflection — m58511](https://github.com/openstax/osbooks-university-physics-bundle/blob/main/modules/m58511/index.cnxml)
- [Polarization — m58525](https://github.com/openstax/osbooks-university-physics-bundle/blob/main/modules/m58525/index.cnxml)
- [Thin Lenses — m58530](https://github.com/openstax/osbooks-university-physics-bundle/blob/main/modules/m58530/index.cnxml)
- [The Simple Magnifier — m58533](https://github.com/openstax/osbooks-university-physics-bundle/blob/main/modules/m58533/index.cnxml)
- [Microscopes and Telescopes — m58534](https://github.com/openstax/osbooks-university-physics-bundle/blob/main/modules/m58534/index.cnxml)

Phép dựng cụ thể và dữ liệu kiểm thử v65 là công việc của dự án; nguồn nguyên lí nền không phải xác nhận chuyên gia cho toàn bộ catalog.
