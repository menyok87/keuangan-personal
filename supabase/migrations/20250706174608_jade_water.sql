/*
  # Create Admin User - Fixed Version

  1. Admin User Creation
    - Email: admin@akuntansi.com
    - Password: admin123 (hashed with bcrypt)
    - Auto-verified email
    - Full profile setup

  2. Sample Data
    - 8 realistic transactions (income & expense)
    - 5 monthly budgets with categories
    - 4 financial goals with progress

  3. Security
    - Proper RLS policies
    - User data isolation
    - Secure password hashing
*/

DO $$
DECLARE
  admin_user_id uuid;
  existing_count integer;
BEGIN
  -- Check if admin user already exists
  SELECT COUNT(*) INTO existing_count 
  FROM auth.users 
  WHERE email = 'admin@akuntansi.com';
  
  IF existing_count = 0 THEN
    -- Generate new UUID for admin user
    admin_user_id := gen_random_uuid();
    
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
      crypt('admin123', gen_salt('bf')),
      now(), -- Email confirmed immediately
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Administrator"}',
      false,
      'authenticated',
      'authenticated',
      '', -- Empty confirmation token (already confirmed)
      '',
      ''
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
    );
    
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
    );
    
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
    );

    -- Output success message
    RAISE NOTICE '✅ Admin user created successfully!';
    RAISE NOTICE '📧 Email: admin@akuntansi.com';
    RAISE NOTICE '🔑 Password: admin123';
    RAISE NOTICE '📊 Sample data: % transactions, % budgets, % goals', 
      (SELECT COUNT(*) FROM transactions WHERE user_id = admin_user_id),
      (SELECT COUNT(*) FROM budgets WHERE user_id = admin_user_id),
      (SELECT COUNT(*) FROM financial_goals WHERE user_id = admin_user_id);

  ELSE
    RAISE NOTICE '⚠️  Admin user already exists with email: admin@akuntansi.com';
    RAISE NOTICE '🔑 You can login with: admin@akuntansi.com / admin123';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Error creating admin user: %', SQLERRM;
END $$;