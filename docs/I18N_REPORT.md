> **Cập nhật26/10/2026:** phần bên dưới là báo cáo lịch sử v54. HEADv58 đã có VI/EN; các thay đổi và nghiệm thu mới nhất nằm trong [báo cáo v59](REDESIGN_V59_REPORT.md). Không dùng trạng thái “chưa có selector/EN” bên dưới làm kết luận cho bản hiện tại. Các20mục khoa học PARTIAL và giới hạn thiết bị thật vẫn được giữ.

# Kiểm kê và thiết kế i18n Quanh Lab — V5.0

Mốc khảo sát: `4863af019a4cde215fd2f02b8b51f56922fe1f51` (v53). Đợt đầu kiểm kê dữ liệu thực; đợt tiếp theo đã thêm nền tảng ESM và bản dịch tên bài. **Chưa tích hợp chuyển ngôn ngữ trên giao diện, chưa dịch toàn bộ nội dung và chưa nghiệm thu i18n toàn site.** Không sửa mô hình, thuật toán, trang sách hay dữ liệu người dùng trong công việc này.

## Tiến độ triển khai nền tảng v54 — 25/10/2026

Đã tạo `dist/i18n.js` và `dist/locales/`. Đây là mã thực có kiểm thử, **chưa được gắn vào `app.js`/`views.js` và chưa có nút chọn ngôn ngữ**. Import module không thay document, không định tuyến và không tải lại mô hình.

- Hai locale chính xác `vi-VN`, `en-US`; mặc định VI. Locale không hợp lệ bị từ chối trước khi thay đổi trạng thái. Khóa lưu riêng `quanh.locale.v1`; đọc/ghi lỗi không làm dừng dịch vụ và không chạm `thpt-lab-v1`.
- API `createI18n`, `getLocale`, `setLocale`, `t`, `formatNumber`, `formatQuantity`, `onLocaleChange`. Binding `service.bind(element,key,{attribute,values})` chỉ cập nhật một leaf/thuộc tính được chỉ định; giữ input và listener. Không đoán/dịch DOM tự động, không chèn HTML bản dịch.
- 784 khóa đối ứng trong từ điển nền tảng: trong đó có 300 tên đầy đủ và 300 tên rút gọn mỗi ngôn ngữ, 58 thuật ngữ vật lí và các namespace UI chung. Đây **không phải 100% chuỗi của website**. Tên rút gọn EN hiện dùng cùng tên đầy đủ; cần rà responsive khi tích hợp.
- Bản VI của tên bài đối chiếu trực tiếp với catalog; EN là bản dịch biên tập ở cấp tên, chưa được giáo viên độc lập phản biện. Chưa dịch `description`, `theory`, `limit`, tham số, nhiệm vụ hoặc 1.800 trường bài soạn.
- Số dùng `Intl.NumberFormat` theo locale; đơn vị SI được truyền nguyên văn, không đổi ký hiệu hay giá trị vật lí. `physicsGlossary` có khóa ngữ nghĩa thay vì đoán nghĩa từ `T`, `V`, `F`.
- Kiểm tra thiếu khóa trả fallback hiển thị rõ, không trả raw key. CI so sánh tập khóa và placeholder hai locale. Khi tích hợp production phải xử lí missing-key telemetry/cổng kiểm bắt buộc để không âm thầm dùng fallback như một bản dịch đạt chuẩn.

`node checks/i18n-v54.mjs`: **PASS** cho parity/placeholder, đủ 300 ID, nguyên bản tên VI, lưu locale/khôi phục/lỗi storage, allowlist, listener/unsubscribe, binding DOM an toàn, giữ input/listener, format số và 12 đơn vị SI hai locale. Phép thử giữ các đối tượng state/time/rows/camera trong unit scope chỉ xác nhận module không can thiệp chúng; **không thay thế kiểm thử chuyển ngôn ngữ khi mô phỏng thực đang chạy**.

