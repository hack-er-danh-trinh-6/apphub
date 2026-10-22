# AppHub

Ứng dụng web quản lý và phân phối APK. Source có sẵn APK hiện tại ở `app.apk` tại thư mục gốc.

## Deploy lên Render

1. Tạo Blueprint trên Render và chọn repository này. Render sẽ đọc cấu hình `render.yaml`.
2. Khi được hỏi, nhập một mật khẩu quản trị mạnh cho biến bí mật `ADMIN_PASSWORD`.
3. Blueprint dùng Node.js, lệnh build `npm ci`, lệnh chạy `npm start`, vùng Singapore và kiểm tra sức khỏe tại `/health`.
4. Blueprint gắn ổ đĩa 1 GB tại `/var/data` để giữ database và các file tải lên qua những lần restart/deploy. Gói máy chủ và ổ đĩa persistent trong cấu hình này là trả phí; cần xem chi phí hiện tại trên Render trước khi tạo dịch vụ.

Render cung cấp URL `onrender.com` sau khi dịch vụ deploy xong. Mỗi lần push lên nhánh chính, Render tự deploy commit mới.

## Cập nhật APK

1. Thay file `app.apk` ở thư mục gốc bằng APK mới, giữ nguyên tên `app.apk`.
2. Cập nhật trường `version` trong `app-config.json` để phiên bản trên trang cũng thay đổi. Có thể cập nhật thêm `description`, `name` hoặc `developer` tại đây.
3. Commit và push. Render sẽ build/deploy lại; link tải hiện tại sẽ phục vụ file APK mới.

`app-config.json` là metadata được đọc từ source ở mỗi lần chạy. Database trên ổ đĩa giữ số lượt tải và các ứng dụng khác; vì vậy không cần sửa database persistent khi cập nhật APK gốc.

## Chạy local

```bash
npm ci
ADMIN_PASSWORD='your-strong-password' npm start
```

Mở `http://localhost:3000`. Mặc định dữ liệu local nằm ở `data.json` và thư mục `uploads/`. Có thể đặt `PORT` và `DATA_DIR` qua biến môi trường.

## Dữ liệu và bảo mật

- `ADMIN_PASSWORD` không được lưu trong Git; hãy cấu hình nó trong Render Environment hoặc môi trường chạy local.
- `app.apk` và icon ban đầu được version-control trong repo. Các file được tải lên từ trang admin được lưu trong `DATA_DIR`.
- Không đưa file bí mật, token, hoặc dữ liệu cá nhân vào repo.
