# Bài soạn v50.1: 300 thí nghiệm

Ngày biên soạn: 19/10/2026. Đây là lớp nội dung sư phạm mới, giữ nguyên 300 mô hình và các công thức tính hiện hành.

Mỗi bài có mục tiêu, giải thích nguyên nhân, kiến thức chuẩn bị, biến khảo sát, quy trình, giới hạn, lỗi dễ nhầm, câu hỏi và lời giải đóng mặc định. Bài được mở ở **Hướng dẫn thí nghiệm** hoặc tab **Mô hình**. Chọn **Đến biến khảo sát** để tới điều khiển; thao tác này giữ điều kiện đầu và bảng đo.

## Nguồn và phạm vi

Đã khảo sát kho 322 mục University Physics của OpenStax. Danh mục tham chiếu chọn 140 mục phù hợp, bổ sung mao dẫn từ College Physics 2e, Poisson từ Introductory Statistics 2e, và hai tài liệu khóa 18.369 của MIT: tổng **144 nguồn**. SHA-256 khớp các tài liệu đã tải, ngày truy cập được lưu trong registry. Bản soạn là diễn giải và thiết kế hoạt động riêng; không sao chép nội dung nguồn thành bài học.

Nguồn chủ yếu đối chiếu nguyên lý nền; chưa đủ để gọi mọi biến thể phi tuyến, điện tử hoặc hiện đại là đã được chuyên gia thẩm định. Không đồng nhất 105 bài nền tảng với bản đồ đối chiếu từng tiết SGK; 195 bài còn lại giữ nhãn mở rộng.

