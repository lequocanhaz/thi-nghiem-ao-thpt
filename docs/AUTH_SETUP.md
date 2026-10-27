# Tài khoản Quanh Lab — Firebase Authentication

Mã v64 bổ sung adapter cho email/mật khẩu, tạo tài khoản, đặt lại mật khẩu, Google popup, đăng xuất và xóa tài khoản. Cập nhật 27/10/2026: cấu hình trong nhánh `main` đã bật và vượt qua validator định dạng. Việc này chưa xác minh provider, authorized domains, đăng nhập Google hoặc gửi email thật; cần kiểm tra các bước bên dưới với project của chủ website. Khi `dist/auth-config.js` có `enabled:false`, client không kết nối dịch vụ. Đây không phải tài khoản giả lưu trong trình duyệt; kiểm thử fixtures không chứng minh đăng nhập thật đã hoạt động.

## Cấu hình một lần bởi chủ dự án

1. Tạo/chọn Firebase project do chủ dự án quản lý. Trong Project settings, thêm Web App. Không bật Analytics chỉ để dùng đăng nhập.
2. Trong Authentication → Sign-in method, bật Email/Password và Google; đặt email hỗ trợ của project cho nhà cung cấp Google. Không bật anonymous login hay SMS cho triển khai này.
3. Trong Authentication → Settings → Authorized domains, thêm `physicslab.tech`. Thêm `www.physicslab.tech` nếu website phục vụ hostname đó và `lequocanhaz.github.io` nếu vẫn hỗ trợ URL GitHub Pages. Nhập hostname, không nhập đường dẫn repository. Chỉ thêm `localhost` khi thực sự cần kiểm tra cục bộ. Giữ auth domain mặc định của project.
4. Sao chép **Firebase Web App config công khai**, chỉ gồm `apiKey`, `authDomain`, `projectId`, `appId`; `messagingSenderId` và `storageBucket` là tùy chọn. Không cần service account, Admin SDK, client secret, khóa máy chủ hoặc khóa AI.
5. Thay cấu hình trong `dist/auth-config.js`:

   ```js
   export const authConfig=Object.freeze({
     enabled:true,
     firebase:{
       apiKey:'PUBLIC_FIREBASE_WEB_API_KEY',
       authDomain:'your-project-id.firebaseapp.com',
       projectId:'your-project-id',
       appId:'1:YOUR_PROJECT_NUMBER:web:YOUR_WEB_APP_ID'
     }
   });
   ```

   Các giá trị minh họa trên không hợp lệ để đăng nhập. Dùng đúng thông tin từ Firebase Console. Validator yêu cầu auth domain mặc định `<projectId>.firebaseapp.com`, project ID hợp lệ, Web API key và Web App ID đúng dạng; không chấp nhận cấu hình Admin SDK. Nếu cần custom auth domain, phải mở rộng validator/CSP và kiểm thử riêng.
6. Bật biện pháp chống dò email (email enumeration protection) và chính sách mật khẩu phù hợp trong Firebase/Google Cloud. Duyệt giới hạn yêu cầu, quota, phân quyền chủ dự án và cảnh báo chi phí. Theo hướng dẫn Firebase về hạn chế API key; thay đổi restrictions cần kiểm lại trên cả website và auth helper domain.
7. Chạy các cổng kiểm tra bên dưới, phát hành qua PR/CI và kiểm lại bằng tài khoản thử trên domain HTTPS thật. Không tuyên bố đã nghiệm thu chỉ vì điền xong config.

Web API key là định danh ứng dụng công khai, không phải khóa Admin. Việc public Web App config không cho phép public service-account secrets. Bộ quét tài nguyên chỉ nên cho phép đúng Web API key trong cấu hình Firebase đã được validator chấp nhận; các vị trí/loại khóa khác vẫn bị chặn.

## Cài SDK và xuất bản

Dự án giữ frontend buildless. Chỉ SDK bên thứ ba được đóng gói:

```sh
npm ci --ignore-scripts
npm run bundle:auth
node checks/auth-client-v64.mjs
node checks/site-security-v63.mjs
npm run check
```

