# Ever After — Undangan Haris & Tika

Undangan pernikahan digital bergaya film: amplop bersegel, film leader 3-2-1, poster hero, kisah cinta, tiket acara, galeri contact sheet, RSVP, buku tamu, dan penutup ala end credits. Musik latar disintesis langsung di browser (orisinal, bebas lisensi).

## Struktur

```
index.html        Seluruh tampilan + konfigurasi konten (objek CONFIG di <script>)
img/              Foto (p1–p7) dan og.jpg untuk pratinjau tautan WhatsApp
api/guestbook.js  GET daftar ucapan, POST ucapan baru
api/rsvp.js       POST konfirmasi kehadiran, GET rekap (butuh ADMIN_KEY)
api/_store.js     Penyimpanan privat Vercel Blob, validasi, rate limit
```

## Mengubah isi undangan

Edit objek `CONFIG` di bagian bawah `index.html`. Nilai `null` otomatis tampil sebagai placeholder dan tombol terkait dinonaktifkan.

| Kunci | Contoh |
|---|---|
| `weddingDate` | `"2028-06-10T09:00:00+08:00"` (aktifkan hitung mundur) |
| `timeZone` / `tzLabel` | `"Asia/Makassar"` / `"WITA"` |
| `events[].start` / `end` | `"2028-06-10T09:00:00+08:00"` |
| `events[].venue` / `address` | nama & alamat tempat (mengaktifkan tombol Google Maps) |
| `groom.parents` / `bride.parents` | `"Putra dari Bapak … & Ibu …"` |
| `story[].when` / `text` | tahun dan cerita tiap bab |
| `rsvp.maxGuests` | jumlah tamu maksimal per undangan (samakan dengan env `MAX_GUESTS`) |
| `music.src` | isi dengan path MP3 berlisensi jika ingin mengganti skor bawaan |

Setiap push ke branch `main` otomatis ter-deploy oleh Vercel.

## Tautan personal tamu

`https://<domain>/?to=Budi-Santoso` → sampul menyapa "Budi Santoso".

## Ruang mempelai (rekap RSVP + pembuat tautan personal)

Buka `https://<domain>/?admin=<ADMIN_KEY>`. Kunci disimpan sebagai environment variable `ADMIN_KEY` di Vercel (Project → Settings → Environment Variables). Jangan bagikan tautan admin.

## Environment variables

| Nama | Keterangan |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | otomatis dari Vercel Blob store yang terhubung ke project |
| `ADMIN_KEY` | kunci rahasia untuk rekap RSVP |
| `MAX_GUESTS` | opsional, default 2 |

Data RSVP dan ucapan disimpan **privat** di Vercel Blob (`rsvp/`, `guestbook/`) dan hanya bisa dibaca lewat API.