- [OpenStax University Physics](https://github.com/openstax/osbooks-university-physics-bundle)
- [OpenStax College Physics](https://github.com/openstax/osbooks-college-physics-bundle)
- [OpenStax Introductory Statistics](https://github.com/openstax/osbooks-introductory-statistics-bundle)
- [MIT 18.369 — Steven G. Johnson](https://github.com/mitmath/18369)
- [Registry nguồn theo từng bài](../dist/lessons/references.js)
- [Quy trình biên tập tiếp](lesson-authoring.md)

## Phạm vi kiểm tra

Kiểm tra tự động khẳng định đủ và đúng ID của 300 bài, nội dung riêng, điều khiển có thật, nguồn có thể truy vết, markup an toàn, lời giải đóng, LaTeX và danh mục khoa học không bị sửa. Kiểm tra mô hình/DOM chạy trên cả 300 bài; Chromium kiểm tra các trường hợp đại diện và lỗi tải. Lần kiểm tra v50: `npm run check` đạt; 61.200 khung phát và 17.185 khung kiểm tra toàn ray trên 300 mô hình (hình học CPU), đủ 388 trang sách và hash của 301 tệp âm thanh. Hai bộ Chromium đạt: 14 bài đại diện có KaTeX thật, lời giải bằng bàn phím, giữ ghi chép khi tải chậm/lỗi, điều hướng, biến khảo sát, chiều rộng mobile; hồi quy thư viện/giáo viên và fallback 3D/WebGL.

Chưa có phản biện độc lập từng kết luận, thí điểm trong lớp, kiểm tra iPhone/Safari thật, hoặc bản thu âm mới cho toàn bộ nội dung. Audio hiện có được giữ và ghi rõ là thuyết minh mô hình. Các bài mở rộng cần phản biện sâu trước khi dùng làm chuẩn chấm điểm.

## Danh mục biên tập

Cột biến là điều khiển chính gợi ý; mỗi lượt tiếp theo có thể đổi biến khác theo quy trình. Đọc nguồn riêng của bài trong hướng dẫn, không suy ra nguồn trực tiếp chỉ từ việc có trong bảng này. Tất cả hàng có trạng thái: đã biên soạn; chưa có người phản biện độc lập ký duyệt.

| # | ID | Bài | Bản soạn | Biến chính | Nguồn |
| --- | --- | --- | --- | --- | --- |
| 1 | `energy` | Cơ năng & sự chuyển hóa | [01](../dist/lessons/batch-01.js) | Thời điểm t (t) | m58314 |
| 2 | `oscillation` | Dao động điều hòa | [01](../dist/lessons/batch-01.js) | Thời điểm t (t) | m58361 |
| 3 | `wave` | Sóng cơ & bước sóng | [01](../dist/lessons/batch-01.js) | Tần số f (f) | m58369 |
| 4 | `electric` | Điện tích & điện trường | [01](../dist/lessons/batch-01.js) | Hoành độ điểm P (px) | m58415, m58722 |
| 5 | `ohm` | Khảo sát định luật Ohm | [01](../dist/lessons/batch-01.js) | Hiệu điện thế U (u) | m58732 |
| 6 | `capacitor` | Tụ điện: tích & phóng điện | [01](../dist/lessons/batch-01.js) | Thời điểm t (t) | m58457, m58450 |
| 7 | `boyle` | Định luật Boyle | [01](../dist/lessons/batch-01.js) | Thể tích V (v) | m58391 |
| 8 | `gas` | Khí lí tưởng & chuyển động phân tử | [01](../dist/lessons/batch-01.js) | Nhiệt độ T (tK) | m58391 |
| 9 | `uniform` | Chuyển động thẳng đều | [01](../dist/lessons/batch-01.js) | Thời điểm (t) | m58282 |
| 10 | `acceleration` | Chuyển động biến đổi đều | [01](../dist/lessons/batch-01.js) | Thời điểm (t) | m58285 |
| 11 | `horizontal` | Ném ngang | [01](../dist/lessons/batch-01.js) | Tốc độ ném (v0) | m58291 |
| 12 | `projectile` | Ném xiên | [01](../dist/lessons/batch-01.js) | Góc ném (angle) | m58291 |
| 13 | `newton` | Định luật II Newton | [01](../dist/lessons/batch-01.js) | Lực tác dụng (force) | m58297 |
| 14 | `incline` | Mặt phẳng nghiêng | [01](../dist/lessons/batch-01.js) | Góc nghiêng (angle) | m58304 |
| 15 | `collision` | Va chạm & động lượng | [01](../dist/lessons/batch-01.js) | Hệ số hồi phục (e) | m58321, m58320 |
| 16 | `circular` | Chuyển động tròn | [01](../dist/lessons/batch-01.js) | Tốc độ (v) | m58305 |
| 17 | `lever` | Cân bằng đòn bẩy | [01](../dist/lessons/batch-01.js) | Cánh tay trái (l1) | m58340 |
| 18 | `hooke` | Định luật Hooke | [01](../dist/lessons/batch-01.js) | Khối lượng tải (m) | m58342, m58361 |
| 19 | `pendulum` | Con lắc đơn | [01](../dist/lessons/batch-01.js) | Chiều dài dây (length) | m58364 |
| 20 | `damped` | Dao động tắt dần | [01](../dist/lessons/batch-01.js) | Thời điểm (t) | m58365 |
| 21 | `resonance` | Cộng hưởng | [01](../dist/lessons/batch-01.js) | Tần số kích thích (f) | m58366 |
| 22 | `interference` | Giao thoa sóng | [01](../dist/lessons/batch-01.js) | Tọa độ x của P (probeX) | m58372 |
| 23 | `standing` | Sóng dừng | [01](../dist/lessons/batch-01.js) | Số bó sóng (mode) | m58373 |
| 24 | `sound` | Độ cao & biên độ âm | [01](../dist/lessons/batch-01.js) | Tần số âm (f) | m58375 |
| 25 | `series` | Điện trở nối tiếp | [01](../dist/lessons/batch-01.js) | Điện trở R₁ (r1) | m58454 |
| 26 | `parallel` | Điện trở song song | [01](../dist/lessons/batch-01.js) | Điện trở R₁ (r1) | m58454 |
| 27 | `joule` | Tác dụng nhiệt của dòng điện | [01](../dist/lessons/batch-01.js) | Thời điểm (t) | m58734 |
| 28 | `magnetic` | Lực từ lên dây dẫn | [01](../dist/lessons/batch-01.js) | Góc với từ trường (angle) | m58742 |
| 29 | `induction` | Cảm ứng điện từ | [01](../dist/lessons/batch-01.js) | Thời điểm (t) | m58472 |
| 30 | `decay` | Phân rã phóng xạ | [01](../dist/lessons/batch-01.js) | Thời điểm (t) | m58609 |
| 31 | `freefall` | Rơi tự do | [02](../dist/lessons/batch-02.js) | Độ cao thả (h0) | m58286 |
| 32 | `friction` | Ma sát trên mặt ngang | [02](../dist/lessons/batch-02.js) | Lực kéo (force) | m58304 |
| 33 | `work` | Công & công suất | [02](../dist/lessons/batch-02.js) | Lực kéo (force) | m58314, m58719 |
| 34 | `impulse` | Xung lượng của lực | [02](../dist/lessons/batch-02.js) | Lực tác dụng (force) | m58285, m58319 |
| 35 | `buoyancy` | Lực đẩy Archimedes | [02](../dist/lessons/batch-02.js) | Phần thể tích chìm (fraction) | m58356 |
| 36 | `pressure` | Áp suất theo độ sâu | [02](../dist/lessons/batch-02.js) | Độ sâu đầu đo (depth) | m58353 |
| 37 | `reflection` | Phản xạ ánh sáng | [02](../dist/lessons/batch-02.js) | Góc tới (angle) | m58509 |
| 38 | `refraction` | Khúc xạ ánh sáng | [02](../dist/lessons/batch-02.js) | Góc tới (angle) | m58510 |
| 39 | `tir` | Phản xạ toàn phần | [02](../dist/lessons/batch-02.js) | Góc tới (angle) | m58511 |
| 40 | `lens` | Thấu kính mỏng | [02](../dist/lessons/batch-02.js) | Khoảng cách vật (distance) | m58530 |
| 41 | `mirror` | Gương cầu | [02](../dist/lessons/batch-02.js) | Khoảng cách vật (distance) | m58528 |
| 42 | `prism` | Tán sắc qua lăng kính | [02](../dist/lessons/batch-02.js) | Góc chiết quang (angle) | m58512 |
| 43 | `young` | Giao thoa khe Young | [02](../dist/lessons/batch-02.js) | Bước sóng (wavelength) | m58537 |
| 44 | `diffraction` | Nhiễu xạ một khe | [02](../dist/lessons/batch-02.js) | Bước sóng (wavelength) | m58543 |
| 45 | `polarization` | Phân cực ánh sáng | [02](../dist/lessons/batch-02.js) | Góc hai trục (angle) | m58525 |
| 46 | `thermalexpansion` | Sự nở dài vì nhiệt | [02](../dist/lessons/batch-02.js) | Nhiệt độ (temp) | m58386 |
| 47 | `calorimetry` | Cân bằng nhiệt | [02](../dist/lessons/batch-02.js) | Nhiệt độ nước nóng (hot) | m58387 |
| 48 | `phasechange` | Nóng chảy của nước đá | [02](../dist/lessons/batch-02.js) | Thời điểm (t) | m58388 |
| 49 | `heattransfer` | Dẫn nhiệt qua thanh | [02](../dist/lessons/batch-02.js) | Nhiệt độ đầu nóng (hot) | m58389 |
| 50 | `isobaric` | Quá trình đẳng áp | [02](../dist/lessons/batch-02.js) | Nhiệt độ khí (temp) | m58391 |
| 51 | `isochoric` | Quá trình đẳng tích | [02](../dist/lessons/batch-02.js) | Nhiệt độ khí (temp) | m58391 |
| 52 | `firstlaw` | Nguyên lí I nhiệt động lực học | [02](../dist/lessons/batch-02.js) | Nhiệt lượng nhận (heat) | m58397 |
| 53 | `kinetic` | Động năng phân tử | [02](../dist/lessons/batch-02.js) | Nhiệt độ (temp) | m58392 |
| 54 | `resistivity` | Điện trở của dây dẫn | [02](../dist/lessons/batch-02.js) | Chiều dài dây (length) | m58731 |
| 55 | `internalresistance` | Nguồn điện thực | [02](../dist/lessons/batch-02.js) | Suất điện động (emf) | m58453 |
| 56 | `bridge` | Cầu Wheatstone | [02](../dist/lessons/batch-02.js) | Điện trở R₁ (r1) | m58456 |
| 57 | `solenoid` | Từ trường trong ống dây | [02](../dist/lessons/batch-02.js) | Số vòng dây (turns) | m58466 |
| 58 | `lorentz` | Hạt tích điện trong từ trường | [02](../dist/lessons/batch-02.js) | Điện tích (charge) | m58740 |
| 59 | `transformer` | Máy biến áp lí tưởng | [02](../dist/lessons/batch-02.js) | Số vòng sơ cấp (n1) | m58494 |
| 60 | `ac` | Dòng điện xoay chiều | [02](../dist/lessons/batch-02.js) | Điện áp cực đại (u0) | m58484 |
| 61 | `vector_sum` | Tổng hợp hai lực | [03](../dist/lessons/batch-03.js) | Lực tác dụng (force) | m58279, m58295 |
| 62 | `vector_components` | Phân tích lực theo hai trục | [03](../dist/lessons/batch-03.js) | Lực tác dụng (force) | m58279, m58295 |
| 63 | `relative_motion` | Chuyển động trong hai hệ quy chiếu | [03](../dist/lessons/batch-03.js) | Vận tốc vật (speed) | m58282, m58285 |
| 64 | `average_speed` | Tốc độ trung bình trên hai chặng | [03](../dist/lessons/batch-03.js) | Tốc độ chặng đầu (v1) | m58282, m58285 |
| 65 | `braking` | Phanh xe và quãng đường dừng | [03](../dist/lessons/batch-03.js) | Tốc độ đầu (speed) | m58285 |
| 66 | `drag_fall` | Rơi có lực cản tuyến tính | [03](../dist/lessons/batch-03.js) | Khối lượng (mass) | m58306 |
| 67 | `atwood` | Máy Atwood | [03](../dist/lessons/batch-03.js) | Khối lượng bên trái (m1) | m58297, m58303 |
| 68 | `pulley` | Ròng rọc động và lợi về lực | [03](../dist/lessons/batch-03.js) | Khối lượng (mass) | m58355, m58303 |
| 69 | `elevator` | Cân trong thang máy | [03](../dist/lessons/batch-03.js) | Khối lượng (mass) | m58306 |
| 70 | `banked_turn` | Đường vòng nghiêng lí tưởng | [03](../dist/lessons/batch-03.js) | Bán kính đường vòng (radius) | m58305, m58348 |
| 71 | `vertical_circle` | Vật ở đỉnh vòng tròn thẳng đứng | [03](../dist/lessons/batch-03.js) | Khối lượng (mass) | m58305, m58348 |
| 72 | `gravitational_force` | Hấp dẫn giữa hai quả cầu | [03](../dist/lessons/batch-03.js) | Khối lượng cầu 1 (m1) | m58415, m58345 |
| 73 | `orbit` | Vệ tinh trên quỹ đạo tròn | [03](../dist/lessons/batch-03.js) | Bán kính quỹ đạo (radius) | m58348 |
| 74 | `escape_speed` | Tốc độ thoát khỏi hành tinh | [03](../dist/lessons/batch-03.js) | Bán kính hành tinh (radius) | m58348 |
| 75 | `kepler` | Quy luật Kepler III | [03](../dist/lessons/batch-03.js) | Bán trục lớn (axis) | m58350 |
| 76 | `torque_angle` | Mômen lực theo góc đặt lực | [03](../dist/lessons/batch-03.js) | Lực tác dụng (force) | m58719, m58331 |
| 77 | `rotational_inertia` | Mômen quán tính của đĩa | [03](../dist/lessons/batch-03.js) | Khối lượng (mass) | m58329 |
| 78 | `angular_accel` | Gia tốc góc dưới mômen không đổi | [03](../dist/lessons/batch-03.js) | Mômen lực (torque) | m58329 |
| 79 | `rolling` | Lăn không trượt | [03](../dist/lessons/batch-03.js) | Khối lượng (mass) | m58335, m58329 |
| 80 | `spring_energy` | Công biến dạng lò xo | [03](../dist/lessons/batch-03.js) | Độ cứng (stiffness) | m58314, m58361 |
| 81 | `elastic_modulus` | Kéo dãn một sợi dây | [03](../dist/lessons/batch-03.js) | Lực tác dụng (force) | m58342, m58361 |
| 82 | `hydraulic_press` | Máy ép thủy lực | [03](../dist/lessons/batch-03.js) | Lực tác dụng (force) | m58355 |
| 83 | `communicating` | Bình thông nhau với hai chất lỏng | [03](../dist/lessons/batch-03.js) | Khối lượng riêng cột 1 (density1) | m58353, m58358 |
| 84 | `torricelli` | Tia nước từ lỗ nhỏ | [03](../dist/lessons/batch-03.js) | Độ cao mặt nước trên lỗ (height) | m58358 |
| 85 | `spring_period` | Chu kì con lắc theo khối lượng | [03](../dist/lessons/batch-03.js) | Khối lượng (mass) | m58361 |
| 86 | `oscillator_energy` | Năng lượng theo pha dao động | [03](../dist/lessons/batch-03.js) | Thời điểm (t) | m58361 |
| 87 | `phase_difference` | Hai dao động lệch pha | [03](../dist/lessons/batch-03.js) | Thời điểm (t) | m58361, m58372 |
| 88 | `beat` | Phách của hai tần số gần nhau | [03](../dist/lessons/batch-03.js) | Thời điểm (t) | m58372, m58380 |
| 89 | `doppler_source` | Doppler khi nguồn tiến lại | [03](../dist/lessons/batch-03.js) | Tốc độ nguồn tiến về đầu thu (source) | m58381 |
| 90 | `doppler_observer` | Doppler khi người nghe chuyển động | [03](../dist/lessons/batch-03.js) | Tốc độ đầu thu hướng về nguồn (observer) | m58381 |
| 91 | `string_speed` | Tốc độ sóng trên dây căng | [04](../dist/lessons/batch-04.js) | Lực căng (tension) | m58370 |
| 92 | `string_resonance` | Các họa âm của dây đàn | [04](../dist/lessons/batch-04.js) | Chiều dài (length) | m58373 |
| 93 | `open_pipe` | Cộng hưởng ống sáo hai đầu hở | [04](../dist/lessons/batch-04.js) | Chiều dài (length) | m58378 |
| 94 | `closed_pipe` | Ống khí một đầu kín | [04](../dist/lessons/batch-04.js) | Chiều dài (length) | m58378 |
| 95 | `sound_level` | Mức cường độ âm và thang decibel | [04](../dist/lessons/batch-04.js) | Số mũ của I (W/m²) (exponent) | m58377 |
| 96 | `intensity_distance` | Âm từ nguồn điểm theo khoảng cách | [04](../dist/lessons/batch-04.js) | Khoảng cách tới nguồn (distance) | m58377 |
| 97 | `standing_phase` | Tổng hai sóng ngược chiều | [04](../dist/lessons/batch-04.js) | Thời điểm (t) | m58369, m58373 |
| 98 | `reflection_wave` | Phản xạ tại đầu dây cố định | [04](../dist/lessons/batch-04.js) | Thời điểm (t) | m58370 |
| 99 | `wave_packet` | Chồng chất và bó sóng | [04](../dist/lessons/batch-04.js) | Thời điểm (t) | m58369, m58381 |
| 100 | `spring_parallel` | Hai lò xo ghép song song | [04](../dist/lessons/batch-04.js) | Độ cứng lò xo 1 (k1) | m58361 |
| 101 | `spring_series` | Hai lò xo ghép nối tiếp | [04](../dist/lessons/batch-04.js) | Độ cứng lò xo 1 (k1) | m58361 |
| 102 | `resonance_power` | Công suất hấp thụ gần cộng hưởng | [04](../dist/lessons/batch-04.js) | Tần số lực cưỡng bức (frequency) | m58366 |
| 103 | `ray_slab` | Tia sáng qua bản mặt song song | [04](../dist/lessons/batch-04.js) | Góc tới (angle) | m58510 |
| 104 | `apparent_depth` | Độ sâu biểu kiến của vật dưới nước | [04](../dist/lessons/batch-04.js) | Độ sâu thật (depth) | m58510 |
| 105 | `lens_power` | Độ tụ của thấu kính | [04](../dist/lessons/batch-04.js) | Tiêu cự (focal) | m58530 |
| 106 | `lenses_contact` | Hệ hai thấu kính sát nhau | [04](../dist/lessons/batch-04.js) | Độ tụ kính 1 (power1) | m58530 |
| 107 | `magnifier` | Kính lúp khi ngắm chừng ở vô cực | [04](../dist/lessons/batch-04.js) | Tiêu cự kính (focal) | m58533 |
| 108 | `telescope` | Kính thiên văn khúc xạ | [04](../dist/lessons/batch-04.js) | Tiêu cự vật kính (objective) | m58534 |
| 109 | `microscope` | Kính hiển vi quang học | [04](../dist/lessons/batch-04.js) | Tiêu cự vật kính (objective) | m58534 |
| 110 | `grating` | Cách tử nhiễu xạ | [04](../dist/lessons/batch-04.js) | Số vạch trên mm (lines) | m62592 |
| 111 | `resolving_power` | Giới hạn phân giải của khẩu độ tròn | [04](../dist/lessons/batch-04.js) | Đường kính khẩu độ (diameter) | m58548 |
| 112 | `brewster` | Góc Brewster | [04](../dist/lessons/batch-04.js) | Chiết suất môi trường 2 (index) | m58525 |
| 113 | `inverse_square_light` | Độ rọi từ nguồn sáng điểm | [04](../dist/lessons/batch-04.js) | Khoảng cách (distance) | m58505 |
| 114 | `mirror_rotation` | Xoay gương và độ lệch tia phản xạ | [04](../dist/lessons/batch-04.js) | Góc xoay gương (rotation) | m58509 |
| 115 | `pinhole` | Ảnh qua lỗ nhỏ | [04](../dist/lessons/batch-04.js) | Khoảng cách vật (distance) | m58505 |
| 116 | `fiber_acceptance` | Khẩu độ số của sợi quang | [04](../dist/lessons/batch-04.js) | Chiết suất lõi (core) | mit-18369-wavepackets, m58511 |
| 117 | `uniform_field` | Hạt trong điện trường đều | [04](../dist/lessons/batch-04.js) | Cường độ điện trường (field) | m58722 |
| 118 | `potential_point` | Điện thế của điện tích điểm | [04](../dist/lessons/batch-04.js) | Điện tích nguồn (charge) | m58722, m58433 |
| 119 | `potential_pair` | Điện thế trên trục của lưỡng cực | [04](../dist/lessons/batch-04.js) | Độ lớn mỗi điện tích (charge) | m58431, m58433 |
| 120 | `dipole_torque` | Lưỡng cực trong điện trường đều | [04](../dist/lessons/batch-04.js) | Mômen lưỡng cực (moment) | m58418, m58295 |
| 121 | `capacitor_plate` | Tụ điện phẳng theo hình học | [05](../dist/lessons/batch-05.js) | Diện tích mỗi bản (area) | m58448 |
| 122 | `dielectric` | Điện môi khi tụ nối nguồn | [05](../dist/lessons/batch-05.js) | Hằng số điện môi (dielectric) | m58451 |
| 123 | `capacitor_series` | Tụ điện ghép nối tiếp | [05](../dist/lessons/batch-05.js) | Điện dung C₁ (c1) | m58449, m58448 |
| 124 | `capacitor_parallel` | Tụ điện ghép song song | [05](../dist/lessons/batch-05.js) | Điện dung C₁ (c1) | m58449, m58448 |
| 125 | `capacitor_force` | Lực hút giữa hai bản tụ | [05](../dist/lessons/batch-05.js) | Diện tích bản (area) | m58450 |
| 126 | `charge_quantization` | Lượng tử hóa điện tích | [05](../dist/lessons/batch-05.js) | Số electron dư (electrons) | m58412 |
| 127 | `drift` | Vận tốc trôi của electron | [05](../dist/lessons/batch-05.js) | Cường độ dòng điện (current) | m58731, m58730 |
| 128 | `wire_stretch` | Kéo dây dẫn khi thể tích không đổi | [05](../dist/lessons/batch-05.js) | Tỉ số chiều dài mới / cũ (factor) | m58731, m58730 |
| 129 | `potentiometer` | Biến trở con chạy | [05](../dist/lessons/batch-05.js) | Phần chiều dài đang dùng (fraction) | m58455 |
| 130 | `voltage_divider` | Mạch chia áp có tải | [05](../dist/lessons/batch-05.js) | Điện trở trên (r1) | m58455 |
| 131 | `kirchhoff_loop` | Hai nguồn ngược chiều trong một vòng | [05](../dist/lessons/batch-05.js) | Suất điện động 1 (source1) | m58455 |
| 132 | `diode_model` | Diode theo mô hình ngưỡng | [05](../dist/lessons/batch-05.js) | Điện áp nguồn có dấu (voltage) | m58601 |
| 133 | `meter_loading` | Vôn kế làm thay đổi mạch đo | [05](../dist/lessons/batch-05.js) | Điện trở vôn kế (meter) | m58456, m58455 |
| 134 | `max_power` | Công suất tải và điện trở trong | [05](../dist/lessons/batch-05.js) | Điện trở tải (load) | m58734, m58455 |
| 135 | `battery_series` | Bộ pin ghép nối tiếp | [05](../dist/lessons/batch-05.js) | Số pin (cells) | m58453, m58455 |
| 136 | `battery_parallel` | Bộ pin giống nhau ghép song song | [05](../dist/lessons/batch-05.js) | Số pin (cells) | m58453, m58455 |
| 137 | `wire_field` | Từ trường quanh dây thẳng dài | [05](../dist/lessons/batch-05.js) | Dòng điện có dấu (current) | m58461 |
| 138 | `wire_pair` | Lực giữa hai dòng điện song song | [05](../dist/lessons/batch-05.js) | Dòng dây 1 (current1) | m58461 |
| 139 | `ampere_loop` | Tuần hoàn từ trường quanh dây | [05](../dist/lessons/batch-05.js) | Bán kính đường khảo sát (radius) | m58465, m58461 |
| 140 | `flux_angle` | Từ thông theo góc pháp tuyến | [05](../dist/lessons/batch-05.js) | Góc B với pháp tuyến (angle) | m58423, m58472 |
| 141 | `inductor_energy` | Năng lượng của cuộn cảm | [05](../dist/lessons/batch-05.js) | Độ tự cảm (inductance) | m58751 |
| 142 | `rl_response` | Đóng mạch RL | [05](../dist/lessons/batch-05.js) | Thời điểm (t) | m58752 |
| 143 | `lc_oscillator` | Dao động điện từ LC | [05](../dist/lessons/batch-05.js) | Thời điểm (t) | m58754 |
| 144 | `rlc_resonance` | Cộng hưởng mạch RLC nối tiếp | [05](../dist/lessons/batch-05.js) | Tần số nguồn (frequency) | m58658 |
| 145 | `newton_cooling` | Làm nguội theo định luật Newton | [05](../dist/lessons/batch-05.js) | Thời điểm (t) | m58389 |
| 146 | `carnot` | Giới hạn hiệu suất động cơ nhiệt | [05](../dist/lessons/batch-05.js) | Nhiệt độ nguồn nóng (hot) | m58406 |
| 147 | `adiabatic` | Nén khí đoạn nhiệt thuận nghịch | [05](../dist/lessons/batch-05.js) | Tỉ số thể tích đầu / sau (ratio) | m58391, m58401 |
| 148 | `photoelectric` | Hiệu ứng quang điện ngoài | [05](../dist/lessons/batch-05.js) | Bước sóng chiếu (wavelength) | m58762 |
| 149 | `debroglie` | Bước sóng de Broglie của electron | [05](../dist/lessons/batch-05.js) | Điện áp tăng tốc (voltage) | m58765, m58766 |
| 150 | `binding_energy` | Độ hụt khối và năng lượng liên kết | [05](../dist/lessons/batch-05.js) | Độ hụt khối (defect) | m58608 |
| 151 | `table_hanging` | Xe trên bàn nối vật treo | [06](../dist/lessons/batch-06.js) | Khối lượng treo (hanging) | m58297, m58303 |
| 152 | `contact_carts` | Lực tiếp xúc giữa hai xe | [06](../dist/lessons/batch-06.js) | Lực đẩy xe sau (force) | m58297, m58303 |
| 153 | `accelerating_pendulum` | Dây treo cân bằng trên xe gia tốc | [06](../dist/lessons/batch-06.js) | Gia tốc xe (acc) | m58297, m58341 |
| 154 | `double_incline` | Hai vật trên hai mặt nghiêng nối dây | [06](../dist/lessons/batch-06.js) | Góc dốc trái (left) | m58297, m58303 |
| 155 | `free_wedge` | Nêm giật lùi khi vật trượt | [06](../dist/lessons/batch-06.js) | Góc nêm (angle) | m58297, m58303 |
| 156 | `ladder_balance` | Thang tựa tường và ngưỡng trượt | [06](../dist/lessons/batch-06.js) | Góc thang với sàn (angle) | m58340, m58341 |
| 157 | `beam_supports` | Dầm hai gối chịu tải lệch tâm | [06](../dist/lessons/batch-06.js) | Vị trí tải / chiều dài dầm (position) | m58340, m58341 |
| 158 | `three_strings` | Nút ba dây và hai lực căng | [06](../dist/lessons/batch-06.js) | Góc dây trái với phương ngang (left) | m58340, m58341 |
| 159 | `slide_tip` | Khối hộp: trượt trước hay lật trước? | [06](../dist/lessons/batch-06.js) | Độ cao đặt lực (height) | m58304, m58341 |
| 160 | `metacentric` | Ổn định nghiêng của khối nổi | [06](../dist/lessons/batch-06.js) | Bề rộng khối nổi (width) | m58356, m58358 |
| 161 | `collision_2d` | Va chạm đàn hồi xiên hai quả cầu | [06](../dist/lessons/batch-06.js) | Góc lệch quả cầu tới (angle) | m58321 |
| 162 | `ballistic_pendulum` | Con lắc đạn và năng lượng mất đi | [06](../dist/lessons/batch-06.js) | Khối lượng đạn (bullet) | m58314, m58321 |
| 163 | `newton_cradle` | Dãy bi Newton và truyền động lượng | [06](../dist/lessons/batch-06.js) | Số bi tới đồng thời (input) | m58321 |
| 164 | `moving_wall` | Phản xạ từ vách đang chuyển động | [06](../dist/lessons/batch-06.js) | Vận tốc vách (wall) | m58321 |
| 165 | `collision_spring` | Va chạm mềm rồi nén lò xo | [06](../dist/lessons/batch-06.js) | Tốc độ xe tới (speed) | m58314, m58321 |
| 166 | `yoyo_drop` | Yo-yo tháo dây khi rơi | [06](../dist/lessons/batch-06.js) | Bán kính trục / bán kính thân (ratio) | m58329, m58336 |
| 167 | `rolling_race` | Đĩa, vành và cầu lăn trên dốc | [06](../dist/lessons/batch-06.js) | Góc dốc (angle) | m58329, m58336 |
| 168 | `angular_momentum` | Thu tay trên đĩa quay | [06](../dist/lessons/batch-06.js) | Bán kính hai vật cầm tay (radius) | m58337, m58336 |
| 169 | `atwood_inertia` | Máy Atwood với ròng rọc có quán tính | [06](../dist/lessons/batch-06.js) | Khối lượng ròng rọc đặc (pulleyMass) | m58329, m58336 |
| 170 | `gyroscope` | Tiến động chậm của con quay | [06](../dist/lessons/batch-06.js) | Tốc độ quay riêng (omega) | m58338, m58336 |
| 171 | `rotating_planet` | Trọng trường trên hành tinh quay | [06](../dist/lessons/batch-06.js) | Vĩ độ (latitude) | m58346, m58348 |
| 172 | `elliptic_orbit` | Vệ tinh trên quỹ đạo elip | [06](../dist/lessons/batch-06.js) | Góc quỹ đạo từ cận điểm (angle) | m58348 |
| 173 | `binary_orbit` | Hai thiên thể quanh khối tâm | [06](../dist/lessons/batch-06.js) | Khối lượng thiên thể 2 / 1 (massRatio) | m58348 |
| 174 | `hohmann` | Chuyển quỹ đạo Hohmann | [06](../dist/lessons/batch-06.js) | Bán kính quỹ đạo đích (target) | m58348 |
| 175 | `tidal_gradient` | Chênh lệch hấp dẫn và thủy triều | [06](../dist/lessons/batch-06.js) | Khoảng cách tới thiên thể gây triều (distance) | m58351, m58348 |
| 176 | `venturi` | Ống Venturi và áp kế vi sai | [06](../dist/lessons/batch-06.js) | Tiết diện lớn / nhỏ (ratio) | m58358 |
| 177 | `siphon` | Xi-phông và áp suất tại đỉnh | [06](../dist/lessons/batch-06.js) | Đỉnh ống cao hơn mặt thoáng (top) | m58358 |
| 178 | `poiseuille` | Dòng tầng trong ống mao quản | [06](../dist/lessons/batch-06.js) | Bán kính ống (radius) | m58359 |
| 179 | `stokes_settling` | Bi nhỏ lắng trong chất lỏng nhớt | [06](../dist/lessons/batch-06.js) | Bán kính bi (radius) | m58306, m58359 |
| 180 | `capillary_rise` | Dâng mao dẫn và góc tiếp xúc | [06](../dist/lessons/batch-06.js) | Bán kính mao quản (radius) | cp-m42197, m58359, m58358 |
| 181 | `coupled_pendulums` | Hai dao động ghép và trao đổi năng lượng | [07](../dist/lessons/batch-07.js) | Thời điểm (t) | m58361, m58366 |
| 182 | `large_pendulum` | Con lắc đơn biên độ lớn | [07](../dist/lessons/batch-07.js) | Thời điểm (t) | m58364 |
| 183 | `physical_pendulum` | Con lắc vật lí: chọn điểm treo | [07](../dist/lessons/batch-07.js) | Khoảng cách điểm treo tới trọng tâm (pivot) | m58364 |
| 184 | `torsion_pendulum` | Con lắc xoắn | [07](../dist/lessons/batch-07.js) | Thời điểm (t) | m58361, m58364 |
| 185 | `u_tube_oscillation` | Dao động cột lỏng trong ống chữ U | [07](../dist/lessons/batch-07.js) | Thời điểm (t) | m58361, m58366 |
| 186 | `vibration_absorber` | Bộ hấp thụ rung hai bậc tự do | [07](../dist/lessons/batch-07.js) | Tần số lực kích thích (frequency) | m58366 |
| 187 | `base_isolation` | Cách rung khi đế dao động | [07](../dist/lessons/batch-07.js) | Tần số kích thích / tần số riêng (ratio) | m58366 |
| 188 | `parametric_oscillation` | Kích thích tham số bằng độ cứng biến thiên | [07](../dist/lessons/batch-07.js) | Thời điểm (t) | m58366 |
| 189 | `duffing` | Lò xo phi tuyến Duffing | [07](../dist/lessons/batch-07.js) | Thời điểm (t) | m58366 |
| 190 | `van_der_pol` | Tự dao động Van der Pol | [07](../dist/lessons/batch-07.js) | Thời điểm (t) | m58366 |
| 191 | `string_boundary` | Phản xạ và truyền sóng qua mối nối dây | [07](../dist/lessons/batch-07.js) | Mật độ dài dây thứ hai (density2) | m58370, m58371 |
| 192 | `bead_scattering` | Sóng tán xạ tại hạt nặng trên dây | [07](../dist/lessons/batch-07.js) | Khối lượng hạt (mass) | m58370, m58371 |
| 193 | `water_refraction` | Khúc xạ sóng nước nông | [07](../dist/lessons/batch-07.js) | Góc tới (angle) | m58358, m58371 |
| 194 | `string_power` | Công suất sóng trên dây theo biên độ | [07](../dist/lessons/batch-07.js) | Biên độ sóng (amplitude) | m58371 |
| 195 | `dispersive_packet` | Vận tốc nhóm của sóng nước | [07](../dist/lessons/batch-07.js) | Bước sóng trung tâm (wavelength) | mit-18369-wavepackets, m58369, m58371 |
| 196 | `helmholtz` | Cộng hưởng Helmholtz của bình có cổ | [07](../dist/lessons/batch-07.js) | Thể tích khoang (volume) | m58375, m58378 |
| 197 | `harmonic_timbre` | Tổng hợp họa âm tạo âm sắc | [07](../dist/lessons/batch-07.js) | Pha của âm cơ bản (phase) | m58375 |
| 198 | `room_reverberation` | Thời gian vang và hấp thụ âm | [07](../dist/lessons/batch-07.js) | Hệ số hấp thụ trung bình (absorption) | m58375 |
| 199 | `sound_tdoa` | Định vị âm bằng chênh lệch thời gian tới | [07](../dist/lessons/batch-07.js) | Hoành độ nguồn (x) | m58375 |
| 200 | `mach_cone` | Nón Mach của nguồn siêu thanh | [07](../dist/lessons/batch-07.js) | Số Mach (mach) | m58382, m58375 |
| 201 | `charged_ring` | Điện trường trên trục vòng tích điện | [07](../dist/lessons/batch-07.js) | Tọa độ trên trục (distance) | m58416 |
| 202 | `charged_rod` | Trường trên đường trung trực thanh tích điện | [07](../dist/lessons/batch-07.js) | Khoảng cách tới tâm thanh (distance) | m58416 |
| 203 | `charged_disk` | Điện trường trên trục đĩa tích điện | [07](../dist/lessons/batch-07.js) | Khoảng cách từ mặt đĩa (distance) | m58416 |
| 204 | `charged_solid_sphere` | Bên trong quả cầu cách điện tích điện đều | [07](../dist/lessons/batch-07.js) | Khoảng cách từ tâm (distance) | m58425 |
| 205 | `charged_plane` | Bước nhảy điện trường qua mặt phẳng điện | [07](../dist/lessons/batch-07.js) | Tọa độ có dấu qua mặt phẳng (position) | m58425 |
| 206 | `electric_turning` | Điểm quay đầu trong lực đẩy điện | [07](../dist/lessons/batch-07.js) | Tốc độ ban đầu hướng về nguồn (speed) | m58314, m58430 |
| 207 | `equipotential_map` | Bản đồ điện thế và hướng điện trường | [07](../dist/lessons/batch-07.js) | Hoành độ đầu dò (x) | m58433, m58430 |
| 208 | `three_charge_energy` | Năng lượng lắp ráp ba điện tích | [07](../dist/lessons/batch-07.js) | Điện tích thứ ba (third) | m58431, m58430 |
| 209 | `electric_work_paths` | Công điện trường trên hai đường đi | [07](../dist/lessons/batch-07.js) | Độ cao điểm vòng (detour) | m58433, m58430 |
| 210 | `connected_spheres` | Hai cầu dẫn nối dây và chia điện tích | [07](../dist/lessons/batch-07.js) | Bán kính cầu 1 (radius1) | m58426, m58430 |
| 211 | `conducting_shell` | Vỏ cầu dẫn có điện tích trong khoang | [08](../dist/lessons/batch-08.js) | Khoảng cách tới tâm (distance) | m58426, m58448 |
| 212 | `coaxial_capacitor` | Tụ điện đồng trục | [08](../dist/lessons/batch-08.js) | Bán kính trụ ngoài (outer) | m58448 |
| 213 | `spherical_capacitor` | Tụ điện hai mặt cầu đồng tâm | [08](../dist/lessons/batch-08.js) | Bán kính cầu ngoài (outer) | m58448 |
| 214 | `isolated_dielectric` | Chèn điện môi khi tụ đã ngắt nguồn | [08](../dist/lessons/batch-08.js) | Hằng số điện môi (dielectric) | m58451, m58448 |
| 215 | `layered_dielectric` | Hai lớp điện môi trong khe tụ | [08](../dist/lessons/batch-08.js) | Tỉ phần bề dày lớp 1 (fraction) | m58451, m58448 |
| 216 | `two_meshes` | Hai vòng mạch có nhánh chung | [08](../dist/lessons/batch-08.js) | Suất điện động vòng 2 (source2) | m58455 |
| 217 | `star_delta` | Biến đổi điện trở sao–tam giác | [08](../dist/lessons/batch-08.js) | Nhánh sao a (r1) | m58454, m58455 |
| 218 | `resistor_ladder` | Mạng thang điện trở hữu hạn | [08](../dist/lessons/batch-08.js) | Số tầng (stages) | m58454, m58455 |
| 219 | `unbalanced_bridge` | Cầu điện lệch cân bằng có điện kế | [08](../dist/lessons/batch-08.js) | Điện trở trên trái (r1) | m58456, m58455 |
| 220 | `thevenin_norton` | Nguồn tương đương Thévenin–Norton | [08](../dist/lessons/batch-08.js) | Điện trở tải (load) | m58455 |
| 221 | `ammeter_shunt` | Mở rộng thang ampe kế bằng shunt | [08](../dist/lessons/batch-08.js) | Dòng toàn thang cần đo (range) | m58456 |
| 222 | `voltmeter_design` | Tạo vôn kế từ điện kế | [08](../dist/lessons/batch-08.js) | Điện áp toàn thang (range) | m58456 |
| 223 | `emf_compensation` | Đo suất điện động bằng phương pháp bù | [08](../dist/lessons/batch-08.js) | Chiều dài cân bằng nguồn chưa biết (unknownLength) | m58456 |
| 224 | `rc_meter_loading` | Vôn kế hữu hạn khi đo tụ đang nạp | [08](../dist/lessons/batch-08.js) | Thời điểm (t) | m58457, m58456 |
| 225 | `kelvin_four_wire` | Đo điện trở bằng bốn dây Kelvin | [08](../dist/lessons/batch-08.js) | Điện trở mẫu (sample) | m58456 |
| 226 | `two_stage_rc` | Hai tầng RC được cách li bằng bộ đệm | [08](../dist/lessons/batch-08.js) | Thời điểm (t) | m58457, m58756 |
| 227 | `charge_sharing` | Nối hai tụ đã tích điện khác nhau | [08](../dist/lessons/batch-08.js) | Điện dung tụ 1 (c1) | m58449, m58756 |
| 228 | `rlc_free` | RLC tự do: ba chế độ tắt dần | [08](../dist/lessons/batch-08.js) | Thời điểm (t) | m58365, m58756 |
| 229 | `rc_square` | Tụ RC nhận chuỗi xung vuông | [08](../dist/lessons/batch-08.js) | Thời điểm (t) | m58457, m58756 |
| 230 | `flyback_diode` | Ngắt cuộn cảm qua diode hồi tiếp | [08](../dist/lessons/batch-08.js) | Thời điểm (t) | m58752, m58756 |
| 231 | `half_rectifier` | Chỉnh lưu nửa chu kì | [08](../dist/lessons/batch-08.js) | Thời điểm (t) | m58601 |
| 232 | `bridge_rectifier` | Cầu chỉnh lưu toàn chu kì | [08](../dist/lessons/batch-08.js) | Thời điểm (t) | m58601 |
| 233 | `rectifier_filter` | Tụ lọc và độ gợn sau chỉnh lưu | [08](../dist/lessons/batch-08.js) | Điện dung lọc (capacity) | m58601 |
| 234 | `zener_regulator` | Ổn áp Zener và giới hạn dòng | [08](../dist/lessons/batch-08.js) | Điện áp nguồn (input) | m58601 |
| 235 | `diode_clipper` | Xén tín hiệu bằng hai diode đối song | [08](../dist/lessons/batch-08.js) | Pha tín hiệu (phase) | m58601 |
| 236 | `rc_lowpass` | Bộ lọc RC thông thấp | [08](../dist/lessons/batch-08.js) | Tần số khảo sát (frequency) | m58457, m58658 |
| 237 | `rc_highpass` | Bộ lọc RC thông cao | [08](../dist/lessons/batch-08.js) | Tần số khảo sát (frequency) | m58457, m58658 |
| 238 | `rlc_bandwidth` | Bộ lọc RLC thông dải và băng thông | [08](../dist/lessons/batch-08.js) | Tần số khảo sát (frequency) | m58658 |
| 239 | `ac_capacitance_bridge` | Cầu xoay chiều đo điện dung | [08](../dist/lessons/batch-08.js) | Điện trở tỉ lệ R1 (r1) | m58658 |
| 240 | `power_factor` | Bù hệ số công suất cho tải cảm | [08](../dist/lessons/batch-08.js) | Điện dung bù song song (capacity) | m58658 |
| 241 | `loop_axis` | Từ trường trên trục vòng dây tròn | [09](../dist/lessons/batch-09.js) | Tọa độ trên trục (distance) | m58464 |
| 242 | `helmholtz_coils` | Cuộn Helmholtz và vùng trường gần đều | [09](../dist/lessons/batch-09.js) | Tọa độ đầu dò trên trục (distance) | m58464 |
| 243 | `finite_solenoid` | Ống dây hữu hạn: trường gần hai đầu | [09](../dist/lessons/batch-09.js) | Tọa độ đầu dò trên trục (distance) | m58466, m58464 |
| 244 | `toroid` | Từ trường và tự cảm của cuộn xuyến | [09](../dist/lessons/batch-09.js) | Bán kính vị trí khảo sát (distance) | m58466, m58464 |
| 245 | `compass_coil` | La bàn trong trường Trái Đất và cuộn dây | [09](../dist/lessons/batch-09.js) | Dòng cuộn có dấu (current) | m58464 |
| 246 | `velocity_selector` | Bộ lọc vận tốc điện–từ | [09](../dist/lessons/batch-09.js) | Tốc độ proton tới (speed) | m58745 |
| 247 | `mass_spectrometer` | Khối phổ từ tách hai đồng vị | [09](../dist/lessons/batch-09.js) | Khối lượng ion (massNumber) | m58745 |
| 248 | `cyclotron` | Cyclotron phi tương đối tính | [09](../dist/lessons/batch-09.js) | Cảm ứng từ (magnetic) | m58740, m58745 |
| 249 | `magnetic_helix` | Quỹ đạo xoắn ốc trong từ trường | [09](../dist/lessons/batch-09.js) | Góc vận tốc với từ trường (angle) | m58740, m58745 |
| 250 | `hall_voltage` | Hiệu ứng Hall và dấu hạt tải | [09](../dist/lessons/batch-09.js) | Cảm ứng từ có dấu (magnetic) | m58744 |
| 251 | `sliding_rod` | Thanh trượt trên ray và lực hãm | [09](../dist/lessons/batch-09.js) | Vận tốc thanh có dấu (speed) | m58477 |
| 252 | `magnetic_braking` | Hãm từ và cơ năng chuyển thành nhiệt | [09](../dist/lessons/batch-09.js) | Thời điểm (t) | m58477 |
| 253 | `coil_entering_field` | Khung dây đi qua vùng từ trường hữu hạn | [09](../dist/lessons/batch-09.js) | Thời điểm (t) | m58472, m58477 |
| 254 | `mutual_induction` | Hai cuộn dây và hỗ cảm | [09](../dist/lessons/batch-09.js) | Thời điểm (t) | m58747, m58477 |
| 255 | `faraday_disk` | Máy phát đĩa Faraday | [09](../dist/lessons/batch-09.js) | Tốc độ góc (omega) | m58477 |
| 256 | `em_plane_wave` | Điện trường và từ trường trong sóng phẳng | [09](../dist/lessons/batch-09.js) | Vị trí dọc hướng truyền (position) | m58498, m58500 |
| 257 | `poynting_energy` | Vectơ Poynting và năng lượng sóng | [09](../dist/lessons/batch-09.js) | Pha tại điểm quan sát (phase) | m58500 |
| 258 | `radiation_pressure` | Áp suất ánh sáng trên mặt hấp thụ và phản xạ | [09](../dist/lessons/batch-09.js) | Tỉ phần năng lượng phản xạ (reflectivity) | m58501, m58500 |
| 259 | `transmission_reflection` | Phản xạ điện áp trên đường truyền có tải | [09](../dist/lessons/batch-09.js) | Trở tải (load) | mit-18369-wavepackets, m58498, m58500 |
| 260 | `skin_depth` | Độ sâu thấm điện từ trong vật dẫn | [09](../dist/lessons/batch-09.js) | Tần số (frequency) | m58498, m58500 |
| 261 | `separated_lenses` | Hai thấu kính cách nhau và ảnh trung gian | [09](../dist/lessons/batch-09.js) | Khoảng cách hai thấu kính (separation) | m58530 |
| 262 | `camera_defocus` | Máy ảnh: khẩu độ và vòng nhòe | [09](../dist/lessons/batch-09.js) | Số khẩu độ f/N (fNumber) | m58532, m58530 |
| 263 | `eye_correction` | Mắt mô hình và kính sửa cận thị | [09](../dist/lessons/batch-09.js) | Khoảng cực viễn của mắt cận (farPoint) | m58531, m58530 |
| 264 | `spherical_aberration` | Cầu sai qua một mặt khúc xạ cầu | [09](../dist/lessons/batch-09.js) | Độ cao tia / bán kính cong (heightRatio) | m58510, m58530 |
| 265 | `chromatic_lens` | Sắc sai: tiêu cự phụ thuộc bước sóng | [09](../dist/lessons/batch-09.js) | Bước sóng (wavelength) | m58512, m58530 |
| 266 | `thin_film` | Màng mỏng và đảo pha phản xạ | [09](../dist/lessons/batch-09.js) | Bề dày màng (thickness) | m58540 |
| 267 | `newton_rings` | Vân Newton trong phản xạ | [09](../dist/lessons/batch-09.js) | Bán kính vị trí trên vòng vân (radius) | m58540, m58541 |
| 268 | `michelson` | Giao thoa kế Michelson: dịch gương đếm vân | [09](../dist/lessons/batch-09.js) | Độ dịch gương (mirror) | m58541 |
| 269 | `fabry_perot` | Khoang Fabry–Pérot và nhiều chùm truyền | [09](../dist/lessons/batch-09.js) | Khoảng cách hai gương (gap) | mit-18369-tcmt, mit-18369-wavepackets, m58540, m58541 |
| 270 | `fringe_visibility` | Độ tương phản vân và độ kết hợp | [09](../dist/lessons/batch-09.js) | Chênh quang lộ (path) | m58537, m58541 |
| 271 | `airy_pattern` | Toàn bộ vân Airy qua khẩu độ tròn | [10](../dist/lessons/batch-10.js) | Khoảng cách từ tâm ảnh (radial) | m58543, m58548 |
| 272 | `finite_double_slit` | Hai khe hữu hạn và đường bao nhiễu xạ | [10](../dist/lessons/batch-10.js) | Vị trí trên màn (position) | m58537, m58623 |
| 273 | `grating_resolution` | Phân giải hai vạch quang phổ bằng cách tử | [10](../dist/lessons/batch-10.js) | Số khe được chiếu sáng (slits) | m62592, m58623 |
| 274 | `wave_plate` | Bản trễ pha và phân cực elip | [10](../dist/lessons/batch-10.js) | Góc phân cực tới với trục nhanh (angle) | m58525 |
| 275 | `photoelasticity` | Quang đàn hồi giữa hai kính phân cực chéo | [10](../dist/lessons/batch-10.js) | Chênh ứng suất chính (stress) | m58525 |
| 276 | `convection_radiation` | Làm nguội do đối lưu và bức xạ | [10](../dist/lessons/batch-10.js) | Thời điểm (t) | m58389 |
| 277 | `radiative_balance` | Cân bằng hấp thụ và phát xạ nhiệt | [10](../dist/lessons/batch-10.js) | Hệ số hấp thụ bức xạ tới (absorptivity) | m58389 |
| 278 | `layered_wall` | Dẫn nhiệt qua tường hai lớp | [10](../dist/lessons/batch-10.js) | Bề dày lớp 1 (thickness1) | m58389 |
| 279 | `transient_heat_bar` | Thanh dẫn nhiệt: suy giảm phân bố ban đầu | [10](../dist/lessons/batch-10.js) | Thời điểm (t) | m58389 |
| 280 | `seebeck` | Suất nhiệt điện Seebeck | [10](../dist/lessons/batch-10.js) | Chênh nhiệt hai mối nối (difference) | m58396, m58389 |
| 281 | `otto_cycle` | Chu trình Otto lí tưởng | [10](../dist/lessons/batch-10.js) | Tỉ số nén (compression) | m58406, m58404 |
| 282 | `diesel_cycle` | Chu trình Diesel và tỉ số cắt | [10](../dist/lessons/batch-10.js) | Tỉ số cắt thể tích (cutoff) | m58406, m58404 |
| 283 | `stirling_regenerator` | Chu trình Stirling và bộ hồi nhiệt | [10](../dist/lessons/batch-10.js) | Hiệu quả hồi nhiệt (regeneration) | m58406, m58404 |
| 284 | `refrigerator` | Tủ lạnh: hệ số COP và công tiêu thụ | [10](../dist/lessons/batch-10.js) | Nhiệt độ ngăn lạnh (cold) | m58653 |
| 285 | `brayton_cycle` | Chu trình Brayton và công nén | [10](../dist/lessons/batch-10.js) | Tỉ số áp suất (pressureRatio) | m58406, m58404 |
| 286 | `maxwell_distribution` | Phân bố tốc độ Maxwell–Boltzmann | [10](../dist/lessons/batch-10.js) | Tốc độ khảo sát (speed) | m58394 |
| 287 | `two_level_boltzmann` | Hai mức năng lượng và phân bố Boltzmann | [10](../dist/lessons/batch-10.js) | Nhiệt độ (temperature) | m58408, m58394 |
| 288 | `brownian_motion` | Chuyển động Brown và độ dời bình phương | [10](../dist/lessons/batch-10.js) | Thời điểm (t) | m58394 |
| 289 | `vapor_pressure` | Áp suất hơi và Clausius–Clapeyron | [10](../dist/lessons/batch-10.js) | Nhiệt độ tuyệt đối (temperature) | m58388 |
| 290 | `van_der_waals` | Đẳng nhiệt khí Van der Waals | [10](../dist/lessons/batch-10.js) | Thể tích mol (volume) | m58391, m58394 |
| 291 | `hydrogen_lines` | Chuyển mức hydrogen và phổ vạch | [10](../dist/lessons/batch-10.js) | Mức n ban đầu (initial) | m58764, m58584 |
| 292 | `franck_hertz` | Franck–Hertz: mất năng lượng theo lượng | [10](../dist/lessons/batch-10.js) | Điện áp tăng tốc electron (voltage) | m58764, m58580 |
| 293 | `compton_scattering` | Tán xạ Compton và năng lượng giật lùi | [10](../dist/lessons/batch-10.js) | Góc tán xạ photon (angle) | m58763 |
| 294 | `electron_bragg` | Electron nhiễu xạ trên mặt tinh thể | [10](../dist/lessons/batch-10.js) | Điện áp tăng tốc (voltage) | m58765, m58580 |
| 295 | `quantum_box` | Giếng thế: năng lượng và mật độ xác suất | [10](../dist/lessons/batch-10.js) | Vị trí x/L (position) | m58580 |
| 296 | `decay_chain` | Chuỗi phân rã mẹ–con | [10](../dist/lessons/batch-10.js) | Thời điểm (t) | stats-m46961, m58609 |
| 297 | `alpha_recoil` | Phân rã alpha và giật lùi hạt nhân con | [10](../dist/lessons/batch-10.js) | Số khối hạt nhân mẹ (massNumber) | m58608, m58610 |
| 298 | `reaction_threshold` | Năng lượng Q và ngưỡng phản ứng | [10](../dist/lessons/batch-10.js) | Khối lượng trước trừ sau (defect) | m58610 |
| 299 | `gamma_attenuation` | Suy giảm gamma chùm hẹp qua vật liệu | [10](../dist/lessons/batch-10.js) | Bề dày vật liệu (thickness) | m58614, m58609 |
| 300 | `poisson_counting` | Số đếm phóng xạ và dao động Poisson | [10](../dist/lessons/batch-10.js) | Lần lấy mẫu (seed) | stats-m46961, m58609 |
