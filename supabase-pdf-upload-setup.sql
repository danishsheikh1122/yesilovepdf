-- ============================================
-- Supabase Storage Setup for PDF Upload with QR Code
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard: https://app.supabase.com/project/YOUR_PROJECT/sql

-- ============================================
-- 1. Create the Storage Bucket
-- ============================================
-- Note: You can also create this bucket via the Supabase Dashboard
-- Storage > New Bucket > Name: "processed-files" > Public: No

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'processed-files',
  'processed-files',
  false, -- Not public, requires authentication
  52428800, -- 50MB file size limit
  ARRAY['application/pdf']::text[] -- Only allow PDF files
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. Enable Row Level Security (RLS)
-- ============================================
-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS Policies for Authenticated Users
-- ============================================

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'processed-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own files
CREATE POLICY "Users can read their own PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'processed-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files (optional)
CREATE POLICY "Users can update their own PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'processed-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files (optional)
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'processed-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 4. Service Role Access (for cleanup)
-- ============================================
-- The service role key bypasses RLS, so no additional policies needed
-- This allows the cleanup cron job to delete any file

-- ============================================
-- 5. Optional: Create a tracking table for uploads
-- ============================================
CREATE TABLE IF NOT EXISTS public.pdf_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on tracking table
ALTER TABLE public.pdf_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own upload records
CREATE POLICY "Users can insert their own upload records"
ON public.pdf_uploads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read their own upload records
CREATE POLICY "Users can read their own upload records"
ON public.pdf_uploads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own upload records
CREATE POLICY "Users can update their own upload records"
ON public.pdf_uploads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_user_id ON public.pdf_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_expires_at ON public.pdf_uploads(expires_at);

-- ============================================
-- 6. Verification Queries
-- ============================================
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'processed-files';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- List all files in bucket (as admin)
-- SELECT * FROM storage.objects WHERE bucket_id = 'processed-files';

-- ============================================
-- 7. Optional: Function to auto-delete expired uploads
-- ============================================
CREATE OR REPLACE FUNCTION delete_expired_uploads()
RETURNS void AS $$
BEGIN
  DELETE FROM public.pdf_uploads
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. Make sure to set up authentication in your app
-- 2. Get your service role key from: Dashboard > Settings > API
-- 3. Never expose the service role key in client-side code
-- 4. The service role key is only used server-side for cleanup
-- 5. Signed URLs work even with RLS because they include auth token
