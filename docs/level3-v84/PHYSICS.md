# Mô hình nhiệt lượng kế pilot v84

Ngày 12/11/2026. Mã nguồn: `dist/l3/thermal-physics.js`; kiểm độc lập: `checks/l3-thermal-physics-v84.mjs`. Đây là lõi mới cắm thêm, không sửa solver/catalog hoặc cách nhập phiên cũ. Chưa có nghiệm thu giáo viên/thiết bị thật; các bài vẫn PARTIAL đối với toàn bộ tám cổng L3.

## Hợp đồng

- `createState('ice'|'solid', config)`; `defaultConfig(activity)`; `DEFAULT_CONFIGS`: điều kiện đầu được xác thực, lỗi miền ném `RangeError`.
- `applyAction(state,event)` trả `{ok,state,reason,effects?}`. Lỗi không thay state; không tự đưa vật vào bình. Event dùng `type`/`actionType` và các trường trực tiếp hoặc `payloadSI`.
- `step(state,dtSeconds)` trả snapshot mới; `0≤dt≤60`, chia thành bước không quá 0,05s. Pause không gọi step. Không random, không phụ thuộc tốc độ khung hình hay tọa độ pixel.
- `observe(state)`: số đo đầu dò trễ/làm tròn tách khỏi trạng thái thật; `valid`, `representative`, `status`, `temperatureC`, `probeTemperatureC`, `trueWaterTemperatureC`, các giá trị Kelvin, khối lượng/thể tích, độ phân giải, miền đo và residual.
- `validateState(state)` trả `{ok,valid,errors}`: schema/model version, miền hữu hạn, ledger khởi tạo từ config, quan hệ node/alias, dung tích và bảo toàn. Đây không phải chữ ký chứng nhận lịch sử thao tác.
- `equilibrium(activity,config)` là oracle cho các lượng/vật ở nhiệt độ **đầu đã chỉ định**. `equilibriumFromState(state)` chỉ tính cân bằng của vật chất **đã nằm trong bình**, loại trừ nước chưa rót/đá chưa thả. Với vật rắn sau gia nhiệt phải dùng nhiệt độ thật lúc chuyển, không thay bằng nhiệt độ bể một cách tự động. UI không được dùng oracle làm đáp án hiển thị sẵn lúc mở bài.

`waterMassKg`, `iceMassKg`, năng lượng J, thời gian s và thể tích m³ theo SI. Nhiệt độ nội bộ mang hậu tố C để tránh thay đổi âm thầm ý nghĩa; hiệu nhiệt độ °C bằng K, quan sát xuất thêm K với `T_K=T_C+273,15`. Không gọi thể tích lít là m³. Nước `ρ=1000 kg/m³`, đá `ρ=917 kg/m³`; nhiệt dung nước 4180 J/(kg·K), ẩn nhiệt 334000 J/kg.

## Hai node nước và bình

Nước chia thành node gần dụng cụ/đá và node xa. Nước mới rót chia đều vào hai node; nước do đá tan đi vào node gần. Mỗi node gắn một nửa nhiệt dung bình. Đầu dò nhúng ở vùng gần đo nhiệt độ node gần. Giá trị bulk là trung bình nhiệt độ nước có trọng số khối lượng, không tự thay thế số đo đầu dò.

Đặt `C_n=m_n c_w+C_cal/2`, `C_f=m_f c_w+C_cal/2`. Trao đổi giữa hai node dùng nghiệm chính xác của hai nhiệt dung tuyến tính trong mỗi vi bước:

`Q = (T_f−T_n)/(1/C_f+1/C_n) · [1−exp(−K_mix(1/C_f+1/C_n)dt)]`.

`E_f←E_f−Q`, `E_n←E_n+Q`. Dấu của Q bảo đảm nhiệt chạy từ nóng sang lạnh. `K_mix=0,5+40·mixingIntensity` W/K. MixingIntensity thuộc [0,1], thao tác khuấy bổ sung cường độ, rồi giảm theo `exp(−dt/4s)` khi ngừng. Không có nhiệt cơ học do khuấy trong mô hình lí tưởng này. Không cần biết tọa độ cử chỉ để suy ra số đo: root chuyển cử chỉ vòng tròn thành command cường độ và plugin chỉ đổi tốc độ trao đổi.