| Cổng nghiệm thu | Trạng thái hiện tại |
|---|---|
| Nền tảng ESM/từ điển/glossary | PASS trong phạm vi unit/DOM nêu trên |
| Tên 300 bài ở hai locale | PASS về coverage; chưa phản biện bản dịch độc lập |
| Bộ chọn VI/EN và bindings toàn UI | NOT IMPLEMENTED |
| Nội dung bài soạn/metadata/nhãn mô hình EN | NOT IMPLEMENTED |
| Đổi khi đang chạy, giữ camera/rows/notes | NOT TESTED — chưa tích hợp thao tác |
| SEO/lang theo locale trên web | NOT IMPLEMENTED |
| Thiết bị thật/overflow tiếng Anh/100% khóa UI | NOT TESTED |

Phần AI backend có thay đổi locale theo công việc riêng; báo cáo kiểm kê cũ dưới đây mô tả mốc v53, không dùng để phủ nhận hoặc chứng nhận các kiểm thử AI mới.

## 1. Kết quả kiểm kê

Đếm bằng cách import catalog thật, `meters`, `lessons`, `compileLesson`, gọi `graphFor` với trạng thái ban đầu của từng bài và đọc `dist/books/catalog.json`. Đây là số mục/chuỗi trong cấu trúc dữ liệu, **không phải số khóa đã dịch**. Chuỗi lặp lại và chuỗi chỉ gồm ký hiệu vẫn có thể nằm trong các số liệu dưới đây.

| Nội dung | Số lượng quan sát |
|---|---:|
| Bài có ID duy nhất | 300 |
| Phân bố lớp 10 / 11 / 12 | 68 / 156 / 76 |
| Chủ đề | 12 |
| `title` và `shortTitle` | Mỗi trường đủ 300; 299 chuỗi mỗi trường có dấu Việt |
| `description`, `theory`, `limit` | Mỗi trường đủ 300 |
| `subtitle` / `analysis` | 30 / 270 trường hiện hữu |
| Tham số | 917 lần xuất hiện; 625 nhãn khác nhau |
| Tiêu đề cột dữ liệu | 1.792 lần xuất hiện; 1.354 chuỗi khác nhau |
| Nhiệm vụ `tasks` | 908 chuỗi |
| Số đọc `meters` | 900 mục cho 300 bài; 727 nhãn khác nhau |
| Nội dung biên soạn trong `lessons` | 300 bài × 6 trường riêng = 1.800 chuỗi |
| Bài học đã compile | 3.303 giá trị chuỗi có dấu Việt ở các trường chuỗi cấp đầu; chưa cộng các mảng `fixed`, `sources` |
| Nhãn trục ở cấu hình mặc định | 600 lần xuất hiện; 463 chuỗi khác nhau |
| Chú giải đường đồ thị ở cấu hình mặc định | 303 lần xuất hiện; 265 chuỗi khác nhau |
| Sách | 3 cuốn, 142 + 119 + 127 = 388 trang ảnh |
| Mục lục sách | 15 chương, 85 bài (34 + 26 + 25) |
| Metadata văn bản trong catalog sách | 106 chuỗi |
| Bộ ngôn ngữ/module i18n hiện hữu | Chưa tìm thấy ở cấp `dist/` |

Nhãn đồ thị ở các mode khác của điện trường, chế độ đo/fit, lỗi tải và cảnh báo còn cần được trích riêng. Không dùng 600 nhãn mặc định để khẳng định đã kiểm đủ nhánh. Kiểm kê tiếng Việt dựa trên ký tự có dấu chỉ hỗ trợ tìm chỗ cần xem; không phải công cụ chứng minh một chuỗi là tiếng Việt hoặc đã dịch đúng.

### Các bề mặt không nằm hoàn toàn trong catalog

