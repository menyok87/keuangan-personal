/*
  # Setup Database Lengkap untuk Aplikasi Akuntansi

  1. Tabel yang dibuat:
    - user_profiles: Profil pengguna
    - transactions: Transaksi keuangan
    - budgets: Anggaran bulanan/tahunan
    - financial_goals: Target keuangan

  2. Data Sample:
    - User admin dengan kredensial login
    - 8 transaksi sample (income & expense)
    - 5 anggaran kategori
    - 4 target keuangan

  3. Keamanan:
    - Row Level Security (RLS) aktif
    - Policies untuk isolasi data per user
    - Password ter-hash dengan bcrypt
*/

-- Create enum types
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'e_wallet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE budget_period AS ENUM ('monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount decimal(15,2) NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  subcategory text,
  type transaction_type NOT NULL,
  date date NOT NULL,
  payment_method payment_method DEFAULT 'cash',
  tags text[] DEFAULT '{}',
  notes text,
  location text,
  is_recurring boolean DEFAULT false,
  recurring_frequency recurring_frequency,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  amount decimal(15,2) NOT NULL,
  period budget_period DEFAULT 'monthly',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create financial_goals table
CREATE TABLE IF NOT EXISTS financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  target_amount decimal(15,2) NOT NULL,
  current_amount decimal(15,2) DEFAULT 0,
  deadline date NOT NULL,
  category text NOT NULL,
  priority goal_priority DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON financial_goals;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for budgets
CREATE POLICY "Users can view own budgets"
  ON budgets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for financial_goals
CREATE POLICY "Users can view own goals"
  ON financial_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON financial_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON financial_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON financial_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);

-- Insert admin user and sample data
DO $$
DECLARE
  admin_user_id uuid := gen_random_uuid();
  hashed_password text;
