// Tạo static site vào thư mục dist/:
//  - sao chép public/ (index.html)
//  - sao chép file APK + icon khai báo trong apps.json
//  - ghi dist/apps.json với dung lượng APK thật (tự tính, không cần nhập tay)
// Không cần cài thư viện nào.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const fail = (msg) => { console.error(`Lỗi build: ${msg}`); process.exit(1); };

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name), dest = path.join(to, entry.name);
    entry.isDirectory() ? copyDir(src, dest) : fs.copyFileSync(src, dest);
  }
}

let catalog;
try { catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps.json'), 'utf8')); }
catch (e) { fail(`không đọc được apps.json (${e.message})`); }
if (!Array.isArray(catalog)) fail('apps.json phải là một mảng []');

fs.rmSync(OUT, { recursive: true, force: true });
copyDir(path.join(ROOT, 'public'), OUT);

function copyAsset(app, field) {
  const rel = app[field];
  if (typeof rel !== 'string' || !rel) fail(`"${app.name || app.id}" thiếu trường "${field}"`);
  const src = path.resolve(ROOT, rel);
  if (!src.startsWith(ROOT + path.sep)) fail(`đường dẫn "${rel}" nằm ngoài repo`);
  if (!fs.existsSync(src) || !fs.statSync(src).isFile()) fail(`không tìm thấy file "${rel}" (ứng dụng "${app.name}")`);
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return { url: rel.split(/[\\/]/).map(encodeURIComponent).join('/'), size: fs.statSync(src).size };
}

const ids = new Set();
const apps = catalog.map((app) => {
  if (!app.name) fail('có ứng dụng thiếu "name"');
  if (!/^[\w-]+$/.test(app.id || '')) fail(`"${app.name}": "id" chỉ gồm chữ không dấu, số, - hoặc _`);
  if (ids.has(app.id)) fail(`id "${app.id}" bị trùng`);
  ids.add(app.id);
  const apk = copyAsset(app, 'apk'), icon = copyAsset(app, 'icon');
  const { apk: _a, icon: _i, ...meta } = app;
  return {
    developer: 'Không rõ', category: 'Khác', version: '1.0', description: '', ...meta,
    size: apk.size, apkUrl: apk.url, iconUrl: icon.url,
  };
});

fs.writeFileSync(path.join(OUT, 'apps.json'), JSON.stringify(apps, null, 2));
console.log(`Build xong: ${apps.length} ứng dụng -> dist/`);
