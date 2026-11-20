# AppHub

Trang phân phối APK dạng **static site**: không có máy chủ, không cần đăng nhập, không bị sleep. Danh sách ứng dụng nằm trong `apps.json`, file APK và icon nằm ngay trong repo.

## Deploy lên Render (Static Site)

Render không cho đổi Web Service đang chạy thành Static Site, nên phải tạo service mới.

1. Nếu muốn giữ tên/URL cũ (`apphub-pop-ai`), xóa Web Service cũ trước: **Settings > Delete Web Service**.
2. Vào [Render Dashboard](https://dashboard.render.com/) > **New > Static Site**, chọn repo `hack-er-danh-trinh-6/apphub`, nhánh `main`.
3. Điền cấu hình:
   - **Name:** `apphub-pop-ai`
   - **Build Command:** `node build.js`
   - **Publish Directory:** `dist`
4. Bấm **Create Static Site**. Không cần biến môi trường nào (`ADMIN_PASSWORD`, `DATA_DIR`, `NODE_ENV` không còn dùng).

Hoặc dùng **New > Blueprint**: `render.yaml` trong repo đã có sẵn cấu hình trên.

## Cập nhật APK

1. Thay file `app.apk` bằng bản mới (giữ nguyên tên).
2. Sửa `version` và `updatedAt` của ứng dụng trong `apps.json`.
3. Commit lên `main`. Render tự build lại; dung lượng APK được tính tự động.

## Thêm ứng dụng mới

1. Upload file APK và icon (PNG/JPG/WEBP) vào repo.
2. Thêm một khối vào `apps.json`:

```json
{
  "id": "ten-ung-dung",
  "name": "Tên ứng dụng",
  "developer": "Tên nhà phát triển",
  "category": "Công cụ",
  "version": "1.0",
  "description": "Mô tả ngắn",
  "updatedAt": "2026-11-20",
  "apk": "ten-ung-dung.apk",
  "icon": "icons/ten-ung-dung.png"
}
```

- `id`: duy nhất, chỉ gồm chữ không dấu, số, `-`, `_` (dùng trong link `#/app/<id>`).
- `apk`, `icon`: đường dẫn file tính từ thư mục gốc của repo.
- Ứng dụng có `updatedAt` mới nhất sẽ là banner nổi bật ở trang chủ.

## Chạy local

```bash
node build.js
npx serve dist          # hoặc: python3 -m http.server 8080 -d dist
```

## Lưu ý

- Static site không có backend nên **không còn trang quản trị, đăng nhập, upload qua web và đếm lượt tải**. Mọi thay đổi đều làm bằng cách sửa repo rồi push.
- GitHub không nhận file đơn lẻ trên 100 MB, nên APK lớn hơn mức này cần cách lưu trữ khác.
- Chỉ cài ứng dụng từ nguồn bạn tin tưởng.