BEGIN
  -- Generate hashed password for 'admin123'
  hashed_password := crypt('admin123', gen_salt('bf'));
  
  -- Insert admin user into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    email_change_token_new,
    recovery_token
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@akuntansi.com',
    hashed_password,
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Administrator", "role": "admin"}',
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    ''
  ) ON CONFLICT (email) DO NOTHING;
  
  -- Insert admin profile
  INSERT INTO public.user_profiles (
    id,
    full_name,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'Administrator',
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Insert sample transactions for admin
  INSERT INTO public.transactions (
    user_id,
    amount,
    description,
    category,
    subcategory,
    type,
    date,
    payment_method,
    tags,
    notes,
    location
  ) VALUES 
  -- Income transactions
  (
    admin_user_id,
    5000000,
    'Gaji Bulanan Januari',
    'Gaji',
    'Gaji Pokok',
    'income',
    CURRENT_DATE - INTERVAL '5 days',
    'bank_transfer',
    ARRAY['gaji', 'rutin', 'bulanan'],
    'Gaji pokok bulan Januari 2025',
    'Bank BCA'
  ),
  (
    admin_user_id,
    1500000,
    'Bonus Kinerja',
    'Gaji',
    'Bonus',
    'income',
    CURRENT_DATE - INTERVAL '3 days',
    'bank_transfer',
    ARRAY['bonus', 'kinerja'],
    'Bonus kinerja Q4 2024',
    'Bank BCA'
  ),
  
  -- Expense transactions
  (
    admin_user_id,
    250000,
    'Makan Siang Keluarga',
    'Makanan & Minuman',
    'Restoran',
    'expense',
    CURRENT_DATE,
    'credit_card',
    ARRAY['makan', 'keluarga', 'weekend'],
    'Makan siang di restoran bersama keluarga',
    'Restoran Padang Sederhana'
  ),
  (
    admin_user_id,
    75000,
    'Bensin Motor',
    'Transportasi',
    'Bensin',
    'expense',
    CURRENT_DATE - INTERVAL '1 day',
    'cash',
    ARRAY['transportasi', 'bensin', 'harian'],
    'Isi bensin motor untuk commuting',
    'SPBU Shell'
  ),
  (
    admin_user_id,
    450000,
    'Belanja Bulanan Supermarket',
    'Belanja',
    'Groceries',
    'expense',
    CURRENT_DATE - INTERVAL '2 days',
    'debit_card',
    ARRAY['belanja', 'kebutuhan', 'bulanan'],
    'Belanja kebutuhan rumah tangga bulanan',
    'Supermarket Indomaret'
  ),
  (
    admin_user_id,
    180000,
    'Tagihan Listrik PLN',
    'Tagihan',
    'Listrik',
    'expense',
    CURRENT_DATE - INTERVAL '4 days',
    'e_wallet',
    ARRAY['tagihan', 'listrik', 'rutin'],
    'Pembayaran tagihan listrik bulan Desember',
    'Aplikasi PLN Mobile'
  ),
  (
    admin_user_id,
    120000,
    'Internet Indihome',
    'Tagihan',
    'Internet',
    'expense',
    CURRENT_DATE - INTERVAL '6 days',
    'bank_transfer',
    ARRAY['tagihan', 'internet', 'bulanan'],
    'Tagihan internet Indihome bulan Januari',
    'Bank BCA'
  ),
  (
    admin_user_id,
    85000,
    'Kopi dan Snack',
    'Makanan & Minuman',
    'Kafe',
    'expense',
    CURRENT_DATE - INTERVAL '1 day',
    'e_wallet',
    ARRAY['kopi', 'snack', 'santai'],
    'Ngopi sambil kerja di cafe',
    'Starbucks Mall'
  )
  ON CONFLICT DO NOTHING;
  
  -- Insert sample budgets for admin
  INSERT INTO public.budgets (
    user_id,
    category,
    amount,
    period,
    created_at,
    updated_at
  ) VALUES 
  (
    admin_user_id,
    'Makanan & Minuman',
    2000000,
    'monthly',
    now(),
    now()
  ),
  (
    admin_user_id,
    'Transportasi',
    800000,
    'monthly',
    now(),
    now()
  ),
  (
    admin_user_id,
    'Belanja',
    1500000,
    'monthly',
    now(),
    now()
  ),
  (
    admin_user_id,
    'Tagihan',
    600000,
    'monthly',
    now(),
    now()
  ),
  (
    admin_user_id,
    'Hiburan',
    500000,
    'monthly',
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;
  
  -- Insert sample financial goals for admin
  INSERT INTO public.financial_goals (
    user_id,
    title,
    target_amount,
    current_amount,
    deadline,
    category,
    priority,
    created_at,
    updated_at
  ) VALUES 
  (
    admin_user_id,
    'Dana Darurat 6 Bulan',
    20000000,
    8500000,
    CURRENT_DATE + INTERVAL '10 months',
    'Dana Darurat',
    'high',
    now(),
    now()
  ),
  (
    admin_user_id,
    'Liburan Keluarga ke Bali',
    12000000,
    4200000,
    CURRENT_DATE + INTERVAL '8 months',
    'Liburan',
    'medium',
    now(),
    now()
  ),
  (
    admin_user_id,
    'Laptop Gaming Baru',
    15000000,
    6800000,
    CURRENT_DATE + INTERVAL '6 months',
    'Gadget',
    'medium',
    now(),
    now()
  ),
  (
    admin_user_id,
    'Investasi Reksadana',
    50000000,
    12000000,
    CURRENT_DATE + INTERVAL '24 months',
    'Investasi',
    'high',
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  -- Output success message
  RAISE NOTICE '✅ Database setup completed successfully!';
  RAISE NOTICE '📧 Admin Email: admin@akuntansi.com';
  RAISE NOTICE '🔑 Admin Password: admin123';
  RAISE NOTICE '📊 Sample data created: % transactions, % budgets, % goals', 
    (SELECT COUNT(*) FROM transactions WHERE user_id = admin_user_id),
    (SELECT COUNT(*) FROM budgets WHERE user_id = admin_user_id),
    (SELECT COUNT(*) FROM financial_goals WHERE user_id = admin_user_id);

EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE '⚠️  Admin user already exists with email: admin@akuntansi.com';
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Error setting up database: %', SQLERRM;
END $$;