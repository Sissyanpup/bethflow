# Bethflow — Progress Snapshot (2026-05-15 rev9)

> Ringkasan status proyek untuk AI agent. Baca ini sebelum mulai bekerja.

---

## Status Umum

| Layer                    | Status                                                                          |
| ------------------------ | ------------------------------------------------------------------------------- |
| Docker (4 container)     | ✅ Running                                                                      |
| PostgreSQL 16            | ✅ Up + healthy                                                                 |
| Redis 7                  | ✅ Up + healthy                                                                 |
| API (Express 5)          | ✅ Running `:4000`                                                              |
| Web (React + Vite)       | ✅ Running `:5173`                                                              |
| Prisma migration         | ✅ Applied (`20260515000002_add_catalog_group`)                                 |
| DB seed                  | ✅ Done — admin + demo user + dummy data                                        |
| Semua halaman            | ✅ Diverifikasi di browser (rev3)                                               |
| Card Modal (Trello)      | ✅ Implemented (rev4)                                                           |
| Archive Card/List        | ✅ Implemented (rev4)                                                           |
| Guest Search Cards       | ✅ Implemented (rev4)                                                           |
| Public Profile Stats     | ✅ Implemented (rev4)                                                           |
| Admin Full CRUD          | ✅ Implemented (rev4)                                                           |
| Export Excel             | ✅ Implemented (rev4) — xlsx installed                                          |
| Admin Login Redirect     | ✅ Fixed (rev5) — ADMIN role redirects to `/admin` on login                    |
| DnD Bug Fix              | ✅ Fixed (rev5) — arrayMove same-list, useDroppable empty list                 |
| Board Edit Modal         | ✅ Implemented (rev5) — title/desc/color + isPublic (Private/Public toggle)    |
| Board isPublic           | ✅ Implemented (rev5) — migration applied, API updated, shared package rebuilt |
| Card Three-Dot Removed   | ✅ Fixed (rev5) — click card = CardModal; Delete added to modal sidebar        |
| Public Boards            | ✅ Implemented (rev5) — /api/public/:username/boards + PublicProfile section   |
| CSP eval blocked         | ✅ Fixed (rev6) — Helmet contentSecurityPolicy dimatikan di API (API = JSON)   |
| Login sering gagal       | ✅ Fixed (rev6) — Redis store + IP:email key + max 20 + xfwd proxy             |
| Dark/Light/System mode   | ✅ Implemented (rev6) — ThemeToggle di semua layout, persist localStorage      |
| Responsive mobile        | ✅ Fixed (rev6) — drawer sidebar UserLayout/AdminLayout, mobile nav GuestLayout |
| Root "/" redirect        | ✅ Fixed (rev6) — GuestLayout auth-aware: logged-in → Dashboard button         |
| Dark mode bugs           | ✅ Fixed (rev7) — Catalogs/AuthLayout/GuestHome/GuestLayout/Login/ProjectDetail |
| Board-Project integration| ✅ Implemented (rev7) — Card dates auto-link to Project task (find/create)      |
| Status dots on Kanban    | ✅ Implemented (rev7) — Colored dot on card if linked task exists               |
| CardModal task status    | ✅ Implemented (rev7) — TaskStatusPicker in sidebar when task is linked          |
| Catalog status dots      | ✅ Implemented (rev7) — Status count badges on catalog cards                    |
| Responsive Gantt mobile  | ✅ Fixed (rev7) — task name col: clamp(200px,30vw,360px)                       |
| Auth hard-refresh logout | ✅ Fixed (rev8) — AppRoot wrapper calls refresh() before RouterProvider renders  |
| Logo login/regis link    | ✅ Fixed (rev8) — Left-panel logo in AuthLayout wrapped with Link to="/"        |
| ProjectDetail task modal | ✅ Implemented (rev8) — Edit task modal: title, description, status, dates      |
| Task add form            | ✅ Enhanced (rev8) — Add task form now includes description + status selector    |
| Catalogs group system    | ✅ Implemented (rev8) — group field (DB + API + UI): grouped view + edit modal  |
| Auth refresh loop fix    | ✅ Fixed (rev9) — axios interceptor skip retry on /auth/refresh + useRef guard  |

---

## Stack

```
Root:      /home/bethapup/betha-trello/
Language:  TypeScript strict (ESM)
Backend:   Node.js 22 + Express 5 + Prisma 6
Frontend:  React 19 + Vite + TanStack Router v1 + TanStack Query v5
Database:  PostgreSQL 16 (Prisma ORM only — no raw SQL)
Cache:     Redis 7
Realtime:  Socket.IO 4  (namespace /board)
Container: Docker Compose
Shared:    packages/shared/  (Zod validators + TypeScript types)
```

