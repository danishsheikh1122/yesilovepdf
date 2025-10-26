'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download, AlertCircle, Cloud, QrCode, Copy, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const copyToClipboard = () => {
    if (uploadUrl) {
      navigator.clipboard.writeText(uploadUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

    // Generate QR code when uploadUrl is available
  useEffect(() => {
    if (!uploadUrl || !showQRCode) {
      console.log('⏭️ Skipping QR generation:', { uploadUrl, showQRCode })
      return
    }

    console.log('🔄 Starting QR generation for URL:', uploadUrl)
    console.log('🔍 URL type:', typeof uploadUrl)
    console.log('🔍 URL length:', uploadUrl?.length)

    const generateQR = async () => {
      try {
        console.log('📦 Loading QRCode library...')
        
        // Dynamic import to ensure it works in the browser
        const QRCode = await import('qrcode')
        
        console.log('✅ QRCode library loaded')
        console.log('🎯 Generating QR for URL:', uploadUrl)
        
        // Use the toDataURL method with simpler config
        const qrDataUrl = await QRCode.toDataURL(uploadUrl, {
          errorCorrectionLevel: 'M',
          width: 256,
          margin: 1,
          color: {
            dark: '#1e40af',
            light: '#ffffff'
          }
        })
        
        console.log('✅ QR Code generated successfully')
        console.log('📊 QR Data URL length:', qrDataUrl.length)
        console.log('📊 QR Data starts with:', qrDataUrl.substring(0, 30))
        setQrCodeDataUrl(qrDataUrl)
      } catch (err) {
        console.error('❌ QR generation error:', err)
        console.error('❌ Error name:', (err as Error)?.name)
        console.error('❌ Error message:', (err as Error)?.message)
        console.error('❌ Error stack:', (err as Error)?.stack)
        setQrCodeDataUrl('error')
      }
    }

    generateQR()
  }, [uploadUrl, showQRCode])

  // Don't render if no upload information is available
  if (!uploadUrl && !uploadError) {
    return null
  }

  return (
    <div className={cn("w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 sm:p-6", className)}>
      {uploadUrl ? (
        // Centered Card Layout - Premium & Minimal
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-200/50 backdrop-blur-sm">
            
            {/* Success Header Section */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 sm:p-10 text-center relative overflow-hidden">
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                {/* Success Icon */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 shadow-lg">
                    <CheckCircle className="w-12 h-12" strokeWidth={2} />
                  </div>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold mb-2">Your file is ready! 🎉</h2>
                <p className="text-green-100 text-sm">Successfully processed and uploaded to cloud storage</p>
              </div>
            </div>

            {/* Main Content - Single Column */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* File Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200/50">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600/10 rounded-lg p-2.5 flex-shrink-0">
                    <Cloud className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">Cloud Storage</h3>
                    <div className="space-y-1 mt-2">
                      <p className="text-xs text-gray-600">
                        {fileSize ? `📦 Size: ${formatFileSize(fileSize)}` : '📦 File uploaded'}
                      </p>
                      <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                        ⏰ Expires in 1 hour
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Download Button */}
              <Button
                onClick={() => window.open(uploadUrl, '_blank')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
              >
                <Download className="w-5 h-5 mr-2" />
                Download from Cloud
              </Button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-xs font-medium text-gray-500 bg-white">or</span>
                </div>
              </div>

              {/* QR Code Section */}
              {showQRCode && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200/50">
                    {/* QR Code Badge */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="bg-blue-600 text-white rounded-full p-1">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">Scan to download</p>
                    </div>

                    {/* QR Code Display - Proper sized */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                      {qrCodeDataUrl && qrCodeDataUrl !== 'error' ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code for download link"
                          className="w-full h-auto"
                        />
                      ) : qrCodeDataUrl === 'error' ? (
                        <div className="aspect-square flex flex-col items-center justify-center bg-red-50 rounded-lg">
                          <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                          <p className="text-xs text-red-700 font-medium text-center">QR generation failed</p>
                          <p className="text-xs text-red-600 text-center mt-1">Please refresh the page</p>
                        </div>
                      ) : (
                        <div className="aspect-square flex items-center justify-center bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600 mx-auto mb-2"></div>
                            <p className="text-xs text-gray-600 font-medium">Generating QR code...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    <p className="text-xs text-gray-600 text-center mt-3 px-2">
                      📱 Open camera on your phone and point at the QR code
                    </p>
                  </div>

                  {/* Copy Link Button */}
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="w-full h-10 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 font-medium rounded-xl transition-all"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Secondary Actions */}
              {showDirectDownload && onDirectDownload && (
                <Button
                  onClick={onDirectDownload}
                  variant="outline"
                  className="w-full h-10 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700 font-medium rounded-xl transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Direct Download
                </Button>
              )}

              {/* Footer Info */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  💡 Your file is temporarily stored. Download before the link expires.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Badge */}
          <p className="text-center text-xs text-gray-500 mt-4">
            🔒 Secure • Private • No data stored
          </p>
        </div>
        ) : uploadError ? (
        // Error state
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4 sm:p-8 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-red-700">
                <AlertCircle className="w-8 h-8" />
                <span className="font-semibold text-lg">Upload unavailable</span>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>{uploadError}</p>
              </div>

              {showDirectDownload && onDirectDownload && (
                <Button
                  onClick={onDirectDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-semibold rounded-xl"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download File Directly
                </Button>
              )}

              <div className="text-sm text-gray-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
                ⚠️ File will be downloaded directly to your device
              </div>
            </div>
          </div>
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