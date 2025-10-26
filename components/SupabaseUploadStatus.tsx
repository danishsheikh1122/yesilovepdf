'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download, AlertCircle, Copy, Home, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'

interface SupabaseUploadStatusProps {
  uploadUrl?: string | null
  uploadError?: string | null
  fileSize?: number
  fileName?: string
  className?: string
  showDirectDownload?: boolean
  onDirectDownload?: () => void
  showQRCode?: boolean
}

export default function SupabaseUploadStatus({
  uploadUrl,
  uploadError,
  fileSize,
  fileName,
  className,
  showDirectDownload = true,
  onDirectDownload,
  showQRCode = true
}: SupabaseUploadStatusProps) {
  const [copied, setCopied] = useState(false)
  const [qrShared, setQrShared] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const copyToClipboard = async () => {
    if (uploadUrl) {
      try {
        await navigator.clipboard.writeText(uploadUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Copy failed:', err)
      }
    }
  }

  const shareQRCode = async () => {
    if (!uploadUrl || !qrRef.current) return

    try {
      // Get the SVG element
      const svg = qrRef.current.querySelector('svg')
      if (!svg) return

      // Convert SVG to canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const svgData = new XMLSerializer().serializeToString(svg)
      const img = new Image()
      
      img.onload = async () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        
        // Convert to blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'qr-code.png', { type: 'image/png' })
            
            // Check if Web Share API is supported
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  title: 'Download QR Code',
                  text: 'Scan this QR code to download your file',
                  files: [file]
                })
                setQrShared(true)
                setTimeout(() => setQrShared(false), 2000)
              } catch (shareErr) {
                // User cancelled or error - fallback to download
                if ((shareErr as Error).name !== 'AbortError') {
                  downloadQRCode(blob)
                }
              }
            } else {
              // Fallback: direct download
              downloadQRCode(blob)
            }
          }
        })
      }

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    } catch (err) {
      console.error('Share QR failed:', err)
    }
  }

  const downloadQRCode = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr-code.png'
    a.click()
    URL.revokeObjectURL(url)
    setQrShared(true)
    setTimeout(() => setQrShared(false), 2000)
  }

  // Don't render if no upload information is available
  if (!uploadUrl && !uploadError) {
    return null
  }

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      {uploadUrl ? (
        <div className="space-y-4">
          {/* Success Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Success Header */}
            <div className="bg-green-50 px-6 py-4 border-b border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">File Ready!</h3>
                  <p className="text-sm text-gray-600">
                    {fileSize && `${formatFileSize(fileSize)} • `}Expires in 1 hour
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Download Section */}
                <div className="space-y-3">
                  <Button
                    onClick={() => window.open(uploadUrl, '_blank')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download File
                  </Button>

                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="w-full h-11"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={shareQRCode}
                    variant="outline"
                    className="w-full h-11"
                  >
                    {qrShared ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        QR Code Saved!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share QR Code
                      </>
                    )}
                  </Button>
                </div>

                {/* QR Code Section */}
                {showQRCode && (
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-sm text-gray-600 mb-3">Scan with phone</p>
                    <div ref={qrRef} className="bg-white p-4 rounded-lg border-2 border-gray-200">
                      <QRCodeSVG
                        value={uploadUrl}
                        size={140}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Home Button */}
          <Button
            onClick={() => window.location.href = '/'}
            variant="ghost"
            className="w-full text-gray-600"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      ) : uploadError ? (
        <div className="space-y-4">
          {/* Error Card */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upload Failed</h3>
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              </div>
            </div>

            {onDirectDownload && (
              <div className="p-6">
                <Button
                  onClick={onDirectDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>

          {/* Home Button */}
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      ) : null}
    </div>
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