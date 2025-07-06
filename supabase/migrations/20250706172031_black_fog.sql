/*
  # Create Admin User

  1. Insert admin user ke auth.users
  2. Create profile untuk admin user
  3. Set admin privileges (optional)
  
  Note: Password akan di-hash otomatis oleh Supabase
*/

-- Insert admin user ke auth.users table
-- Password: admin123 (akan di-hash otomatis)
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
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@akuntansi.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Administrator", "role": "admin"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Get the admin user ID
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@akuntansi.com';
  
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
  
  -- Insert sample admin transactions
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
    notes
  ) VALUES 
  (
    admin_user_id,
    5000000,
    'Gaji Bulanan',
    'Gaji',
    'Gaji Pokok',
    'income',
    CURRENT_DATE,
    'bank_transfer',
    ARRAY['gaji', 'rutin'],
    'Gaji bulan ini'
  ),
  (
    admin_user_id,
    150000,
    'Makan Siang',
    'Makanan & Minuman',
    'Restoran',
    'expense',
    CURRENT_DATE,
    'cash',
    ARRAY['makan', 'harian'],
    'Makan siang di restoran'
  ),
  (
    admin_user_id,
    50000,
    'Bensin Motor',
    'Transportasi',
    'Bensin',
    'expense',
    CURRENT_DATE - INTERVAL '1 day',
    'cash',
    ARRAY['transportasi', 'bensin'],
    'Isi bensin motor'
  ),
  (
    admin_user_id,
    200000,
    'Belanja Groceries',
    'Belanja',
    'Groceries',
    'expense',
    CURRENT_DATE - INTERVAL '2 days',
    'debit_card',
    ARRAY['belanja', 'kebutuhan'],
    'Belanja kebutuhan sehari-hari'
  ),
  (
    admin_user_id,
    100000,
    'Listrik PLN',
    'Tagihan',
    'Listrik',
    'expense',
    CURRENT_DATE - INTERVAL '3 days',
    'bank_transfer',
    ARRAY['tagihan', 'rutin'],
    'Bayar tagihan listrik bulan ini'
  );
  
  -- Insert sample budgets
  INSERT INTO public.budgets (
    user_id,
    category,
    amount,
    period
  ) VALUES 
  (
    admin_user_id,
    'Makanan & Minuman',
    1500000,
    'monthly'
  ),
  (
    admin_user_id,
    'Transportasi',
    800000,
    'monthly'
  ),
  (
    admin_user_id,
    'Belanja',
    1000000,
    'monthly'
  ),
  (
    admin_user_id,
    'Tagihan',
    500000,
    'monthly'
  );
  
  -- Insert sample financial goals
  INSERT INTO public.financial_goals (
    user_id,
    title,
    target_amount,
    current_amount,
    deadline,
    category,
    priority
  ) VALUES 
  (
    admin_user_id,
    'Dana Darurat',
    15000000,
    5000000,
    CURRENT_DATE + INTERVAL '12 months',
    'Dana Darurat',
    'high'
  ),
  (
    admin_user_id,
    'Liburan Bali',
    8000000,
    2000000,
    CURRENT_DATE + INTERVAL '6 months',
    'Liburan',
    'medium'
  ),
  (
    admin_user_id,
    'Laptop Baru',
    12000000,
    3000000,
    CURRENT_DATE + INTERVAL '8 months',
    'Gadget',
    'medium'
  );
  
END $$;