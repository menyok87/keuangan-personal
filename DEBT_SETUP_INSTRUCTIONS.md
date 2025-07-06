# 🚀 Setup Tabel Hutang & Piutang

## ❌ **Error yang Terjadi:**
```
Gagal memuat data hutang: relation "public.debts" does not exist
```

## ✅ **Solusi:**

### **1. Buka Supabase Dashboard**
- Kunjungi [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Login ke akun Anda
- Pilih project: `ddtwsrfrfywgrqxxvsso`

### **2. Buka SQL Editor**
- Di sidebar kiri, klik **SQL Editor**
- Klik **New Query**

### **3. Copy dan Paste SQL Lengkap**
Copy seluruh isi file `supabase/migrations/create_debt_tables_complete.sql` dan paste ke SQL Editor.

### **4. Jalankan Query**
- Klik tombol **Run** atau tekan `Ctrl+Enter`
- Tunggu hingga query berhasil dijalankan
- Lihat pesan sukses di output

## 🔑 **Setelah Setup Berhasil:**

1. **Refresh aplikasi** di browser
2. **Klik tab "Hutang"** di navigation
3. **Lihat data sample** yang sudah tersedia:
   - 3 Hutang (termasuk yang sudah lunas dan sebagian)
   - 3 Piutang (dengan berbagai status)
   - Dashboard dengan summary lengkap
   - Laporan analisis hutang/piutang

## 📊 **Data Sample yang Akan Dibuat:**

### **Hutang (3 items):**
1. **Pinjaman Bank BCA** - Rp 15.000.000 (Sisa: Rp 12.000.000) - *Sebagian*
2. **Pinjaman Emergency** - Rp 2.500.000 (Sisa: Rp 2.500.000) - *Belum Bayar*
3. **Cicilan Motor Honda** - Rp 8.000.000 (Lunas) - *Paid*

### **Piutang (3 items):**
1. **Pinjaman ke Sari Dewi** - Rp 3.000.000 (Sisa: Rp 1.500.000) - *Sebagian*
2. **Uang Muka Project** - Rp 5.000.000 (Sisa: Rp 5.000.000) - *Belum Bayar*
3. **Hutang Konsultasi IT** - Rp 1.200.000 (Lunas) - *Paid*

## 🛠️ **Troubleshooting:**

### **Jika masih error setelah setup:**
1. **Logout dan login ulang** di aplikasi
2. **Refresh browser** (Ctrl+F5)
3. **Cek console browser** (F12) untuk error detail
4. **Pastikan semua SQL berhasil dijalankan** di Supabase

### **Jika tabel tidak terbuat:**
1. **Cek di Table Editor** apakah tabel `debts` dan `debt_payments` sudah ada
2. **Jalankan SQL bertahap** jika ada error
3. **Pastikan user admin sudah ada** sebelum menjalankan

---

**🎯 Setelah setup berhasil, fitur hutang & piutang akan berfungsi penuh!**