# Setup Admin User

## Cara Membuat User Admin

### 1. Buka Supabase Dashboard
- Kunjungi [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Login ke akun Anda
- Pilih project: `ddtwsrfrfywgrqxxvsso`

### 2. Buka SQL Editor
- Di sidebar kiri, klik **SQL Editor**
- Klik **New Query**

### 3. Copy dan Paste SQL
Copy seluruh isi file `supabase/migrations/create_admin_user.sql` dan paste ke SQL Editor.

### 4. Jalankan Query
- Klik tombol **Run** atau tekan `Ctrl+Enter`
- Tunggu hingga query berhasil dijalankan

## Kredensial Admin

Setelah berhasil menjalankan SQL, Anda dapat login dengan:

**Email:** `admin@akuntansi.com`  
**Password:** `admin123`

## Data Sample yang Dibuat

### Transaksi Sample:
- ✅ Gaji Bulanan (Rp 5.000.000) - Income
- ✅ Makan Siang (Rp 150.000) - Expense  
- ✅ Bensin Motor (Rp 50.000) - Expense
- ✅ Belanja Groceries (Rp 200.000) - Expense
- ✅ Listrik PLN (Rp 100.000) - Expense

### Anggaran Sample:
- ✅ Makanan & Minuman: Rp 1.500.000/bulan
- ✅ Transportasi: Rp 800.000/bulan
- ✅ Belanja: Rp 1.000.000/bulan
- ✅ Tagihan: Rp 500.000/bulan

### Target Keuangan Sample:
- ✅ Dana Darurat: Target Rp 15.000.000 (Progress: Rp 5.000.000)
- ✅ Liburan Bali: Target Rp 8.000.000 (Progress: Rp 2.000.000)
- ✅ Laptop Baru: Target Rp 12.000.000 (Progress: Rp 3.000.000)

## Verifikasi

1. **Login ke Aplikasi**: Gunakan kredensial admin di atas
2. **Cek Dashboard**: Lihat data sample yang sudah dibuat
3. **Test Fitur**: Coba tambah/edit/hapus transaksi

## Keamanan

- ✅ Password di-hash menggunakan bcrypt
- ✅ User terisolasi dengan RLS
- ✅ Data sample hanya untuk user admin
- ✅ Tidak ada privilege khusus (menggunakan role 'authenticated' biasa)

## Troubleshooting

### Jika login gagal:
1. Pastikan email dan password benar
2. Cek di Authentication > Users apakah user admin sudah terbuat
3. Pastikan email_confirmed_at tidak null

### Jika data tidak muncul:
1. Cek di Table Editor apakah data sudah tersimpan
2. Pastikan RLS policies sudah aktif
3. Logout dan login ulang

Setelah setup berhasil, Anda dapat menggunakan akun admin untuk testing dan demo aplikasi!