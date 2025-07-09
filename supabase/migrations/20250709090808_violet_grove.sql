/*
  # Update User Profiles Table with Additional Fields
  
  1. New Fields
    - `occupation` (text) - Pekerjaan pengguna
    - `phone` (text) - Nomor telepon
    - `location` (text) - Lokasi/alamat
    - `bio` (text) - Biografi singkat
    
  2. Security
    - Update RLS policies to include new fields
*/

-- Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS occupation text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS bio text;

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ User profiles table updated successfully!';
  RAISE NOTICE '📋 New fields added: occupation, phone, location, bio';
  RAISE NOTICE '🔒 RLS policies updated';
END $$;