---

## Seed Credentials

```
Admin:   admin@bethflow.dev  /  Admin1234!  (role: ADMIN)
Demo:    demo@bethflow.dev   /  User1234!   (role: USER, username: demouser)
```

**Dummy data (akun demo):**

- 5 boards: My First Board, Product Roadmap, Marketing Campaign, Bug Tracker, Ych Queue
- Bug Tracker: 4 lists (Reported/Investigating/Fixing/Resolved) + 10 cards
- Product Roadmap: 4 lists + 15 cards
- Marketing Campaign: 4 lists + 10 cards
- 3 projects: Website Redesign 2026, Mobile App MVP, Q2 Backend Infrastructure (masing-masing 6–7 tasks dengan tanggal nyata + status beragam)
- 6 catalogs: User Research Report, Design System Components, API Documentation v2, Competitor Analysis, Q2 Content Calendar, Brand Asset Library
- 8 social links: GitHub, LinkedIn, Twitter, Instagram, YouTube Channel, Telegram, Personal Site, Discord (Discord `isVisible: false`)

---

## WARNING — Shared Package Build

`packages/shared` menggunakan `dist/` (bukan source langsung). Setelah edit **apapun** di `packages/shared/src/`, wajib rebuild di **kedua** container sebelum test:

```bash
docker compose exec api sh -c "cd /workspace/packages/shared && npm run build"
docker compose exec web sh -c "cd /workspace/packages/shared && npm run build"
```

Tidak rebuild = validator/type lama masih dipakai, bug runtime yang susah dilacak.

---

## Struktur File Penting

```
betha-trello/
├── CLAUDE.md                        <- Aturan utama proyek (BACA DULU)
├── PROGRESS.md                      <- File ini
├── notes.md                         <- Revisi pending (kosong = semua rev5 selesai)
├── .env                             <- Sudah ada JWT keys + DB creds
├── docker-compose.yml
├── apps/
│   ├── api/
│   │   ├── src/app.ts               <- Entry point Express, semua router terdaftar
│   │   ├── src/middleware/          <- auth, rbac, rate-limit, validate, security
│   │   ├── src/lib/                 <- prisma.ts, redis.ts, socket.ts, logger.ts
│   │   └── src/modules/
│   │       ├── auth/                <- register, login, refresh, logout
│   │       ├── users/               <- GET me, GET/PATCH/DELETE :id
│   │       │   ├── public-users.router.ts     <- GET /api/public/users/search
│   │       │   ├── public-users.controller.ts
│   │       │   └── public-users.service.ts
│   │       ├── boards/              <- boards.router + lists.router + public-boards.router (rev5)
│   │       ├── cards/               <- cards.router (checklist + comments + archive)
│   │       ├── catalogs/
│   │       ├── projects/            <- projects.router + tasks.router
│   │       ├── social-links/        <- socialLinksRouter + publicSocialLinksRouter (stats)
│   │       ├── admin/               <- CRUD: create/edit/deactivate user
│   │       └── notifications/       <- feedback.router
│   │   prisma/
│   │       ├── schema.prisma        <- Full schema (Board.isPublic added rev5)
│   │       ├── seed.ts              <- Admin + Demo user
│   │       └── migrations/
│   └── web/
│       ├── src/main.tsx
│       ├── src/router.tsx           <- Semua route + layout IDs
│       ├── src/stores/auth.store.ts <- Zustand auth (in-memory, hilang saat hard refresh)
│       ├── src/lib/api.ts           <- Axios + token inject
│       ├── src/lib/socket.ts
│       ├── src/styles/globals.css   <- Design tokens + animation system
│       ├── src/components/ui/icons.tsx  <- 37 SVG icons (NO emojis) — IconLock added rev5
│       ├── src/components/board/
│       │   ├── CardModal.tsx        <- Trello-style card modal + Delete button (rev5)
│       │   └── ExportModal.tsx      <- Export to xlsx modal (rev4)
│       └── src/pages/
│           ├── guest/   GuestLayout, GuestHome (search cards), Contact,
│           │            PublicProfile (stats + public boards section rev5)
│           ├── auth/    AuthLayout, Login (admin->'/admin' redirect rev5), Register
│           ├── user/    UserLayout, Dashboard, Boards (+ Export),
│           │            BoardDetail (DnD fixed + Edit board modal rev5),
│           │            Projects, ProjectDetail, Catalogs, SocialLinks
│           └── admin/   AdminLayout, AdminDashboard, AdminUsers (full CRUD + profile modal)
└── packages/shared/src/
    ├── types/index.ts               <- Board.isPublic added (rev5)
    ├── types/social-platforms.ts    <- SOCIAL_PLATFORMS const
    └── validators/                  <- board.validator: UpdateBoardSchema includes isPublic (rev5)
```

