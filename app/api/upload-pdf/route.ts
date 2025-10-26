import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/utils/supabaseClient'
import QRCode from 'qrcode'

const BUCKET_NAME = 'processed-files'
const SIGNED_URL_EXPIRES_IN = 3600 // 1 hour in seconds

export async function POST(request: NextRequest) {
  try {
    // Get the file from the request
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to upload files.' },
        { status: 401 }
      )
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${sanitizedFileName}`
    const filePath = `${user.id}/${fileName}`

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
        cacheControl: '3600', // 1 hour
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Create a signed URL valid for 1 hour
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

    // Generate download URL for QR code (using our API route)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const downloadUrl = `${baseUrl}/api/download-pdf?path=${encodeURIComponent(filePath)}`

    // Generate QR code as data URL
    let qrCodeDataUrl: string
    try {
      qrCodeDataUrl = await QRCode.toDataURL(downloadUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2,
      })
    } catch (qrError) {
      console.error('QR code generation error:', qrError)
      return NextResponse.json(
        { error: 'Failed to generate QR code' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        fileName: sanitizedFileName,
        filePath,
        downloadUrl,
        signedUrl: signedUrlData.signedUrl,
        qrCode: qrCodeDataUrl,
        expiresAt: new Date(Date.now() + SIGNED_URL_EXPIRES_IN * 1000).toISOString(),
        expiresInSeconds: SIGNED_URL_EXPIRES_IN,
      },
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
