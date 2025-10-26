import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/utils/supabaseClient'

const BUCKET_NAME = 'processed-files'
const SIGNED_URL_EXPIRES_IN = 3600 // 1 hour in seconds

export async function GET(request: NextRequest) {
  try {
    // Get file path from query parameters
    const searchParams = request.nextUrl.searchParams
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to download files.' },
        { status: 401 }
      )
    }

    // Verify the file belongs to the authenticated user
    if (!filePath.startsWith(user.id + '/')) {
      return NextResponse.json(
        { error: 'Access denied. You can only download your own files.' },
        { status: 403 }
      )
    }

    // Create a signed URL for download
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRES_IN)

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
      return NextResponse.json(
        { error: `Failed to generate download link: ${signedUrlError.message}` },
        { status: 500 }
      )
    }

    if (!signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrlData.signedUrl)
  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
