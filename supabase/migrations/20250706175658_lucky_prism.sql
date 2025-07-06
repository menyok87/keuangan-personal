-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid()::text = (storage.filename(name))[1:36]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid()::text = (storage.filename(name))[1:36]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid()::text = (storage.filename(name))[1:36]
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Avatar storage bucket created successfully!';
  RAISE NOTICE '📁 Bucket: avatars (public, 5MB limit)';
  RAISE NOTICE '🔒 Policies: Users can only manage their own avatars';
  RAISE NOTICE '📷 Supported formats: JPEG, PNG, GIF, WebP';
END $$;