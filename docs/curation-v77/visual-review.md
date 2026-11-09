# Rà soát trực quan và diễn tả mô hình — thư viện v77

Ngày: 2026-11-08. Chỉ đọc mã và kiểm tra giao diện; không sửa runtime, ảnh gốc, banner, font hoặc mô hình.

## Phạm vi bằng chứng

- Đọc AGENTS.md, CODEX_HANDOFF.md và các module dựng hình liên quan.
- Tạo contact sheet từ đúng ảnh có sẵn `dist/previews/v74/*.webp`; đây là ảnh QA, không thay ảnh nguồn.
- Đã trực tiếp xem 160 thumbnail đầu (60 bản gốc và 100 atlas đầu). Các sheet cho 161–300 cũng được tạo nhưng không dùng để tuyên bố đã thẩm định toàn bộ.
- Chromium headless 1440×1000: mở và chạy ngắn 8 bài: gas, decay, lever, oscillation, lens, electric, kirchhoff_loop, binding_energy. Cả 8 không phát sinh pageerror trong lượt này. Đây không phải kiểm thử đầy đủ tham số hoặc nghiệm thu khoa học tất cả bài.
- Riêng oscillation dùng `#shmCirclePanel` (SVG liên kết); `#visual` ẩn đúng thiết kế. Lượt script đầu dừng khi chờ sai selector này, sau đó đã chạy lại 5 bài còn lại bằng selector đúng.
- Chromium390×844 giả lập cảm ứng: gas, lens, oscillation đều không có pageerror hoặc tràn ngang trong lượt mở. Screenshot oscillation-mobile.png xác nhận sơ đồ liên kết hiện rõ; trường bounding_box sau chụp trả None nên không dùng trường đó làm bằng chứng ẩn/hiện. Không kiểm thử phần cứng iPhone/Safari thật.

## Đề xuất chính

Thư viện chính nên dùng danh sách tuyển chọn 40 bài dưới đây, giữ các URL, dữ liệu phiên và tài nguyên của 260 bài còn lại trong thư viện bổ sung. Con số 40 là phạm vi biên tập hợp lý, không phải chứng nhận rằng 40 bài đã được nghiệm thu đầy đủ hoặc 260 bài còn lại đều sai.

### Nhóm cơ học (11)

energy, uniform, acceleration, horizontal, newton, incline, collision, circular, lever, hooke, friction.

### Nhóm dao động và sóng (8)

oscillation, pendulum, damped, resonance, wave, interference, standing, sound.

### Nhóm điện học (8)

electric, ohm, capacitor, series, parallel, joule, resistivity, internalresistance.

### Nhóm quang học (4)

reflection, refraction, lens, young.

### Nhóm nhiệt học (4)

boyle, gas, calorimetry, phasechange.

### Nhóm điện từ và hạt nhân (5)

magnetic, induction, solenoid, ac, decay.

Bộ này có dụng cụ hoặc dấu hiệu quan sát riêng, bao phủ các hiện tượng khác nhau và có hệ tham số/quan hệ đo tương ứng. Không nên thêm bài chỉ để đạt đủ số lượng.

## Vấn đề cụ thể