`firebase@13.1.0` và `esbuild@0.28.2` được ghim trong lockfile; dùng Node 24.12 trở lên, cùng dòng Node 24 của CI. `scripts/bundle-auth.mjs` chỉ xuất Firebase App + Authentication ra `dist/vendor/firebase-auth.js`, không tải SDK từ CDN và không sinh source map. Bundle hiện tại khoảng 142 kB trước gzip, chỉ tải khi mở tính năng tài khoản. Script giữ thông báo bản quyền và chép license từ `scripts/licenses/firebase-apache-2.0.txt` ra `dist/vendor/FIREBASE-LICENSE.txt`. License nguồn được lấy từ tag `firebase@13.1.0` của firebase-js-sdk, gồm cả các thông báo Apache-2.0/BSD của upstream.

CI cần chạy bước bundle trước quét public assets và trước upload Pages artifact. Bundle và notice do script sinh không cần chỉnh tay. Cài lại KaTeX theo workflow hiện hành trước khi chạy toàn bộ check; việc thêm tài khoản không thay quy trình đóng gói công thức.

## CSP và Google popup

Email/password dùng SDK tự phục vụ và các endpoint HTTPS của Firebase. Google popup chính thức còn cần script trợ giúp `https://apis.google.com/js/api.js` và iframe `https://<projectId>.firebaseapp.com`. Vì vậy chỉ bundle SDK cục bộ không đủ để giữ `script-src 'self'` tuyệt đối cho đăng nhập Google.

Khi config hợp lệ, policy cần cho phép chính xác origin `https://apis.google.com` trong `script-src` và chính xác origin auth domain đã được validator xác nhận trong `frame-src`. Không dùng wildcard, `unsafe-eval` hoặc thêm toàn bộ `google.com`/`gstatic.com` chỉ để tránh lỗi. `connect-src` cần các endpoint Authentication `https://identitytoolkit.googleapis.com`, `https://securetoken.googleapis.com` và helper origin phù hợp, cùng các dịch vụ hiện có được duyệt. `accounts.google.com` là trang trong cửa sổ popup, không phải iframe được nhúng vào trang Quanh Lab.

Resolver popup không được gắn lúc khởi tạo adapter; script/iframe Google chỉ được yêu cầu khi người học chọn Google. Nếu project bật reCAPTCHA Enterprise bắt buộc cho email/password, cần duyệt thêm các nguồn và kiểm thử CSP riêng. Bản này không triển khai phone/SMS/reCAPTCHA UI hoặc tự nới policy để bỏ qua cấu hình đó.

Cửa sổ bị chặn/đóng, provider chưa bật hoặc hostname chưa được cho phép có lỗi riêng. Không chuyển ngầm sang redirect, vì redirect có thể làm mất trạng thái thí nghiệm đang mở. Hộp tài khoản gọi `prepare()` khi mở để SDK sẵn sàng trước lần bấm Google. Trình duyệt vẫn có thể chặn popup; cho phép popup rồi bấm lại.

## Dữ liệu và phiên đăng nhập

- Chỉ khởi tạo SDK sau `prepare()` hoặc thao tác tài khoản do người dùng thực hiện. Khởi tạo client, đọc snapshot và subscribe không gửi yêu cầu Firebase. Khi config thiếu/sai, không tải SDK hay gửi request dịch vụ.
- Mặc định dùng `browserSessionPersistence`: phiên của tab trình duyệt. Tùy chọn “Ghi nhớ đăng nhập” chủ động chọn `browserLocalPersistence`. Trình duyệt có thể hạn chế/khôi phục storage theo chế độ riêng tư và chính sách của thiết bị; cần kiểm tra browser mục tiêu.
- Adapter chỉ lưu lựa chọn không bí mật `quanh.auth.persistence.v1=local` khi người dùng chọn ghi nhớ. Firebase SDK tự quản lý trạng thái/token theo persistence đã chọn. Không tự chép mật khẩu, ID token, refresh token hoặc custom token vào localStorage, log, URL hay file phiên của Quanh Lab.
- Sau tải lại, trạng thái được khôi phục qua Firebase `onAuthStateChanged` khi người dùng mở phần tài khoản. Snapshot chỉ gồm UID, email, tên hiển thị, trạng thái email verified và mã nhà cung cấp; không trả token cho UI.
- Tạo tài khoản email/password không tự xác nhận email. `emailVerified:false` được giữ nguyên; không được gắn nhãn “email đã xác minh” khi chưa có quy trình xác minh.
- Yêu cầu đặt lại mật khẩu không công bố email có tồn tại hay không. Thông báo UI nên dùng “Nếu email đã đăng ký, hướng dẫn sẽ được gửi”.
- Dữ liệu danh mục/thí nghiệm, ghi chép, tiến độ, sách, hội thoại AI không tự tải lên Firebase. Không có Firestore/Storage database hay đồng bộ đa thiết bị trong phạm vi này. Đăng nhập cũng không tự bảo vệ static Pages, backend AI hoặc tạo quyền quản trị; backend cần tự xác minh token và phân quyền nếu có tính năng bảo vệ sau này.
- Đăng xuất chỉ kết thúc phiên Firebase. Xóa tài khoản gọi Firebase `deleteUser` sau xác nhận rõ ràng; yêu cầu recent-login được hiển thị để người học đăng xuất/đăng nhập lại rồi thử lại. Không xóa dữ liệu thí nghiệm cục bộ hoặc tài khoản Google gốc. Firebase/Google có chính sách lưu giữ dữ liệu dịch vụ riêng.
- Không đọc/xóa các khóa phiên thí nghiệm hiện hành, không gọi `localStorage.clear()` và không di chuyển dữ liệu từ người dùng cũ sang người dùng mới.

