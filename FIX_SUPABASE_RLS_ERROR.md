# 🚨 Fix Supabase Storage RLS Error

You're getting a "row-level security policy" error because Supabase Storage needs proper permissions to allow file uploads. Here's how to fix it:

## Step 1: Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar

## Step 2: Create Storage Bucket (if not exists)

1. Click **"New Bucket"**
2. Set **Bucket name**: `processed-files`
3. Enable **"Public bucket"** ✅
4. Set **File size limit**: `50MB` (52428800 bytes)
5. Click **"Create bucket"**

## Step 3: Set Up RLS Policies

1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the entire content from `supabase-storage-setup.sql`
3. Click **"Run"** to execute the SQL script

### Alternative: Manual Policy Setup

If you prefer to set up policies manually:

1. Go to **Storage** → **Policies**
2. Create these 3 policies for the `processed-files` bucket:

**Policy 1: Allow Uploads**
```sql
CREATE POLICY "Allow public uploads to processed-files bucket" ON storage.objects
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'processed-files');
```

**Policy 2: Allow Downloads**
```sql
CREATE POLICY "Allow public downloads from processed-files bucket" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'processed-files');
```

**Policy 3: Allow Deletions (for cleanup)**
```sql
CREATE POLICY "Allow public deletes from processed-files bucket" ON storage.objects
FOR DELETE 
TO public
USING (bucket_id = 'processed-files');
```

## Step 4: Verify Setup

1. Visit: `http://localhost:3000/api/test-supabase`
2. You should see: `"success": true`
3. If still failing, check the response for specific error details

## Step 5: Test File Upload

1. Try processing a small PDF file (under 50MB)
2. Check if you see the Supabase upload status in the UI
3. Look for the cloud download link after processing

## Troubleshooting

### ❌ Still getting RLS errors?

1. **Check bucket exists**: Make sure `processed-files` bucket exists in Storage
2. **Verify policies**: Go to Storage → Policies and ensure the 3 policies are created
3. **Check bucket permissions**: Ensure bucket is set to "public"
4. **Clear cache**: Restart your development server

### ❌ Bucket not found error?

1. Create the bucket manually in Supabase dashboard
2. Set it to public
3. Run the SQL script to create policies

### ❌ Environment variables?

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Quick Test Command

After setup, test with:
```bash
curl http://localhost:3000/api/test-supabase
```

Expected response:
```json
{
  "success": true,
  "message": "Supabase Storage is properly configured and accessible!"
}
```

## 🎉 Once Fixed

After running the SQL script, your file uploads should work automatically! Files will be:
- ✅ Uploaded to Supabase Storage (if ≤ 50MB)
- ✅ Available via cloud download link
- ✅ Automatically deleted after 1 hour
- ✅ Fall back to direct download if too large