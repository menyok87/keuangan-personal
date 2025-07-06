/*
  # Setup Database Lengkap - Versi Terperbaiki

  1. Schema Database
    - Buat semua enum types dengan pengecekan
    - Buat semua tabel dengan struktur lengkap
    - Setup Row Level Security (RLS)
    - Buat policies untuk keamanan data
    - Tambah indexes untuk performa

  2. Sample Data
    - User admin dengan kredensial login
    - Transaksi sample yang realistis
    - Anggaran bulanan
    - Target keuangan

  3. Security & Error Handling
    - RLS aktif untuk semua tabel
    - Password ter-hash dengan bcrypt
    - Data terisolasi per user
    - Error handling yang robust
    - Pengecekan duplikasi data
*/

-- ========================================
-- 1. CREATE ENUM TYPES (SAFE)
-- ========================================

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type transaction_type sudah ada';
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'e_wallet');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type payment_method sudah ada';
END $$;

DO $$ BEGIN
    CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type recurring_frequency sudah ada';
END $$;

DO $$ BEGIN
    CREATE TYPE budget_period AS ENUM ('monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type budget_period sudah ada';
END $$;

DO $$ BEGIN
    CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type goal_priority sudah ada';
END $$;

-- ========================================
-- 2. CREATE TABLES (SAFE)
-- ========================================

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

-- ========================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. DROP EXISTING POLICIES (SAFE)
-- ========================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies safely
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- ========================================
-- 5. CREATE RLS POLICIES
-- ========================================

-- Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for budgets
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for financial_goals
CREATE POLICY "Users can view own goals"
  ON financial_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON financial_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON financial_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON financial_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ========================================
-- 6. CREATE TRIGGER FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================
-- 7. CREATE INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_deadline ON financial_goals(deadline);

-- ========================================
-- 8. INSERT ADMIN USER & SAMPLE DATA
-- ========================================

DO $$
DECLARE
  admin_user_id uuid;
  existing_count integer;
BEGIN
  -- Check if admin user exists
  SELECT COUNT(*) INTO existing_count 
  FROM auth.users 
  WHERE email = 'admin@akuntansi.com';
  
  IF existing_count = 0 THEN
    -- Create new admin user
    admin_user_id := gen_random_uuid();
    
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
    
    RAISE NOTICE '✅ Admin user created: admin@akuntansi.com';
  ELSE
    -- Get existing admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@akuntansi.com';
    
    RAISE NOTICE 'ℹ️  Admin user already exists: admin@akuntansi.com';
  END IF;
  
  -- Check and create profile
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = admin_user_id) THEN
    INSERT INTO public.user_profiles (id, full_name) 
    VALUES (admin_user_id, 'Administrator');
    RAISE NOTICE '✅ Admin profile created';
  ELSE
    RAISE NOTICE 'ℹ️  Admin profile already exists';
  END IF;
  
  -- Check and create transactions
  IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = admin_user_id) THEN
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
    
    RAISE NOTICE '✅ 8 sample transactions created';
  ELSE
    RAISE NOTICE 'ℹ️  Transactions already exist';
  END IF;
  
  -- Check and create budgets
  IF NOT EXISTS (SELECT 1 FROM budgets WHERE user_id = admin_user_id) THEN
    INSERT INTO public.budgets (user_id, category, amount, period) VALUES 
    (admin_user_id, 'Makanan & Minuman', 2000000, 'monthly'),
    (admin_user_id, 'Transportasi', 800000, 'monthly'),
    (admin_user_id, 'Belanja', 1500000, 'monthly'),
    (admin_user_id, 'Tagihan', 600000, 'monthly'),
    (admin_user_id, 'Hiburan', 500000, 'monthly');
    
    RAISE NOTICE '✅ 5 sample budgets created';
  ELSE
    RAISE NOTICE 'ℹ️  Budgets already exist';
  END IF;
  
  -- Check and create financial goals
  IF NOT EXISTS (SELECT 1 FROM financial_goals WHERE user_id = admin_user_id) THEN
    INSERT INTO public.financial_goals (user_id, title, target_amount, current_amount, deadline, category, priority) VALUES 
    (admin_user_id, 'Dana Darurat 6 Bulan', 20000000, 8500000, CURRENT_DATE + 300, 'Dana Darurat', 'high'),
    (admin_user_id, 'Liburan Keluarga ke Bali', 12000000, 4200000, CURRENT_DATE + 240, 'Liburan', 'medium'),
    (admin_user_id, 'Laptop Gaming Baru', 15000000, 6800000, CURRENT_DATE + 180, 'Gadget', 'medium'),
    (admin_user_id, 'Investasi Reksadana', 50000000, 12000000, CURRENT_DATE + 720, 'Investasi', 'high');
    
    RAISE NOTICE '✅ 4 sample financial goals created';
  ELSE
    RAISE NOTICE 'ℹ️  Financial goals already exist';
  END IF;

  -- Final success message
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ===== DATABASE SETUP COMPLETED =====';
  RAISE NOTICE '📧 Admin Email: admin@akuntansi.com';
  RAISE NOTICE '🔑 Admin Password: admin123';
  RAISE NOTICE '📊 Sample data created successfully';
  RAISE NOTICE '✅ Database schema is ready!';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Setup failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;