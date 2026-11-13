# Nhiệt lượng kế v86 — va chạm cốc và an toàn phiên

Ngày 13/11/2026. Mốc nguồn khảo sát: `71344a949233d22e998a9352336d8fb6fc7024 ca`; nhánh `feat/thermal-geometry-v86`. Chỉ hai hoạt động nước–đá và vật rắn, cùng ID `calorimetry`. Không nâng hàng loạt danh mục.

## Lỗi xác minh và sửa thực tế

| Mức | Lỗi tại nguồn v85 | Thay đổi v86 |
|---|---|---|
| P1 | Kiểm miệng cốc có thể chấp nhận `(300,112),60°` dù thân cốc chạm vành bình | Kiểm hình bao toàn thân và vòi; chặn cả đường kéo và xoay, kể cả pointer nhảy xa. Không sửa vị trí để che xuyên vật. |
| P1 | Chưa chặn thân cốc xuyên mặt bàn | Kiểm bao thân/vòi với mặt bàn trong cùng hệ mét. |
| P1 | Trường thể tích/residual thiếu, chuỗi hoặc giá trị giả có thể lọt qua phép so sánh NaN | Kiểm số hữu hạn và đối chiếu độc lập với ledger trước khi chấp nhận state/import. Không sửa dữ liệu nhập. |
| P1 | Dừng/hủy thao tác có thể dựng thẳng cốc đang nghiêng vào vật cản | Giữ góc hợp lệ hiện tại, dừng rót/thời gian; không ép góc về0. |
| P1 | Kiểm va chạm mới có thể thêm sự kiện thứ5.001 trước giới hạn | Chặn trước tác động và giới hạn chung khi thêm sự kiện; phiên xuất vẫn đọc được. |
| P2 | Phiên cũ có cốc xuyên vật sẽ bị mắc khi áp ràng buộc mới | Giữ nguyên phiên lúc mở, chặn rót sai; nút “Đưa cốc về khay” chỉ xuất hiện khi cần và yêu cầu thao tác rõ ràng. Giữ chất và số đo. |
| P2 | Tệp lưu lỗi khó sao lưu nguyên bản | Tách nút Sao lưu bản gốc và JSON phiên đang mở; yêu cầu sao lưu trước khi nhập thay bản lưu lỗi. Giữ nguyên byte bản cũ, không làm mất khả năng xuất công việc mới trong RAM. |

Một kiểm tra âm quan trọng: cốc `(410,130),60°` có thể nằm trong lòng rỗng; không được coi cả bình là khối đặc rồi chặn giả. Ca này được giữ hợp lệ.

## Tệp và hợp đồng

- `dist/l3/thermal-collision.js`: module thuần, nhận pose/điều kiện; trả valid/reason. Không đổi state, mesh hoặc nhiệt lượng.
- `dist/l3/thermal-pilot.js`: gọi kiểm đường kéo/xoay, chặn rót/lắp bình sai, khôi phục cốc có chủ ý, giới hạn sự kiện, backup nguyên bản, hủy thao tác an toàn.
- `dist/l3/thermal-physics.js`: siết validation thể tích và residual; không đổi phương trình truyền nhiệt, oracle hoặc schema.
- `dist/app.js`, `dist/boot.js`, `dist/index.html`: chuỗi cache86 tới pilot và physics mới.
- `checks/thermal-collision-v86.mjs`, `checks/thermal-derived-state-v86.mjs`, `checks/browser-thermal-v86.py`, `checks/browser-thermal-storage-v86.py`: kiểm hình học độc lập, ledger/import, thao tác trình duyệt.
- `package.json`: thêm hai bộ Node vào cổng kiểm tra hiện hữu và lệnh `check:thermal-v86`.
- `CODEX_HANDOFF.md`: bàn giao phạm vi, cổng kiểm và giới hạn cho phiên sau.
- Thư mục tài liệu này: kết quả, giới hạn và bằng chứng; không phải UI học sinh.

### Không gian và sai số

Giữ phép ánh xạ cũ `X=(x−400)/1000`, `Y=(348−y)/1000`, `Z=0`, 1 world unit=1m; mặt bàn Y=−0,082m. Hình bao cốc: nửa chiều cao59mm, bán kính44mm; vòi là hình bao đoạn có bán kính4mm. Thành/đáy/vành là các dải hữu hạn quanh bình cố định, miệng bình mở. Dung sai tiếp xúc1e−7m. Đường tịnh tiến dùng convex hull hai đầu; xoay chia tối đa2° và nới theo sagitta để bao cung xoay. Cách này có thể từ chối ca sát mép bảo thủ.

