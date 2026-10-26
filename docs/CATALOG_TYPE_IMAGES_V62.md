# Quanh Lab — ảnh thí nghiệm và typography v62

Ngày 26/10/2026. Sửa trực tiếp theo ảnh người dùng gửi, bắt đầu từ main `e14afbc`. Không đổi nội dung tiêu đề, logo, phông gốc, video hố đen, mô hình hoặc dữ liệu phiên.

## Những phần đã sửa

- **Banner:** hai dòng cùng Manrope, cùng cỡ responsive, cùng weight 750; bỏ tracking âm `-.045em`, dùng `.015em` và word spacing `.08em`; line-height 1.35 và khoảng cách hai dòng`.24em`. Giữ căn giữa, video chuyển động và CTA.
- **Thẻ:** thống nhất phông/khoảng cách, padding 24 px (mobile 20 px), line-height 1.75 cho mô tả; dự trữ không gian tiêu đề hai dòng, căn hàng nội dung và giữ các nút ở đáy. Mobile ≤ 480 px dùng hai nút trên hai hàng để nhãn EN không bị cắt.
- **Ảnh:** xuất 300 ảnh WebP 640 × 400 từ **LabScene thật của đúng bài**, không dùng AI, ảnh chung hay công thức thay hình. Mỗi thẻ có ảnh tải lazy, kích thước dự trữ và liên kết mở lab. Nút Xem trước dùng cùng ảnh.
- **Lỗi tải ảnh:** thông báo inline và nút Thử lại ảnh, giữ đường mở lab; bảo toàn focus khi thử lại. Không thay ảnh lỗi bằng hình khoa học khác.
- **Hiệu năng:** không tải renderer/WebGL trên home hoặc vẽ 300 ảnh trên máy học sinh. Không phụ thuộc IndexedDB/cache từ lần đã mở lab. Dữ liệu cache/phiên cũ không bị xóa.

## Vì sao trước đó chỉ thấy công thức?

Cards v53/v59 dùng công thức làm placeholder. `thumbnails.js` chỉ dựng ảnh khi`peekRenderers()` đã có sau lần mở lab; trên cold home chưa tải renderer nên placeholder không được thay. V62 thay cơ chế đó bằng ảnh tĩnh có URL trực tiếp ngay khi thẻ được render. Công thức đầy đủ vẫn ở trang học/lab và trang thông tin thí nghiệm; không sửa hoặc xóa dữ liệu khoa học để thay thumbnail.

Ảnh ở `dist/previews/v62/<ID>.webp`; manifest không được tải trên home. Tổng ảnh 1.717.436 byte (~1,64MiB) cho cả 300 bài; trình duyệt chỉ tải ảnh gần vùng nhìn. Có295 hash ảnh khác nhau: một số bài dùng cùng cấu trúc mô hình thật, không ép chúng thành ảnh khác bằng thay khoa học.

## Nguồn và tái lập

`dist/previews/v62/manifest.json` ghi ID, state, config, camera, bao hình học, byte/hash từng ảnh,37 hash nguồn và hash generator.300 ảnh đều có miền hợp lệ và boundsInView=true; kiểm hình học không chứng minh mọi ảnh rõ/đẹp.

```sh
# Phục vụ dist bằng HTTP trước khi chạy. Cần Python Playwright và Chromium.
python3 scripts/generate-thumbnails-v62.py --help
python3 scripts/generate-thumbnails-v62.py --base http://127.0.0.1:4173/
```

Generator từ chối ghi đè output nếu không có `--overwrite`. Chỉ tái xuất khi có yêu cầu sửa ảnh hoặc nguồn mô hình thay đổi. State lấy mặc định, chọn thời điểm minh họa theo cùng cách factory trước đây; không đổi phương trình, tham số khoa học hoặc camera riêng theoID để tạo ảnh giả. Nguồn/preset/tương tác của300 bài,300 bài soạn,388 trang sách,85 bài mục lục và301 âm thanh giữ nguyên.

## Kiểm thử

- `checks/catalog-previews-v62.mjs`: đủ 300 ID, WebP 640 × 400, hash/nguồn thực, dung lượng, ảnh lazy clickable, lỗi/retry/khôi phục và giải phóng listeners. Đã đưa vào `npm run check`.
- `checks/browser-catalog-v62.py`: cold home, pagination đủ 300 ảnh,9 viewport, VI/EN, cùng font/size/weight/giãn dòng, CTA không bị cắt, clickảnh/mởlab/Xem trước,404/retry/focus, không import WebGL từ home và không tràn ngang. Kết quả cuối lưu cùng báo cáo phát hành.
- Agent UI đã xem 8 case VI/EN ở 320/390/1440/1920px và phát hiện nhãn CTA EN 320 px bị cắt; đã sửa bằng bố cục một cột và kiểm lại phạm vi text trong nút.
- Kiểm trước/sau chỉ chứng minh các trạng thái được chụp, không phải nghiệm thu thiết bị iPhone/Safari/Android thật.

Ảnh sau: [banner 1440](catalog-v62/after-hero-1440.png), [thẻ 390](catalog-v62/after-cards-390.png). [Review UI](catalog-v62/ui-review.json).

Một số preview như `apparent_depth`, `adiabatic`, `separated_lenses`, `room_reverberation` còn nhạt do vật liệu renderer gốc; một số vật nhỏ do miền nhìn của mô hình. Không tự đổi màu/vật lí hoặc phóng đại điện tích để làm ảnh đẹp. Không tuyên bố đã rà trực quan từng ảnh của cả 300 bài.

**Kết quả chốt:** `npm run check` exit0; [browser13/13](catalog-v62/browser.json), gồm300ảnh×9viewport,18trạng thái bannerVI/EN, load/error/retry/focus và điều hướng; không pageerror hoặcHTTPerror ngoài fixture404. [Axe6/6](catalog-v62/axe.json) không có violation tự động. [Lognpm](catalog-v62/npm-check.txt). Chưa kiểm thiết bị thật.
