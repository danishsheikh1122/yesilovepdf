import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabaseServer'

const BUCKET_NAME = 'processed-files'
const FILE_RETENTION_HOURS = 1 // Delete files older than 1 hour

export async function GET(request: NextRequest) {
  try {
    // Verify the request is authorized (cron job secret)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const startTime = Date.now()
    const cutoffTime = Date.now() - (FILE_RETENTION_HOURS * 60 * 60 * 1000)
    
    console.log(`[Cleanup] Starting cleanup job at ${new Date().toISOString()}`)
    console.log(`[Cleanup] Deleting files older than ${new Date(cutoffTime).toISOString()}`)

    // List all files in the bucket
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listError) {
      console.error('[Cleanup] Error listing files:', listError)
      return NextResponse.json(
        { error: `Failed to list files: ${listError.message}` },
        { status: 500 }
      )
    }

    if (!files || files.length === 0) {
      console.log('[Cleanup] No files found in bucket')
      return NextResponse.json({
        success: true,
        message: 'No files to clean up',
        deletedCount: 0,
        executionTime: Date.now() - startTime,
      })
    }

    // Get all user folders
    const userFolders = files.filter(file => file.id === null) // Folders have no id
    const filesToDelete: string[] = []

    // List files in each user folder
    for (const folder of userFolders) {
      const { data: userFiles, error: userListError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list(folder.name, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'asc' }
        })

      if (userListError) {
        console.error(`[Cleanup] Error listing files in folder ${folder.name}:`, userListError)
        continue
      }

      if (!userFiles) continue

      // Filter files older than cutoff time
      for (const file of userFiles) {
        if (!file.created_at) continue
        
        const fileCreatedAt = new Date(file.created_at).getTime()
        
        if (fileCreatedAt < cutoffTime) {
          const filePath = `${folder.name}/${file.name}`
          filesToDelete.push(filePath)
          console.log(`[Cleanup] Marking for deletion: ${filePath} (created: ${file.created_at})`)
        }
      }
    }

    if (filesToDelete.length === 0) {
      console.log('[Cleanup] No files older than cutoff time')
      return NextResponse.json({
        success: true,
        message: 'No old files to delete',
        deletedCount: 0,
        executionTime: Date.now() - startTime,
      })
    }

    console.log(`[Cleanup] Found ${filesToDelete.length} files to delete`)

    // Delete files in batches
    const deleteResults = []
    const BATCH_SIZE = 100
    
    for (let i = 0; i < filesToDelete.length; i += BATCH_SIZE) {
      const batch = filesToDelete.slice(i, i + BATCH_SIZE)
      const { data: deleteData, error: deleteError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove(batch)

      if (deleteError) {
        console.error('[Cleanup] Error deleting batch:', deleteError)
        deleteResults.push({ success: false, error: deleteError.message, batch })
      } else {
        console.log(`[Cleanup] Successfully deleted batch of ${batch.length} files`)
        deleteResults.push({ success: true, count: batch.length, batch })
      }
    }

    const deletedCount = deleteResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.count || 0), 0)

    const executionTime = Date.now() - startTime

    console.log(`[Cleanup] Cleanup complete. Deleted ${deletedCount} files in ${executionTime}ms`)

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      deletedCount,
      totalFound: filesToDelete.length,
      executionTime,
      cutoffTime: new Date(cutoffTime).toISOString(),
      details: deleteResults,
    })
  } catch (error) {
    console.error('[Cleanup] Cleanup job error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