- `dist/index.html`, `views.js`, `app.js`: điều hướng, bộ lọc, công cụ, dialog, trạng thái, tooltip, thông báo nhập sai và báo cáo.
- `dist/lesson-view.js`, `lessons/catalog.js`: tiêu đề mục, kiến thức chuẩn bị, nguồn/giới hạn, bước hướng dẫn và nội dung biên soạn riêng. `loadTeaching` hiện gắn một đối tượng VI vào `experiment.lesson`.
- `dist/book-reader.js`, `books.html`: điều khiển trang, đọc lỗi, thử lại, mức zoom, alt text ảnh, SEO.
- `dist/assistant.js`: màn hình chờ, gợi ý, trạng thái gửi/ảnh/timeout và tên truy cập.
- `server/ai-handler.mjs`, `dist/local-ai.js`, `physics-tutor` liên quan: hệ thống hiện ưu tiên VI. Request chat chưa có trường locale được xác thực. System instruction máy chủ vẫn có tên cũ “Vật lí Lab”; cần sửa thành Quanh Lab trong đợt AI được giao riêng.
- `dist/scene3d.js`, `extended-scenes.js`, `atlas-scenes.js`, `discovery-scenes.js`, `apparatus.js`, các rig và `coordinates.js`: chữ nằm trong texture/canvas/sprite, không thể dịch bằng cách sửa DOM.
- Các lời ghi âm hiện có là tiếng Việt. Dịch tên nút không biến 301 bản ghi đó thành âm thanh tiếng Anh.

Đếm lời gọi tĩnh để định vị mã: `label(...)` xuất hiện 19/9/11/24 lần trong bốn module scene chính tương ứng; một lời gọi có thể tạo nhiều nhãn động. Các con số này không phải số nhãn thực trên 300 cảnh và chưa bao phủ toàn bộ helper dụng cụ.

## 2. Trạng thái nghiệm thu hiện tại

| Yêu cầu V5.0 | Trạng thái | Bằng chứng/phần còn thiếu |
|---|---|---|
| Giữ ngôn ngữ Việt ban đầu | PASS ở bản hiện tại | `index.html` có `lang="vi"`, nội dung và formatter VI |
| Bộ chọn VI/EN ở desktop/mobile | NOT TESTED — chưa có tính năng | Chưa có bộ chuyển hoặc store locale |
| Từ điển khóa dùng chung | NOT TESTED — chưa triển khai | Chuỗi nằm trực tiếp trong templates/catalog/scene/backend |
| Đủ 300 bài song ngữ | NOT TESTED — chưa dịch | Có dữ liệu VI đủ 300, chưa có bộ EN đối ứng |
| Đổi ngôn ngữ giữ state/rows/time/camera | NOT TESTED — chưa có thao tác | Chưa có handler ngôn ngữ để đo |
| AI dùng locale đã chọn | NOT TESTED — chưa triển khai | Chưa có locale allowlist trong request/backend |
| Công thức hoạt động cả VI và EN | NOT TESTED | Kiểm KaTeX VI hiện có không thay thế kiểm hai locale |
| Không thiếu khóa/không tràn chữ EN | NOT TESTED | Chưa có từ điển và không có lượt trình duyệt EN |
| Kiểm kê cấu trúc dữ liệu | PASS trong phạm vi trên | Import/catalog/đồ thị mặc định không báo lỗi; không phải chứng nhận dịch thuật |

Không chấm phần chưa xây là FAIL runtime. Không nâng trạng thái lên PASS chỉ vì một module i18n hoặc một nút EN đã xuất hiện.

## 3. Kiến trúc đề xuất phù hợp frontend buildless

Dùng một runtime nhỏ ESM với từ điển khóa; không cần đưa React hoặc tạo website thứ hai. Có thể dùng i18next nếu chi phí tải và cách đóng gói đã được kiểm chứng; với hai locale, API nhỏ tự phục vụ phù hợp stack hiện tại hơn việc thêm framework.

Tách các module dự kiến:

