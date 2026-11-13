# UI/browser review v86

Agent `thermal_qa86` kiểm bằng Playwright/Chromium 154.0.8037.57, pointer/keyboard và CDPtouch. Root đã xem ảnh desktop3D, darkEN và stage390. Source cố định trong toàn bộ11 nhóm; báo cáo chi tiết ở [browser-final.json](evidence/browser-final.json).

## Đã kiểm

- 3D thực: WebGL 2/ANGLE SwiftShader,48 meshes,9.644triangles,97 draw calls; framebuffer thay đổi khi orbit và dữ liệu vật lí không đổi. Đây là renderer phần mềm, không benchmarkGPU thật.
- Chọn/kéo/rotate cốc, chặn thân/vòi và đường xuyên, phản hồi sửa bằng cách nhấc lên. Cốc trong lòng mở không bị chặn giả trong lát cắtXY.
- A/B×mouse1440/CDPtouch390: đúng/sai/biên, nước rót hữu hạn và ledger, Escape/lostcapture không để thao tác dính. Raycast còn dùng được sau orbit/zoom/resize.
- Hành trình nước–đá và vật rắn, nhiệt kế và số học sinh ghi. Vật rắn tay trần bị từ chối; kẹp/bể nóng có diễn tiến hữu hạn.
- VI/EN, sáng/tối, logo/rời trang/reload cho cả hai hoạt động;2D/3D chuyển qua lại giữ số liệu. Mobile320/390/ngang844 và pinch/pan có kiểm riêng.
- Thiếu hoặc mấtWebGL có fallback, dữ liệu còn giữ và thử lại3D được. Không có unhandledJavaScript trong11 nhóm.
- Cốc cũ sai pose có nút khôi phục đúng ngữ cảnh, dùng bàn phím được; giữ readings và lượng chất. Backup bản gốc lỗi/JSON hiện tại còn kiểm riêng4 ca, gồm390khôngtràn ngang.

## Ảnh

- [A: rót, đá và đầu dò](evidence/ice-raycast-water-ice-probe.png)
- [B: giao diện tối tiếng Anh](evidence/solid-dark-english.png)
- [Stage390, touch giả lập](evidence/collision-ice-touch390.png)
- [Pose lỗi phiên cũ trước khôi phục](evidence/legacy-invalid-ice-before.png) → [sau thao tác khôi phục](evidence/legacy-recovered-ice.png). Đây là before/after khôi phục trong bản v86; không gán thành ảnh baseline v85.

## Giới hạn

Chưa đánh giá usability bởi học sinh/giáo viên hoặc thiết bị thật. Dụng cụ vẫn kéo trên mặt phẳng đứng; stage nhỏ cần chọn dụng cụ/nút chính xác, hình học và khe hởZ còn thiếu. Không gọi toàn bộUX/3D hoàn thành hoặc đạtWCAGAA chỉ từ các ca này. P95/FPS chưa đo trên thiết bị mục tiêu.
