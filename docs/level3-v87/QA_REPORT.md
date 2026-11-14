# Kiểm thử nhiệt lượng kế v87

Ngày14/11/2026 (UTC+7). Node24.19.0; Chromium154.0.8037.57 trênLinux, WebGL2 quaANGLE/SwiftShader. CDPtouch và viewport là giả lập, không thiết bị thật. ManifestSHA-256 trong từng báo cáo xác định chính xác nguồn đã kiểm; sourcebaseHEAD trước commit là3e68307.

## Lệnh và bằng chứng

| Lệnh | Kết quả trên nguồn cuối | Bằng chứng |
|---|---|---|
| `npm run check` | Exit0; sourceStable | `evidence/npm-check-final.json`, log cùng tên |
| `node checks/thermal-geometry-v87.mjs` |18capacity/201cup/94hydro/12spout/61pour/38guards | Bao gồm trong npmcheck |
| `node checks/thermal-compartments-v87.mjs` |180state hợp lệ,8state giả và8import giả bị từ chối | npmcheck |
| `node checks/thermal-spatial-v87.mjs` |41 kiểm tra; cả witness3D màXY bỏ lọt | npmcheck |
| `node checks/thermal-motion-v87.mjs` |Kéo bị chặn không tạo khuấy; vòng được chấp nhận có tác động | npmcheck |
| `node checks/thermal-overflow-v87.mjs` |76.379 assertions; tràn/melting/mini100mL/đá và vật rắn | npmcheck |
| `node checks/calibrated-oracles-v87.mjs` |Hai oracle chuẩn trên apparatusv2 | npmcheck |
| `python checks/browser-thermal-v87.py --swiftshader --out work/thermal-v87/verified` |17/17 nhóm đạt trên cùng20hash nguồn | `evidence/browser-final.json` |
| `python checks/browser-thermal-extra-v87.py --out work/thermal-v87/extra-verified` |3/3 luồng đạt | `evidence/browser-extra.json` |
| `python checks/browser-thermal-migration-v87.py --out work/thermal-v87/migration-verified` |2/2 ca đạt | `evidence/browser-migration.json` |
| `python checks/browser-thermal-viewports-v87.py --out work/thermal-v87/viewports-verified` |18/18 bố cục đạt | `evidence/browser-viewports.json` |
| `python checks/browser-thermal-storage-v86.py --out work/thermal-v87/storage-verified` |4/4 ca đạt trên mãv87 | `evidence/browser-storage.json` |
| `node checks/site-security-v63.mjs` |306HTML/500publictextassets | Chạy riêng; không cần khóaAPI |
| `node scripts/check-public-assets.mjs` |500publictextassets | Chạy riêng |
| `git diff --check` |Sạch trước commit | Kiểm riêng |

17 nhóm chính bao gồm: gián đoạn mainthread2s không rơi thời gian; log5000events; cavity/liquid actualBufferGeometry tích phân tetrahedron độc lập và kiểm closededges; cốc dưới mép không rót; capacity100mL/600mL/10L; chuột vàCDPtouch thả đá/khuấy/đầu dò/ghi≥5 điểm; gắp–gia nhiệt–chuyển vật; mẫu quá cỡ; collision/recovery dữ liệu cũ; CSV/JSON tải thật/fileinputimport/reload; cận cảnh vàraycast sauresize; orbit/wheel;VI/EN/theme/logo/route/lifecycle;2Dkeyboard;pointercancel/lostcapture;320/390/844viewporttouch;WebGLdisabled/contextlossfallback.

3 luồng bổ sung dùngUI thực: mẫu1g vàkẹp, recoverykhông tách mẫu đang giữ, kẹp rỗng không cân/chuyển mẫu từxa;590g nước+20g đá tràn10g/1672J cóconditionflag; fixture vật lí hợp lệ tại180s rồi10 bướcUI xác nhận tràn trong lúc tan vàconditionsSI. Fixture được tạo bằngmodule tin cậy trước mở trang, không setter của model đang chạy. Migration dùngfixturephiênv1; malformed/quota giữ bytegốc. Các fixture không giả làm dữ liệu đo của học sinh.

