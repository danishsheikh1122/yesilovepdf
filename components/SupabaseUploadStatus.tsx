import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download, AlertCircle, Cloud, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SupabaseUploadStatusProps {
  uploadUrl?: string | null
  uploadError?: string | null
  fileSize?: number
  fileName?: string
  className?: string
  showDirectDownload?: boolean
  onDirectDownload?: () => void
}

export default function SupabaseUploadStatus({
  uploadUrl,
  uploadError,
  fileSize,
  fileName,
  className,
  showDirectDownload = true,
  onDirectDownload
}: SupabaseUploadStatusProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Don't render if no upload information is available
  if (!uploadUrl && !uploadError) {
    return null
  }

  return (
    <Card className={cn("mt-4", className)}>
      <CardContent className="p-4">
        {uploadUrl ? (
          // Success state
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-green-700">
              <Cloud className="w-5 h-5" />
              <span className="font-medium">File uploaded to cloud storage</span>
              <CheckCircle className="w-4 h-4" />
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>Your processed file is temporarily available for download (1 hour)</p>
              {fileSize && (
                <p>File size: {formatFileSize(fileSize)}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => window.open(uploadUrl, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Download from Cloud
              </Button>
              
              {showDirectDownload && onDirectDownload && (
                <Button
                  onClick={onDirectDownload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Direct Download
                </Button>
              )}
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              💡 Cloud link expires automatically after 1 hour for security
            </div>
          </div>
        ) : uploadError ? (
          // Error state  
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Cloud upload unavailable</span>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>{uploadError}</p>
            </div>

            {showDirectDownload && onDirectDownload && (
              <Button
                onClick={onDirectDownload}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download File Directly
              </Button>
            )}

            <div className="text-xs text-gray-500 bg-amber-50 p-2 rounded border border-amber-200">
              ⚠️ File will be downloaded directly to your device
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// Hook to extract Supabase upload information from response headers
export function useSupabaseUploadInfo(response?: Response | null) {
  if (!response) {
    return {
      uploadUrl: null,
      uploadError: null,
      fileSize: undefined
    }
  }

  return {
    uploadUrl: response.headers.get('X-Supabase-Url'),
    uploadError: response.headers.get('X-Upload-Warning'), 
    fileSize: response.headers.get('X-File-Size') ? 
      parseInt(response.headers.get('X-File-Size')!) : undefined
  }
}