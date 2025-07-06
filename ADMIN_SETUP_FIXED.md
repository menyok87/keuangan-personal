# Setup Admin User - Fixed Version

## 🚀 Cara Membuat User Admin

### 1. **Buka Supabase Dashboard**
- Kunjungi [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Login ke akun Anda
- Pilih project: `ddtwsrfrfywgrqxxvsso`

### 2. **Buka SQL Editor**
- Di sidebar kiri, klik **SQL Editor**
- Klik **New Query**

### 3. **Copy dan Paste SQL**
Copy seluruh isi file `supabase/migrations/create_admin_user_fixed.sql` dan paste ke SQL Editor.

### 4. **Jalankan Query**
- Klik tombol **Run** atau tekan `Ctrl+Enter`
- Tunggu hingga query berhasil dijalankan
- Lihat pesan sukses di output

## 🔑 Kredensial Admin

**Email:** `admin@akuntansi.com`  
**Password:** `admin123`

## 📊 Data Sample yang Dibuat

### ✅ **Transaksi Sample (8 transaksi):**

#### 💰 **Pemasukan:**
- Gaji Bulanan Januari: **Rp 5.000.000**
- Bonus Kinerja: **Rp 1.500.000**

#### 💸 **Pengeluaran:**
- Makan Siang Keluarga: **Rp 250.000** (Restoran)
- Bensin Motor: **Rp 75.000** (SPBU Shell)
- Belanja Bulanan: **Rp 450.000** (Supermarket)
- Tagihan Listrik: **Rp 180.000** (PLN)
- Internet Indihome: **Rp 120.000**
- Kopi dan Snack: **Rp 85.000** (Starbucks)

### 📋 **Anggaran Bulanan (5 kategori):**
- **Makanan & Minuman:** Rp 2.000.000/bulan
- **Transportasi:** Rp 800.000/bulan
- **Belanja:** Rp 1.500.000/bulan
- **Tagihan:** Rp 600.000/bulan
- **Hiburan:** Rp 500.000/bulan

### 🎯 **Target Keuangan (4 target):**
- **Dana Darurat 6 Bulan:** Target Rp 20.000.000 (Progress: Rp 8.500.000) - **42.5%**
- **Liburan Keluarga ke Bali:** Target Rp 12.000.000 (Progress: Rp 4.200.000) - **35%**
- **Laptop Gaming Baru:** Target Rp 15.000.000 (Progress: Rp 6.800.000) - **45.3%**
- **Investasi Reksadana:** Target Rp 50.000.000 (Progress: Rp 12.000.000) - **24%**

## ✅ Verifikasi Setup

### 1. **Login ke Aplikasi**
- Buka aplikasi akuntansi
- Gunakan kredensial admin di atas
- Pastikan login berhasil

### 2. **Cek Dashboard**
- Lihat ringkasan keuangan
- Pastikan data sample muncul
- Cek grafik dan statistik

### 3. **Test Fitur CRUD**
- ✅ Tambah transaksi baru
- ✅ Edit transaksi existing
- ✅ Hapus transaksi
- ✅ Kelola anggaran
- ✅ Update target keuangan

## 🔒 Keamanan & Fitur

### ✅ **Keamanan Terjamin:**
- Password di-hash dengan **bcrypt**
- **Row Level Security (RLS)** aktif
- Data terisolasi per user
- Tidak ada privilege admin khusus

### ✅ **Data Realistis:**
- Transaksi dengan lokasi dan catatan
- Berbagai metode pembayaran
- Tags untuk kategorisasi
- Timeline yang masuk akal

### ✅ **Fitur Lengkap:**
- Dashboard dengan analytics
- Manajemen transaksi
- Pelacakan anggaran
- Target keuangan
- Laporan keuangan

## 🛠️ Troubleshooting

### ❌ **Jika login gagal:**
1. Pastikan email dan password benar
2. Cek di **Authentication > Users** apakah user admin sudah terbuat
3. Pastikan `email_confirmed_at` tidak null
4. Coba refresh browser

### ❌ **Jika data tidak muncul:**
1. Cek di **Table Editor** apakah data sudah tersimpan
2. Pastikan RLS policies sudah aktif
3. Logout dan login ulang
4. Cek console browser untuk error

### ❌ **Jika ada error SQL:**
1. Pastikan database schema sudah diimport
2. Cek apakah semua tabel sudah ada
3. Jalankan query satu per satu jika perlu

## 🎉 Setelah Setup Berhasil

1. **Demo Aplikasi:** Gunakan data sample untuk presentasi
2. **Training User:** Ajarkan fitur-fitur dengan data real
3. **Development:** Lanjutkan pengembangan fitur
4. **Testing:** Test semua fungsi dengan user admin

---

**🎯 Aplikasi siap digunakan dengan data sample yang realistis!**