---

## API Routes (Semua Sudah Diimplementasi)

```
POST   /api/auth/register|login|refresh|logout
GET    /api/users/me
GET    /api/users/:id  |  PATCH  |  DELETE (admin)

GET|POST            /api/boards
GET|PATCH|DELETE    /api/boards/:id              <- PATCH supports isPublic (rev5)
POST                /api/boards/:id/lists
PATCH|DELETE        /api/lists/:id               <- supports isArchived

POST                /api/cards/list/:listId      <- BUKAN /lists/:id/cards
GET                 /api/cards/:id               <- card + checklist + comments (rev4)
PATCH|DELETE        /api/cards/:id               <- supports isArchived + color
POST                /api/cards/reorder           <- drag-drop

POST                /api/cards/:id/checklist                    <- add item (rev4)
PATCH               /api/cards/:id/checklist/:itemId            <- toggle/edit (rev4)
DELETE              /api/cards/:id/checklist/:itemId            <- delete item (rev4)
POST                /api/cards/:id/comments                     <- add comment (rev4)
DELETE              /api/cards/:id/comments/:commentId          <- delete comment (rev4)

GET|POST            /api/catalogs
GET|PATCH|DELETE    /api/catalogs/:id

GET|POST            /api/projects
GET|PATCH|DELETE    /api/projects/:id
POST                /api/projects/:id/tasks
PATCH|DELETE        /api/tasks/:id

GET                 /api/social-links/:username   <- public, no auth (returns stats rev4)
GET|POST            /api/me/social-links
PATCH|DELETE        /api/me/social-links/:id
POST                /api/me/social-links/reorder

GET                 /api/admin/users
POST                /api/admin/users              <- create user (rev4)
GET                 /api/admin/stats
PATCH               /api/admin/users/:id          <- edit: role/isActive/isVerified/displayName
DELETE              /api/admin/users/:id          <- soft delete

GET                 /api/public/users/search?q=   <- public, no auth (rev4)
GET                 /api/public/:username/boards  <- public boards only (rev5, no auth)

POST                /api/feedback
GET                 /health
```

---

## Database Schema (Ringkasan Model)

| Model         | Relasi utama                                                                                |
| ------------- | ------------------------------------------------------------------------------------------- |
| User          | boards[], projects[], catalogs[], socialLinks[], refreshTokens[], cardComments[]            |
| RefreshToken  | -> User                                                                                     |
| Board         | -> User (owner), lists[] · isPublic Boolean default(false) (rev5)                          |
| List          | -> Board, cards[] · isArchived Boolean                                                      |
| Card          | -> List, -> Catalog?, -> Task? (taskId @unique) · isArchived · color · checklist[], comments[] |
| ChecklistItem | -> Card, text, isChecked, position (rev4)                                                   |
| CardComment   | -> Card, -> User, content (rev4)                                                            |
| Catalog       | -> User (owner), cards[]                                                                    |
| Project       | -> User (owner), tasks[]                                                                    |
| Task          | -> Project, status: TaskStatus enum · linkedCard Card? (back-rel)                           |
| SocialLink    | -> User, platform, label, url, isVisible, position                                          |
| Feedback      | -> User?                                                                                    |

Enums: Role {GUEST USER ADMIN} · TaskStatus {TODO IN_PROGRESS DONE BLOCKED}

---

## Frontend — Design System Rules

3 sistem desain berbeda, TIDAK boleh dicampur dalam satu halaman:

| Halaman                             | Design             | Bg              | Accent                         |
| ----------------------------------- | ------------------ | --------------- | ------------------------------ |
| Guest, Social Links publik, Contact | figma-design.md    | #f8f7ff         | #7c3aed purple + multi-color   |
| User Dashboard, Boards, Admin       | linear-design.md   | #08090a dark    | #7170ff violet                 |
| Projects, Catalogs, Data grid       | airtable-design.md | #f9fafb light   | #166ee1 blue                   |

CSS globals tersedia di globals.css:

