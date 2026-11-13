# Rà soát khoa học và tiếp xúc không gian — v85

Phạm vi: renderer Three.js cho hai hoạt động nhiệt lượng kế thuộc cùng ID `calorimetry`. Baseline đang đọc: `4e129eb`. Rà soát này không thay solver, thông số đo, ledger hoặc trạng thái nghiệm thu L3. Mục tiêu là hình 3D và vị trí dụng cụ biểu diễn đúng các điều kiện tiếp xúc của model v84.

## Quyết định hình học

Canonical 800×480 của v84 là **mặt cắt đứng**, không phải tọa độ mặt bàn từ trên xuống. `y` tăng xuống dưới; `waterSurfaceY=348−176·fraction`. Map y canonical thành trục z ngang với độ cao dụng cụ cố định sẽ làm đầu dò trượt ngang mà số đo lại được coi là nhúng nước. Đó là bất nhất nhân quả và đã được báo root/UI trước khi dựng renderer.

Phương án đã thống nhất với root/UI:

```text
worldX = (canonicalX − 400)/1000
worldY = (348 − canonicalY)/1000
worldZ = 0 cho mặt phẳng thao tác / lát cắt tiếp xúc
canonicalX = 1000·worldX + 400
canonicalY = 348 − 1000·worldY
```

Scene có mesh thể tích và camera quay phối cảnh; tương tác dụng cụ vẫn ràng buộc vào mặt phẳng thao tác khai báo. Không tuyên bố đây là mô hình chuyển động sáu bậc tự do hay mô phỏng đầy đủ va chạm vật rắn/chất lỏng.

Các kích thước mesh được phóng đại để dễ thao tác. Root chọn bình tròn bình thường thay vì ellipse rất mỏng ép vừa dung tích hình học. Nội bán kính minh họa 0,076 world-unit và cột chất lỏng 0,176 world-unit tương ứng khoảng 3,19 L nếu diễn giải thành hình trụ thật; **không được gọi mesh này là bình hình học đã hiệu chuẩn 600 mL**. Khối lượng, dung tích và số đo vẫn lấy từ state SI. UI phải nói rõ không đo lượng chất/dung tích bằng pixel hoặc thể tích mesh. Chia vạch tương ứng phần trăm dung tích model, không phải chứng cứ đã hiệu chuẩn hình học SI.

## Hợp đồng điểm chuẩn

| Đối tượng | Canonical/model | Điểm 3D cần khớp |
|---|---|---|
| Nhiệt lượng kế | Anchor (410,260), đáy trong y348 | Anchor world (0,010;0,088;0), đáy worldY=0 |
| Miệng bình | y156 (SVG origin260−104) | Rim worldY=0,192; không nhầm với mức nước cực đại y172 |
| Cột chất lỏng | y348−176f | Water surface worldY=0,176f, còn 0,016 headspace đến rim |
| Đầu dò | `positions.probe` chính là điểm cảm biến/tip, không thêm +35 | Điểm cảm biến mesh ở local(0,0,0); cùng tọa độ world mà adapter dùng |
| Que khuấy | Tip = (positions.stirrer.x, positions.stirrer.y+10) | Active end localY=−0,010 so với group origin |
| Cốc rót | Spout canonical = cp+(55cosθ+50sinθ,55sinθ−50cosθ) | Local spout (+0,055;+0,050;0), `rotation.z=−θ` |
| Bể gia nhiệt | Mặt nước SVG y258; vùng đo x65..215, y263..332 | Surface worldY=0,090; đầu dò hợp lệ từ worldY≤0,085 (nhúng ≥5mm), đến worldY≥0,016 |
| Mẫu vật rắn | Tiếp xúc đầu dò trong ±22/±24 canonical quanh mẫu ngoài nước | Mesh/điểm tiếp xúc có footprint phù hợp; mẫu trong nước dùng trạng thái immersion riêng |

Độ lớn `f` phải xuất phát từ cùng thể tích/dung tích mà registry sử dụng. Mặt nước không lấy từ nhiệt độ hoặc từ shader. Mọi đổi góc nhìn, zoom, camera phải giữ đúng phép chiếu ngược pointer → mặt phẳng thao tác → canonical; không đổi điều kiện đo khi chỉ quay camera.

## Các phép kiểm bắt buộc

