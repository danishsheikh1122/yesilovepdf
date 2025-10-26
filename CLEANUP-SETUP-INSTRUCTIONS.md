# Supabase Auto-Cleanup Setup Instructions

## Problem
Files uploaded to Supabase storage are set to expire after 1 hour, but they are not being automatically deleted.

## Solutions

You have **3 options** to set up automatic file cleanup:

---

### **Option 1: PostgreSQL Cron Job (Recommended)**

This is the cleanest solution and runs directly in Supabase's database.

**Steps:**

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the entire content of `supabase-auto-cleanup-setup.sql`
3. Run the script
4. Verify the cron job is created by running:
   ```sql
   SELECT * FROM cron.job WHERE jobname LIKE '%cleanup-processed%';
   ```

**What it does:**
- Runs every 15 minutes
- Deletes files older than 1 hour from `processed-files` bucket
- Logs cleanup activity

**Pros:**
- ✅ Completely automatic
- ✅ No external services needed
- ✅ Runs inside Supabase

**Cons:**
- ❌ Requires `pg_cron` extension (should be available in most Supabase projects)

---

### **Option 2: Supabase Edge Function + External Cron**

Use a Supabase Edge Function triggered by an external cron service.

**Steps:**

1. **Deploy the Edge Function:**
   ```bash
   cd /Users/danishsheikh/Desktop/yesilovepdf
   
   # Create the function
   mkdir -p supabase/functions/cleanup-old-files
   cp supabase-edge-function-cleanup.ts supabase/functions/cleanup-old-files/index.ts
   
   # Deploy
   supabase functions deploy cleanup-old-files
   ```

2. **Set up external cron trigger (choose one):**

   **Option A: EasyCron (Free)**
   - Go to https://www.easycron.com/
   - Create account
   - Add new cron job:
     - URL: `https://[your-project-ref].supabase.co/functions/v1/cleanup-old-files`
     - Schedule: `*/15 * * * *` (every 15 minutes)
     - Method: POST

   **Option B: Cron-job.org (Free)**
   - Go to https://cron-job.org/
   - Create account
   - Add new cron job with the same URL
   - Schedule: Every 15 minutes

**Pros:**
- ✅ Works even if pg_cron is not available
- ✅ Free external cron services available

**Cons:**
- ❌ Requires external service
- ❌ Two-step setup

---

### **Option 3: Next.js API Route + Vercel Cron**

If your app is deployed on Vercel, use Vercel Cron.

**Steps:**

1. **Create API route:** `app/api/cleanup-files/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data: files, error } = await supabase
    .storage
    .from('processed-files')
    .list()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const oldFiles = files.filter(f => new Date(f.created_at) < new Date(oneHourAgo))

  for (const file of oldFiles) {
    await supabase.storage.from('processed-files').remove([file.name])
  }

  return NextResponse.json({
    success: true,
    deletedCount: oldFiles.length,
    timestamp: new Date().toISOString()
  })
}
```

2. **Create `vercel.json` in project root:**

```json
{
  "crons": [{
    "path": "/api/cleanup-files",
    "schedule": "*/15 * * * *"
  }]
}
```

3. **Add environment variable:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `CRON_SECRET` = `your-random-secret-key`

**Pros:**
- ✅ Built into Vercel
- ✅ No external services
- ✅ Works automatically on deploy

**Cons:**
- ❌ Only works if deployed on Vercel
- ❌ Requires Vercel Pro plan for cron

---

## Testing

After setup, test manually:

```sql
-- Check files in bucket
SELECT name, created_at FROM storage.objects WHERE bucket_id = 'processed-files';

-- Manually run cleanup (Option 1)
SELECT cleanup_old_processed_files();

-- Check if files were deleted
SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'processed-files';
```

---

## Recommendation

**Use Option 1** (PostgreSQL Cron) if available. It's the simplest and most reliable.

If pg_cron is not available, use **Option 2** with EasyCron (free and works well).