## A — nước và đá 0°C

Trong node gần, `Qdot=(1,5+15·mixingIntensity)·T_near` W khi còn đá. Mỗi vi bước lấy `Q=min(Qdot·dt, m_ice L_f, C_n T_near)`, tăng khối lượng nước `Q/L_f`, giảm khối lượng đá tương ứng và trừ đúng Q khỏi nội năng nước/bình node gần. Cập nhật nhiệt độ bằng năng lượng mới chia nhiệt dung mới. Đây là tích phân hữu hạn bảo toàn enthalpy; không dựng hàm tan theo hoạt ảnh.

Mốc enthalpy: nước lỏng 0°C có 0 J/kg; đá 0°C có `−L_f J/kg`. Vì vậy `E= C_n T_n + C_f T_f − m_ice L_f`, cộng nguồn nước/đá ngoài bình trong ledger toàn hệ. Cân bằng sau cùng đối chiếu độc lập:

- `Q_available=m_w c_w T_w0+C_cal T_cal0`.
- Nếu `Q_available<m_i L_f`: `T_eq=0°C`, `m_ice,left=m_i−Q_available/L_f`.
- Nếu đủ nhiệt: `T_eq=(Q_available−m_i L_f)/[(m_w+m_i)c_w+C_cal]`.

Khi `T_cal0=T_w0`, công thức trùng đặc tả. Ccal mặc định 0; config Ccal>0 phải ghi nhiệt độ ban đầu của bình. Không tự bỏ nhiệt dung bình để làm số liệu suy ra đúng.

## B — vật rắn và nước

Vật rắn có `C_s=m_s c_s`; khi đặt bằng kẹp vào nước, trao đổi chính xác hai nhiệt dung giữa vật và node gần với `K_s=2+12·mixingIntensity` W/K. Node xa tiếp tục trao đổi theo mô hình trên. Cân bằng hệ cách nhiệt nằm giữa các nhiệt độ đầu.

Bể gia nhiệt là một reservoir ở nhiệt độ chỉ định, không phải làm nóng tức thời. Khi vật nằm trong bể:

`T_s(t+dt)=T_bath+[T_s(t)−T_bath]exp(−10dt/C_s)`.

Năng lượng vào/ra do bể được ghi ở ledger. Nhiệt kế ở bể đo nhiệt độ bể; đặt tiếp xúc vật (`placement='solid'`) mới đo nhiệt độ vật với độ trễ. Vật chưa cân bằng với bể không tự có cùng nhiệt độ bể. Chuyển vào nước yêu cầu trước đó vật nằm trong kẹp; thả trực tiếp từ khay/bể bị từ chối. Vật đặt trên bàn không làm thay đổi nhiệt lượng nước.

Mặc định không thất thoát môi trường. Config nâng cao `solidAirCoolingWPerK>0` áp dụng Newton cooling cho vật trên khay/bàn/kẹp, với năng lượng trao đổi được ghi. Không thêm tổn thất nước/bình hoặc trộn dữ kiện chế độ nâng cao vào công thức lí tưởng mà không nêu rõ. Từ số đo cân bằng sau khi đã đồng đều:

`c_s=(m_w c_w+C_cal)(T_f−T_w0)/[m_s(T_s0−T_f)]`.

Nhiệt độ `T_s0` là lúc chuyển vật. Đo quá sớm, đo node nước chưa đều, không tare hoặc bỏ qua Ccal có thể dẫn đến kết quả suy ra sai; plugin không sửa dữ liệu học sinh.

## Dụng cụ, thao tác sai và ledger

