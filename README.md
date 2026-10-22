# AppHub

Ứng dụng web quản lý và phân phối APK. Source có sẵn APK hiện tại ở `app.apk` tại thư mục gốc.

## Deploy miễn phí lên Render

1. Trên Render Dashboard, chọn **New > Blueprint** và kết nối repository GitHub này.
2. Chọn nhánh `main`. Render sẽ đọc cấu hình ở `render.yaml`.
3. Khi được hỏi, đặt mật khẩu mạnh cho biến bí mật `ADMIN_PASSWORD`.
4. Xác nhận tạo web service với plan `free`, vùng Singapore, build `npm ci`, start `npm start` và health check `/health`.

Sau khi deploy, Render cấp URL `onrender.com`. Mỗi lần push commit mới lên `main`, Render tự deploy lại.

### Giới hạn của gói miễn phí

Render Free không hỗ trợ persistent disk. Service sẽ sleep sau 15 phút không có traffic và có thể mất khoảng một phút để thức dậy khi nhận request tiếp theo. Filesystem local là tạm thời; nội dung trong `/tmp/apphub-data` như database, lượt tải và APK/icon được upload qua trang quản trị sẽ mất khi service sleep, restart hoặc deploy lại. Khi khởi động lại, catalog và icon ban đầu được seed lại từ repo; APK gốc `app.apk` vẫn có trong source. Do đó gói free phù hợp để thử nghiệm, không phù hợp nếu cần giữ dữ liệu hoặc file người dùng tải lên lâu dài.

Render cũng có giới hạn giờ chạy, băng thông và build cho gói free. Xem các giới hạn hiện hành trong [tài liệu Render Free](https://render.com/docs/free).

## Cập nhật APK

1. Thay file `app.apk` ở thư mục gốc bằng APK mới, giữ nguyên tên `app.apk`.
2. Cập nhật trường `version` trong `app-config.json` để phiên bản trên trang cũng thay đổi. Có thể cập nhật thêm `description`, `name` hoặc `developer` tại đây.
3. Commit và push. Render sẽ build/deploy lại; link tải hiện tại sẽ phục vụ file APK mới.

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
