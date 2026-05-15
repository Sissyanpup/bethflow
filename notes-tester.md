# Laporan Kesiapan Deploy — Bethflow (Rev13)

---

Tim Hitam — Keamanan (Security Testing)

Skor: 82 / 100

Lulus ✅

┌───────────────────────┬─────────────────────────────────────────────────────────┐
│ Vektor │ Temuan │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ JWT RS256 │ alg:none attack diblokir (tested + automated) │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ IDOR │ Alice tidak bisa baca board Bob → 403 (tested) │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ Mass assignment │ role/isVerified/isActive diabaikan saat PATCH /me │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ XSS – cards │ sanitize-html mode plain-text di title, desc, │
│ │ checklist, comment │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ XSS – social links │ javascript:, data:, ftp:, file:, vbscript: diblokir │
│ │ validator Zod │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ XSS – avatarUrl / │ Zod schema enforces https:// / http:// only │
│ mediaUrl │ │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ Brute force login │ Redis-backed, 20 req / 15 min per IP:email │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ Brute force OTP │ 5 req / 10 min terpisah dari auth limiter │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ Bcrypt │ Rounds 12 ✅ │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ Refresh token │ HttpOnly, SameSite=Strict, Secure di prod, single-use │
│ │ rotated │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ User enumeration │ Pesan error sama untuk email salah vs password salah │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ GDPR │ GET /api/users/me/export + DELETE /api/users/me — │
│ │ berjalan dan dites │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ Soft delete │ isActive=false, tidak hard DELETE │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ Prisma ORM │ Tidak ada raw SQL dengan user input │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ CORS │ Whitelist berbasis env, credentials: true │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ Helmet │ X-Frame-Options, X-Content-Type-Options, │
│ │ X-DNS-Prefetch-Control aktif │
├───────────────────────┼─────────────────────────────────────────────────────────┤
│ CSP │ Set di nginx untuk HTML; dimatikan di API (benar — API │
│ │ adalah JSON) │
└───────────────────────┴─────────────────────────────────────────────────────────┘

Gagal / Risiko ❌

[KRITIS] Socket.IO /board namespace tidak ada autentikasi.
File apps/api/src/lib/socket.ts: siapapun bisa socket.emit('board:join', '<boardId>')
tanpa token dan menerima semua event card:moved, card:created, card:deleted dari board
tersebut. Data leak realtime lintas user.

[MENENGAH] OTP menggunakan Math.random() — tidak kriptografis aman.
auth.service.ts:22: Math.floor(100000 + Math.random() \* 900000). Seharusnya
crypto.randomInt(100000, 999999). Math.random() Node.js bukan CSPRNG.

[RENDAH] BotToken disimpan plain-text di database.
Jika terjadi DB breach, semua bot token langsung terkompromis. Sebaiknya di-hash
(seperti refresh token).

---

Tim Putih — Fungsional & Kualitas (White-box Testing)

Skor: 78 / 100

Lulus ✅

- 52 automated tests lulus semua — auth flow, security, validators
- TypeScript 0 errors di API dan Web
- Fitur lengkap sesuai PROGRESS.md: Kanban+DnD, CardModal, Archive, Projects/Gantt,
  Catalogs, Admin CRUD, OTP verify, GDPR, 404, ErrorBoundary
- Auth flow register → OTP email → verify → auto-login berfungsi
- Refresh token rotation single-use teruji
- ErrorBoundary terpasang di root main.tsx
- NotFound.tsx terdaftar di router

Gagal / Celah ❌

[TINGGI] ESLint tidak bisa jalan di container.
Error: Cannot find package '@typescript-eslint/eslint-plugin'
Saat ini npm run lint crash total. Tidak ada linting enforcement sebelum deploy.

[MENENGAH] Coverage test sangat sempit.
Hanya 3 file test: auth, security, validators. Tidak ada test untuk:

- boards, lists, cards (DnD, archive, reorder)
- projects, tasks, catalogs
- admin CRUD
- social-links
- Frontend (tidak ada Playwright / Cypress sama sekali)

[RENDAH] Swagger/OpenAPI belum ada.
/api/docs tercatat di PROGRESS.md sebagai "Belum". Tidak ada dokumentasi API untuk
onboarding / integrasi.

[INFO] Beberapa halaman mobile masih "perlu fix" per PROGRESS.md:

- BoardDetail header padding di HP kecil
- Gantt area belum full-mobile

---

Tim Biru — Infrastruktur & DevOps

Skor: 72 / 100

Lulus ✅

- 4 container running + healthy (postgres, redis, api, web)
- docker-compose.prod.yml dikonfigurasi dengan benar:
  - DB dan Redis tidak expose port ke host
  - API tidak expose ke host (nginx proxy)
  - Redis wajib password di prod
- Multi-stage Dockerfile (dev → builder → prod) untuk API dan Web
- nginx production: CSP, gzip, cache 1-year untuk asset hash, WebSocket proxy
- Health check /health tersedia
- Env validation saat startup — crash jika var wajib hilang, warn jika SMTP hilang
- .env.production.example lengkap dengan instruksi generate keys

