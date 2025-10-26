// Supabase Edge Function for Automatic File Cleanup
// Deploy this as a Supabase Edge Function
// Then set up a cron trigger to call it every 15 minutes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Verify this is a legitimate request (optional: add authentication)
    const authHeader = req.headers.get('Authorization')
    
    // You can set a secret key in your Supabase environment variables
    // const CRON_SECRET = Deno.env.get('CRON_SECRET')
    // if (authHeader !== `Bearer ${CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 })
    // }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate the cutoff time (1 hour ago)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // List files in the processed-files bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from('processed-files')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listError) {
      console.error('Error listing files:', listError)
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Filter files older than 1 hour
    const oldFiles = files.filter(file => {
      const createdAt = new Date(file.created_at)
      return createdAt < new Date(oneHourAgo)
    })

    console.log(`Found ${oldFiles.length} files older than 1 hour`)

    // Delete old files
    let deletedCount = 0
    let errors = []

    for (const file of oldFiles) {
      const { error: deleteError } = await supabase
        .storage
        .from('processed-files')
        .remove([file.name])

      if (deleteError) {
        console.error(`Error deleting ${file.name}:`, deleteError)
        errors.push({ file: file.name, error: deleteError.message })
      } else {
        deletedCount++
        console.log(`Deleted: ${file.name}`)
      }
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      totalFiles: files.length,
      oldFiles: oldFiles.length,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    }

    console.log('Cleanup completed:', response)

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Cleanup function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

/* 
DEPLOYMENT INSTRUCTIONS:

1. Create the edge function:
   supabase functions new cleanup-old-files

2. Copy this code to: supabase/functions/cleanup-old-files/index.ts

3. Deploy the function:
   supabase functions deploy cleanup-old-files

4. Set up a cron job to call this function every 15 minutes:
   - Go to: https://console.cron-job.org/
   - Or use: https://cron-job.org/en/
   - Or use Vercel Cron (if your app is on Vercel)
   
   URL to call: https://[your-project-ref].supabase.co/functions/v1/cleanup-old-files
   
5. Alternative: Use GitHub Actions to trigger this every 15 minutes
   Create .github/workflows/cleanup-files.yml:

   name: Cleanup Old Files
   on:
     schedule:
       - cron: '*/15 * * * *'  # Every 15 minutes
   jobs:
     cleanup:
       runs-on: ubuntu-latest
       steps:
         - name: Call cleanup function
           run: |
             curl -X POST https://[your-project-ref].supabase.co/functions/v1/cleanup-old-files \
               -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
*/
