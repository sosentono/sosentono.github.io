# Silsilah Wit Keturunan Trah Sosentono

Aplikasi silsilah keluarga modern, interaktif, dan minimalis yang dirancang untuk paguyuban keluarga besar trah. Mengusung filosofi Jawa luhur *"Ngumpulke Balung Pisah, Mikul Dhuwur Mendhem Jero"* dengan sentuhan antarmuka elegan, diagram pohon silsilah berpresisi tinggi, serta sistem peran **Master Admin & Admin Paguyuban** berbasis **Firebase Firestore**.

---

## Fitur Utama

- 🌳 **Diagram Pohon Keluarga Interaktif**:
  - Pembedaan visual tegas antara **Anak Kandung (Garis Pancer Trah)** dengan aksen hijau solid dan **Pasangan / Menantu** dengan aksen rose dan simbol nikah (💍).
  - Alur garis keturunan dan saudara kandung berpresisi tanpa jeda (*zero gap*).
  - Latar belakang kanvas ultra-minimalis dengan toggle **Titik Lembut** atau **Polos Bersih**.
  - Zoom in/out, pan drag kanvas, cetak diagram (landscape), dan ekspor data ke Excel (CSV).
- 👑 **Sistem Peran Master Admin & Admin**:
  - **Master Admin**: Memiliki wewenang penuh mengelola data keluarga dan **mendaftarkan admin baru** melalui panel *Kelola Admin*.
  - **Admin Paguyuban**: Pengurus yang didaftarkan untuk mengelola anggota, relasi, agenda, kabar, dan cariyos.
  - Login admin dengan email & password yang tersimpan di Firestore.
- 👥 **Direktori Anggota Lengkap**: Pencarian cepat, filter generasi Jawa (Wiwitan, Anak, Putu, Buyut, Canggah, Wareng, dll.), dan modal detail profil.
- 📅 **Agenda Pertemuan & Selapanan**: Perhitungan otomatis siklus 35 hari Minggu Pon dan Halal Bihalal Trah Besar Syawal.
- 📰 **Kabar Trah & Cariyos Leluhur**: Warta kelahiran, duka, prestasi, serta arsip digital kisah sejarah leluhur.
- 💾 **Penyimpanan Cloud Firebase Firestore**: Sinkronisasi data *real-time* ke cloud database Firestore.

---

## Hosting di GitHub Pages

Repo ini sudah berisi workflow `.github/workflows/deploy.yml` yang otomatis
mem-build (Vite) dan men-deploy ke GitHub Pages setiap kali ada push ke branch `main`.

### Langkah sekali saja
1. Upload/push isi folder ini ke repositori GitHub (branch `main`).
2. Buka repo di GitHub → **Settings → Pages**.
3. Di **Build and deployment → Source**, pilih **GitHub Actions**.
4. Buka tab **Actions**, jalankan ulang workflow *Deploy ke GitHub Pages* jika belum berjalan.
5. Setelah centang hijau, situs aktif di `https://USERNAME.github.io/NAMA-REPO/`.

> Catatan: GitHub Pages dari repo **private** butuh GitHub Pro/Team
> (gratis untuk pelajar lewat GitHub Student Developer Pack). Akun gratis biasa
> hanya bisa Pages dari repo **public**.

### Database & login admin (Firebase proyek `trah-sosentono`)
Lakukan sekali, berurutan, di [Firebase Console](https://console.firebase.google.com/):
1. **Authentication → Sign-in method**: aktifkan **Email/Password**.
2. **Authentication → Users → Add user**: buat akun Master Admin dengan email
   `admin@sosentono.ai.studio` dan password pilihan sendiri (min. 6 karakter).
3. **Firestore Database → Rules**: tempel seluruh isi `firestore.rules`, lalu **Publish**.
4. Buka situs → **Admin** → masuk dengan akun di langkah 2.
5. Tab pengaturan Master Admin → **Salin Data dari Database Lama**:
   unduh cadangan dulu, lalu salin ke database baru.

Password tidak disimpan di kode maupun di Firestore. Semua orang bisa membaca data;
hanya admin yang login yang bisa mengubah. Jika email Master Admin diganti, ubah di
dua tempat: `src/context/AuthContext.tsx` dan `firestore.rules`.

### Pembaruan selanjutnya
Cukup commit & push ke `main` (atau aktifkan sync GitHub di AI Studio ke repo ini).
Workflow akan build dan deploy ulang otomatis.

---

## Menjalankan di Komputer Lokal

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # hasil build di folder dist/
```
