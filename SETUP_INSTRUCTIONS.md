# 🚀 Setup Database Aplikasi Akuntansi

## 📋 Langkah-langkah Setup

### 1. **Buka Supabase Dashboard**
- Kunjungi [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Login ke akun Anda
- Pilih project: `ddtwsrfrfywgrqxxvsso`

### 2. **Buka SQL Editor**
- Di sidebar kiri, klik **SQL Editor**
- Klik **New Query**

### 3. **Copy dan Paste SQL**
- Copy seluruh isi file `supabase/migrations/20250106180000_complete_setup.sql`
- Paste ke SQL Editor di Supabase

### 4. **Jalankan Query**
- Klik tombol **Run** atau tekan `Ctrl+Enter`
- Tunggu hingga query berhasil dijalankan
- Lihat pesan sukses di output console

## 🔑 Kredensial Login

Setelah setup berhasil, gunakan kredensial berikut:

**📧 Email:** `admin@akuntansi.com`  
**🔑 Password:** `admin123`

## 📊 Data yang Akan Dibuat

### 🗄️ **Tabel Database:**
- ✅ `user_profiles` - Profil pengguna
- ✅ `transactions` - Transaksi keuangan
- ✅ `budgets` - Anggaran bulanan/tahunan
- ✅ `financial_goals` - Target keuangan

### 💰 **Sample Transaksi (8 items):**
- **Pemasukan:** Gaji (Rp 5.000.000) + Bonus (Rp 1.500.000)
- **Pengeluaran:** Makan, transportasi, belanja, tagihan, dll

### 📋 **Sample Anggaran (5 kategori):**
- Makanan & Minuman: Rp 2.000.000/bulan
- Transportasi: Rp 800.000/bulan
- Belanja: Rp 1.500.000/bulan
- Tagihan: Rp 600.000/bulan
- Hiburan: Rp 500.000/bulan

### 🎯 **Sample Target Keuangan (4 goals):**
- Dana Darurat: Target Rp 20.000.000 (Progress 42.5%)
- Liburan Bali: Target Rp 12.000.000 (Progress 35%)
- Laptop Gaming: Target Rp 15.000.000 (Progress 45.3%)
- Investasi: Target Rp 50.000.000 (Progress 24%)

## 🔒 Fitur Keamanan

- ✅ **Row Level Security (RLS)** aktif
- ✅ **Password ter-hash** dengan bcrypt
- ✅ **Data terisolasi** per user
- ✅ **Policies lengkap** untuk CRUD operations

## ✅ Verifikasi Setup

### 1. **Cek Tabel di Supabase**
- Buka **Table Editor** di Supabase
- Pastikan semua tabel sudah ada
- Cek data sample sudah tersimpan

### 2. **Test Login Aplikasi**
- Buka aplikasi akuntansi
- Login dengan kredensial admin
- Pastikan dashboard menampilkan data

### 3. **Test Fitur CRUD**
- Tambah transaksi baru
- Edit/hapus transaksi existing
- Kelola anggaran dan target

## 🛠️ Troubleshooting

### ❌ **Jika ada error saat menjalankan SQL:**
1. Pastikan project Supabase sudah aktif
2. Coba jalankan query dalam beberapa bagian
3. Refresh browser dan coba lagi

### ❌ **Jika login gagal:**
1. Pastikan email dan password benar
2. Cek di **Authentication > Users** apakah admin user sudah ada
3. Pastikan `email_confirmed_at` tidak null

### ❌ **Jika data tidak muncul:**
1. Cek di **Table Editor** apakah data sudah ada
2. Pastikan RLS policies sudah aktif
3. Logout dan login ulang

## 🎉 Setelah Setup Berhasil

1. **✅ Database lengkap** dengan semua tabel
2. **✅ User admin** siap digunakan
3. **✅ Data sample** untuk testing
4. **✅ Aplikasi siap** untuk development/demo

---

**🚀 Aplikasi Akuntansi Keuangan siap digunakan!**

Jika ada masalah, pastikan semua langkah sudah diikuti dengan benar dan cek console untuk pesan error.