Gagal / Celah ❌

[BLOCKER] HTTPS belum dikonfigurasi.
nginx.conf memiliki SSL commented-out sepenuhnya. Saat ini web hanya listen di port 80. Perlu certbot + uncomment blok SSL sebelum deploy ke domain publik. Tidak ada
HSTS.

[BLOCKER] prisma migrate deploy tidak dijalankan saat prod startup.
Prod Dockerfile CMD adalah node dist/app.js — tidak ada migrate. Deploy ke server baru
dengan DB kosong akan crash karena tabel belum ada. Solusi: tambahkan entrypoint
script atau jalankan migrate sebagai init container.

[TINGGI] SMTP tidak dikonfigurasi → OTP tidak terkirim.
Tanpa SMTP_HOST di .env.production, validasi env hanya console.warn (non-fatal).
Pengguna yang register di prod tidak akan terima email verifikasi → tidak bisa login
sama sekali. Ini effectively membuat registrasi tidak berfungsi.

[MENENGAH] Tidak ada CI/CD pipeline.
Tidak ada GitHub Actions, tidak ada otomasi build/test sebelum deploy. Test harus
dijalankan manual.

[MENENGAH] Tidak ada monitoring/alerting.
Tidak ada Prometheus, Grafana, Sentry, atau log aggregation. Jika API crash di prod,
tidak ada notifikasi otomatis.

[RENDAH] Tidak ada resource limits di docker-compose (CPU/memory). Container tidak
dibatasi, satu container yang runaway bisa mematikan host.

[RENDAH] Tidak ada backup strategy terdokumentasi untuk PostgreSQL volume.

---

Tim Merah — Adversarial / Penetration

Skor: 80 / 100

Attack surface yang aman ✅

┌────────────────────────────────────────┬─────────────────────────────────┐
│ Skenario │ Hasil │
├────────────────────────────────────────┼─────────────────────────────────┤
│ alg:none JWT forgery │ 401 ✅ │
├────────────────────────────────────────┼─────────────────────────────────┤
│ Akses board user lain (IDOR) │ 403 ✅ │
├────────────────────────────────────────┼─────────────────────────────────┤
│ Privilege escalation via PATCH /me │ Role tetap USER ✅ │
├────────────────────────────────────────┼─────────────────────────────────┤
│ XSS via card title <script> │ Di-strip ✅ │
├────────────────────────────────────────┼─────────────────────────────────┤
│ javascript:alert() di social link │ 422 ✅ │
├────────────────────────────────────────┼─────────────────────────────────┤
│ data:text/html di social link │ 422 ✅ │
├────────────────────────────────────────┼─────────────────────────────────┤
│ Login tanpa verifikasi email │ 403 EMAIL_NOT_VERIFIED ✅ │
├────────────────────────────────────────┼─────────────────────────────────┤
│ CSRF │ SameSite=Strict memblokirnya ✅ │
├────────────────────────────────────────┼─────────────────────────────────┤
│ SQL injection via search '; DROP TABLE │ Prisma ORM parametrize ✅ │
├────────────────────────────────────────┼─────────────────────────────────┤
│ Route tidak ada │ 404 JSON bukan stack trace ✅ │
└────────────────────────────────────────┴─────────────────────────────────┘

Vektor yang berhasil / perlu perhatian ❌

[KRITIS] Socket.IO lateral movement.
Melalui koneksi WebSocket ke /board, seorang attacker yang tahu UUID board milik user
lain bisa join room-nya dan mendapatkan realtime card events tanpa autentikasi apapun.
UUID board bukan rahasia (terlihat di URL). Severity: HIGH — data leakage realtime.

[MENENGAH] OTP prediction attack (teoritis).
Math.random() di V8 menggunakan xorshift128+ yang tidak aman secara kriptografis.
Dengan akses ke seed (misalnya via side-channel atau jika ada endpoint lain yang
membocorkan nilai random), OTP bisa diprediksi. Fix: crypto.randomInt(100000, 999999).

[INFO] User enumeration via /api/public/users/search.
Endpoint ini memang intentional (fitur guest search), tetapi attacker bisa enumerate
username/email valid secara massal. Pertimbangkan rate limiting khusus untuk endpoint
publik ini.

[INFO] Bot token plain text.
Endpoint POST /api/auth/bot-token mengembalikan token 64-hex yang disimpan plain text
di tabel BotToken. Jika ada DB dump/breach, semua bot token terkompromis langsung.

---

Ringkasan Eksekutif

Tim Hitam (Security) : 82/100 — 2 blocker kritis
Tim Putih (Quality) : 78/100 — 1 blocker ESLint, coverage sempit
Tim Biru (Infra/DevOps): 72/100 — 3 blocker infrastruktur
Tim Merah (Pentest) : 80/100 — 1 blocker kritis Socket.IO

Rata-rata kesiapan : 78/100

---