- Animation: .anim-fade-up, .anim-scale-in, .delay-{50..700} — fill-mode both
- .btn, .btn-primary, .btn-gradient, .btn-ghost, .btn-danger, .btn-sm, .btn-lg
- .input (light), .input-dark (dark)
- .card (light), .card-dark
- .skeleton (dark bg), .skeleton-light (light bg)
- .toast-success, .toast-error, .toast-info

Icons — Import dari src/components/ui/icons.tsx (37 ikon, NO emoji di mana pun):

```
IconDashboard, IconKanban, IconCalendar, IconGrid, IconLink,
IconUser, IconUsers, IconShield, IconLogOut, IconPlus, IconX,
IconCheck, IconSearch, IconStar, IconTrendingUp, IconArrowRight,
IconChevronRight, IconEye, IconEyeOff, IconGlobe, IconMail,
IconSend, IconMenu, IconGripVertical, IconTrash, IconPencil,
IconZap, IconSparkle, IconAlertCircle,
IconArchive, IconTag, IconMessageSquare, IconDownload, IconImage, IconRotateCcw,
IconLock,
IconSun, IconMoon, IconMonitor
```

---

## Bug Penting yang Sudah Diperbaiki (Rev2–Rev6)

| Bug                                                       | File                                          | Fix                                                                                            |
| --------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Emoji di UI melanggar CLAUDE.md                           | Contact.tsx, Dashboard.tsx, PublicProfile.tsx | Diganti IconZap, IconShield, hapus emoji, IconAlertCircle                                      |
| useParams({ from }) pakai URL path, bukan route tree ID   | BoardDetail, ProjectDetail, PublicProfile     | Harus pakai layout prefix: /user-layout/boards/$boardId, /guest-layout/u/$username/links       |
| Dashboard stat Catalogs & SocialLinks hardcoded           | Dashboard.tsx                                 | Tambah 2 query baru ke /catalogs dan /me/social-links                                          |
| SocialLinks DnD grip dekoratif (tidak berfungsi)          | SocialLinks.tsx                               | Implementasi @dnd-kit/core + useSortable + reorder mutation                                    |
| SocialLinks preview link mengarah ke #                    | SocialLinks.tsx                               | Fix ke /u/${user.username}/links                                                               |
| Delete button tidak ada di Boards, Projects, Catalogs     | Boards, Projects, Catalogs                    | Tambah hover-delete overlay + confirm + mutation                                               |
| JSX.Element TS error tanpa namespace                      | Dashboard.tsx                                 | Ganti ke ReactElement dari react                                                               |
| GET /api/social-links/:username return 401                | app.ts                                        | publicSocialLinksRouter dipasang sebelum app.use('/api', authenticate)                         |
| Card creation 404                                         | seed script                                   | Route sebenarnya adalah POST /cards/list/:listId, bukan /lists/:id/cards                       |
| reorderCard field mismatch (frontend vs API)              | BoardDetail.tsx                               | Frontend kirim destinationListId/newPosition, bukan targetListId/position                      |
| xlsx tidak ter-install di container                       | ExportModal.tsx                               | Rebuild container + npm install xlsx di /workspace/apps/web                                    |
| Admin login goes to /dashboard not /admin                 | Login.tsx                                     | Check user.role === 'ADMIN' after login, redirect to /admin (rev5)                            |
| DnD same-list reorder tidak bekerja                       | BoardDetail.tsx                               | Pakai arrayMove di handleDragEnd untuk reorder dalam list yang sama (rev5)                     |
| DnD drop ke list kosong tidak bisa                        | BoardDetail.tsx                               | Tambah useDroppable di KanbanColumn; over.id fallback ke listId (rev5)                        |
| isPublic tidak tersimpan via PATCH                        | board.validator.ts (packages/shared)          | Shared package harus di-rebuild setelah edit src/ (rev5)                                      |
| Refresh loop saat restart docker                          | api.ts + main.tsx                             | Interceptor tidak skip retry pada /auth/refresh + useRef guard StrictMode (rev9)              |
| CSP eval blocked di browser                               | security.middleware.ts                        | Helmet contentSecurityPolicy: false — API serve JSON bukan HTML (rev6)                         |
| Login sering gagal (rate limit collapse)                  | rate-limit.middleware.ts, app.ts, vite.config | Redis store + initRateLimiters() setelah connectRedis() + key IP:email + max 20 (rev6)        |
| Login error message tidak informatif                      | Login.tsx                                     | Bedakan 429 ("terlalu banyak percobaan") vs 401 ("salah password") vs error lain (rev6)       |
| Sidebar tidak collapsible di mobile                       | UserLayout.tsx, AdminLayout.tsx               | Drawer sidebar + overlay + hamburger topbar, CSS: .sidebar-drawer + .mob-topbar (rev6)        |
| GuestLayout mobile nav tidak ada                          | GuestLayout.tsx                               | Implementasi burger menu + mobile drawer dengan link + auth-aware CTA (rev6)                  |
| Root "/" menampilkan "Log in" ke user yang sudah login    | GuestLayout.tsx                               | Cek useAuthStore, tampilkan "Dashboard" button jika sudah login (rev6)                        |
| Semua halaman padding tidak responsive                    | Dashboard, Boards, Projects, dll (9 file)     | Ganti inline padding dengan .page-content class (36px 44px → 20px 16px di mobile) (rev6)     |

