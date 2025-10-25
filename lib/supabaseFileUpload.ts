import { supabase } from '@/utils/supabaseClient'

export interface UploadResult {
  publicUrl: string | null
  error: string | null
  fileSize: number
  uploaded: boolean
}

/**
 * Upload processed file to Supabase Storage with automatic deletion after 1 hour
 * @param file - File object or Buffer to upload
 * @param fileName - Name for the file in storage
 * @param originalFileName - Original filename for logging
 * @returns Promise with upload result
 */
export async function uploadToSupabaseIfEligible(
  file: File | Buffer | Uint8Array,
  fileName: string,
  originalFileName?: string
): Promise<UploadResult> {
  try {
    // Determine file size
    let fileSize: number
    let fileData: File | Uint8Array

    if (file instanceof File) {
      fileSize = file.size
      fileData = file
    } else if (Buffer.isBuffer(file)) {
      fileSize = file.length
      fileData = new Uint8Array(file)
    } else {
      fileSize = file.length
      fileData = file
    }

    console.log(`Processing file upload: ${originalFileName || fileName}, size: ${fileSize} bytes`)

    // Check file size limit (50MB)
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB in bytes
    if (fileSize > MAX_SIZE) {
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(2)
      console.warn(`File too large (${sizeMB}MB > 50MB). Skipping upload.`)
      return {
        publicUrl: null,
        error: `File size exceeds 50MB (${sizeMB}MB). Please download directly instead of cloud upload.`,
        fileSize,
        uploaded: false
      }
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}_${fileName}`
    const filePath = `ready/${uniqueFileName}`

    console.log(`Uploading to Supabase: ${filePath}`)

    // Determine content type based on file extension
    let contentType = 'application/pdf'
    if (fileName.toLowerCase().endsWith('.zip')) {
      contentType = 'application/zip'
    } else if (fileName.toLowerCase().endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (fileName.toLowerCase().endsWith('.pptx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    } else if (fileName.toLowerCase().endsWith('.xlsx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    console.log(`Attempting upload with content-type: ${contentType}`)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('processed-files')
      .upload(filePath, fileData, {
        cacheControl: '3600', // cache for 1 hour
        upsert: true,
        contentType
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      
      // Provide more specific error messages
      let errorMessage = `Upload failed: ${uploadError.message}`
      
      if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('policy')) {
        errorMessage = 'Storage not configured properly. Please run the Supabase setup SQL script.'
      } else if (uploadError.message?.includes('bucket')) {
        errorMessage = 'Storage bucket "processed-files" not found. Please create it in Supabase dashboard.'
      } else if (uploadError.message?.includes('size')) {
        errorMessage = 'File size exceeds storage limits.'
      }
      
      return {
        publicUrl: null,
        error: errorMessage,
        fileSize,
        uploaded: false
      }
    }

    // Generate public URL
    const { data: urlData } = supabase.storage
      .from('processed-files')
      .getPublicUrl(filePath)

    console.log(`File uploaded successfully: ${urlData.publicUrl}`)

    // Schedule deletion after 1 hour (3600 seconds)
    scheduleFileDeletion(filePath, originalFileName || fileName)

    return {
      publicUrl: urlData.publicUrl,
      error: null,
      fileSize,
      uploaded: true
    }

  } catch (error) {
    console.error('Unexpected error in uploadToSupabaseIfEligible:', error)
    return {
      publicUrl: null,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fileSize: 0,
      uploaded: false
    }
  }
}

/**
 * Schedule file deletion after 1 hour
 * @param filePath - Path of file in Supabase Storage
 * @param originalFileName - Original filename for logging
 */
function scheduleFileDeletion(filePath: string, originalFileName: string) {
  const ONE_HOUR = 3600 * 1000 // 1 hour in milliseconds
  
  setTimeout(async () => {
    try {
      console.log(`Attempting to delete expired file: ${filePath}`)
      
      const { error } = await supabase.storage
        .from('processed-files')
        .remove([filePath])

      if (error) {
        console.error(`Failed to delete expired file ${filePath}:`, error)
      } else {
        console.log(`Successfully deleted expired file: ${originalFileName} (${filePath})`)
      }
    } catch (error) {
      console.error(`Error during scheduled deletion of ${filePath}:`, error)
    }
  }, ONE_HOUR)

  console.log(`Scheduled deletion for ${originalFileName} in 1 hour`)
}

/**
 * Create signed URL for secure download (alternative to public URL)
 * @param filePath - Path of file in Supabase Storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Promise with signed URL
 */
export async function createSignedUrl(filePath: string, expiresIn: number = 3600): Promise<{
  signedUrl: string | null
  error: string | null
}> {
  try {
    const { data, error } = await supabase.storage
      .from('processed-files')
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      return {
        signedUrl: null,
        error: error.message
      }
    }

    return {
      signedUrl: data.signedUrl,
      error: null
    }
  } catch (error) {
    return {
      signedUrl: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Helper function to format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Check if Supabase Storage bucket exists and is accessible
 * @returns Promise with bucket status
 */
export async function checkStorageBucket(): Promise<{
  accessible: boolean
  error: string | null
  details?: any
}> {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      return {
        accessible: false,
        error: `Failed to list buckets: ${bucketsError.message}`,
        details: bucketsError
      }
    }

    const bucket = buckets?.find(b => b.id === 'processed-files')
    if (!bucket) {
      return {
        accessible: false,
        error: 'Bucket "processed-files" not found. Please create it in Supabase dashboard.',
        details: { availableBuckets: buckets?.map(b => b.id) }
      }
    }

    // Test upload permissions by trying to upload a small test file
    const testData = new Uint8Array([1, 2, 3, 4]) // 4 bytes
    const testPath = `test/${Date.now()}_test.txt`
    
    const { error: uploadError } = await supabase.storage
      .from('processed-files')
      .upload(testPath, testData, {
        contentType: 'text/plain'
      })

    if (uploadError) {
      return {
        accessible: false,
        error: `Upload test failed: ${uploadError.message}. Check RLS policies.`,
        details: { bucket, uploadError }
      }
    }

    // Clean up test file
    await supabase.storage.from('processed-files').remove([testPath])

    return {
      accessible: true,
      error: null,
      details: { 
        bucket: {
          id: bucket.id,
          name: bucket.name,
          public: bucket.public,
          fileSizeLimit: bucket.file_size_limit
        }
      }
    }
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    }
  }
}