Trước khi công khai đăng ký thật, chủ dự án cần duyệt thông báo quyền riêng tư phù hợp đối tượng học sinh, dữ liệu email/tên/UID do Firebase xử lý, mục đích sử dụng, cách liên hệ hỗ trợ/xóa tài khoản và điều khoản dịch vụ. Không tự bật thu thập số điện thoại, ngày sinh, hồ sơ học sinh hoặc marketing.

## API adapter cho UI

`createAuthClient({config, loadSDK, storage, locale})` trả về:

- `getSnapshot()` và `subscribe(listener)`; unsubscribe do subscribe trả về.
- `prepare()`; alias `start()`.
- `signIn({email,password,remember})`, `signUp(...)`, `signInWithGoogle({remember})`: trả profile đã lọc.
- `resetPassword({email})`, `signOut()`, `deleteAccount()`: resolve không có dữ liệu.
- `destroy()`: hủy listener, không đăng xuất hoặc xóa dữ liệu.

Snapshot bất biến `{enabled,status,user,errorCode,operation}`. `status` thuộc `disabled`, `idle`, `loading`, `ready`, `busy`, `error`; dùng `user!==null` để nhận biết đã đăng nhập. `operation` cho biết thao tác đang chờ. Lỗi chỉ lộ mã allowlist và thông báo đã lọc, không trả nguyên `customData`/credential từ SDK. `authErrorText(code,locale)` cung cấp copy VI/EN.

`validateAuthConfig(config)` trả `{enabled,valid,errorCode,firebase}`; `valid:true` chỉ khi cấu hình bật và đúng toàn bộ điều kiện. `authAvailability(config)` là snapshot ngắn `{enabled,errorCode}`. `loadSDK` là seam kiểm thử, không phải lựa chọn provider cho người dùng cuối.

## Kiểm chứng và giới hạn

`checks/auth-client-v64.mjs` dùng Firebase SDK fixtures để kiểm lazy loading, config, SESSION/LOCAL, khôi phục user, vòng đời tài khoản, lỗi popup/network, recent-login, timeout và bảo toàn khóa phiên. Không dùng mật khẩu/API token thật. Browser UI fixtures kiểm thao tác và phản hồi. `python3 checks/browser-auth-sdk-v64.py` (server static ở cổng 4173) kiểm bundle Firebase thật với REST response giả lập: signup/signin, SESSION, chọn LOCAL và khôi phục sau reload, password reset, delete. Bằng chứng ghi vào `work/auth-sdk/report.json`; không tạo account thật hoặc gọi OAuth Google.

Chỉ nghiệm thu dịch vụ sau khi kiểm HTTPS domain thật: đăng ký/tạo user trong Firebase Console, đăng nhập email, nhận email đặt lại mật khẩu, Google popup thành công, đóng/chặn popup, khôi phục phiên theo lựa chọn ghi nhớ, đăng xuất và xóa tài khoản. Kiểm trên Safari/iPhone và Android thật là việc riêng, không suy ra từ Chromium giả lập.

Nguồn chính thức:

- https://firebase.google.com/docs/web/setup
- https://firebase.google.com/docs/auth/web/start
- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/auth/web/auth-state-persistence
- https://firebase.google.com/docs/auth/web/manage-users
- https://firebase.google.com/docs/projects/api-keys
- https://github.com/firebase/firebase-js-sdk/blob/firebase%4013.1.0/LICENSE
