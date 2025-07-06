# Setup Database Supabase

## Cara Import Tabel ke Supabase

Karena kita tidak bisa menggunakan Supabase CLI di WebContainer, ikuti langkah-langkah berikut untuk mengimport database schema:

### 1. Buka Supabase Dashboard
- Kunjungi [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Login ke akun Anda
- Pilih project: `ddtwsrfrfywgrqxxvsso`

### 2. Buka SQL Editor
- Di sidebar kiri, klik **SQL Editor**
- Klik **New Query**

### 3. Copy dan Paste SQL Schema
Copy seluruh isi file `supabase/migrations/20250706170531_wispy_castle.sql` dan paste ke SQL Editor.

### 4. Jalankan Query
- Klik tombol **Run** atau tekan `Ctrl+Enter`
- Tunggu hingga semua query berhasil dijalankan

### 5. Verifikasi Tabel
Setelah berhasil, Anda akan melihat tabel-tabel berikut di **Table Editor**:
- `user_profiles`
- `transactions` 
- `budgets`
- `financial_goals`

## Schema yang Akan Dibuat

### Enum Types
- `transaction_type`: income, expense
- `payment_method`: cash, credit_card, debit_card, bank_transfer, e_wallet
- `recurring_frequency`: daily, weekly, monthly, yearly
- `budget_period`: monthly, yearly
- `goal_priority`: low, medium, high

### Tables

#### user_profiles
- `id` (uuid, FK ke auth.users)
- `full_name` (text)
- `avatar_url` (text)
- `created_at`, `updated_at` (timestamptz)

#### transactions
- `id` (uuid, PK)
- `user_id` (uuid, FK ke user_profiles)
- `amount` (decimal 15,2)
- `description` (text)
- `category`, `subcategory` (text)
- `type` (transaction_type)
- `date` (date)
- `payment_method` (payment_method)
- `tags` (text[])
- `notes`, `location` (text)
- `is_recurring` (boolean)
- `recurring_frequency` (recurring_frequency)
- `created_at`, `updated_at` (timestamptz)

#### budgets
- `id` (uuid, PK)
- `user_id` (uuid, FK ke user_profiles)
- `category` (text)
- `amount` (decimal 15,2)
- `period` (budget_period)
- `created_at`, `updated_at` (timestamptz)

#### financial_goals
- `id` (uuid, PK)
- `user_id` (uuid, FK ke user_profiles)
- `title` (text)
- `target_amount`, `current_amount` (decimal 15,2)
- `deadline` (date)
- `category` (text)
- `priority` (goal_priority)
- `created_at`, `updated_at` (timestamptz)

### Security Features
- ✅ Row Level Security (RLS) enabled
- ✅ Policies untuk CRUD operations
- ✅ User isolation (setiap user hanya akses data sendiri)
- ✅ Auto-create profile trigger
- ✅ Performance indexes

## Setelah Import Berhasil

1. **Test Authentication**: Coba daftar akun baru di aplikasi
2. **Test Transactions**: Tambah beberapa transaksi
3. **Verify Data**: Cek di Table Editor apakah data tersimpan

## Troubleshooting

### Jika ada error saat import:
1. Pastikan semua query dijalankan secara berurutan
2. Jika ada error "already exists", abaikan dan lanjutkan
3. Refresh browser dan cek Table Editor

### Jika RLS tidak bekerja:
1. Pastikan policies sudah dibuat
2. Cek di Authentication > Policies
3. Test dengan user yang berbeda

## Environment Variables
Pastikan file `.env` sudah berisi:
```
VITE_SUPABASE_URL=https://ddtwsrfrfywgrqxxvsso.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdHdzcmZyZnl3Z3JxeHh2c3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjExNjYsImV4cCI6MjA2NzM5NzE2Nn0.BUixetXNsej6oDI93tp388xk_S2l2DhfFgEjpYgq2VE
```

Setelah database berhasil diimport, aplikasi akan terhubung ke Supabase dan siap digunakan!