-- Supabase Storage Setup for Temporary File Uploads
-- Run these commands in your Supabase SQL Editor

-- 1. Create the storage bucket for processed files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'processed-files', 
  'processed-files', 
  true, 
  52428800, -- 50MB in bytes
  ARRAY['application/pdf', 'application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

-- 2. Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy to allow anyone to upload files to the processed-files bucket
CREATE POLICY "Allow public uploads to processed-files bucket" ON storage.objects
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'processed-files');

-- 4. Create policy to allow anyone to read files from the processed-files bucket
CREATE POLICY "Allow public downloads from processed-files bucket" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'processed-files');

-- 5. Create policy to allow anyone to delete files from the processed-files bucket (for cleanup)
CREATE POLICY "Allow public deletes from processed-files bucket" ON storage.objects
FOR DELETE 
TO public
USING (bucket_id = 'processed-files');

-- 6. Optional: Create a function to automatically clean up old files
CREATE OR REPLACE FUNCTION cleanup_old_processed_files()
RETURNS void AS $$
BEGIN
  -- Delete files older than 2 hours from processed-files bucket
  DELETE FROM storage.objects 
  WHERE bucket_id = 'processed-files' 
  AND created_at < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Optional: Create a cron job to run cleanup every hour
-- Note: You need to enable the pg_cron extension first
-- SELECT cron.schedule('cleanup-processed-files', '0 * * * *', 'SELECT cleanup_old_processed_files();');

-- Verify the setup
SELECT 
  'Bucket created' as status,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'processed-files';

-- Check policies
SELECT 
  'Policies created' as status,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%processed-files%';