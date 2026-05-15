# Revisi untuk rev8

## Fitur belum diimplementasi

- **ProjectDetail** — add/edit task form modal lebih lengkap (bisa edit deskripsi, ubah status, edit tanggal in-modal).
- **Catalogs** — list/group system agar catalog bisa dikelompokkan.
- **Swagger/OpenAPI** — `/api/docs` belum ada.
- **GDPR** — `GET /api/me/export` dan `DELETE /api/me` belum ada.
- **Email verification** — Phase 2, optional.

## Notes arsitektur Board-Project (rev7)

- Card.taskId → Task (nullable, unique FK, onDelete: SetNull)
- Auto-link saat PATCH /cards/:id dengan startDate + endDate keduanya ada
- Project dibuat otomatis jika belum ada, dengan nama = list.title
- Task dibuat dengan status default TODO, title = card.title
- Jika taskId sudah ada, update task.startDate+endDate saja
- Board GET sudah include taskStatus per card
- CardModal menampilkan TaskStatusPicker jika card.linkedTask ada
- Status sync satu arah dari Boards → Projects via TaskStatusPicker di CardModal
  (Projects → Boards sudah otomatis karena board refetch)
