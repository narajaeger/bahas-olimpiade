# 📘 Bahas Olimpiade

Website soal dan pembahasan OSN & ONMIPA — siap deploy ke Vercel.

**Domain target:** `bahas-olimpiade.com` (atau domain apapun yang sudah Anda beli)

---

## 🎯 Fitur

- 🏠 Landing page aesthetic & clean dengan copywriting lengkap
- 🏅 9 bidang OSN (Matematika, Fisika, Kimia, Biologi, Informatika, Astronomi, Ekonomi, Kebumian, Geografi)
- 🎓 4 bidang ONMIPA (Matematika, Fisika, Kimia, Biologi)
- 📅 Pilih tahun 2010 – 2024 untuk tiap bidang
- 📄 **Soal**: gratis untuk semua, bisa di-download (PDF)
- 💡 **Pembahasan**:
  - Tahun 2024 → **gratis**
  - Tahun 2010 – 2023 → **berlangganan Rp25.000/bulan/bidang**
- 🔒 Pembahasan **tidak bisa di-download** — hanya dilihat via viewer PDF.js internal dengan watermark email user, anti-context-menu, anti-Ctrl+S/Ctrl+P
- 🔑 Sistem autentikasi (register/login) + dashboard langganan
- ⚙️ Backend serverless (Vercel Functions)

---

## 📂 Struktur Proyek

```
bahas-olimpiade/
├── api/                          # Vercel serverless functions
│   ├── _lib.js                   # Helper: auth, store, hash
│   ├── auth/
│   │   ├── login.js              # POST /api/auth/login
│   │   └── register.js           # POST /api/auth/register
│   ├── subscriptions.js          # GET & POST /api/subscriptions
│   └── pdf.js                    # GET /api/pdf — gatekeeper PDF
├── public/
│   ├── index.html                # Landing page
│   ├── osn.html                  # Pilih bidang OSN
│   ├── onmipa.html               # Pilih bidang ONMIPA
│   ├── tahun.html                # Pilih tahun 2010-2024
│   ├── material.html             # Pilih soal atau pembahasan
│   ├── viewer.html               # PDF viewer (anti-download) untuk pembahasan
│   ├── login.html                # Login / Register
│   ├── dashboard.html            # Kelola langganan
│   ├── robots.txt
│   ├── css/style.css
│   ├── js/
│   │   ├── main.js
│   │   ├── tahun.js
│   │   ├── material.js
│   │   ├── viewer.js             # PDF.js renderer + anti-download
│   │   ├── auth.js
│   │   └── dashboard.js
│   └── pdfs/                     # Folder PDF (lihat README di dalamnya)
│       ├── osn/{bidang}/{tahun}/soal.pdf
│       ├── osn/{bidang}/{tahun}/pembahasan.pdf
│       ├── onmipa/{bidang}/{tahun}/soal.pdf
│       └── onmipa/{bidang}/{tahun}/pembahasan.pdf
├── vercel.json                   # Konfigurasi Vercel
├── package.json
└── .gitignore
```

---

## 🚀 Cara Deploy

### A. Persiapan akun