- `dist/i18n/runtime.js`: `getLocale()`, `setLocale(locale)`, `t(key, values)`, `number(value, options)`, `onLocaleChange(listener)`.
- `dist/i18n/vi-VN/{common,navigation,controls,measurements,charts,ai,errors,accessibility}.js` và các bộ EN tương ứng.
- `dist/i18n/experiments/{vi-VN,en-US}/batch-01.js` … `batch-10.js`: nội dung theo ID, tải theo lô, không thay tham số vật lí.
- `dist/i18n/lessons/{vi-VN,en-US}/batch-*.js`: sáu trường biên soạn, prerequisite/scope/evidence và nhãn quy trình.
- `dist/i18n/scene-labels.js`: khóa nhãn hiển thị và biến nội suy; không chứa tọa độ hoặc công thức tính.
- Glossary dùng chung có khóa ngữ nghĩa và ngữ cảnh; tài liệu CSV/JSON để phản biện thuật ngữ.

Ví dụ khóa: `navigation.library`, `controls.play`, `errors.numberRequired`, `experiments.ohm.title`, `experiments.ohm.params.u.label`, `experiments.ohm.tasks.0`, `lessons.ohm.investigation`, `charts.lever.netTorque`, `scene.lever.pivot`.

`{value}`, `{unit}`, `{symbol}` là biến có tên. Chuỗi được đưa vào `textContent` hoặc escaped template; không bật HTML tùy ý trong bản dịch. Không cho phép một bản dịch chứa code, inline event hoặc chuỗi dùng làm CSS selector.

Locale được chấp nhận chính xác là `vi-VN` và `en-US`. Người dùng mới mặc định `vi-VN`; không tự chọn EN theo trình duyệt trái yêu cầu. Lưu riêng `quanh.locale.v1`, không đổi schema dữ liệu phiên hiện có. Bản ghi sai hoặc localStorage lỗi phải trở về VI mà không xóa bất kỳ state/rows nào.

Khi EN cần tải, chỉ đổi locale sau khi các bộ từ điển cần cho màn hình hiện tại đã sẵn sàng. Có thông báo tải/lỗi có thể thử lại, dùng token yêu cầu để tránh kết quả tải cũ ghi đè lần chọn mới. Không im lặng tạo giao diện nửa EN nửa VI rồi đánh dấu hoàn tất. Fallback VI hỗ trợ phục hồi production; trong CI, thiếu khóa bắt buộc phải làm test thất bại.

## 4. Tích hợp mà không đặt lại thí nghiệm

Không gọi `renderLab()` hoặc `route()` để đổi ngôn ngữ: `renderLab()` hiện đặt `running=false`, dựng lại controls và thay nhiều trạng thái. Không tự gọi nút reset hoặc khởi tạo lại viewer.

