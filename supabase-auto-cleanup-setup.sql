-- Supabase Automatic File Cleanup Setup
-- This script sets up automatic deletion of files older than 1 hour
-- Run these commands in your Supabase SQL Editor

-- 1. First, enable the pg_cron extension (if not already enabled)
-- This needs to be done by a Supabase admin
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create or replace the cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_processed_files()
RETURNS void AS $$
BEGIN
  -- Delete files older than 1 hour from processed-files bucket
  DELETE FROM storage.objects 
  WHERE bucket_id = 'processed-files' 
  AND created_at < NOW() - INTERVAL '1 hour';
  
  -- Log the cleanup
  RAISE NOTICE 'Cleaned up old files from processed-files bucket at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule the cleanup job to run every 15 minutes
-- This ensures files are deleted promptly after they expire
SELECT cron.schedule(
  'cleanup-processed-files-every-15min',  -- Job name
  '*/15 * * * *',                         -- Cron expression: every 15 minutes
  'SELECT cleanup_old_processed_files();' -- SQL to execute
);

-- 4. Alternative: Run cleanup every hour (less frequent)
-- Uncomment this if you prefer hourly cleanup instead
-- SELECT cron.schedule(
--   'cleanup-processed-files-hourly',
--   '0 * * * *',  -- At minute 0 of every hour
--   'SELECT cleanup_old_processed_files();'
-- );

-- 5. Check if the cron job was created successfully
SELECT * FROM cron.job WHERE jobname LIKE '%cleanup-processed%';

-- 6. Manually test the cleanup function
-- Run this to test if the function works
-- SELECT cleanup_old_processed_files();

-- 7. Check how many files would be deleted
SELECT 
  COUNT(*) as files_to_delete,
  bucket_id,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_old_file
FROM storage.objects 
WHERE bucket_id = 'processed-files' 
AND created_at < NOW() - INTERVAL '1 hour'
GROUP BY bucket_id;

-- 8. To remove the cron job (if needed)
-- SELECT cron.unschedule('cleanup-processed-files-every-15min');

-- 9. View all scheduled cron jobs
-- SELECT * FROM cron.job;

-- 10. View cron job run history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