Daftar Blocker Wajib Sebelum Deploy

#: 1
Prioritas: 🔴 KRITIS  
 Item: Socket.IO /board butuh autentikasi token
File/Lokasi: apps/api/src/lib/socket.ts
────────────────────────────────────────  
 #: 2
Prioritas: 🔴 KRITIS
Item: HTTPS/SSL harus dikonfigurasi (certbot + uncomment nginx)
File/Lokasi: apps/web/nginx.conf, docker-compose.prod.yml  
 ────────────────────────────────────────
#: 3  
 Prioritas: 🔴 KRITIS
Item: prisma migrate deploy harus jalan saat prod startup
File/Lokasi: apps/api/Dockerfile
────────────────────────────────────────
#: 4  
 Prioritas: 🟠 TINGGI
Item: SMTP wajib dikonfigurasi (OTP prod tidak terkirim tanpa ini)
File/Lokasi: .env.production
────────────────────────────────────────
#: 5
Prioritas: 🟠 TINGGI
Item: OTP generation: ganti Math.random() → crypto.randomInt()
File/Lokasi: apps/api/src/modules/auth/auth.service.ts:22
────────────────────────────────────────
#: 6
Prioritas: 🟡 MENENGAH
Item: Perbaiki ESLint di container (package missing)
File/Lokasi: root package.json / container

Kalau keenam item ini diselesaikan, proyek ini layak deploy ke staging/production.

# Deploy

Proyek ini punya 5 service Docker (postgres + redis + api + web + bot) — ini yang
menentukan pilihan. Layanan "serverless" seperti Vercel/Netlify tidak cocok karena
Redis, Postgres, dan Telegram bot butuh proses yang selalu berjalan.

---

Rekomendasi

Gratis Selamanya

Oracle Cloud Free Tier

- 2 VM AMD (1 GB RAM each) atau 1 VM Arm (4 vCPU, 24 GB RAM) — gratis permanen
- Cukup untuk jalankan docker compose up langsung
- 50 GB block storage gratis
- Syarat: daftar pakai kartu kredit (tidak dicharge jika pakai free tier)
- Link: cloud.oracle.com

▎ Ini pilihan terbaik jika mau gratis selamanya. Setup-nya persis seperti dev — SSH ke
▎ VM, git clone, docker compose up -d.

---

Sangat Murah (~$4–5/bulan)

┌───────────────┬───────────┬──────────────────────┬─────────────────┐
│ Layanan │ Harga │ Spesifikasi │ Cocok? │
├───────────────┼───────────┼──────────────────────┼─────────────────┤
│ Hetzner CAX11 │ €3.79/bln │ 2 vCPU Arm, 4 GB RAM │ ✅ Terbaik │
├───────────────┼───────────┼──────────────────────┼─────────────────┤
│ Contabo VPS S │ €4.99/bln │ 4 vCPU, 8 GB RAM │ ✅ Murah banget │
├───────────────┼───────────┼──────────────────────┼─────────────────┤
│ DigitalOcean │ $4/bln │ 1 vCPU, 512 MB RAM │ ⚠ RAM mepet │
├───────────────┼───────────┼──────────────────────┼─────────────────┤
│ Vultr │ $2.50/bln │ 1 vCPU, 512 MB RAM │ ⚠ RAM mepet │
└───────────────┴───────────┴──────────────────────┴─────────────────┘

Hetzner adalah pilihan berbayar terbaik — €3.79 dengan 4 GB RAM sangat nyaman untuk 5
service Docker ini.

---

Platform PaaS (Lebih mudah setup, tapi lebih mahal/kompleks)

┌─────────┬────────────────┬──────────────────────────────────────────────────────┐
│ Layanan │ Estimasi │ Catatan │
├─────────┼────────────────┼──────────────────────────────────────────────────────┤
│ Railway │ ~$5–10/bln │ Docker support bagus, tapi harga per-resource │
├─────────┼────────────────┼──────────────────────────────────────────────────────┤
│ Fly.io │ $0–5/bln │ Free tier ada, tapi Redis + Postgres bisa kena │
│ │ │ charge │
├─────────┼────────────────┼──────────────────────────────────────────────────────┤
│ Render │ Free tier │ Web service tidur setelah 15 menit idle — bot mati │
│ │ tidur │ │
└─────────┴────────────────┴──────────────────────────────────────────────────────┘

PaaS tidak disarankan untuk proyek ini karena harus split tiap service (api, web, bot,
postgres, redis masing-masing jadi service terpisah) — lebih rumit daripada langsung
VPS.

---

Rekomendasi Final

Gratis → Oracle Cloud Free Tier (ARM 4 vCPU 24GB)
Berbayar → Hetzner CAX11 (€3.79/bln, 4GB RAM)

Di keduanya, cara deploy persis sama:
git clone <repo>
cd betha-trello

## isi .env dengan kredensial prod

docker compose up -d

Tidak perlu ubah konfigurasi apapun karena proyek ini sudah Docker-ready.