1. Các thành phần UI đăng ký binding theo **khóa đã biết tại chỗ tạo phần tử**. Handler locale chỉ cập nhật nội dung, placeholder, title, aria-label và tên option; giữ DOM node input/select/canvas, ID, listener và giá trị hiện tại. Đây là binding khai báo, không phải quét DOM rồi đoán/dịch văn bản.
2. `state`, `config`, `rows`, `pinned`, `running`, `speed`, `t`, camera/OrbitControls, draft chat và notes phải giữ nguyên cả giá trị lẫn quyền sở hữu. Không ghi chuỗi đã dịch vào đối tượng scientific catalog.
3. Dùng projection `experimentCopy(id,locale)` cho văn bản; tham số giữ `key,min,max,step,unit,value` gốc. Mọi phép tính tiếp tục dùng key/ID, không dùng tên hiển thị đã dịch.
4. Bài học: cache riêng theo `{lessonId,locale,contentVersion}`; không thay `e.lesson` bằng bản dịch rồi làm nguồn dữ liệu cho lần sau. Giữ bản nguyên tắc/số học và phần hiển thị độc lập.
5. Đồ thị: giữ arrays/data/domain/pointRows và các key chọn cột; thay nhãn trong lớp trình bày, invalidate cache chữ theo locale. Không dịch chuỗi trước bước `metricColor` hoặc tra tên đại lượng vốn đang phụ thuộc ký hiệu. Không đổi miền trục hoặc lấy số đã format làm input tính toán.
6. 3D: nhãn phải giữ `labelKey` và dữ liệu nội suy. Khi đổi locale, cập nhật texture qua `userData.setText` và đánh dấu render dirty; không hủy geometry/material hoặc dựng lại mô hình. Nhãn động trong `update` cần đọc locale mới ngay cả khi mô phỏng tạm dừng. Kiểm công cụ có chữ texture riêng ngoài `modelLabel`.
7. Format: `app.js`, `plot-grid.js`, `research.js` đang cố định `vi-VN` hoặc thay dấu chấm thành phẩy. Chuyển qua formatter locale dùng chung; giữ số dạng Number trong state, dùng dấu nhập số phù hợp `<input type=number>` thay vì parse lại chuỗi đã format.
8. CSV/phiên: giữ ID/schema, chỉ số cột, số gốc và đơn vị chuẩn; chốt quy ước CSV rõ ràng. Đổi ngôn ngữ không được sửa các bản ghi đo đã lưu hoặc khiến chữ “Chế độ” đổi ý nghĩa cột. Nhãn UI dịch qua projection.
9. Tìm kiếm: index cả tên VI và EN theo cùng ID, giữ alias chuẩn. Giữ bộ lọc theo key và không reset bài đang chọn. Collator cho sắp xếp tên có thể thay đổi thứ tự thẻ, không thay ID/giá trị lọc.
10. Cập nhật `document.documentElement.lang`, title và description theo locale. Trang chủ HTML tĩnh giữ mặc định VI. Cần quyết định chiến lược URL locale/hreflang dựa vào SEO thực tế; không công bố nội dung EN đã được index chỉ từ việc đổi meta bằng JavaScript.

## 5. Sách và AI

Giữ 388 trang ảnh gốc; chỉ dịch reader chrome, mục lục, alt text và metadata. Các trang sách vẫn là tiếng Việt và cần ghi rõ điều này trong giao diện EN. Không vẽ đè hoặc thay sách bằng bản dịch chưa được cung cấp. Giữ grade/page, zoom, chế độ một/hai trang và tiến trình vuốt khi đổi ngôn ngữ.

Với AI, gửi `locale` đã allowlist ở field rõ ràng; backend chọn instruction từ hai giá trị cố định, không chèn locale tùy ý thành system prompt. Cập nhật cả provider Gemini, provider thay thế, local AI, câu trả lời đồng hồ/đáp án xác định và lỗi phục hồi. Đổi locale không làm mất thread/draft/ảnh hoặc tự gửi lại câu hỏi. Các tin nhắn lịch sử giữ nguyên ngôn ngữ đã viết; phản hồi kế tiếp dùng locale của lượt hỏi. Backend nên trả error code ổn định kèm fallback tương thích; client dịch code thay vì đoán nội dung lỗi trả về.

Sửa tên cũ “Vật lí Lab” trong instruction thành Quanh Lab; không tự thay tên chủ sở hữu. API key và proxy secret vẫn ở máy chủ. Kiểm thử bằng fixtures, không cần gọi API trả phí để chứng minh payload locale đúng.

Âm thanh: giữ các bản thu VI và ghi rõ ngôn ngữ của chúng khi UI ở EN. Nếu thêm English TTS, phải chọn tiếng/giọng theo yêu cầu phát âm thanh và có fallback rõ; không tự phát tiếng Việt dưới nhãn tiếng Anh.

## 6. Glossary khởi điểm để phản biện

| Khóa ngữ nghĩa | VI | EN |
|---|---|---|
| electricField | Điện trường | Electric field |
| electricFieldStrength | Cường độ điện trường | Electric field strength |
| torque | Mômen lực | Torque |
| equilibrium | Cân bằng | Equilibrium |
| kineticEnergy | Động năng | Kinetic energy |
| potentialEnergy | Thế năng | Potential energy |
| mechanicalEnergy | Cơ năng | Mechanical energy |
| simpleHarmonicMotion | Dao động điều hòa | Simple harmonic motion |
| standingWave | Sóng dừng | Standing wave |
| refraction | Khúc xạ | Refraction |
| magneticFluxDensity | Cảm ứng từ | Magnetic flux density |
| pressure | Áp suất | Pressure |
| volume | Thể tích | Volume |
| period | Chu kì | Period |
| temperature | Nhiệt độ | Temperature |

