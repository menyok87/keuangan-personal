# 🚀 Setup Database - Versi Terperbaiki

## 🔧 Masalah yang Diperbaiki

Error sebelumnya: `there is no unique or exclusion constraint matching the ON CONFLICT specification`

**✅ Solusi:**
- Menghapus `ON CONFLICT` yang bermasalah
- Menggunakan pendekatan `IF NOT EXISTS` yang lebih aman
- Menambah error handling yang lebih baik
- Menyederhanakan proses insert data

## 📋 Langkah Setup

### 1. **Buka Supabase Dashboard**
- Kunjungi [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Login ke akun Anda
- Pilih project: `ddtwsrfrfywgrqxxvsso`

### 2. **Buka SQL Editor**
- Di sidebar kiri, klik **SQL Editor**
- Klik **New Query**

### 3. **Copy dan Paste SQL Baru**
- Copy seluruh isi file `supabase/migrations/20250106180500_fixed_setup.sql`
- Paste ke SQL Editor di Supabase

### 4. **Jalankan Query**
- Klik tombol **Run** atau tekan `Ctrl+Enter`
- Tunggu hingga query berhasil dijalankan
- Lihat pesan sukses: `✅ Database setup completed successfully!`

## 🔑 Kredensial Login

**📧 Email:** `admin@akuntansi.com`  
**🔑 Password:** `admin123`

## 📊 Data Sample yang Dibuat

### 💰 **Transaksi (8 items):**
- **Pemasukan:** Gaji Rp 5.000.000 + Bonus Rp 1.500.000
- **Pengeluaran:** Makan, transportasi, belanja, tagihan (Total: Rp 1.160.000)

### 📋 **Anggaran (5 kategori):**
- Makanan & Minuman: Rp 2.000.000/bulan
- Transportasi: Rp 800.000/bulan  
- Belanja: Rp 1.500.000/bulan
- Tagihan: Rp 600.000/bulan
- Hiburan: Rp 500.000/bulan

### 🎯 **Target Keuangan (4 goals):**
- Dana Darurat: Target Rp 20.000.000 (Progress: Rp 8.500.000)
- Liburan Bali: Target Rp 12.000.000 (Progress: Rp 4.200.000)
- Laptop Gaming: Target Rp 15.000.000 (Progress: Rp 6.800.000)
- Investasi: Target Rp 50.000.000 (Progress: Rp 12.000.000)

## 🔒 Fitur Keamanan

- ✅ **Row Level Security (RLS)** aktif
- ✅ **Password ter-hash** dengan bcrypt
- ✅ **Data terisolasi** per user
- ✅ **Policies lengkap** untuk CRUD operations
- ✅ **Error handling** yang robust

## ✅ Verifikasi Setup

### 1. **Cek Console Output**
Setelah menjalankan SQL, pastikan melihat pesan:
```
✅ Database setup completed successfully!
📧 Admin Email: admin@akuntansi.com
🔑 Admin Password: admin123
📊 Sample data created successfully
```

### 2. **Cek Tabel di Supabase**
- Buka **Table Editor**
- Pastikan tabel ada: `user_profiles`, `transactions`, `budgets`, `financial_goals`
- Cek data sample sudah tersimpan

### 3. **Test Login Aplikasi**
- Buka aplikasi akuntansi
- Login dengan kredensial admin
- Pastikan dashboard menampilkan data sample

## 🛠️ Troubleshooting

### ❌ **Jika masih ada error:**
1. **Refresh browser** dan coba lagi
2. **Jalankan query bertahap** (copy bagian per bagian)
3. **Cek console** untuk pesan error spesifik
4. **Pastikan project Supabase** sudah aktif

### ❌ **Jika login gagal:**
1. Pastikan email dan password benar
2. Cek di **Authentication > Users** apakah admin user sudah ada
3. Pastikan `email_confirmed_at` tidak null

### ❌ **Jika data tidak muncul:**
1. Logout dan login ulang
2. Cek RLS policies sudah aktif
3. Refresh aplikasi

## 🎯 Perbedaan dengan Versi Sebelumnya

### ❌ **Versi Lama (Bermasalah):**
```sql
INSERT INTO table (...) VALUES (...) ON CONFLICT DO NOTHING;
```

### ✅ **Versi Baru (Fixed):**
```sql
-- Cek dulu apakah data sudah ada
IF existing_count = 0 THEN
  INSERT INTO table (...) VALUES (...);
END IF;
```

## 🚀 Setelah Setup Berhasil

1. **✅ Database lengkap** dengan semua tabel
2. **✅ User admin** siap digunakan  
3. **✅ Data sample** untuk testing
4. **✅ Aplikasi siap** untuk development/demo

---

**🎉 Aplikasi Akuntansi Keuangan siap digunakan!**

Versi ini sudah diperbaiki dan tidak akan mengalami error `ON CONFLICT` lagi.