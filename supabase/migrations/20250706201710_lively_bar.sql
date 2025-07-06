-- ========================================
-- DEBT TABLES SETUP - FINAL FIX
-- ========================================

-- 1. CREATE ENUM TYPES (SAFE)
DO $$ BEGIN
    CREATE TYPE debt_status AS ENUM ('pending', 'partial', 'paid');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type debt_status sudah ada';
END $$;

DO $$ BEGIN
    CREATE TYPE debt_type AS ENUM ('debt', 'receivable');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type debt_type sudah ada';
END $$;

-- 2. CREATE TABLES (SAFE)
CREATE TABLE IF NOT EXISTS debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  creditor_name text NOT NULL,
  debtor_name text,
  amount decimal(15,2) NOT NULL,
  remaining_amount decimal(15,2) NOT NULL,
  description text NOT NULL,
  due_date date,
  status debt_status DEFAULT 'pending',
  type debt_type NOT NULL,
  interest_rate decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount decimal(15,2) NOT NULL,
  payment_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- 4. DROP EXISTING POLICIES (SAFE)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own debts" ON debts;
    DROP POLICY IF EXISTS "Users can insert own debts" ON debts;
    DROP POLICY IF EXISTS "Users can update own debts" ON debts;
    DROP POLICY IF EXISTS "Users can delete own debts" ON debts;
    DROP POLICY IF EXISTS "Users can view own debt payments" ON debt_payments;
    DROP POLICY IF EXISTS "Users can insert own debt payments" ON debt_payments;
    DROP POLICY IF EXISTS "Users can update own debt payments" ON debt_payments;
    DROP POLICY IF EXISTS "Users can delete own debt payments" ON debt_payments;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- 5. CREATE RLS POLICIES
CREATE POLICY "Users can view own debts"
  ON debts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debts"
  ON debts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts"
  ON debts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts"
  ON debts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own debt payments"
  ON debt_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = (SELECT user_id FROM debts WHERE id = debt_id));

CREATE POLICY "Users can insert own debt payments"
  ON debt_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = (SELECT user_id FROM debts WHERE id = debt_id));

CREATE POLICY "Users can update own debt payments"
  ON debt_payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = (SELECT user_id FROM debts WHERE id = debt_id));

CREATE POLICY "Users can delete own debt payments"
  ON debt_payments FOR DELETE
  TO authenticated
  USING (auth.uid() = (SELECT user_id FROM debts WHERE id = debt_id));

-- 6. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON debt_payments(payment_date);

-- 7. CREATE FUNCTIONS AND TRIGGERS
CREATE OR REPLACE FUNCTION update_debt_status()
RETURNS trigger AS $$
BEGIN
  UPDATE debts 
  SET 
    remaining_amount = amount - (
      SELECT COALESCE(SUM(amount), 0) 
      FROM debt_payments 
      WHERE debt_id = COALESCE(NEW.debt_id, OLD.debt_id)
    ),
    status = CASE 
      WHEN amount - (
        SELECT COALESCE(SUM(amount), 0) 
        FROM debt_payments 
        WHERE debt_id = COALESCE(NEW.debt_id, OLD.debt_id)
      ) <= 0 THEN 'paid'::debt_status
      WHEN (
        SELECT COALESCE(SUM(amount), 0) 
        FROM debt_payments 
        WHERE debt_id = COALESCE(NEW.debt_id, OLD.debt_id)
      ) > 0 THEN 'partial'::debt_status
      ELSE 'pending'::debt_status
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.debt_id, OLD.debt_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_debt_status_trigger ON debt_payments;
CREATE TRIGGER update_debt_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON debt_payments
  FOR EACH ROW EXECUTE PROCEDURE update_debt_status();

