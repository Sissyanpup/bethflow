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
- Tidak bisa save boards to public or private.

## Export — ✅ Selesai (rev14)

- ✅ Semua variabel lengkap: Board, List, Card Title, Description, Color, Catalog Name, Task Status, Checklist Total/Done/%, Start Date, Due Date, isArchived, Has Media, Created
- ✅ Sheet Checklist_Items (All Data mode): Board, List, Card, Item Text, Is Done, Created
- ✅ Sheet Tasks enriched: linkedCard title, list, board name + task createdAt
- ✅ 3 tab export: "Boards & Cards" (2 sheets + date filter), "Projects & Tasks" (2 sheets + date filter), "All Data" (6 sheets, no filter)
- ✅ Tombol Export ditambahkan di Dashboard (beranda) dan Projects

## Fitur tambahan

- Jika bisa menambahkan foto profile dengan maks 512kb saja
- Fitur edit profile saat klik card user di navbar
- Jika memungkinkan kembangkan menjadi setiap card bisa menambahkan file attachment seperti gambar png, jpg, dll. Hampir menuju mirip trello dengan lebih modern dan rapi