Viewport320/375/390/414/430/768/1024/1440/1920 cho cả2 hoạt động: không tràn ngang, nút hiển thị có kích thước tối thiểu44px,WebGL còn hoạt động vàstate vật lí giữ nguyên khiresize. Đây không bằng chứngiOS/Android thật hay bàn phím ảo.

## Oracle và sai số

-200g nước40°C+20g đá0°C,Ccal=0: T≈29,0996085254°C, hết đá.
-200g nước20°C+100g đá0°C: T≈0°C, đá còn0,04994011976kg.
-Oracle nhiệt trên apparatusv2 giữ khuấy trong7200s tiếp cận hữu hạn; dung sai1e−4K/1e−6kg. Không giả định một lần khuấy duy trìtrộn suốt phiên. Residual năng lượng hai ca≤1,32e−9J; khối lượng≤9,55e−15kg.
-Tràn580g+20gđá:0g;590g+20gđá:10g/1672J. Các test năng lượng đối chiếu enthalpy riêng từngnode và ledgertoànphiên.
-Geometry dùng sốFloat32 thực củaWebGL, kiểmvolumetolerance max(2e−10m³,3e−5×volume). Đây tolerance hình ảnh, khônglàmtròn model. Testpuregeometry có dung sai chặt hơn.

## Review độc lập đã thực hiện

- `physics_v87_review`: phát hiện3 lỗi chặn (tan grounded vượt capacity, xả cạnnode ngắt trao đổi nhiệt, kẹp rỗng tác động mẫu từxa) và1lỗi recovery. Sau sửa chạy lại reprogrounded600s, miniice/solid và suites; không thấy blocker mới trong phạm vi đó. Repro600s có600/600state hợp lệ, nước0,3252011871kg, tràn0,0313760253kg, residualmax6,55e−10J.
- `ui_qa_v87_review`: xem ảnhdesktop/mobile/darkEN, kiểmguard/lifecycle/keyboard/focus/touch, đối chiếu manifest của17nhómverified và4báo cáo companion với mã cuối; tất cả khớp. NêuP2nhãn/LCDnhỏ khi overviewmobile, cóClose-up/readoutHTML. Đợtreview17approved đầu là lịch sử, khôngdùng thay bằngchứng verified sau sửa.
- Agent chính chạy suite cuối, đối chiếuhash, tổng hợpdiff và chịu trách nhiệm phát hành. Không coi reviewNode/DOM là testbrowser/hardware.

## Provenance và phần chưa nghiệm thu

`evidence/verification-summary.json` phân biệt lượt cuối với approved/intermediate bịthaythế. Lượt check bị dừng đểsửa lỗi không được tínhPASS; extra cũ bị bác vì source đổi trong lúc chạy phải chạy lại. Bảnthửoracle ban đầu giả địnhkhuấy1lầnduylâu, không đúng tốcđộ tiếp cận; finalfixture nêu rõ duytrìkhuấy, không đổi phương trình để épđápán.

0PASS/1PARTIAL/299NOTTESTED/0BLOCKED=300ID. SốPASSnumeric/DOM trong loglegacy không phảiPASSL3. Giáoviên, thiếtbịthật, SafariiOS, AndroidChrome thật, P95/30FPS phầncứng và chứngnhậnWCAG đềuNOTTESTED trong đợt này. Solverlegacy `voltmeter_design` cóknownissue lịch sử đượclogriêng, chưa sửa.

Các ảnh before/after và log nằm cùngevidence. Ảnh trước là riêngcanvas1050×609 ởbaselinev86; ảnhsautoàntrang1440px vàmobile320px, không phải soảnhpixel cùngkhung. Geometryđượcđối chiếu bằngoracletrianglesriêng. Trạng thái ở thời điểmchụp bằngchứng:localđãkiểm; PR/CI/Pages/live được xác nhận riêng saucommit và ghi trongPR cùng báo cáo phát hành. Không suytrạngthái deployment từlocalPASS.
