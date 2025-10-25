# Supabase Storage Configuration Guide

This guide explains how to set up temporary file uploads to Supabase Storage for your PDF processing application.

## 1. Supabase Project Setup

If you don't have a Supabase project yet:

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Note down your project URL and anon key

## 2. Environment Variables

Add these environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your actual Supabase project credentials.

## 3. Storage Bucket Setup

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket called `processed-files`
4. Set the bucket to **public** (for easy access to download links)

### SQL Commands (Alternative Setup)

You can also run these SQL commands in the Supabase SQL editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('processed-files', 'processed-files', true);

-- Set up RLS policy for public access
CREATE POLICY "Public access for processed files" ON storage.objects
FOR ALL USING (bucket_id = 'processed-files');
```

## 4. Testing the Setup

Once configured, you can test the Supabase connection by visiting:
```
http://localhost:3000/api/test-supabase
```

This will check if your Supabase Storage is properly configured.

## 5. How It Works

### File Upload Process

1. When a file is processed (PDF merge, compress, etc.), the system:
   - Checks if the file is ≤ 50MB
   - If yes, uploads to Supabase Storage with a 1-hour cache
   - Generates a public download URL
   - Schedules automatic deletion after 1 hour

2. Users see:
   - A "Download from Cloud" button if upload succeeded
   - A warning message if file was too large (>50MB)
   - Direct download option as fallback

### Security Features

- Files are automatically deleted after 1 hour
- 50MB size limit prevents abuse
- Unique filenames prevent conflicts
- Public URLs expire based on cache settings

### Modified API Routes

The following API routes now include Supabase upload:

- `/api/merge` - PDF merging
- `/api/compress` - PDF compression  
- `/api/split` - PDF splitting (creates ZIP files)

More routes can be easily added by importing and using the `uploadToSupabaseIfEligible` function.

## 6. Production Considerations

### Automatic Cleanup

The current implementation uses `setTimeout` for file deletion, which works for development but may not be reliable in serverless environments.

For production, consider:

1. **Supabase Edge Functions** for scheduled cleanup
2. **Vercel Cron Jobs** if using Vercel
3. **AWS Lambda scheduled functions**
4. **Database triggers** with cleanup jobs

### Rate Limiting

Consider adding rate limiting to prevent abuse:

```javascript
// Example rate limiting logic
const uploadCount = await getUploadCountForIP(userIP);
if (uploadCount > 10) {
  return { error: "Too many uploads. Please try again later." };
}
```

### Monitoring

Monitor your Supabase Storage usage:
- Storage space consumed
- Number of files uploaded
- Failed uploads
- Cleanup effectiveness

## 7. Customization

### File Size Limits

Change the 50MB limit in `lib/supabaseFileUpload.ts`:

```typescript
const MAX_SIZE = 100 * 1024 * 1024; // 100MB
```

### Retention Period

Change the 1-hour retention in `lib/supabaseFileUpload.ts`:

```typescript
const TWO_HOURS = 2 * 3600 * 1000; // 2 hours
setTimeout(async () => {
  // deletion logic
}, TWO_HOURS);
```

### Bucket Configuration

Use private buckets with signed URLs for enhanced security:

```typescript
// In supabaseFileUpload.ts
const { data } = await supabase.storage
  .from('processed-files')
  .createSignedUrl(filePath, 3600); // 1 hour expiry
```

## 8. Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check your `.env.local` file
   - Restart your development server

2. **"Upload failed: Storage bucket not found"**
   - Create the `processed-files` bucket in Supabase dashboard
   - Ensure bucket name matches exactly

3. **"Permission denied"**
   - Check bucket is set to public
   - Verify RLS policies allow access

4. **Files not being deleted**
   - Check browser console for deletion errors
   - Verify bucket permissions allow delete operations

### Debug Mode

Enable debug logging by adding this to your environment:

```env
DEBUG_SUPABASE_UPLOAD=true
```

This will show detailed upload and deletion logs in the console.