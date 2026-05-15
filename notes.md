# Revisi untuk rev9

## Fitur belum diimplementasi

- **Swagger/OpenAPI** — `/api/docs` belum ada.
- **GDPR** — `GET /api/me/export` dan `DELETE /api/me` belum ada.
- **Email verification** — Phase 2, optional.

## Selesai di rev8

- ✅ Auth hard-refresh logout fix — AppRoot wrapper di main.tsx
- ✅ Logo login/regis bisa diklik → Link to="/"
- ✅ ProjectDetail — edit task modal (judul, deskripsi, status, tanggal)
- ✅ Catalogs — group system (DB migration + API + UI grouped view + edit modal)

## Error Bug

- ✅ Fixed (rev9) — Refresh loop saat restart docker. Root cause: axios interceptor memanggil `window.location.href = '/login'` dari dalam request `/auth/refresh` → infinite reload. Fix: skip interceptor retry jika request adalah refresh, dan guard StrictMode double-effect dengan `useRef`.