-- 8. INSERT SAMPLE DATA FOR ADMIN USER
DO $$
DECLARE
  admin_user_id uuid;
  debt1_id uuid;
  receivable1_id uuid;
  existing_debt_count integer;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@akuntansi.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Check if sample debts already exist
    SELECT COUNT(*) INTO existing_debt_count 
    FROM debts 
    WHERE user_id = admin_user_id;
    
    IF existing_debt_count = 0 THEN
      
      -- Insert sample debts (hutang) - FIXED: Use proper enum casting
      INSERT INTO public.debts (
        user_id, creditor_name, amount, remaining_amount, description, 
        due_date, status, type, interest_rate
      ) VALUES 
      (
        admin_user_id,
        'Bank BCA',
        15000000,
        12000000,
        'Pinjaman Modal Usaha KUR',
        CURRENT_DATE + INTERVAL '18 months',
        'partial'::debt_status,
        'debt'::debt_type,
        6.0
      ),
      (
        admin_user_id,
        'Ahmad Rizki',
        2500000,
        2500000,
        'Pinjaman Emergency Dana Darurat',
        CURRENT_DATE + INTERVAL '6 months',
        'pending'::debt_status,
        'debt'::debt_type,
        0.0
      ),
      (
        admin_user_id,
        'Dealer Honda',
        8000000,
        0,
        'Cicilan Motor Honda Beat',
        CURRENT_DATE - INTERVAL '1 month',
        'paid'::debt_status,
        'debt'::debt_type,
        0.0
      );
      
      -- Insert sample receivables (piutang) - FIXED: Use proper enum casting
      INSERT INTO public.debts (
        user_id, creditor_name, debtor_name, amount, remaining_amount, description, 
        due_date, status, type, interest_rate
      ) VALUES 
      (
        admin_user_id,
        'Sari Dewi',
        'Sari Dewi',
        3000000,
        1500000,
        'Pinjaman untuk Modal Warung',
        CURRENT_DATE + INTERVAL '8 months',
        'partial'::debt_status,
        'receivable'::debt_type,
        2.0
      ),
      (
        admin_user_id,
        'PT. Maju Jaya',
        'PT. Maju Jaya',
        5000000,
        5000000,
        'Uang Muka Project Website',
        CURRENT_DATE + INTERVAL '2 months',
        'pending'::debt_status,
        'receivable'::debt_type,
        0.0
      ),
      (
        admin_user_id,
        'Budi Santoso',
        'Budi Santoso',
        1200000,
        0,
        'Hutang Konsultasi IT',
        CURRENT_DATE - INTERVAL '15 days',
        'paid'::debt_status,
        'receivable'::debt_type,
        0.0
      );
      
      -- Add sample payments for partial status
      SELECT id INTO debt1_id FROM debts WHERE user_id = admin_user_id AND creditor_name = 'Bank BCA';
      SELECT id INTO receivable1_id FROM debts WHERE user_id = admin_user_id AND creditor_name = 'Sari Dewi';
      
      -- Add payments for Bank BCA loan (3M paid from 15M)
      IF debt1_id IS NOT NULL THEN
        INSERT INTO public.debt_payments (debt_id, amount, payment_date, notes) VALUES 
        (debt1_id, 1500000, CURRENT_DATE - INTERVAL '3 months', 'Pembayaran cicilan bulan 1'),
        (debt1_id, 1500000, CURRENT_DATE - INTERVAL '2 months', 'Pembayaran cicilan bulan 2');
      END IF;
      
      -- Add payment for Sari Dewi receivable (1.5M received from 3M)
      IF receivable1_id IS NOT NULL THEN
        INSERT INTO public.debt_payments (debt_id, amount, payment_date, notes) VALUES 
        (receivable1_id, 1500000, CURRENT_DATE - INTERVAL '1 month', 'Pembayaran pertama dari Sari');
      END IF;
      
      RAISE NOTICE '✅ Sample debt data created successfully!';
      RAISE NOTICE '📊 Created 6 sample debts/receivables with payments';
      RAISE NOTICE '💰 Includes: 3 debts (hutang) and 3 receivables (piutang)';
      RAISE NOTICE '📈 Status: paid, partial, and pending examples';
      
    ELSE
      RAISE NOTICE 'ℹ️  Sample debt data already exists for admin user (% records)', existing_debt_count;
    END IF;
  ELSE
    RAISE NOTICE '⚠️  Admin user not found - please run database setup first';
  END IF;
  
  -- Final success message
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ===== DEBT TABLES SETUP COMPLETED =====';
  RAISE NOTICE '📧 Login dengan: admin@akuntansi.com / admin123';
  RAISE NOTICE '💳 Klik tab "Hutang" untuk melihat fitur baru';
  RAISE NOTICE '📊 Dashboard hutang & piutang sudah tersedia';
  RAISE NOTICE '📈 Laporan analisis hutang/piutang lengkap';
  RAISE NOTICE '✅ Database siap digunakan!';
  RAISE NOTICE '';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Error setting up debt tables: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;