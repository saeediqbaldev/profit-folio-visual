-- Create trade_screenshots storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trade_screenshots',
  'trade_screenshots',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
);

-- Allow authenticated users to upload their own trade screenshots
CREATE POLICY "Users can upload their own trade screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade_screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own trade screenshots
CREATE POLICY "Users can view their own trade screenshots"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade_screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to trade screenshots (since bucket is public)
CREATE POLICY "Public can view trade screenshots"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'trade_screenshots');

-- Allow authenticated users to update their own trade screenshots
CREATE POLICY "Users can update their own trade screenshots"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trade_screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own trade screenshots
CREATE POLICY "Users can delete their own trade screenshots"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade_screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);