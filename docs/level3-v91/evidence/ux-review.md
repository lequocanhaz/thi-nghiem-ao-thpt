# Rà UX độc lập V91 — camera và hiển thị dụng cụ

Scope: hai hoạt động nhiệt, tập trung 3D/camera. Chỉ sửa `dist/l3/thermal-three.js` và thêm `checks/thermal-camera-v91.mjs`; không sửa controller/CSS/model, không commit.

## Lỗi tái hiện trước sửa

P1 theo mục7 rubric: chọn Cận cảnh bình khi nhiệt kế đã nhúng làm mất toàn bộ LCD phía trên canvas. Bốn viewport320/390/768/1440 đều thất bại; Y của các góc LCD từ−9 đến−86 CSSpx. DOM số đọc bên dưới vẫn có, nhưng dụng cụ thật bị cắt, gây hiểu lầm khi thao tác/quan sát.

Command: `python work/thermal-v91/ux/camera_probe.py --url http://127.0.0.1:4196 --only before --out work/thermal-v91/ux/before`. Report/ảnh `before/`. Port4196 đã có server dist khi thử khởi tạo; không giết/thay server đó. Các lượt sau dùng server4195 của root.

Nguyên nhân: focusTool chỉ tính bounds bình và dùng chiều cao trụcworld làm khoảng cách camera; không tính probe/stirrer đang trong bình hoặc projection theo hướng nhìn. Resize sau namedfocus không fit lại.

## Sửa

- Khi focus bình, bounds bao cả probe/stirrer đang trong miền bình; không kéo theo rack/dụng cụ chưa đặt.
- Purefit tính đủ8corners trong camera-space, bao cảdepth/aspect/currentdirection và10%margin. Không sửa bất kỳ vật thể/trạng thái/vị trí SI nào.
- Namedfocus có optional `focusId` trong khóa camera view-only. Resize/reload fit lại namedtarget theo aspect hiện tại; zoom/orbit/AltArrow xóa namedfocus và giữ manualcamera quaresize/reload. Khóa session/schema physics không đổi.
- Không fake mesh luôn trên cùng, không thay picking hoặc vật liệu.

## Bằng chứng

- `node checks/thermal-camera-v91.mjs`:2169assertions PASS. IndependentThreePerspective projection xác thực từngcorner của4loạibounds×6aspects×9hướng nhìn; domain/immutability/limit cases.
- `python work/thermal-v91/ux/camera_probe.py --url http://127.0.0.1:4195 --out work/thermal-v91/ux/accepted`:4/4LCDvisible; ở320px Y40..74 trongcanvas360px. RendererSHA trước/sau ổn định. Scopehash chỉ renderer vì root đang sửa controller đồng thời; không gọi đây là toànruntimefrozen.
- Lượt `after/` trướcaccepted có4PASSprojection nhưng thất bại global sourceStable do root sửa mã đồng thời; không dùng nó làm bản nghiệm thu.
- `python work/thermal-v91/ux/camera_state.py --url http://127.0.0.1:4195 --out work/thermal-v91/ux/state`:PASS. Namedfocus resize4widths; reload sangaspectmới giữLCD; manualzoom bỏfocusId, camera giữ nguyên quaresize/reload;physicalstateunchanged;0pageerror. Reportghi globalruntimeSHA trước/sau ổn định trong lượt đó.
- `python work/thermal-v91/ux/camera_dark.py --url http://127.0.0.1:4195 --out work/thermal-v91/ux/dark`:390pxdarkPASSprojection; ảnh đã nhìn trực tiếp, LCD20,0°C và nước rõ;0pageerror.
- `node checks/thermal-water-v90.mjs`:37mesh/40diagramPASS.
- `node checks/thermal-picking-v88.mjs`:PASS.
- Diffcheckclean cho mã hiện tại.

Chromium154.0.8037.57/SwiftShader. Không phải iPhone/Android thật, không đoP95/FPS/WCAG đầy đủ.

## Điểm độc lập

Mục7 trong rubric: banđầu0,5/1 vìauto closeup cắtLCD, hiện có căn cứ1/1 trong các ca đã công bố (light320/390/768/1440,dark390,resize/reload). Root vẫn cần kiểm learnerjourney tổng thể và manifest cuối toànruntime sau khi đóngbăng. Mục8: browser đã xác nhận zoom/manualcamera giữ đúng quaresize/reload; nhánh AltArrow/orbit xóa focusId mới chỉ rà mã, chưa chạygesture riêng. Reducedmotion/focus/toànviewport do root kiểm. Không tự chấm tổng9/10 hoặc nâng trạng tháiL3.