| Ưu tiên | Phạm vi | Bằng chứng | Xử lý đề xuất |
|---|---|---|---|
| P1, diễn tả bản chất | kirchhoff_loop | Browser thực chỉ có một nguồn, một điện trở, một đồng hồ; tiêu đề là hai nguồn ngược chiều. `kirchhoff_loop-stage.png`; `atlas-scenes.js` case circuit | Đưa khỏi danh sách chính; cần vẽ đủ hai nguồn và cực tính trước khi quảng bá là mô phỏng hoàn chỉnh. Không kết luận công thức sai. |
| P1/P2, diễn tả cấu trúc | potentiometer, voltage_divider, diode_model, meter_loading, max_power, battery_series, battery_parallel | Preview129–136 dùng cùng rig nguồn/điện trở/đồng hồ; source circuit không tạo diode, hai nguồn hay nhóm pin/nhánh. `atlas-a-4.jpg` | Nhóm cần cải thiện biểu diễn; giữ route và tài liệu. Cần sơ đồ mạch có cấu phần đúng riêng cho từng bài. |
| P2, diễn tả bản chất | binding_energy | Browser là một chùm bi cùng màu, không có phân biệt proton/neutron, so sánh khối lượng hay liên hệ trực quan Δm→E. `binding_energy-stage.png` | Giữ phần bài tập/quan hệ trong bổ sung; chưa nên quảng bá như hoạt động trực quan chính. |
| P2, diễn tả bản chất | charge_quantization, debroglie | Preview126/149 và source particles dùng chùm bi chung; debroglie chỉ thay tỉ lệ chùm, không dựng sóng tương ứng; lượng tử hóa chỉ thay số hạt. Chưa browser hai bài này | Cần kiểm tiếp, chưa đưa chính. Tránh gọi là lỗi phương trình khi bằng chứng chỉ về hình. |
| P2, diễn tả quá trình | adiabatic | Source gas giữ vị trí mẫu j cố định, đổi chiều rộng và màu; thumbnail147 rất nhạt. Không thấy hoạt động nén/nóng động học tương ứng trong rig này | Bài chuyên sâu cần dựng piston/công/trạng thái. Chưa browser, không kết luận lỗi chạy. |
| P2, thừa dụng cụ | Hầu hết bài3D | addInteractionRig thêm các ray tham số vào mọi sân; defaults handles=true nhưng labels=false. Trong gas/decay/lever/lens chúng giống hai thước/đường ray vô danh, không phải dụng cụ của hiện tượng | Ẩn ray tổng quát mặc định; bật bằng Hiển thị→Điểm kéo thông số. Giữ form HTML và kéo trực tiếp đối tượng thật. |
| P2, dễ đọc | lens | Mặc định iso3D làm tia/thấu kính nhỏ và nhạt, lưới phủ qua hình. `lens-stage.png` | Ưu tiên front/2D khi mở quang hình học; vẫn cho chuyển3D. Không bỏ hình học tia đã có. |
| P2, quá tải mặc định | electric | Browser mode Coulomb hiển thị cùng lúc trục3D/lưới, đường sức, vectơ và ray, nhãn O/z/mốc chồng gần điện tích. `electric-stage.png` | Tắt đường sức trong mode lực Coulomb mặc định, ưu tiên không lưới trong3D; giữ các toggle để khảo sát sâu. |
| P2, nhãn | oscillation | Ở pha0 các nhãn M/A/H nằm sát hoặc chồng nhau. `oscillation-stage.png` | Đẩy nhãn điểm ra vị trí không trùng mốc trục, đặc biệt các pha0,π. |

## Các bài bổ sung không được gọi là hỏng chỉ vì không ở danh sách chính

- projectile có góc ném riêng; horizontal có độ cao ban đầu riêng. Đây là hai mục tiêu khác nhau, không phải trùng hoàn toàn. Để projectile ở bổ sung là lựa chọn phạm vi, không phải lỗi mô hình.
- buoyancy, pressure, prism, polarization, transformer là các hiện tượng độc lập; nên gọi là chuyên đề bổ sung.
- ray_slab, apparent_depth, lens_power, lenses_contact, magnifier, telescope, microscope, fiber_acceptance có dựng tia/hình học riêng dễ nhận ra trong ảnh thực; module optics-geometry-v65 chứa dữ liệu dựng hình riêng. Không gom chúng với các rig atlas mạch điện thiếu cấu trúc.
- spring_period và oscillator_energy phù hợp làm khảo sát tiếp sau oscillation; string_resonance/standing_phase là khảo sát sâu hơn standing. Có thể giảm độ dày thư viện chính mà vẫn giữ đường dẫn đến khảo sát hỗ trợ.
- isobaric, isochoric, firstlaw, kinetic là các mục tiêu/quá trình nhiệt học có ý nghĩa. Chuyển bổ sung không đồng nghĩa gas đã thay thế đầy đủ mọi quy trình đó.

## Giữ gas và decay với cách giải thích đúng

- gas dùng makeGas riêng: mẫu chuyển động theo √T, phản xạ biên trong không gian co theo V, số mẫu minh họa theo n; không phải gas rig atlas tĩnh. Dễ thấy container, phân tử và nhiệt kế ở browser. Mẫu hạt minh họa không phải số phân tử thật, và không phải mô phỏng va chạm phân tử đầy đủ.
- decay dùng 216 tuổi thọ mũ xác định theo các phân vị; đổi trạng thái sống/đã phân rã và thanh tỉ phần N/N0. Mô hình biểu diễn quần thể kỳ vọng, không phải chuỗi đếm Poisson độc lập giữa các lần chạy. Giữ với nhãn kỳ vọng/mẫu minh họa; không hứa đo thống kê ngẫu nhiên.

## Tệp bằng chứng

- `core60-1.jpg` đến `core60-3.jpg`: 60 bài đầu.
- `atlas-a-1.jpg` đến `atlas-a-4.jpg`: bài61–140.
- `atlas-b-1.jpg`: bài141–160.
- `*-stage.png`, `*-run.png`: sân trước/sau lượt chạy ngắn của 8 bài.
- `browser-results.json`: nhật ký5 bài cuối, consoleerror và tràn ngang desktop;3 bài đầu có ảnh và log lệnh, script dừng trước ghi JSON.
- `mobile-results.json`, `*-mobile.png`: 3 mẫu Chromium390px giả lập đã hoàn tất, không phải iPhone thật.

Không có runtime edits từ tác giả báo cáo này. Không chạy npm run check vì không có thay đổi runtime; root thực hiện kiểm thử tích hợp của nhánh v77.