1. Nước 0,20 kg trong bình dung tích 0,0006 m³ cho mặt nước canonical y≈289,333, worldY≈0,058667. Đầu dò ở (410,180) đang ở không khí, không được trả số nước. Điểm y=surface+5 mới đạt độ nhúng tối thiểu; điểm y=342 là giới hạn đáy an toàn worldY=0,006.
2. Que ở không khí không làm `mixingIntensity` tăng. Phải dùng đúng tip `y+10` và miền nước thật; không chỉ kiểm nguyên vùng nhận của bình.
3. Probe rút ra hoặc chạm thành vẫn có trạng thái không hợp lệ cho số đo nước. Vị trí mesh tip phải nhìn thấy ở vị trí tương ứng; không tự nhấc/hạ mesh để làm kết quả có vẻ đúng.
4. Cup dùng đúng dấu quay quanh Z. Tia rót đi xuống theo trọng lực và xuyên miệng bình; ngoài miệng/bình chưa đặt phải ghi spill. Root đã quyết định cổng trên miệng `spout.y≤156`, thay cho v84 cho tới y342. Không thay đổi công thức nhiệt để chữa hình.
5. Cổng spout trên miệng **chưa chứng minh cả thân cốc không va chạm**. Ví dụ anchor (410,130), θ60° có spout (480,801;152,631) hợp lệ nhưng thân dưới có thể xuyên thành bình. Demo nên dùng pose thoáng hơn, ví dụ khoảng (315,100), θ60°, hoặc thêm kiểm thân cốc. Không tự chỉnh cao mesh mà giữ pose/model cũ. Nếu chưa kiểm va chạm thân, phải ghi giới hạn, không gọi mọi bố trí sai đều đã bị chặn.
6. Mẫu vật nóng chỉ vào nước qua state `tongs→water`; pose mẫu trong tay/kẹp, trong bể và trong bình phải nhất quán. Kéo probe theo mẫu đang di chuyển phải tính lại placement; bể không được đọc như nhiệt độ mẫu chưa cân bằng.
7. Đá đã đưa vào bình lấy tổng mass từ model; kích cỡ giảm đơn điệu như căn bậc ba khối lượng và biến mất khi mass=0. Với khối thị giác cao L, nổi theo ρice/ρwater≈0,917: centerY=surfaceY+(0,5−0,917)L, không mặc định nửa khối đá nằm trên nước. Có thể dùng nhiều mảnh minh họa nằm trong thành bình; không gọi là CFD hoặc động lực học vật nổi đầy đủ.
8. Mặt thoáng nước trong cốc nghiêng nên vẫn theo trọng lực (world-horizontal trong xấp xỉ tĩnh); không cho người học hiểu chất lỏng cứng quay đồng khối với cốc. Đồ họa dòng nước có thể đơn giản, nhưng chỉ hiện khi command rót đã được model chấp nhận và phải kết thúc ở đích thật.

## Dữ liệu và giới hạn nghiệm thu

`thermal-physics.js` vẫn là nguồn nhiệt/khối lượng/năng lượng, `observe()` vẫn quyết định độ trễ, độ phân giải, placement và tính đại diện của số đo. Renderer không được viết `waterTempC`, `probe.tempC`, mass hoặc ledger để khớp ảnh. Không đổi các phép tính này khi raycast hoặc clip camera gặp khó khăn.

Rà soát source contract và oracle số học không chứng minh framebuffer 3D, cảm ứng thật, va chạm mesh hoặc thiết bị. Bằng chứng framebuffer/gesture 3D do agent UI/QA và root thực hiện riêng; physics không lặp lại kiểm trình duyệt và không chuyển source review thành chứng nhận phần cứng. Không tăng số lab L3 PASS chỉ vì có mesh 3D.


## Kết quả rà soát source thực tế

Đã đọc `thermal-three.js`, `apparatus-registry.js`, phần mount/update trong `thermal-pilot.js` sau khi file renderer được dựng. Kết quả dưới đây áp dụng cho snapshot hash ghi ở phần cuối, không phải lời hứa cho mọi thay đổi sau này.