Không dịch bằng phép thay từ toàn cục: `T` có thể là chu kì hoặc nhiệt độ; `V` có thể là thể tích hoặc volt trong đơn vị. Các ký hiệu `F,E,v,a,T,p,V`, LaTeX, tên key và SI phải giữ nguyên theo mô hình. Với ký hiệu VI đang nằm trong công thức như `Wđ`, cần quyết định ký hiệu tương đương có chú giải theo ngữ cảnh; không âm thầm đổi biểu thức/số liệu chỉ để “English hóa”.

## 7. Thứ tự thực hiện và cổng kiểm tra

1. **Nền tảng:** runtime/từ điển/glossary; kiểm schema khóa trùng, interpolation, locale hỏng, tải chậm/lỗi, callback unsubscribe. Chưa gọi đây là hoàn thiện song ngữ.
2. **Toàn bộ catalog:** dịch và phản biện metadata, tham số, 908 nhiệm vụ; manifest cho đủ 300 ID và từng key. Các từ thuần ký hiệu được allowlist có chủ đích, không tính chúng là bản dịch bị bỏ sót.
3. **Nội dung sư phạm:** dịch 1.800 trường biên soạn và nội dung compile; đối chiếu điều kiện giữ cố định, dấu, đơn vị và lời giải. Phân biệt bản dịch biên tập và bản đã được giáo viên phản biện.
4. **Thao tác/lỗi/đồ thị/3D/AI/sách:** tích hợp từng màn hình và mọi trạng thái tải/lỗi, không chỉ trang chủ.
5. **Browser acceptance:** đo đối chiếu trước/sau locale trên state, `t`, camera target/zoom, rows, input identity, notes/prediction, tốc độ và running. Đổi khi đang chạy/tạm dừng, đang tải bài, đang có nháp ảnh, đang mở dialog/fullscreen và khi đổi locale nhanh liên tiếp.
6. **Toàn thư viện:** unit coverage từng key/300 ID; browser từng bài ở hai locale; smoke không thay cho rà toàn bộ lời giải hoặc mọi biên hình học.
7. **Responsive/a11y:** 320/390/768/1440 px, zoom chữ 200%, tiếng Anh dài, font đã tải/chưa tải, focus/Tab/Escape, role/status/aria-live và tên truy cập. Chưa có kết quả thực nghiệm cho các mục này trong lượt khảo sát.
8. **Hiệu năng:** tránh tải toàn bộ lesson EN trên home; theo dõi bundle/long task và bộ nhớ texture qua nhiều lần đổi locale. Mục tiêu không làm chậm không đồng nghĩa đã đo đạt.

Manifest khóa phải so sánh tập khóa VI/EN đúng cấu trúc, phát hiện raw keys, fallback ngoài allowlist và ký hiệu/đơn vị thay đổi. Kiểm literal cần parser JavaScript/HTML và review ngữ cảnh; regex ký tự Việt chỉ dùng phát hiện ứng viên, không thay thế bộ kiểm đầy đủ.

## 8. Giới hạn và việc còn lại

Lượt này không chạy test đổi ngôn ngữ vì chưa có tính năng đó. Không đo thiết bị thật, không gọi AI/provider, không tạo bản dịch giả và không dùng overlay tự dịch DOM. Việc hoàn thiện V5.0 cần triển khai các seam trên, biên tập/phản biện bản EN, sau đó chạy đủ cổng nghiệm thu; báo cáo này chỉ là kiểm kê và thiết kế để tiếp nối các giai đoạn sau sửa vật lí ưu tiên.
