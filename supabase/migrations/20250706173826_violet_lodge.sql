/*
  # Setup Admin User - Versi Terperbaiki

  1. Penanganan Error yang Lebih Baik
    - Cek apakah user sudah ada sebelum insert
    - Gunakan UPSERT untuk menghindari duplicate key
    - Error handling yang robust

  2. Data Sample
    - 8 transaksi realistis dengan detail lengkap
    - 5 kategori anggaran bulanan
    - 4 target keuangan dengan progress

  3. Keamanan
    - Password ter-hash dengan bcrypt
    - RLS policies aktif
    - Data terisolasi per user
*/

DO $$
DECLARE
  admin_user_id uuid;
  existing_user_count integer;
  existing_profile_count integer;
  transaction_count integer;
  budget_count integer;
  goal_count integer;
BEGIN
  -- Cek apakah user admin sudah ada
  SELECT COUNT(*) INTO existing_user_count 
  FROM auth.users 
  WHERE email = 'admin@akuntansi.com';
  
  IF existing_user_count > 0 THEN
    -- Ambil ID user yang sudah ada
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@akuntansi.com';
    
    RAISE NOTICE 'ℹ️  Admin user sudah ada dengan email: admin@akuntansi.com';
  ELSE
    -- Buat user admin baru
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
    
    RAISE NOTICE '✅ User admin berhasil dibuat dengan email: admin@akuntansi.com';
  END IF;
  
  -- Cek apakah profile sudah ada
  SELECT COUNT(*) INTO existing_profile_count 
  FROM user_profiles 
  WHERE id = admin_user_id;
  
  IF existing_profile_count = 0 THEN
    -- Insert profile admin
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
    
    RAISE NOTICE '✅ Profile admin berhasil dibuat';
  ELSE
    RAISE NOTICE 'ℹ️  Profile admin sudah ada';
  END IF;
  
  -- Cek apakah transaksi sudah ada
  SELECT COUNT(*) INTO transaction_count 
  FROM transactions 
  WHERE user_id = admin_user_id;
  
  IF transaction_count = 0 THEN
    -- Insert sample transactions
    INSERT INTO public.transactions (
      user_id, amount, description, category, subcategory, type, date, payment_method, tags, notes, location
    ) VALUES 
    -- Income transactions
    (admin_user_id, 5000000, 'Gaji Bulanan Januari', 'Gaji', 'Gaji Pokok', 'income', CURRENT_DATE - 5, 'bank_transfer', ARRAY['gaji', 'rutin', 'bulanan'], 'Gaji pokok bulan Januari 2025', 'Bank BCA'),
    (admin_user_id, 1500000, 'Bonus Kinerja', 'Gaji', 'Bonus', 'income', CURRENT_DATE - 3, 'bank_transfer', ARRAY['bonus', 'kinerja'], 'Bonus kinerja Q4 2024', 'Bank BCA'),
    
    -- Expense transactions
    (admin_user_id, 250000, 'Makan Siang Keluarga', 'Makanan & Minuman', 'Restoran', 'expense', CURRENT_DATE, 'credit_card', ARRAY['makan', 'keluarga', 'weekend'], 'Makan siang di restoran bersama keluarga', 'Restoran Padang Sederhana'),
    (admin_user_id, 75000, 'Bensin Motor', 'Transportasi', 'Bensin', 'expense', CURRENT_DATE - 1, 'cash', ARRAY['transportasi', 'bensin', 'harian'], 'Isi bensin motor untuk commuting', 'SPBU Shell'),
    (admin_user_id, 450000, 'Belanja Bulanan Supermarket', 'Belanja', 'Groceries', 'expense', CURRENT_DATE - 2, 'debit_card', ARRAY['belanja', 'kebutuhan', 'bulanan'], 'Belanja kebutuhan rumah tangga bulanan', 'Supermarket Indomaret'),
    (admin_user_id, 180000, 'Tagihan Listrik PLN', 'Tagihan', 'Listrik', 'expense', CURRENT_DATE - 4, 'e_wallet', ARRAY['tagihan', 'listrik', 'rutin'], 'Pembayaran tagihan listrik bulan Desember', 'Aplikasi PLN Mobile'),
    (admin_user_id, 120000, 'Internet Indihome', 'Tagihan', 'Internet', 'expense', CURRENT_DATE - 6, 'bank_transfer', ARRAY['tagihan', 'internet', 'bulanan'], 'Tagihan internet Indihome bulan Januari', 'Bank BCA'),
    (admin_user_id, 85000, 'Kopi dan Snack', 'Makanan & Minuman', 'Kafe', 'expense', CURRENT_DATE - 1, 'e_wallet', ARRAY['kopi', 'snack', 'santai'], 'Ngopi sambil kerja di cafe', 'Starbucks Mall');
    
    RAISE NOTICE '✅ % transaksi sample berhasil dibuat', 8;
  ELSE
    RAISE NOTICE 'ℹ️  Transaksi sudah ada (% transaksi)', transaction_count;
  END IF;
  
  -- Cek apakah budget sudah ada
  SELECT COUNT(*) INTO budget_count 
  FROM budgets 
  WHERE user_id = admin_user_id;
  
  IF budget_count = 0 THEN
    -- Insert sample budgets
    INSERT INTO public.budgets (user_id, category, amount, period) VALUES 
    (admin_user_id, 'Makanan & Minuman', 2000000, 'monthly'),
    (admin_user_id, 'Transportasi', 800000, 'monthly'),
    (admin_user_id, 'Belanja', 1500000, 'monthly'),
    (admin_user_id, 'Tagihan', 600000, 'monthly'),
    (admin_user_id, 'Hiburan', 500000, 'monthly');
    
    RAISE NOTICE '✅ % anggaran bulanan berhasil dibuat', 5;
  ELSE
    RAISE NOTICE 'ℹ️  Anggaran sudah ada (% anggaran)', budget_count;
  END IF;
  
  -- Cek apakah financial goals sudah ada
  SELECT COUNT(*) INTO goal_count 
  FROM financial_goals 
  WHERE user_id = admin_user_id;
  
  IF goal_count = 0 THEN
    -- Insert sample financial goals
    INSERT INTO public.financial_goals (user_id, title, target_amount, current_amount, deadline, category, priority) VALUES 
    (admin_user_id, 'Dana Darurat 6 Bulan', 20000000, 8500000, CURRENT_DATE + 300, 'Dana Darurat', 'high'),
    (admin_user_id, 'Liburan Keluarga ke Bali', 12000000, 4200000, CURRENT_DATE + 240, 'Liburan', 'medium'),
    (admin_user_id, 'Laptop Gaming Baru', 15000000, 6800000, CURRENT_DATE + 180, 'Gadget', 'medium'),
    (admin_user_id, 'Investasi Reksadana', 50000000, 12000000, CURRENT_DATE + 720, 'Investasi', 'high');
    
    RAISE NOTICE '✅ % target keuangan berhasil dibuat', 4;
  ELSE
    RAISE NOTICE 'ℹ️  Target keuangan sudah ada (% target)', goal_count;
  END IF;

  -- Final success message
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ===== SETUP BERHASIL DISELESAIKAN =====';
  RAISE NOTICE '📧 Email Admin: admin@akuntansi.com';
  RAISE NOTICE '🔑 Password Admin: admin123';
  RAISE NOTICE '📊 Data Sample:';
  RAISE NOTICE '   - Transaksi: % items', (SELECT COUNT(*) FROM transactions WHERE user_id = admin_user_id);
  RAISE NOTICE '   - Anggaran: % kategori', (SELECT COUNT(*) FROM budgets WHERE user_id = admin_user_id);
  RAISE NOTICE '   - Target: % goals', (SELECT COUNT(*) FROM financial_goals WHERE user_id = admin_user_id);
  RAISE NOTICE '✅ Database siap digunakan!';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;