- **Đạt hợp đồng mặt phẳng:** `toWorld`/`toCanonical` dùng XY đứng và phép ngược tương ứng; raycast trên z=0. Mesh thiết bị có độ sâu và camera phối cảnh, còn thao tác contact giữ trên mặt phẳng đã khai báo. Không còn lỗi nhầm canonicaly thành độ sâu bàn.
- **Đạt waterline:** water-cylinder có localcenterY `−0,088+height/2`, height=`0,176f`; với anchorY=0,088, worldsurface đúng `0,176f`. Fraction cùng registry: thể tích dịch chỗ của đá nổi `m_ice/ρ_water`, không phải toàn thể tích `m_ice/ρ_ice`. Trong mô hình mật độ hằng, đá nổi tan không làm đổi waterline nếu không thêm/rót/tràn — phù hợp Archimedes.
- **Đạt điểm đầu dò/que:** probe sensor sphere ở localorigin, thân đi lên; không cộng sai +35 canonical units. Stir active end localY=−0,010 khớp `canonicaly+10`. Độ sâu tối thiểu 5mm vẫn do adapter quyết định, số đo lấy từ `observe`, không từ raycast mesh hoặc texture màn hình.
- **Đạt spout và mặt thoáng cốc:** cup mesh xoay `rotation.z=−angle`; stream start dùng chính localspout (+0,055;+0,050;0) rồi cùng rotation. Water geometry được cắt với mặt phẳng ngang theo trọng lực, không quay thành khối nước cứng theo cốc. Đây là hình học minh họa, không phải bộ giải thủy động lực học.
- **Đã sửa cổng rót:** registry yêu cầu miệng rót ở trên actualrim y156, không còn chấp nhận y342 sâu trong bình. Nước vào/tràn vẫn do action và mass ledger quyết định. Giới hạn va chạm cả thân cốc vẫn tồn tại như đã nêu ở mục 5; không có autoheight chữa pose sai.
- **Đã sửa bath:** box nước từ localcenterY=0,022 chuyển thành 0,018, với halfheight0,004 và groupY0,068 tạo surface0,090/canonical258. Điều kiện đo y263 tương ứng 5mm dưới mặt nước, không nhầm surface với ngưỡng nhúng.
- **Đã sửa biểu diễn đá tan:** bỏ clamp scale1,7 từng tạo plateau khi mass>~0,098kg và làm cụm vượt thành. Snapshot mới dùng `cbrt(iceMass/max(0,02,config.iceMass))`, không chặn đáy/trần trong miền state hợp lệ; cụm chỉ thu nhỏ theo mass trong lượt thử. Floatcenter dùng `−0,417·0,022·scale` so với mặt nước, thể hiện chìm phần lớn thay vì nửa khối nổi trên nước. Chunks và kích thước vẫn minh họa/phóng đại, không đo mass từ mesh.
- **Không sửa source khoa học:** `git diff --exit-code HEAD -- dist/l3/thermal-physics.js` trả0 tại snapshot. Module 3D chỉ đọc state/observation và phát callback thao tác, không gán nhiệt độ, mass hay ledger.

Không phát hiện blocker về giá trị đo hoặc ánh xạ điểm contact trong snapshot đã rà soát sau các sửa trên. Điều kiện phát hành vẫn gồm kiểm browser thật của renderer, dữ liệu qua đổi 2D/3D, context loss/fallback và quy trình CI của root. Đây không phải nghiệm thu L3-08, GPU thiết bị, CFD hoặc va chạm vật thể đầy đủ.

## Lệnh kiểm độc lập và snapshot

Thực thi tại baseline Git `4e129eb` với working tree v85, lúc `2026-11-13T07:56:08Z`:

```sh
git diff --exit-code HEAD -- dist/l3/thermal-physics.js
node checks/l3-thermal-physics-v84.mjs
```

Kết quả: exit0; **61.503 assertion được đếm trong oracle**, N-01=29,099608525445845°C, N-02 còn0,049940119760479046kg đá, residual tối đa1,3169483281672e−9J /9,547918011776346e−15kg. Tiêu chí gradient<0,02K và đá tan: khuấy52s/không khuấy3217s, thời gian mô hình chưa hiệu chuẩn, không là benchmark thiết bị.

| File được rà soát | SHA-256 lúc kiểm |
|---|---|
| `dist/l3/thermal-physics.js` | `09fe79ebd4f90b33e25b40606efaa4d0a2be6124e5f3728b4fb482fba6e6b880` |
| `checks/l3-thermal-physics-v84.mjs` | `d51b8f7723df2becd7b5d16b4cb1119dce7dde51a0f8b203b0737c894abb0ef5` |
| `dist/l3/apparatus-registry.js` | `cdbddcbb32d6155d49e3f9d2a15ddf221745cd69cce4b10f2be80917902d78e1` |
| `dist/l3/thermal-three.js` | `b43a9eae69d0024267a72e5a3863a69b1da39ad0d793fea0fd0e19c215f400db` |

Nếu hash renderer thay đổi sau mốc này, root cần đối chiếu diff của các điểm contact/geometry đã nêu; không gắn nguyên kết quả source review cho một mesh đã thay khác mà chưa xem. Các oracle nhiệt vẫn có thể giữ giá trị khi source solver/test không đổi, nhưng không thay thế visual regression.
