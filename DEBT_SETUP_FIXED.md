# 🚀 Setup Tabel Hutang & Piutang - FIXED VERSION

## ❌ **Error yang Diperbaiki:**
```
ERROR: 42P01: relation "debts" does not exist
QUERY: NOT EXISTS (SELECT 1 FROM debts WHERE user_id = admin_user_id)
```

**✅ Solusi:** SQL sekarang mengecek tabel setelah tabel dibuat, bukan sebelumnya.

## 🛠️ **Langkah Setup:**

### **1. Buka Supabase Dashboard**
- Kunjungi [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Login ke akun Anda
- Pilih project: `ddtwsrfrfywgrqxxvsso`

### **2. Buka SQL Editor**
- Di sidebar kiri, klik **SQL Editor**
- Klik **New Query**

### **3. Copy dan Paste SQL Fixed**
- Copy seluruh isi file `supabase/migrations/create_debt_tables_fixed.sql`
- Paste ke SQL Editor di Supabase
- Klik **Run** atau tekan `Ctrl+Enter`

### **4. Tunggu Hingga Selesai**
- Lihat pesan sukses di output console
- Pastikan tidak ada error merah

### **5. Refresh Aplikasi**
- Refresh browser di https://keuangan99.com
- Login dengan admin@akuntansi.com / admin123
- Klik tab **"Hutang"**

## 🎯 **Setelah Setup Berhasil:**

### **📊 Dashboard Hutang & Piutang:**
- **Summary Cards** dengan total hutang, piutang, jatuh tempo
- **Progress tracking** untuk setiap hutang/piutang
- **Status indicators** (Lunas, Sebagian, Belum Bayar)
- **Net position** (surplus/defisit)

### **📝 Data Sample (6 items):**

#### **💸 Hutang (3 items):**
1. **Pinjaman Bank BCA** - Rp 15.000.000 (Sisa: Rp 12.000.000) - *Sebagian*
2. **Pinjaman Emergency** - Rp 2.500.000 (Sisa: Rp 2.500.000) - *Belum Bayar*
3. **Cicilan Motor Honda** - Rp 8.000.000 (Lunas) - *Paid*

#### **💰 Piutang (3 items):**
1. **Pinjaman ke Sari Dewi** - Rp 3.000.000 (Sisa: Rp 1.500.000) - *Sebagian*
2. **Uang Muka Project** - Rp 5.000.000 (Sisa: Rp 5.000.000) - *Belum Bayar*
3. **Hutang Konsultasi IT** - Rp 1.200.000 (Lunas) - *Paid*

### **📈 Fitur Lengkap:**
- ✅ **Tambah/Edit/Hapus** hutang dan piutang
- ✅ **Pembayaran bertahap** dengan tracking otomatis
- ✅ **Laporan analisis** dengan grafik dan export CSV
- ✅ **Filter dan search** berdasarkan status, tipe, periode
- ✅ **Timeline jatuh tempo** dengan notifikasi overdue
- ✅ **Dashboard overview** dengan net position

### **🔧 Fitur Teknis:**
- ✅ **Auto-update status** saat pembayaran ditambah
- ✅ **RLS Security** untuk isolasi data per user
- ✅ **Trigger functions** untuk kalkulasi otomatis
- ✅ **Indexes** untuk performa optimal

## 🛠️ **Jika Masih Error:**

### **1. Cek Console Browser (F12)**
- Lihat error detail di console
- Screenshot error untuk debugging

### **2. Verifikasi di Supabase**
- Buka **Table Editor** di Supabase
- Pastikan tabel `debts` dan `debt_payments` sudah ada
- Cek data sample sudah tersimpan

### **3. Test Login**
- Logout dan login ulang dengan admin@akuntansi.com / admin123
- Refresh browser dengan Ctrl+F5

### **4. Troubleshooting Lanjutan**
```sql
-- Test query di SQL Editor untuk cek tabel
SELECT COUNT(*) FROM debts;
SELECT COUNT(*) FROM debt_payments;
```

## 🎉 **Hasil Akhir**

Setelah setup berhasil, Anda akan memiliki:

✅ **Sistem manajemen hutang & piutang lengkap**  
✅ **Dashboard dengan analytics real-time**  
✅ **Laporan export CSV**  
✅ **Timeline jatuh tempo**  
✅ **Payment tracking otomatis**  
✅ **Data sample untuk testing**  

**🌐 Akses di:** https://keuangan99.com → Tab "Hutang"

---

**💡 Tips:**
- Gunakan fitur "Bayar Lunas" untuk pembayaran penuh
- Export laporan CSV untuk analisis eksternal
- Monitor timeline jatuh tempo secara berkala
- Gunakan filter untuk analisis spesifik