Đây là ràng buộc 2,5D cho cốc trên mặt phẳng thao tác hiện có. Chưa phải va chạm vật rắn3D tổng quát, kéo trên mặt bàn/chiều sâu tự do hoặc CFD. Chưa giải quyết va chạm đầy đủ của mẫu/kẹp/đầu dò/que và bình rỗng đang được kéo. Thể tích lòng mesh vẫn chưa hiệu chuẩn với dung tích600 mL của model; số đo lấy từ model vật lí, không từ pixel hoặc thể tích mesh.

Validation: sai số thể tích1e−10m³, residual báo cáo năng lượng1e−8J/khối lượng1e−12kg; bất biến vật lí giữ ngưỡng1e−4J/1e−7kg. Không migrate schema hoặc ghi đè dữ liệu sai để làm cho hợp lệ.

## Trạng thái A/B và danh mục

| Hoạt động | Mô hình nhiệt | Tương tác | Dữ liệu | Sư phạm | Thiết bị thật |
|---|---|---|---|---|---|
| A nước–đá | Oracle và bất biến có unit test | Cốc được gia cố; còn giới hạn2,5D | Phiên/CSV/JSON có regression | NOT TESTED | NOT TESTED |
| B vật rắn | Trao đổi hữu hạn có unit test | Giữ kẹp/bể v85; gia cố cốc chung | Phiên/CSV/JSON có regression | NOT TESTED | NOT TESTED |

Browser:11/11 nhóm PASS, cộng4ca lưu trữ và đổi A↔B/reload; `npm run check` exit0 trên nguồn ổn định. Phạm vi và bằng chứng xem `QA_REPORT.md`. Trạng thái CI/Pages/live được xác nhận riêng sau commit.

| Trạng thái L3 | Số ID |
|---|---:|
| PASS | 0 |
| PARTIAL (`calorimetry`, A và B) | 1 |
| NOT TESTED | 299 |
| BLOCKED | 0 |
| Tổng | 300 |

Không coi hai hoạt động thành ID301 hoặc coi browser pass là nghiệm thu8 cổng.

## Demo tự kiểm

Mở `/#lab/calorimetry?l3=ice`, đặt bình. Chọn cốc, nhấc lên phía trên vành rồi đưa sang gần miệng bình, nghiêng từ từ để rót. Kéo thấp xuyên thành bình hoặc hạ xuyên bàn: vị trí cuối bị từ chối, lượng nước không tự đổi vì va chạm. Chuyển2D để dùng thao tác chính xác nếu cần; các ràng buộc giống nhau. Cân/thả đá, nhúng đầu dò, khuấy, tự ghi ít nhất5 điểm rồi xuất CSV/JSON và nhập lại.

Với0,20kg nước40°C,0,020kg đá0°C, Ccal0, cân bằng lí tưởng29,0996085°C. Với0,20kg nước20°C và0,10kg đá, cân bằng0°C, còn0,04994012kg đá. Số chỉ có độ trễ; không ép kết quả đo hữu hạn thành nghiệm lí thuyết.

Mở `/#lab/calorimetry?l3=solid`: cân mẫu, dùng kẹp vào bể gia nhiệt hữu hạn rồi chuyển vào nước; đọc và ghi nhiệt độ, tự nhập số vào calculator. Không dùng quy trình đá tan thay cho đo nhiệt dung riêng.

## Việc tiếp theo

1. Hiệu chuẩn lòng bình/cốc và mực nước theo thể tích; kiểm thêm độ nổi/kích thước mẫu.
2. Thao tác theo mặt bàn và chiều cao/chiều sâu, ràng buộc mẫu/kẹp/đầu dò; kiểm miệng nhận trong3D thực.
3. Bổ sung suy luận so sánh lượt, miền gần cân bằng và điều kiện dụng cụ theo phản hồi giáo viên.
4. Nghiệm thu thiết bị Android/iPhone Safari thật, giáo viên và hiệu năng P95/FPS trên máy mục tiêu. Chưa có bằng chứng để nâng trạng thái PASS.
