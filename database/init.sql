-- ============================================================
-- Keuangan Personal - Database Initialization Script
-- Self-hosted PostgreSQL (menggantikan Supabase migrations)
-- ============================================================

-- Extension untuk UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================
DO $$ BEGIN CREATE TYPE transaction_type AS ENUM ('income','expense'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_method_type AS ENUM ('cash','credit_card','debit_card','bank_transfer','e_wallet'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE recurring_frequency_type AS ENUM ('daily','weekly','monthly','yearly'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE budget_period_type AS ENUM ('monthly','yearly'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE goal_priority_type AS ENUM ('low','medium','high'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE debt_status_type AS ENUM ('pending','partial','paid'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE debt_type_enum AS ENUM ('debt','receivable'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- TABLE: users (menggantikan Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: user_profiles (FK ke users.id)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL DEFAULT '',
  full_name   TEXT,
  avatar_url  TEXT,
  occupation  TEXT,
  phone       TEXT,
  location    TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRIGGER: Auto-create user_profiles setelah user register
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_created ON users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TABLE: transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount              DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description         TEXT NOT NULL,
  category            TEXT NOT NULL,
  subcategory         TEXT,
  type                transaction_type NOT NULL,
  date                DATE NOT NULL,
  payment_method      payment_method_type DEFAULT 'cash',
  tags                TEXT[] DEFAULT '{}',
  notes               TEXT,
  location            TEXT,
  is_recurring        BOOLEAN DEFAULT false,
  recurring_frequency recurring_frequency_type,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: budgets
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category   TEXT NOT NULL,
  amount     DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  period     budget_period_type DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: financial_goals
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  target_amount  DECIMAL(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(15,2) DEFAULT 0 CHECK (current_amount >= 0),
  deadline       DATE NOT NULL,
  category       TEXT NOT NULL,
  priority       goal_priority_type DEFAULT 'medium',
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: debts
-- ============================================================
CREATE TABLE IF NOT EXISTS debts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  creditor_name    TEXT NOT NULL,
  debtor_name      TEXT,
  amount           DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  remaining_amount DECIMAL(15,2) NOT NULL,
  description      TEXT NOT NULL,
  due_date         DATE,
  status           debt_status_type DEFAULT 'pending',
  type             debt_type_enum NOT NULL,
  interest_rate    DECIMAL(5,2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: debt_payments
-- ============================================================
CREATE TABLE IF NOT EXISTS debt_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id      UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount       DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRIGGER: Update debt status & remaining_amount setelah payment
-- ============================================================
CREATE OR REPLACE FUNCTION update_debt_status()
RETURNS TRIGGER AS $$
DECLARE
  v_debt_id UUID;
  v_total_paid DECIMAL(15,2);
  v_debt_amount DECIMAL(15,2);
BEGIN
  v_debt_id := COALESCE(NEW.debt_id, OLD.debt_id);

  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM debt_payments
  WHERE debt_id = v_debt_id;

  SELECT amount INTO v_debt_amount
  FROM debts
  WHERE id = v_debt_id;

  UPDATE debts
  SET
    remaining_amount = GREATEST(v_debt_amount - v_total_paid, 0),
    status = CASE
      WHEN v_total_paid <= 0 THEN 'pending'
      WHEN v_debt_amount - v_total_paid <= 0 THEN 'paid'
      ELSE 'partial'
    END,
    updated_at = now()
  WHERE id = v_debt_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_debt_status_trigger ON debt_payments;
CREATE TRIGGER update_debt_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON debt_payments
  FOR EACH ROW EXECUTE FUNCTION update_debt_status();

-- ============================================================
-- INDEXES untuk performa query
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id   ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category   ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type       ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id         ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_id           ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_status            ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_type              ON debts(type);
CREATE INDEX IF NOT EXISTS idx_debts_due_date          ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id   ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_date      ON debt_payments(payment_date);
