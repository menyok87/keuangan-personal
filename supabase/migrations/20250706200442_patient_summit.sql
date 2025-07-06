/*
  # Create Debt Management System

  1. New Tables
    - `debts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `creditor_name` (text) - Nama pemberi hutang
      - `debtor_name` (text) - Nama yang berhutang (bisa kosong jika user sendiri)
      - `amount` (decimal) - Jumlah hutang
      - `remaining_amount` (decimal) - Sisa hutang
      - `description` (text) - Deskripsi hutang
      - `due_date` (date) - Tanggal jatuh tempo
      - `status` (enum) - pending, partial, paid
      - `type` (enum) - debt (hutang), receivable (piutang)
      - `interest_rate` (decimal) - Bunga (opsional)
      - `created_at`, `updated_at` (timestamptz)

    - `debt_payments`
      - `id` (uuid, primary key)
      - `debt_id` (uuid, references debts)
      - `amount` (decimal) - Jumlah pembayaran
      - `payment_date` (date) - Tanggal pembayaran
      - `notes` (text) - Catatan pembayaran
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create enum types for debt management
DO $$ BEGIN
    CREATE TYPE debt_status AS ENUM ('pending', 'partial', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE debt_type AS ENUM ('debt', 'receivable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create debts table
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

-- Create debt_payments table
CREATE TABLE IF NOT EXISTS debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount decimal(15,2) NOT NULL,
  payment_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for debts
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

-- Create policies for debt_payments
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON debt_payments(payment_date);

-- Create function to update debt status and remaining amount
CREATE OR REPLACE FUNCTION update_debt_status()
RETURNS trigger AS $$
BEGIN
  -- Update remaining amount and status when payment is added
  UPDATE debts 
  SET 
    remaining_amount = amount - (
      SELECT COALESCE(SUM(amount), 0) 
      FROM debt_payments 
      WHERE debt_id = NEW.debt_id
    ),
    status = CASE 
      WHEN amount - (
        SELECT COALESCE(SUM(amount), 0) 
        FROM debt_payments 
        WHERE debt_id = NEW.debt_id
      ) <= 0 THEN 'paid'
      WHEN (
        SELECT COALESCE(SUM(amount), 0) 
        FROM debt_payments 
        WHERE debt_id = NEW.debt_id
      ) > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = now()
  WHERE id = NEW.debt_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update debt status
CREATE TRIGGER update_debt_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON debt_payments
  FOR EACH ROW EXECUTE PROCEDURE update_debt_status();