- `place-vessel {placed}` đặt/rời vùng làm việc; không xóa vật chất. Trao đổi nhiệt của vật chất trong bình vẫn tiếp tục khi nhấc bình.
- `pour {massKg,target}` rút lượng hữu hạn khỏi nguồn cốc. Root tính lượng từ góc/thời gian rót, plugin giới hạn theo lượng còn lại. Rót xuống bàn là spill; rót vượt dung tích bình gây tràn và mất đúng khối lượng/enthalpy nước node thoát ra. `effects` ghi lượng thật chuyển/tràn. Bình chưa được đặt thì command bị từ chối.
- `add-ice {massKg,target:'vessel'}` cần đúng vùng nhận, đủ stock, bình đã đặt, còn dung tích. Sai chỗ/khối lượng/đầy bình không tự thành công. Stock ngoài bình gồm phần còn trên khay/cân/bàn; vị trí đồ họa do lớp tương tác quản lý, không tạo thêm mass.
- `move-solid {target}` có trạng thái khay/bể/kẹp/nước/bàn; rơi ngoài bình không làm nước nóng lên. Root không được tự đổi target sai thành water.
- `place-probe {placement}`: water/air/wall/bath/solid. Ngoài nước hoặc chạm thành không được trả số đo như nhiệt độ nước. T_probe tiến về nhiệt độ vật tiếp xúc theo hằng số tau, mặc định 2s. Làm tròn 0,1K mặc định; offset hiệu chuẩn do người học đặt được giữ lại, kể cả sai.
- `load-scale`, `tare`: cân lý tưởng có độ phân giải mặc định 0,001kg. Cốc rỗng 0,050kg, đĩa cân 0,005kg. Tare sai không tự bù. Số đo có dấu sau tare, miền −3..3kg. Nhiệt kế có miền −10..110°C, res/tau xuất cùng số đo. Chưa có noise ngẫu nhiên.
- `observe.valid` là tiếp xúc dụng cụ hợp lệ. `representative=false` nếu hai node nước lệch >0,2K; số đo địa phương vẫn được lưu đúng và có cờ, không thay bằng bulk. Probe không có nhiệt dung/backreaction trong pilot.

Toàn ledger gồm nước nguồn chưa rót, đá chưa thả, vật rắn và vật chất trong bình. Spill không biến mất khỏi sổ: `massResidual = mass_current+mass_spilled−mass_initial`, `energyResidual=energy_current+energyOut−energyIn−energy_initial`. Spill enthalpy nằm trong energyOut; ngoại nhiệt bể và trao đổi không khí được ghi rõ. Những đại lượng này dùng kiểm toán, không biến thành câu trả lời tự động cho học sinh.

## Bằng chứng kiểm toán hiện tại

Lệnh `node checks/l3-thermal-physics-v84.mjs` đạt 61.503 assertion trên Node 24.22.1, bao gồm N-01…N-06, hai node không đều/đầu dò trễ, sai thao tác immutable, tràn/rót ngoài nguồn, tare đúng/sai, gia nhiệt hữu hạn/kẹp/chuyển vật nguội, Ccal>0, thất thoát vật rắn có chủ đích, bước thời gian và JSON restart, nhập NaN/vô cực/âm/ledger sai.

| Oracle | Kết quả |
|---|---|
| N-01, 0,20kg nước 40°C + 0,020kg đá | 29,099608525445845°C (làm tròn 3 chữ số thập phân: 29,100°C) |
| N-02, 0,20kg nước 20°C + 0,10kg đá | 0°C, đá còn 0,049940119760479046kg |
| Hai cường độ khuấy với N-01 | Cùng bulk equilibrium trong 1e−8K; tiêu chí gradient<0,02K/đá tan: 52s so với 3217s |
| Sai số tích lũy lớn nhất trong fixtures | 1,317e−9J và 9,55e−15kg |

Dung sai assert ledger: 1e−5J, 1e−10kg; equilibrium bulk 1e−8K, các công thức tĩnh 1e−12K; node mixing/bath là nghiệm tuyến tính trong từng bước, đá dùng bounded finite-step enthalpy. Các con số thời gian do conductance minh họa quyết định, **không phải số đo hiệu suất hoặc thời gian của nhiệt lượng kế thật**. Kết quả này chỉ là bằng chứng F1/F2 số học, không thay e2e/thiết bị/sư phạm.

## Giới hạn

Hai node nhiệt là xấp xỉ, không phải CFD hoặc trường nhiệt không gian chính xác. Không mô phỏng nước sôi, bay hơi, đá dưới 0°C, siêu lạnh, nhiệt dung kẹp/nhiệt kế, thất thoát bình hoặc chuyển pha vật rắn. Các miền cơ sở giới hạn nhiệt độ 0–95°C; đầu dò không rút nhiệt. Hệ số trao đổi không được hiệu chuẩn cho thiết bị thật. Không tuyên bố đạt L3-08 hoặc 300/300 L3 từ các test này.