---

## TanStack Router — Catatan Kritis

Route tree ID tidak sama dengan URL path. Layout routes dengan id (bukan path) menambahkan prefix ke child routes:

```tsx
userLayoutRoute  = createRoute({ id: 'user-layout', ... })
guestLayoutRoute = createRoute({ id: 'guest-layout', ... })

// useParams HARUS menggunakan route tree ID:
useParams({ from: '/user-layout/boards/$boardId' })    // benar
useParams({ from: '/boards/$boardId' })                // runtime crash

useParams({ from: '/guest-layout/u/$username/links' }) // benar
useParams({ from: '/u/$username/links' })              // runtime crash
```

---

## Halaman yang Perlu Pengembangan Lanjutan

| Halaman / Fitur             | Status       | Catatan                                                                                        |
| --------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| BoardDetail.tsx             | Lengkap      | Kanban + DnD (fixed rev5) + Edit board modal + Card Modal + Archive/Delete                    |
| GuestHome.tsx               | Lengkap      | Search -> hasil user cards (avatar, bio, counts); klik "View profile" -> PublicProfile        |
| PublicProfile.tsx           | Lengkap      | Social links + RadialBar stats + Public Boards section (expand/collapse rev5)                 |
| AdminUsers.tsx              | Lengkap      | CRUD: buat user, edit (role/status), deactivate/restore, view profil (links + stats)          |
| Login.tsx                   | Lengkap      | Admin redirect ke /admin, user ke /dashboard; error messages 429/401/network (rev6)           |
| GuestLayout.tsx             | Lengkap      | Mobile nav drawer + auth-aware CTA (Dashboard vs Log in/Get started) (rev6)                  |
| UserLayout.tsx              | Lengkap      | Dark sidebar + mobile drawer + hamburger topbar + theme toggle (rev6)                         |
| AdminLayout.tsx             | Lengkap      | Dark sidebar + mobile drawer + hamburger topbar + theme toggle (rev6)                         |
| ProjectDetail.tsx           | Fungsional   | Timeline Gantt + task list berjalan; header responsive (rev6); gantt area belum full-mobile   |
| BoardDetail.tsx mobile      | Perlu fix    | Kanban board sudah horizontal-scroll, tapi header padding bisa lebih responsif di HP kecil    |
| Swagger/OpenAPI docs        | Belum        | Route /api/docs disebut di CLAUDE.md tapi belum dibuat                                        |
| Email verification          | Belum        | Phase 2, optional                                                                              |
| GET /api/me/export (GDPR)   | Belum        |                                                                                                |
| DELETE /api/me (GDPR)       | Belum        |                                                                                                |
| Rate limit                  | OK (rev6)    | Batas login 20x/15min per IP:email, Redis-backed. Reset: redis-cli FLUSHDB                   |

---

## Commands

```bash
# Jalankan semua (dari root)
docker compose up -d

# Restart service tertentu
docker restart betha-trello-api-1
docker restart betha-trello-web-1

# Log live
docker compose logs api -f
docker compose logs web -f

# Prisma
docker compose exec api npx prisma migrate dev
docker compose exec api npx prisma migrate status
docker compose exec api npm run db:seed

# Prisma Studio (GUI)
docker compose exec api npm run db:studio -- --hostname 0.0.0.0
# buka http://localhost:5555

# Reset Redis (hapus rate limit)
docker exec betha-trello-redis-1 redis-cli FLUSHDB

# Rebuild container (misal setelah update package.json)
docker compose up -d --build web
docker compose up -d --build api

# WAJIB setelah edit packages/shared/src/
docker compose exec api sh -c "cd /workspace/packages/shared && npm run build"
docker compose exec web sh -c "cd /workspace/packages/shared && npm run build"
```