1. Punya akun **GitHub** ([github.com](https://github.com))
2. Punya akun **Vercel** ([vercel.com](https://vercel.com)) — login pakai GitHub
3. Punya domain Anda (sudah dibeli)

### B. Push ke GitHub

```bash
# di dalam folder bahas-olimpiade
git init
git add .
git commit -m "Initial commit"
git branch -M main

# buat repo kosong di github.com dulu, lalu:
git remote add origin https://github.com/USERNAME/bahas-olimpiade.git
git push -u origin main
```

### C. Deploy ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Klik **Import Git Repository** → pilih repo `bahas-olimpiade`
3. Framework Preset: **Other** (atau biarkan auto-detect)
4. Klik **Deploy**
5. Tunggu beberapa menit, situs Anda akan online di `https://bahas-olimpiade.vercel.app`

### D. Pasang domain custom

1. Di dashboard Vercel project → tab **Settings** → **Domains**
2. Tambahkan domain Anda (misal `bahas-olimpiade.com`)
3. Vercel akan kasih instruksi DNS:
   - Tambahkan record **A** ke `76.76.21.21` di registrar domain Anda, **atau**
   - Tambahkan record **CNAME** dari `www` ke `cname.vercel-dns.com`
4. Tunggu DNS propagation (5 menit – 24 jam)
5. HTTPS otomatis aktif

---

## 📄 Cara Menambah PDF

Letakkan file PDF dengan struktur folder:

```
public/pdfs/{olympiad}/{bidang}/{tahun}/soal.pdf
public/pdfs/{olympiad}/{bidang}/{tahun}/pembahasan.pdf
```

Contoh:
- `public/pdfs/osn/matematika/2023/soal.pdf`
- `public/pdfs/osn/fisika/2024/pembahasan.pdf`
- `public/pdfs/onmipa/kimia/2018/soal.pdf`

Jika file belum ada, website **tetap berfungsi** — sistem akan otomatis menampilkan **placeholder PDF** sehingga Anda bisa demo dulu sambil mengisi PDF satu per satu.

Lihat juga `public/pdfs/README.md`.

---

## 🔧 Development Lokal

```bash
npm install -g vercel
vercel dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## ⚠️ Catatan Penting untuk Produksi

Implementasi saat ini sudah **fully functional dan siap deploy** ke Vercel. Namun untuk versi produksi nyata, ada 2 hal yang perlu di-upgrade:

### 1. **Database Persisten**

`api/_lib.js` saat ini menyimpan user & subscription di **memori serverless** (`globalThis`). Ini bisa hilang saat cold-start container Vercel. Untuk produksi nyata, ganti dengan database. Pilihan termudah:

- **Vercel KV** (Redis) — gratis tier tersedia, paling mudah
- **Vercel Postgres** — relational
- **Supabase** — Postgres + auth + storage gratis
- **Upstash Redis** — serverless redis

Cukup ubah file `api/_lib.js` agar fungsi `createUser`, `verifyUser`, `addSubscription`, dll. read/write ke database tersebut. Frontend tidak perlu diubah.

### 2. **Payment Gateway**

Saat ini endpoint `POST /api/subscriptions` langsung mengaktifkan langganan **tanpa pembayaran nyata** (untuk demo). Untuk transaksi sungguhan, integrasikan dengan:

- **Midtrans** ([midtrans.com](https://midtrans.com)) — paling populer di Indonesia
- **Xendit** ([xendit.co](https://xendit.co)) — alternatif bagus
- **Stripe** — kalau audiens global

Alur produksi:
1. User klik "Berlangganan" → frontend minta `POST /api/payments/create` → backend buat transaksi di gateway → user diarahkan ke halaman bayar
2. Setelah user bayar, gateway kirim **webhook** ke `POST /api/payments/webhook`
3. Endpoint webhook memverifikasi signature → baru panggil `addSubscription()`

---

## 🛡️ Keamanan Pembahasan

Strategi anti-download untuk pembahasan:

1. **Endpoint backend** (`/api/pdf` dengan `type=pembahasan&mode=download`) **menolak** mode download dengan HTTP 403.
2. **Backend** memverifikasi token + subscription sebelum mengirim byte PDF.
3. **Frontend** menggunakan **PDF.js** untuk render PDF ke `<canvas>` — bukan `<embed>` PDF native, sehingga viewer browser tidak menampilkan tombol download/print.
4. **Watermark** dengan email user di-overlay pada tiap halaman → kalau bocor lewat screenshot, terlacak.
5. **Anti context-menu** + blokir keyboard Ctrl+S / Ctrl+P di viewer.
6. **HTTP headers**: `Cache-Control: no-store`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy: frame-ancestors 'self'`.

> **Catatan jujur:** tidak ada metode 100% anti-download untuk konten yang sudah dirender di browser — user yang sangat motivated tetap bisa screenshot/print. Pendekatan di atas adalah **best practice industri** dan cukup untuk mencegah leak kasual.

---

## 📞 Pertanyaan?

Buka issue di GitHub repo Anda atau email ke `halo@bahas-olimpiade.com`.

Selamat deploy! 🚀
