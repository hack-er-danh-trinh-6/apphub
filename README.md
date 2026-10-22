# AppHub

Ứng dụng web quản lý và phân phối APK. Source có sẵn APK hiện tại ở `app.apk` tại thư mục gốc.

## Deploy miễn phí bằng Render Web Service

1. Mở [Render Dashboard](https://dashboard.render.com/) và chọn **New > Web Service**.
2. Kết nối GitHub nếu được hỏi, rồi chọn repo riêng tư `hack-er-danh-trinh-6/apphub`, nhánh `main`.
3. Điền cấu hình:
   - **Name:** `apphub-pop-ai`
   - **Language/Runtime:** `Node`
   - **Region:** `Singapore`
   - **Branch:** `main`
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
4. Trong phần **Environment Variables**, thêm:
   - `ADMIN_PASSWORD` = mật khẩu quản trị mạnh do bạn tự đặt
   - `DATA_DIR` = `/tmp/apphub-data`
   - `NODE_ENV` = `production`
5. Trong phần **Health Check Path** nếu có, nhập `/health`. Bật auto-deploy khi có commit lên `main` nếu Render chưa bật sẵn.
6. Bấm **Create Web Service** và theo dõi log cho đến khi trạng thái Live. Render sẽ cấp URL dạng `https://apphub-pop-ai.onrender.com`.

Nếu repo riêng tư không xuất hiện, cấp quyền cho Render truy cập repo này trong phần cài đặt GitHub của Render, rồi tải lại danh sách repo.

Sau deploy, mở URL Render để xem trang chính. Vào `/#/admin` để đăng nhập bằng giá trị `ADMIN_PASSWORD` đã cấu hình.

### Tự ping để hạn chế Render Free sleep

`server.js` dùng biến Render tự cấp `RENDER_EXTERNAL_URL` để gọi endpoint `/health` của chính dịch vụ mỗi 5 phút. Không cần cài `axios`, nhập URL Render, tạo GitHub Actions workflow hoặc cấu hình dịch vụ ping bên ngoài. Bộ hẹn giờ chỉ chạy trên Render.

Sau khi deploy, nếu Render khởi động ứng dụng thì các request tự ping sẽ giữ traffic đều đặn. Nếu service đã sleep hoặc bị restart, tiến trình hẹn giờ không thể tự chạy khi nó đang dừng; request đầu tiên từ người dùng sẽ đánh thức service, sau đó self-ping tiếp tục. Cách này giúp hạn chế sleep nhưng không ngăn được restart ngoài ý muốn hay các giới hạn/quy tắc Render Free.

Render Free có quota 750 instance-hours mỗi workspace mỗi tháng, dùng chung với các Free service khác. Self-ping liên tục có thể dùng gần hết quota đó. Xem [giới hạn Render Free](https://render.com/docs/free).

Filesystem Free vẫn tạm thời. Database, lượt tải và file upload trong `/tmp/apphub-data` có thể mất khi service restart hoặc deploy lại; self-ping không làm dữ liệu bền vững.

## Cập nhật APK

1. Thay file `app.apk` ở thư mục gốc bằng APK mới, giữ nguyên tên `app.apk`.
2. Cập nhật trường `version` trong `app-config.json` để phiên bản trên trang cũng thay đổi. Có thể cập nhật thêm `description`, `name` hoặc `developer` tại đây.
3. Commit và push lên `main`. Render tự deploy commit mới; link tải hiện tại sẽ phục vụ APK mới.

`app-config.json` là metadata được đọc từ source ở mỗi lần chạy. Database trên filesystem tạm thời giữ số lượt tải và các ứng dụng khác cho đến khi instance bị restart, sleep hoặc deploy lại.

## Chạy local

```bash
npm ci
ADMIN_PASSWORD='your-strong-password' npm start
```

Mở `http://localhost:3000`. Mặc định dữ liệu local nằm ở `data.json` và thư mục `uploads/`. Có thể đặt `PORT` và `DATA_DIR` qua biến môi trường.

## Dữ liệu và bảo mật

- `ADMIN_PASSWORD` không được lưu trong Git; hãy cấu hình nó trong Render Environment hoặc môi trường chạy local.
- `app.apk` và icon ban đầu được version-control trong repo. Các file được tải lên từ trang admin được lưu trong `DATA_DIR` và có thể mất theo giới hạn filesystem của plan.
- Không đưa file bí mật, token, hoặc dữ liệu cá nhân vào repo.

## Cấu hình Blueprint tùy chọn

Repo vẫn có `render.yaml` với cùng cài đặt Web Service Free. Chỉ dùng file này nếu muốn tạo service bằng **New > Blueprint** thay vì tạo Web Service trực tiếp như các bước bên trên.
