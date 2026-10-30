# QA độc lập — không gian dao động v69

**PASS trong phạm vi nêu dưới đây.** Agent `/root/unified_qa_v69` không sửa runtime, không commit hoặc triển khai.

- Vòng đầu đủ9 viewport320/375/390/414/430/768/1024/1440/1920 đạt: mặc định Liên hệ không tải WebGL, hình chiếu/vật/engine khớp, ghi một dòng và notes, VI/EN/ngày–đêm/reload giữ phiên, chạy/dừng và không tràn ngang.
- Sau các sửa menu/focus của root, deep1440 đạt; deep390 cuối đạt với toàn bộ7hash runtime khớp mã cuối. Deep kiểm phaT=3/t=20,0/90/180/270/360° và359°, kéo chuột/bàn phím/CDPtouch390, WebGL3D/2D/camerazoom, chuyển Liên hệ giữ dữ liệu. Model WebGL ẩn không tăng state.t hoặc renderer.info.render.frame khi SVG chạy.
- PNG720×828 đã tải và giải mã: có vật màu xanh ở vị trí đúng với SVG hiện tại. Không dùng ảnh của model3D cũ. Bản390 cuối bao gồm halo chữ và paint-order trong export;1440 được kiểm trước tinh chỉnh màu chữ nhỏ này.
-100Tab/ShiftTab mỗi deep viewport không thoát CSSfullscreen;Escape thoát đúng. Kiểm menu riêng390/1440 đạt:Escape đóng và trảfocus, mởStudy/Tools đóngTimeOptions.
- Sau reorderCSS,320/390/414/430 kiểm lại đúng thứ tự hình→Chạy→pha→sốđọc→phầnmởrộng. NútChạy cách đáySVG55.17px; không tràn ngang hoặc JSerror.
- Các lượt deep cuối không có pageerror,consoleerror,HTTPerror. Không suy ra0request nhà cung cấp từ trườngexternalRequests trống của harness cũ; observer bổ sung chỉ áp dụng cho lần chạy tương lai.

Hai lỗi thật đã phát hiện và root sửa: popupTimeOptions đè nútPNG ởdesktop; Tabfullscreen đi ra ngoài khung do kiểm nearest details. Có một lần fail harness khi cố nhấn preset bị popup native đang mở che sau reorder mobile; đã sửa điều hướng test để đóng summary trước, không sửa runtime để làm assertion này đạt.

Bằng chứng: `report.json` giữ lượt đầu và failuredesktop; `final/report.json` giữ recheck1440; `final-mobile/report.json` là390 cuối; `layout-followup.json`, `menu-followup.json`, `focus-probe.json`;PNG và screenshots cùng thư mục. `SUMMARY.json` ghi hash và phạm vi từng lượt, không giả định tất cả kiểm thử diễn ra trên một nguồn đóng băng duy nhất.

Giới hạn: Chromium/SwiftShader và viewport/CDP touch giả lập; không iPhone/Safari/Android thật, bàn phím ảo, OAuth/email, AI hoặc GPU/FPS phần cứng; không chứng nhận khoa học/WCAG toàn300bài.
