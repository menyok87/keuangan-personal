/*
  # Disable Email Confirmation untuk Pendaftaran

  1. Update auth settings untuk disable email confirmation
  2. Set semua user yang ada menjadi confirmed
  3. Pastikan user baru langsung confirmed
*/

-- Update existing users to be confirmed (if any)
UPDATE auth.users 
SET email_confirmed_at = created_at 
WHERE email_confirmed_at IS NULL;

-- Create function to auto-confirm new users
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  -- Auto confirm email for new users
  NEW.email_confirmed_at = NEW.created_at;
  NEW.confirmation_token = '';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;

-- Create trigger to auto-confirm new users
CREATE TRIGGER auto_confirm_user_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.auto_confirm_user();

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user profile with error handling
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', user_profiles.full_name),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the user creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Email confirmation disabled successfully!';
  RAISE NOTICE '📧 New users will be auto-confirmed';
  RAISE NOTICE '🔧 Existing users have been confirmed';
  RAISE NOTICE '🚀 Registration now works without email confirmation';
END $$;