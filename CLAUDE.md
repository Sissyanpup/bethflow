# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Read `PROGRESS.md` for current status snapshot and seed credentials before starting any session.
> Read `notes.md` for pending revisions that have not yet been implemented.

---

## Commands

All commands run **inside Docker containers** — not on the host.

```bash
# Start all services
docker compose up -d

# Restart individual services
docker restart betha-trello-api-1
docker restart betha-trello-web-1

# Live logs
docker compose logs api -f
docker compose logs web -f

# API — typecheck / lint / test
docker compose exec api npm run typecheck
docker compose exec api npm run lint
docker compose exec api npm run test
docker compose exec api npm run test -- --reporter=verbose path/to/file.test.ts   # single test file

# Web — typecheck / lint
docker compose exec web npm run typecheck
docker compose exec web npm run lint

# Prisma
docker compose exec api npx prisma migrate dev          # apply + generate
docker compose exec api npx prisma migrate status
docker compose exec api npm run db:seed                 # resets + seeds demo data
docker compose exec api npm run db:studio -- --hostname 0.0.0.0   # GUI → http://localhost:5555

# Reset Redis rate-limit state
docker exec betha-trello-redis-1 redis-cli FLUSHDB
```

Seed credentials: `admin@bethflow.dev / Admin1234!` (ADMIN) · `demo@bethflow.dev / User1234!` (USER, username: `demouser`)

---

## Architecture

### Monorepo layout

```
betha-trello/
├── apps/api/          Express 5 backend
├── apps/web/          React 19 + Vite frontend
└── packages/shared/   Zod validators + TypeScript types (consumed by both)
```

### API (`apps/api/src/`)

Each feature lives in `modules/<name>/` as a trio: `*.router.ts` → `*.controller.ts` → `*.service.ts`. All business logic is in the service; controllers only parse, validate, and respond.

**Middleware chain (in `app.ts`):**

1. Helmet + CORS + body parsers
2. `/health` (no auth)
3. `POST /api/auth/*` and `GET /api/social-links/:username` — public, no auth
4. All `/api/*` routes: `authenticate` (RS256 JWT) → `apiRateLimit` (Redis-backed)
5. Route-level RBAC via `requireUser` / `requireAdmin` from `rbac.middleware.ts`

**Critical route note:** card creation is `POST /api/cards/list/:listId` (not `/lists/:id/cards` as stated in CLAUDE.md's route table — the route table there is wrong).

`req.user` is typed as `TokenPayload` (injected by `authenticate`). Access token lives in-memory on the client (15 min, RS256). Refresh token is HttpOnly cookie (7 days, rotated on each use, persisted in `RefreshToken` table).

### Frontend (`apps/web/src/`)

**Router:** TanStack Router v1 with layout routes that use `id` instead of `path`. This means `useParams` must reference the full route tree ID, not the URL:

```tsx
useParams({ from: '/user-layout/boards/$boardId' })   // ✅
useParams({ from: '/boards/$boardId' })               // ❌ runtime crash
```

Layout IDs: `guest-layout`, `auth-layout`, `user-layout`, `admin-layout`.

**Auth state:** Zustand store (`stores/auth.store.ts`). State is in-memory — lost on hard refresh. `main.tsx` calls `refresh()` on mount to rehydrate from the HttpOnly cookie. Route guards (`beforeLoad`) read `useAuthStore.getState()` synchronously.

**API client:** Axios instance at `lib/api.ts` with `baseURL: '/api'`. Intercepts 401s to auto-refresh the access token before retrying. Access token is stored in a module-level closure (`setAccessToken`), not in Zustand.

**Data fetching:** TanStack Query v5 for all server state. Socket.IO (`lib/socket.ts`, namespace `/board`) handles realtime card events: `card:moved`, `card:created`, `card:deleted`.

**Drag-and-drop:** `@dnd-kit/core` + `@dnd-kit/sortable` for both card reordering and SocialLinks reordering.

### Shared package (`packages/shared/src/`)

- `types/index.ts` — all TypeScript interfaces (`UserPublic`, `Board`, `Card`, `Task`, `SocialLink`, etc.) and `ApiSuccess` / `ApiError` response wrappers
- `types/social-platforms.ts` — `SOCIAL_PLATFORMS` const with 30+ platform definitions
- `validators/` — Zod schemas used by both API (`validate.middleware.ts`) and web forms

---

## Design Systems (do not mix within a single page)

| Pages | Design file | Background | Accent |
|---|---|---|---|
| Guest, PublicProfile, Contact | `figma-design.md` | `--fig-bg: #f8f7ff` | `--fig-purple: #7c3aed` |
| User Dashboard, Boards, Admin | `linear-design.md` | `--lin-canvas: #08090a` | `--lin-violet: #7170ff` |
| Projects, Catalogs, data grids | `airtable-design.md` | `--air-bg: #f9fafb` | `--air-blue: #166ee1` |

CSS design tokens and utility classes live in `apps/web/src/styles/globals.css`. Available utilities: `.btn`, `.btn-primary`, `.btn-gradient`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-lg` · `.input` / `.input-dark` · `.card` / `.card-dark` · `.skeleton` / `.skeleton-light` · `.toast-success`, `.toast-error`, `.toast-info` · `.anim-fade-up`, `.anim-scale-in`, `.delay-{50..700}`.

**Icons:** Always import from `src/components/ui/icons.tsx`. Never use emojis anywhere in the UI. Available: `IconDashboard, IconKanban, IconCalendar, IconGrid, IconLink, IconUser, IconUsers, IconShield, IconLogOut, IconPlus, IconX, IconCheck, IconSearch, IconStar, IconTrendingUp, IconArrowRight, IconChevronRight, IconEye, IconEyeOff, IconGlobe, IconMail, IconSend, IconMenu, IconGripVertical, IconTrash, IconPencil, IconZap, IconSparkle, IconAlertCircle`.

---

## Pending Revisions (from `notes.md`)

These features are **not yet implemented** and should be built when requested:

### Guest / Public search
- Search results must show user **cards** (not immediate detail). Each card shows matched user info (name, avatar, role).
- Clicking a card opens a detail view that includes: social links + task completion stats (total tasks done, in-progress) + success graph (% on-time task delivery).

### Board & Card (User)
- Clicking a card or board should open an **inline edit modal** (Trello-style) with: description, catalog picker, media attachments (image/video), color labels, checklist items, archive button, start/deadline dates, and comments (Add in the card: Dates, Checklist, Attachment, Comment).
- Cards and lists must be **archivable** (soft-hide, not deleted).
- **Export** — users can export all boards/projects to Excel (`.xlsx`) with a configurable date range.

### Admin Dashboard
- Scope is limited to: CRUD user management only.
- Admin can view a user's social links and a summary graph (same as public profile view).

---

## Conventions

- **TypeScript strict** — no `any`; use Zod for all runtime validation
- **Prisma ORM only** — never raw SQL with user input
- **Passwords** — bcrypt cost 12; never logged, never returned in API responses
- **Soft-delete users** — set `isActive: false`, never hard `DELETE`
- **Error shape:** `{ success: false, error: { code: string, message: string, details?: {} } }`
- **Success shape:** `{ success: true, data: {}, meta?: { page, limit, total, totalPages } }`
- **Pagination** — all list endpoints: `?page=1&limit=20`
- **RBAC** — all `/api/*` routes require auth except `/health`, `/api/auth/*`, `GET /api/social-links/:username`
