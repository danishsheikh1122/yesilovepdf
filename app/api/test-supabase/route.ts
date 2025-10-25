import { NextResponse } from 'next/server'
import { checkStorageBucket } from '@/lib/supabaseFileUpload'

export async function GET() {
  try {
    const bucketStatus = await checkStorageBucket()
    
    return NextResponse.json({
      success: bucketStatus.accessible,
      message: bucketStatus.accessible 
        ? 'Supabase Storage is properly configured and accessible!'
        : `Supabase Storage error: ${bucketStatus.error}`,
      error: bucketStatus.error,
      details: bucketStatus.details,
      timestamp: new Date().toISOString(),
      instructions: bucketStatus.accessible 
        ? null 
        : {
          step1: 'Go to your Supabase dashboard > Storage',
          step2: 'Run the SQL script in supabase-storage-setup.sql',
          step3: 'Ensure bucket "processed-files" exists and is public',
          step4: 'Check that RLS policies allow public uploads',
          sqlScript: '/supabase-storage-setup.sql'
        }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to check Supabase Storage',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}