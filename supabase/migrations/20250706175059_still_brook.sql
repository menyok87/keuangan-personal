-- ========================================
-- FIX EMAIL CONFIRMATION ISSUES
-- ========================================

-- 1. Update all existing users to be confirmed
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, created_at),
  confirmation_token = ''
WHERE email_confirmed_at IS NULL OR confirmation_token IS NOT NULL;

-- 2. Create or replace function to auto-confirm users
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  -- Auto confirm email for all new users
  NEW.email_confirmed_at = NEW.created_at;
  NEW.confirmation_token = '';
  NEW.email_change_token_new = '';
  NEW.recovery_token = '';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;

-- 4. Create trigger to auto-confirm new users
CREATE TRIGGER auto_confirm_user_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.auto_confirm_user();

-- 5. Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user profile with better error handling
  INSERT INTO public.user_profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', user_profiles.full_name),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recreate the user creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Ensure admin user is properly confirmed
DO $$
DECLARE
  admin_count integer;
BEGIN
  -- Check if admin user exists and update if needed
  SELECT COUNT(*) INTO admin_count 
  FROM auth.users 
  WHERE email = 'admin@akuntansi.com';
  
  IF admin_count > 0 THEN
    UPDATE auth.users 
    SET 
      email_confirmed_at = created_at,
      confirmation_token = '',
      email_change_token_new = '',
      recovery_token = ''
    WHERE email = 'admin@akuntansi.com';
    
    RAISE NOTICE '✅ Admin user confirmed and ready';
  ELSE
    RAISE NOTICE '⚠️  Admin user not found - please run database setup first';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 EMAIL CONFIRMATION FIXED!';
  RAISE NOTICE '📧 All users can now register without email confirmation';
  RAISE NOTICE '🔧 Existing users have been auto-confirmed';
  RAISE NOTICE '🚀 Registration should work smoothly now';
  RAISE NOTICE '';
  
END $$;