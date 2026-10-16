# Nguồn âm thanh hiện tại · v13

- Giọng `vi-VN-HoaiMyNeural` (Hoài My), Microsoft. Đối chiếu tên/ngôn ngữ với https://learn.microsoft.com/azure/ai-services/speech-service/language-support . Công cụ tạo file là `edge-tts==7.3.1`, https://github.com/rany2/edge-tts . Không ghi nhãn OpenScienceVN vì chưa có nguồn giọng cụ thể để xác minh; người dùng đã chọn dùng một nguồn Việt phù hợp.
- Nội dung của chính dự án được chuẩn hóa kí hiệu, số mũ, chỉ số và đơn vị trước khi tổng hợp. `scripts/voice-texts.mjs` tạo công việc; `scripts/build-neural-voice.py` tạo MP3 và ánh xạ đoạn bằng WordBoundary, yêu cầu văn bản/ranh giới khớp. Nhóm từ–số–đơn vị được chia nhỏ rồi ghép PCM với độ lệch cue theo số mẫu.
- 300 file bài + 1 file chung tại `dist/audio/vi13/`. Giải mã thực bằng FFmpeg: 11.404,848 s, 2.591 đoạn; RMS thấp nhất 2.775,15 trên PCM 16 bit. Báo cáo SHA-256, thời lượng và số đoạn từng file tại `checks/audio-audit-v13.json`.
- Âm thanh tạo sẵn ở bước build, chỉ tải từ cùng Site sau khi bấm Nghe; không API/TTS server/mô hình AI trên thiết bị người học. Giữ giọng thiết bị nếu người dùng chọn. Không autoplay. Cách ghép số đọc vẫn có nhịp ngắt; chưa kiểm tra phát qua loa hay thẩm định phát âm của người bản ngữ trên thiết bị thật.
- Bản v13 thay thế file của giọng cũ; phần dưới giữ lịch sử nguồn v11.

---

# Nguồn âm thanh tiếng Việt · v11

Nội dung tiếng Việt lấy từ danh mục, hướng dẫn và số đọc hiện có của dự án. Không đưa video tham khảo, âm nhạc hay giọng người nói trong video vào website.

- Bộ tổng hợp: `piper-tts==1.3.0`; các âm thanh được tạo trước khi xuất bản, không có dịch vụ TTS hay mô hình ONNX chạy trên máy học sinh.
- Giọng: `vi_VN-vais1000-medium`, 22.050 Hz, một giọng theo model card của rhasspy/Piper.
- Nguồn: https://huggingface.co/rhasspy/piper-voices/tree/main/vi/vi_VN/vais1000/medium
- Thẻ mô hình: https://huggingface.co/rhasspy/piper-voices/blob/main/vi/vi_VN/vais1000/medium/MODEL_CARD
- Tác giả/đơn vị trên kho: Michael Hansen, rhasspy/Piper; thẻ mô hình ghi dữ liệu VAIS-1000 theo CC BY 4.0.
- SHA-256 ONNX: `ec7c89e2c85f4d1edc24b6120c18aaf1bda614f06b511567eb9c7c0de15e2dab`.
- SHA-256 cấu hình: `fafb9da1354ed4b77c31af228ed41fb41cd825c14cffa105454b25e6ae751ee0`.
- Quy trình tái tạo: `node scripts/voice-texts.mjs <jobs.json>`; `python scripts/build-voice.py --jobs <jobs.json> --model <path-to-model.onnx> --out <audio-dir> --workers 2`. Dùng `index.json` xuất ra để tạo `dist/voice-index.js` và chép các MP3 vào `dist/audio/vi/`.
- 300 tệp bài học + 1 tệp từ/số/đơn vị dùng chung; tổng thời lượng khoảng 7.209 s. MP3 mono 40 kbps, tải theo yêu cầu; bộ nhớ đệm giải mã tối đa ba tệp.

Hướng dẫn từng bước dùng đoạn đọc riêng. Số đo thay đổi được đọc bằng cách ghép nhãn, từ số và đơn vị từ cùng giọng; cách ghép này có nhịp ngắt khác giọng đọc cả câu. Giọng hệ thống vẫn có thể chọn nếu thiết bị có tiếng Việt. Không tự phát khi mở trang.
