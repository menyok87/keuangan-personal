-- =================================================
-- Keuangan Personal - PostgreSQL Schema
-- Self-hosted (tanpa Supabase)
-- =================================================

-- Extension untuk UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =================================================
-- ENUM TYPES
-- =================================================

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'e_wallet');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE budget_period AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE debt_status AS ENUM ('pending', 'partial', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE debt_type AS ENUM ('debt', 'receivable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =================================================
-- USERS TABLE (menggantikan auth.users Supabase)
-- =================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  occupation text,
  phone text,
  location text,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =================================================
-- TRANSACTIONS TABLE
-- =================================================

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(15,2) NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  subcategory text,
  type transaction_type NOT NULL,
  date date NOT NULL,
  payment_method payment_method_type DEFAULT 'cash',
  tags text[] DEFAULT '{}',
  notes text,
  location text,
  is_recurring boolean DEFAULT false,
  recurring_frequency recurring_frequency,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- =================================================
-- BUDGETS TABLE
-- =================================================

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  amount decimal(15,2) NOT NULL,
  period budget_period DEFAULT 'monthly',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- =================================================
-- FINANCIAL GOALS TABLE
-- =================================================

CREATE TABLE IF NOT EXISTS financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  target_amount decimal(15,2) NOT NULL,
  current_amount decimal(15,2) DEFAULT 0,
  deadline date NOT NULL,
  category text NOT NULL,
  priority goal_priority DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);

-- =================================================
-- DEBTS TABLE
-- =================================================

CREATE TABLE IF NOT EXISTS debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);

-- =================================================
-- DEBT PAYMENTS TABLE
-- =================================================

CREATE TABLE IF NOT EXISTS debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount decimal(15,2) NOT NULL,
  payment_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON debt_payments(payment_date);

-- =================================================
-- TRIGGER: Auto-update debt status setelah pembayaran
-- =================================================

CREATE OR REPLACE FUNCTION update_debt_after_payment()
RETURNS trigger AS $$
DECLARE
  target_debt_id uuid;
BEGIN
  target_debt_id := COALESCE(NEW.debt_id, OLD.debt_id);

  UPDATE debts
  SET
    remaining_amount = amount - (
      SELECT COALESCE(SUM(amount), 0)
      FROM debt_payments
      WHERE debt_id = target_debt_id
    ),
    status = CASE
      WHEN amount - (
        SELECT COALESCE(SUM(amount), 0)
        FROM debt_payments
        WHERE debt_id = target_debt_id
      ) <= 0 THEN 'paid'::debt_status
      WHEN (
        SELECT COALESCE(SUM(amount), 0)
        FROM debt_payments
        WHERE debt_id = target_debt_id
      ) > 0 THEN 'partial'::debt_status
      ELSE 'pending'::debt_status
    END,
    updated_at = now()
  WHERE id = target_debt_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_debt_status ON debt_payments;
CREATE TRIGGER trg_update_debt_status
  AFTER INSERT OR UPDATE OR DELETE ON debt_payments
  FOR EACH ROW EXECUTE FUNCTION update_debt_after_payment();

-- =================================================
-- SELESAI
-- =================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Schema berhasil dibuat!';
  RAISE NOTICE '📋 Tabel: users, transactions, budgets, financial_goals, debts, debt_payments';
  RAISE NOTICE '🔐 Autentikasi: JWT (bcrypt password hashing)';
END $$;
