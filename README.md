# Symphos Meeting Room Booking System

Sistem reservasi ruang rapat modern, responsif, dan terpusat untuk lingkungan perusahaan. Memungkinkan karyawan melakukan pemesanan ruang meeting secara langsung tanpa login, dengan sistem persetujuan otomatis dan proteksi pencegahan jadwal bentrok berbasis database. Dilengkapi dengan portal dashboard administrator yang aman untuk mengelola seluruh jadwal dan log audit.

---

## 🏢 Daftar Ruang Rapat Pre-Configured

1. **Ruang R1 (Executive)**: Kapasitas 16 orang (Proyektor Laser 4K, Polycom Video Conference, Sound System, Whiteboard Kaca, AC VIP).
2. **Ruang R2 (Creative & Design)**: Kapasitas 10 orang (Smart TV 75" 4K, Glass Whiteboard, Wireless Presentation, AC).
3. **Ruang R3 (Operational & Engineering)**: Kapasitas 8 orang (Monitor LED 55", Whiteboard, Conference Mic, AC).
4. **Ruang R4 (Focus & Interview)**: Kapasitas 6 orang (Monitor LED 50", Panel Kedap Suara, Whiteboard, AC).

---

## 🚀 Fitur Utama

- **Pemesanan Tanpa Login (Public Employee Access)**: Karyawan dapat langsung memesan ruangan dengan memasukkan Nama, Departemen, Judul Rapat, Tanggal, Ruangan, Jam Mulai, dan Jam Selesai.
- **Waktu Bebas Fleksibel**: Tidak dibatasi slot 30 menit atau 1 jam kaku (contoh: 08:15–09:45, 10:00–10:30, 13:15–15:00).
- **Persetujuan Otomatis (Instant Approval)**: Jadwal otomatis terkonfirmasi apabila slot waktu ruangan tersedia.
- **Proteksi Jadwal Bentrok (Conflict Prevention)**:
  - Formula: `requested_start < existing_end AND requested_end > existing_start` pada ruangan dan tanggal yang sama.
  - Jadwal *back-to-back* diperbolehkan (selesai 10:00, meeting berikutnya mulai 10:00).
  - Memberikan saran ruangan alternatif jika terjadi bentrok.
- **Tiket Konfirmasi Unik**: Menghasilkan kode referensi unik (contoh: `MRB-20261013-XXXX`) dan token keamanan pembatalan.
- **Mekanisme Pembatalan Mandiri**: Karyawan dapat membatalkan reservasi menggunakan kode referensi dan token keamanan.
- **Status Operasional Real-time**: Indikator warna kartu ruangan:
  - 🟢 **Hijau**: Tersedia (Available)
  - 🔴 **Merah**: Terpakai (Occupied)
  - 🟠 **Oranye**: Akan Datang Segera (Upcoming, dalam 90 menit)
- **Matriks Ketersediaan & Kalender Visual**:
  - Matriks timeline harian 07:00–21:00 WIB (interaktif klik slot untuk memesan).
  - Mode Kalender: Harian (Daily), Mingguan (Weekly), dan Bulanan (Monthly) dengan filter ruangan.
- **Admin Dashboard Lengkap (`/admin`)**:
  - 6 Kartu Statistik KPI (Bookings hari ini, ruangan tersedia, ruangan terpakai, meeting mendatang, total jam rapat, ruangan favorit).
  - Manajemen tabel seluruh booking dengan fitur pencarian, filter ruangan, status, departemen, dan rentang tanggal.
  - Aksi edit dan batalkan reservasi dengan validasi bentrok.
  - **Ekspor CSV**: Mengunduh seluruh atau hasil filter reservasi ke file CSV.
  - **Log Audit Riwayat (`booking_audit_logs`)**: Merekam setiap perubahan jadwal dan penanggung jawab.
  - **Konfigurasi Ruangan**: Mengaktifkan/menonaktifkan ruangan, kapasitas, dan fasilitas.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animasi**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Database Engine**:
  - **Dual Engine Architecture**: SQLite WAL terintegrasi (`node:sqlite`) untuk zero-config lokal dan Supabase PostgreSQL untuk skala produksi.
  - Skema PostgreSQL DDL di `supabase/schema.sql`.

---

## 📦 Menjalankan Proyek

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Menjalankan di Mode Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser.

### 3. Build & Production Start
```bash
npm run build
npm run start
```

---

## 🔐 Kredensial Akses Administrator

- **URL Login Admin**: `/admin/login`
- **Email**: `admin@company.com`
- **Password**: `Admin#2026!`

---

## 📄 Skema Database Supabase

Untuk deployment ke Supabase PostgreSQL, jalankan SQL query pada file:
`supabase/schema.sql` di SQL Editor Dashboard Supabase Anda.
