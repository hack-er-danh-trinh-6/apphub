const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const DATA_DIR = path.resolve(process.env.DATA_DIR || __dirname);
const UP = path.join(DATA_DIR, 'uploads');
const DB = path.join(DATA_DIR, 'data.json');
const ROOT_APK_NAME = 'app.apk';
const ROOT_APK = path.join(__dirname, ROOT_APK_NAME);
const ROOT_APP_CONFIG = path.join(__dirname, 'app-config.json');

fs.mkdirSync(UP, { recursive: true });

// On a fresh Render disk, seed the initial catalog and icon from the repository.
function seedPersistentData() {
  if (DATA_DIR !== __dirname && !fs.existsSync(DB)) {
    const sourceDb = path.join(__dirname, 'data.json');
    if (fs.existsSync(sourceDb)) fs.copyFileSync(sourceDb, DB);
  }

  const seedUploads = path.join(__dirname, 'seed', 'uploads');
  if (fs.existsSync(seedUploads)) {
    for (const name of fs.readdirSync(seedUploads)) {
      const source = path.join(seedUploads, name);
      const target = path.join(UP, name);
      if (fs.statSync(source).isFile() && !fs.existsSync(target)) {
        fs.copyFileSync(source, target);
      }
    }
  }
}
seedPersistentData();

const load = () => {
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); } catch { return []; }
};
const save = (data) => fs.writeFileSync(DB, JSON.stringify(data, null, 2));
const loadRootAppConfig = () => {
  try { return JSON.parse(fs.readFileSync(ROOT_APP_CONFIG, 'utf8')); } catch { return null; }
};
const tokens = new Set();
const auth = (req, res, next) =>
  tokens.has(req.headers['x-token']) ? next() : res.status(401).json({ error: 'Chưa đăng nhập' });

const upload = multer({
  storage: multer.diskStorage({
    destination: UP,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(10).toString('hex') + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'apk' && ext === '.apk') return cb(null, true);
    if (file.fieldname === 'icon' && ['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return cb(null, true);
    cb(new Error('Sai định dạng file (APK cho ứng dụng, PNG/JPG/WEBP cho icon)'));
  },
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Keep the free Render web service warm by requesting its public health URL.
// Render supplies RENDER_EXTERNAL_URL automatically; this timer exists only
// while the app process is running and is not started during local development.
const selfPingBaseUrl = process.env.RENDER === 'true' && process.env.RENDER_EXTERNAL_URL
  ? process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '')
  : '';
if (selfPingBaseUrl) {
  const selfPing = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${selfPingBaseUrl}/health`, { signal: controller.signal });
      if (!response.ok) console.warn(`Render self-ping returned HTTP ${response.status}`);
    } catch (error) {
      console.warn(`Render self-ping failed: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  };
  const timer = setInterval(selfPing, 5 * 60 * 1000);
  timer.unref();
  console.log(`Render self-ping enabled for ${selfPingBaseUrl} every 5 minutes`);
}
const find = (id) => load().find((item) => item.id === id);
const publicApp = (item) => {
  const { apkFile, iconFile, ...rest } = item;
  const config = loadRootAppConfig();
  if (apkFile === ROOT_APK_NAME && config && config.id === item.id) {
    Object.assign(rest, {
      name: config.name || rest.name,
      developer: config.developer || rest.developer,
      category: config.category || rest.category,
      version: config.version || rest.version,
      description: config.description ?? rest.description,
    });
    try { rest.size = fs.statSync(ROOT_APK).size; } catch { /* keep saved size */ }
  }
  return rest;
};
const apkPathFor = (item) => item.apkFile === ROOT_APK_NAME
  ? ROOT_APK
  : path.join(UP, item.apkFile);

app.get('/health', (req, res) => res.status(200).send('ok'));
app.get('/api/apps', (req, res) => res.json(load().map(publicApp).reverse()));
app.get('/api/apps/:id/icon', (req, res) => {
  const item = find(req.params.id);
  if (!item) return res.sendStatus(404);
  res.sendFile(path.join(UP, item.iconFile));
});
app.get('/api/apps/:id/download', (req, res) => {
  const db = load();
  const item = db.find((entry) => entry.id === req.params.id);
  if (!item) return res.sendStatus(404);
  const apkPath = apkPathFor(item);
  if (!fs.existsSync(apkPath)) return res.status(404).send('APK không tồn tại');
  item.downloads++;
  save(db);
  const slug = item.name.replace(/[^\w.-]+/g, '_');
  res.type('application/vnd.android.package-archive');
  res.download(apkPath, `${slug}-${publicApp(item).version}.apk`);
});
app.post('/api/login', (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(503).json({ error: 'Chưa cấu hình ADMIN_PASSWORD trên máy chủ' });
  const ok = String(req.body.password || '') === ADMIN_PASSWORD;
  if (!ok) return res.status(401).json({ error: 'Sai mật khẩu' });
  const token = crypto.randomBytes(24).toString('hex');
  tokens.add(token);
  res.json({ token });
});
app.post('/api/admin/apps', auth, upload.fields([{ name: 'apk', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), (req, res) => {
  const { name, developer, category, version, description } = req.body;
  const apk = req.files?.apk?.[0], icon = req.files?.icon?.[0];
  if (!name || !apk || !icon) {
    [apk, icon].forEach((file) => file && fs.unlink(file.path, () => {}));
    return res.status(400).json({ error: 'Cần có tên, file APK và icon' });
  }
  const db = load();
  const item = {
    id: crypto.randomBytes(6).toString('hex'),
    name, developer: developer || 'Không rõ', category: category || 'Khác',
    version: version || '1.0', description: description || '',
    size: apk.size, downloads: 0, createdAt: new Date().toISOString(),
    apkFile: apk.filename, iconFile: icon.filename,
  };
  db.push(item);
  save(db);
  res.json(publicApp(item));
});
app.delete('/api/admin/apps/:id', auth, (req, res) => {
  const db = load();
  const item = db.find((entry) => entry.id === req.params.id);
  if (!item) return res.sendStatus(404);
  if (item.apkFile !== ROOT_APK_NAME) fs.unlink(path.join(UP, item.apkFile), () => {});
  fs.unlink(path.join(UP, item.iconFile), () => {});
  save(db.filter((entry) => entry.id !== item.id));
  res.json({ ok: true });
});
app.use((err, req, res, next) => res.status(400).json({ error: err.message }));
app.listen(PORT, '0.0.0.0', () => console.log(`AppHub listening on port ${PORT}`));
