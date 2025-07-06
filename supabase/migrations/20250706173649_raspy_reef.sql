/*
  # Setup Database Lengkap - Fixed Version

  1. Database Schema
    - Buat semua tabel dengan enum types
    - Setup Row Level Security (RLS)
    - Buat policies untuk keamanan data
    - Tambah indexes untuk performa

  2. Sample Data
    - User admin dengan kredensial login
    - Transaksi sample yang realistis
    - Anggaran bulanan
    - Target keuangan

  3. Security
    - RLS aktif untuk semua tabel
    - Password ter-hash dengan bcrypt
    - Data terisolasi per user
*/

-- Create enum types (with error handling)
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

-- Drop existing policies if they exist (safe approach)
DO $$ BEGIN
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
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

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
DO $$ BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

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

-- Insert admin user and sample data (safe approach)
DO $$
DECLARE
  admin_user_id uuid;
  existing_user_count integer;
BEGIN
  -- Check if admin user already exists
  SELECT COUNT(*) INTO existing_user_count 
  FROM auth.users 
  WHERE email = 'admin@akuntansi.com';
  
  IF existing_user_count = 0 THEN
    -- Generate new UUID for admin user
    admin_user_id := gen_random_uuid();
    
    -- Insert admin user into auth.users (simplified approach)
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
      aud
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@akuntansi.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Administrator"}',
      false,
      'authenticated',
      'authenticated'
    );
    
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
    );
    
    -- Insert sample transactions
    INSERT INTO public.transactions (
      user_id, amount, description, category, subcategory, type, date, payment_method, tags, notes, location
    ) VALUES 
    (admin_user_id, 5000000, 'Gaji Bulanan Januari', 'Gaji', 'Gaji Pokok', 'income', CURRENT_DATE - 5, 'bank_transfer', ARRAY['gaji', 'rutin'], 'Gaji pokok bulan Januari 2025', 'Bank BCA'),
    (admin_user_id, 1500000, 'Bonus Kinerja', 'Gaji', 'Bonus', 'income', CURRENT_DATE - 3, 'bank_transfer', ARRAY['bonus', 'kinerja'], 'Bonus kinerja Q4 2024', 'Bank BCA'),
    (admin_user_id, 250000, 'Makan Siang Keluarga', 'Makanan & Minuman', 'Restoran', 'expense', CURRENT_DATE, 'credit_card', ARRAY['makan', 'keluarga'], 'Makan siang di restoran bersama keluarga', 'Restoran Padang'),
    (admin_user_id, 75000, 'Bensin Motor', 'Transportasi', 'Bensin', 'expense', CURRENT_DATE - 1, 'cash', ARRAY['transportasi', 'bensin'], 'Isi bensin motor untuk commuting', 'SPBU Shell'),
    (admin_user_id, 450000, 'Belanja Bulanan', 'Belanja', 'Groceries', 'expense', CURRENT_DATE - 2, 'debit_card', ARRAY['belanja', 'kebutuhan'], 'Belanja kebutuhan rumah tangga', 'Supermarket'),
    (admin_user_id, 180000, 'Tagihan Listrik PLN', 'Tagihan', 'Listrik', 'expense', CURRENT_DATE - 4, 'e_wallet', ARRAY['tagihan', 'listrik'], 'Pembayaran tagihan listrik', 'PLN Mobile'),
    (admin_user_id, 120000, 'Internet Indihome', 'Tagihan', 'Internet', 'expense', CURRENT_DATE - 6, 'bank_transfer', ARRAY['tagihan', 'internet'], 'Tagihan internet bulanan', 'Bank BCA'),
    (admin_user_id, 85000, 'Kopi dan Snack', 'Makanan & Minuman', 'Kafe', 'expense', CURRENT_DATE - 1, 'e_wallet', ARRAY['kopi', 'snack'], 'Ngopi sambil kerja', 'Starbucks');
    
    -- Insert sample budgets
    INSERT INTO public.budgets (user_id, category, amount, period) VALUES 
    (admin_user_id, 'Makanan & Minuman', 2000000, 'monthly'),
    (admin_user_id, 'Transportasi', 800000, 'monthly'),
    (admin_user_id, 'Belanja', 1500000, 'monthly'),
    (admin_user_id, 'Tagihan', 600000, 'monthly'),
    (admin_user_id, 'Hiburan', 500000, 'monthly');
    
    -- Insert sample financial goals
    INSERT INTO public.financial_goals (user_id, title, target_amount, current_amount, deadline, category, priority) VALUES 
    (admin_user_id, 'Dana Darurat 6 Bulan', 20000000, 8500000, CURRENT_DATE + 300, 'Dana Darurat', 'high'),
    (admin_user_id, 'Liburan Keluarga ke Bali', 12000000, 4200000, CURRENT_DATE + 240, 'Liburan', 'medium'),
    (admin_user_id, 'Laptop Gaming Baru', 15000000, 6800000, CURRENT_DATE + 180, 'Gadget', 'medium'),
    (admin_user_id, 'Investasi Reksadana', 50000000, 12000000, CURRENT_DATE + 720, 'Investasi', 'high');

    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📧 Admin Email: admin@akuntansi.com';
    RAISE NOTICE '🔑 Admin Password: admin123';
    RAISE NOTICE '📊 Sample data created successfully';
    
  ELSE
    RAISE NOTICE '⚠️  Admin user already exists with email: admin@akuntansi.com';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Error setting up database: %', SQLERRM;
END $$;