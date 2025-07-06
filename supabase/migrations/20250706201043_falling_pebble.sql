/*
  # Add Sample Debt Data for Admin User

  1. Sample Debts (Hutang)
    - Pinjaman Bank untuk modal usaha
    - Hutang ke teman untuk emergency
    - Cicilan motor

  2. Sample Receivables (Piutang)
    - Pinjaman ke teman
    - Uang muka project
    - Hutang klien

  3. Sample Payments
    - Beberapa pembayaran untuk menunjukkan status partial
*/

DO $$
DECLARE
  admin_user_id uuid;
  debt1_id uuid;
  debt2_id uuid;
  debt3_id uuid;
  receivable1_id uuid;
  receivable2_id uuid;
  receivable3_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@akuntansi.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Check if sample debts already exist
    IF NOT EXISTS (SELECT 1 FROM debts WHERE user_id = admin_user_id) THEN
      
      -- Insert sample debts (hutang)
      INSERT INTO public.debts (
        id, user_id, creditor_name, amount, remaining_amount, description, 
        due_date, status, type, interest_rate
      ) VALUES 
      (
        gen_random_uuid(),
        admin_user_id,
        'Bank BCA',
        15000000,
        12000000,
        'Pinjaman Modal Usaha KUR',
        CURRENT_DATE + INTERVAL '18 months',
        'partial',
        'debt',
        6.0
      ),
      (
        gen_random_uuid(),
        admin_user_id,
        'Ahmad Rizki',
        2500000,
        2500000,
        'Pinjaman Emergency Dana Darurat',
        CURRENT_DATE + INTERVAL '6 months',
        'pending',
        'debt',
        0.0
      ),
      (
        gen_random_uuid(),
        admin_user_id,
        'Dealer Honda',
        8000000,
        0,
        'Cicilan Motor Honda Beat',
        CURRENT_DATE - INTERVAL '1 month',
        'paid',
        'debt',
        0.0
      )
      RETURNING id INTO debt1_id;
      
      -- Insert sample receivables (piutang)
      INSERT INTO public.debts (
        id, user_id, creditor_name, debtor_name, amount, remaining_amount, description, 
        due_date, status, type, interest_rate
      ) VALUES 
      (
        gen_random_uuid(),
        admin_user_id,
        'Sari Dewi',
        'Sari Dewi',
        3000000,
        1500000,
        'Pinjaman untuk Modal Warung',
        CURRENT_DATE + INTERVAL '8 months',
        'partial',
        'receivable',
        2.0
      ),
      (
        gen_random_uuid(),
        admin_user_id,
        'PT. Maju Jaya',
        'PT. Maju Jaya',
        5000000,
        5000000,
        'Uang Muka Project Website',
        CURRENT_DATE + INTERVAL '2 months',
        'pending',
        'receivable',
        0.0
      ),
      (
        gen_random_uuid(),
        admin_user_id,
        'Budi Santoso',
        'Budi Santoso',
        1200000,
        0,
        'Hutang Konsultasi IT',
        CURRENT_DATE - INTERVAL '15 days',
        'paid',
        'receivable',
        0.0
      )
      RETURNING id INTO receivable1_id;
      
      -- Add some sample payments to show partial status
      -- Get the debt IDs for partial payments
      SELECT id INTO debt1_id FROM debts WHERE user_id = admin_user_id AND creditor_name = 'Bank BCA';
      SELECT id INTO receivable1_id FROM debts WHERE user_id = admin_user_id AND creditor_name = 'Sari Dewi';
      
      -- Add payments for Bank BCA loan (3M paid from 15M)
      INSERT INTO public.debt_payments (debt_id, amount, payment_date, notes) VALUES 
      (debt1_id, 1500000, CURRENT_DATE - INTERVAL '3 months', 'Pembayaran cicilan bulan 1'),
      (debt1_id, 1500000, CURRENT_DATE - INTERVAL '2 months', 'Pembayaran cicilan bulan 2');
      
      -- Add payment for Sari Dewi receivable (1.5M received from 3M)
      INSERT INTO public.debt_payments (debt_id, amount, payment_date, notes) VALUES 
      (receivable1_id, 1500000, CURRENT_DATE - INTERVAL '1 month', 'Pembayaran pertama dari Sari');
      
      RAISE NOTICE '✅ Sample debt data created successfully!';
      RAISE NOTICE '📊 Created 6 sample debts/receivables with payments';
      RAISE NOTICE '💰 Includes: 3 debts (hutang) and 3 receivables (piutang)';
      RAISE NOTICE '📈 Status: paid, partial, and pending examples';
      
    ELSE
      RAISE NOTICE 'ℹ️  Sample debt data already exists for admin user';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  Admin user not found - please run database setup first';
  END IF;
  
END $$;