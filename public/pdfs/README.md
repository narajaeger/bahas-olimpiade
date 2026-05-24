# Cara Menambahkan PDF Soal & Pembahasan

Struktur folder sudah disiapkan untuk semua bidang dan tahun 2010–2024.

## Pola Penamaan

Letakkan setiap file PDF dengan nama persis seperti ini:

```
public/pdfs/{olympiad}/{bidang}/{tahun}/soal.pdf
public/pdfs/{olympiad}/{bidang}/{tahun}/pembahasan.pdf
```

## Contoh

- Soal OSN Matematika 2023: `public/pdfs/osn/matematika/2023/soal.pdf`
- Pembahasan OSN Fisika 2024: `public/pdfs/osn/fisika/2024/pembahasan.pdf`
- Soal ONMIPA Kimia 2018: `public/pdfs/onmipa/kimia/2018/soal.pdf`

## Catatan

- Jika file belum ada, sistem akan otomatis menampilkan **placeholder PDF** dengan judul yang sesuai sehingga website tetap berfungsi.
- Cukup upload file dengan nama dan lokasi sesuai pola di atas, dan website langsung memunculkannya.
- File `soal.pdf` bisa di-download user (sesuai requirement: soal gratis).
- File `pembahasan.pdf` **tidak akan bisa di-download user**; hanya bisa dilihat melalui viewer dengan kontrol akses (gratis untuk tahun 2024, berbayar untuk 2010–2023).

## Bidang yang Tersedia

**OSN (9 bidang):**
matematika, fisika, kimia, biologi, informatika, astronomi, ekonomi, kebumian, geografi

**ONMIPA (4 bidang):**
matematika, fisika, kimia, biologi

**Tahun:** 2010, 2011, 2012, ..., 2024
