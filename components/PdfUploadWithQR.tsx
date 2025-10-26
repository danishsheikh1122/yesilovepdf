'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface UploadResponse {
  success: boolean
  data?: {
    fileName: string
    filePath: string
    downloadUrl: string
    signedUrl: string
    qrCode: string
    expiresAt: string
    expiresInSeconds: number
  }
  error?: string
}

export default function PdfUploadWithQR() {
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  // Calculate time remaining
  React.useEffect(() => {
    if (!uploadResult?.data?.expiresAt) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const expiresAt = new Date(uploadResult.data!.expiresAt).getTime()
      const remaining = expiresAt - now

      if (remaining <= 0) {
        setTimeRemaining('Expired')
        clearInterval(interval)
      } else {
        const minutes = Math.floor(remaining / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [uploadResult])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      const data: UploadResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during upload')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: uploading
  })

  const handleDownload = () => {
    if (uploadResult?.data?.signedUrl) {
      window.open(uploadResult.data.signedUrl, '_blank')
    }
  }

  const handleReset = () => {
    setUploadResult(null)
    setError(null)
    setTimeRemaining('')
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          PDF Upload with QR Code
        </h1>
        <p className="text-gray-600 mb-8">
          Upload your PDF file and get a QR code for easy sharing. Download link valid for 1 hour.
        </p>

        {/* Upload Area */}
        {!uploadResult && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
              }
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-lg text-gray-700">Uploading your PDF...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg text-gray-700 mb-2">
                  {isDragActive
                    ? 'Drop your PDF file here'
                    : 'Drag & drop a PDF file here, or click to select'}
                </p>
                <p className="text-sm text-gray-500">
                  Only PDF files are accepted
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-semibold">Upload Failed</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Success */}
        {uploadResult?.data && (
          <div className="mt-6 space-y-6">
            {/* Success Header */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <h3 className="text-green-800 font-semibold">Upload Successful!</h3>
                <p className="text-green-700 text-sm mt-1">
                  File: {uploadResult.data.fileName}
                </p>
              </div>
            </div>

            {/* Time Remaining */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
              <Clock className="w-5 h-5 text-blue-500 mr-3" />
              <div className="flex-1">
                <p className="text-blue-800 font-semibold">Time Remaining</p>
                <p className="text-blue-700 text-sm mt-1">
                  Download link expires in: <span className="font-mono font-bold">{timeRemaining}</span>
                </p>
              </div>
            </div>

            {/* QR Code and Download */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Code */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Scan QR Code to Download
                </h3>
                <div className="flex justify-center">
                  <img 
                    src={uploadResult.data.qrCode} 
                    alt="QR Code for download" 
                    className="w-64 h-64 border-4 border-white shadow-md rounded-lg"
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Scan with any device to download the file
                </p>
              </div>

              {/* Download Options */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Download Options
                </h3>
                
                <button
                  onClick={handleDownload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center mb-4"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Now
                </button>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Download URL
                  </label>
                  <input
                    type="text"
                    value={uploadResult.data.downloadUrl}
                    readOnly
                    className="w-full text-xs bg-gray-50 border border-gray-300 rounded px-3 py-2 font-mono"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(uploadResult.data!.downloadUrl)
                      alert('Link copied to clipboard!')
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Copy Link
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  Upload Another File
                </button>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-yellow-800 font-semibold mb-2">⚠️ Important Notice</h4>
              <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                <li>This download link will expire in 1 hour</li>
                <li>The file will be automatically deleted after 1-2 hours</li>
                <li>Save the file to your device before the link expires</li>
                <li>You can download the file multiple times before expiration</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
