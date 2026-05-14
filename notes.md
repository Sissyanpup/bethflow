# Revisi untuk rev7

## Responsive — sisa yang belum optimal

- **BoardDetail.tsx** header: padding `18px 28px` masih terlalu besar di HP kecil (< 480px).
  Tambahkan `.page-content` atau media query di header kanban.
- **ProjectDetail.tsx** Gantt area: `minWidth: 900` aman untuk scroll horizontal,
  tapi task name column (`width: 360`) bisa dikecilkan di mobile jadi 200–240px.
- **GuestHome.tsx / PublicProfile.tsx**: cek layout hasil search dan stats di HP kecil.

## Fitur belum diimplementasi (dari backlog asli)

- **ProjectDetail** — add/edit task form modal yang lebih lengkap (status, tanggal, deskripsi).
- **Swagger/OpenAPI** — `/api/docs` belum ada.
- **GDPR** — `GET /api/me/export` dan `DELETE /api/me` belum ada.
- **Email verification** — Phase 2, optional.

## semua role kecuali publik

- Pada Boards > List > Card, akan otomatis masuk ke timeline Projects jika ditetapkan dates (start - end) dengan nama project sesuai dengan nama (konten includ deskripsi) list yang dibuat. Sehingga tidak redundant masukkan data 2 kali, kegiatan sudah ada di Boards.
- Catalogs pun dibuat list agar bisa dikelompokkan kembali.
- Pada card di list pada Boards, bisa menambahkan katalog dari card di Catalogs. Agar tidak manual mengetik deskripsi berulang kali untuk jenis kerjaan yang sama.
- Contoh pada halaman projects -> masuk ke projek (http://localhost:5173/projects/cmp5b0b1v002dq35vab8je9l7) di navbar pada dark mode masih bug dengan bg putih.

## UI UX

- http://localhost:5173/catalogs masih error UI untuk darkmode cardnya masih putih (light mode).
- http://localhost:5173 dan http://localhost:5173/login http://localhost:5173/register ui dark mode masih error dimana card, birunya banner, bahkan beberapa text masih mode light.
- Jangan ubah auth atau API yang sudah fix benar dan tepat.
