'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Globe, Download, Loader2, Eye, X, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logPdfUsage } from '@/lib/pdfTracking'
import SupabaseUploadStatus from '@/components/SupabaseUploadStatus'

interface HtmlToPdfProps {
  className?: string
}

interface ConversionOptions {
  format: 'A4' | 'A3' | 'Letter' | 'Legal'
  printBackground: boolean
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  conversionType: 'text' | 'screenshot'
}

export default function HtmlToPdf({ className }: HtmlToPdfProps) {
  const [url, setUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('') // Separate state for input
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [uploadUrl, setUploadUrl] = useState<string | undefined>(undefined)
  const [uploadError, setUploadError] = useState<string | undefined>(undefined)
  const [fileSize, setFileSize] = useState<number | undefined>(undefined)
  const [fileName, setFileName] = useState<string>('webpage.pdf')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [options, setOptions] = useState<ConversionOptions>({
    format: 'A4',
    printBackground: true,
    marginTop: '1cm',
    marginRight: '1cm',
    marginBottom: '1cm',
    marginLeft: '1cm',
    conversionType: 'text'
  })

  const validateUrl = async (inputUrl: string) => {
    if (!inputUrl) {
      setValidationResult(null)
      return
    }

    // Add protocol if missing
    let fullUrl = inputUrl
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      fullUrl = 'https://' + inputUrl
    }

    setIsValidating(true)
    setError('')

    try {
      const response = await fetch(`/api/html-to-pdf?url=${encodeURIComponent(fullUrl)}`)
      const result = await response.json()
      
      if (result.valid) {
        setValidationResult(result)
        setUrl(fullUrl) // Set the validated URL
      } else {
        setError(result.error || 'Unable to access the website')
        setValidationResult(null)
        setUrl('')
      }
    } catch (err) {
      setError('Failed to validate URL')
      setValidationResult(null)
      setUrl('')
    } finally {
      setIsValidating(false)
    }
  }

  const handleUrlSubmit = async () => {
    if (!inputUrl.trim()) {
      setError('Please enter a URL')
      return
    }
    
    // Validate URL when user clicks Add or presses Enter
    await validateUrl(inputUrl.trim())
  }

  // Use effect to show preview after successful validation
  useEffect(() => {
    if (validationResult?.valid && url) {
      setShowPreview(true)
    }
  }, [validationResult, url])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleUrlSubmit()
    }
  }

  const convertToPdf = async () => {
    if (!url) return

    setIsLoading(true)
    setProgress(0)
    setError('')
    setUploadUrl(undefined)
    setUploadError(undefined)

    // Simulate progress with smooth increments
    let progressValue = 0
    const progressInterval = setInterval(() => {
      progressValue += 2
      if (progressValue <= 60) {
        setProgress(progressValue)
      }
    }, 300)

    try {
      setProgress(10)
      
      const response = await fetch('/api/html-to-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          options
        }),
      })

      clearInterval(progressInterval)
      setProgress(75)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Conversion failed')
      }

      setProgress(85)

      // Extract Supabase upload info from headers
      const supabaseUrl = response.headers.get('X-Supabase-Url')
      const uploadWarning = response.headers.get('X-Upload-Warning')
      const fileSizeHeader = response.headers.get('X-File-Size')
      
      // Extract filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'webpage.pdf'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      setFileName(filename)
      
      if (supabaseUrl) {
        setUploadUrl(supabaseUrl)
      }
      if (uploadWarning) {
        setUploadError(uploadWarning)
      }
      if (fileSizeHeader) {
        setFileSize(parseInt(fileSizeHeader))
      }

      setProgress(93)

      // Download the PDF
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(link)

      setProgress(100)

      // Track the HTML to PDF conversion
      await logPdfUsage({
        pdfName: filename,
        actionType: 'html-to-pdf'
      });

      // Small delay to ensure download starts, then show result screen
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Show result screen with Supabase upload info
      setIsLoading(false)
      setShowResult(true)
      setShowPreview(false)

    } catch (err: any) {
      setError(err.message || 'Failed to convert webpage to PDF')
      clearInterval(progressInterval)
      setProgress(0)
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setUrl('')
    setInputUrl('') // Reset input URL as well
    setShowPreview(false)
    setShowOptions(false)
    setShowResult(false)
    setError('')
    setValidationResult(null)
    setProgress(0)
    setUploadUrl(undefined)
    setUploadError(undefined)
    setFileSize(undefined)
    setFileName('webpage.pdf')
  }

  // Show result screen after conversion
  if (showResult) {
    return (
      <div className={cn("w-full max-w-4xl mx-auto", className)}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversion Complete!</h2>
          <p className="text-gray-600">Your webpage has been converted to PDF</p>
        </div>

        <SupabaseUploadStatus
          uploadUrl={uploadUrl}
          uploadError={uploadError}
          fileSize={fileSize}
          fileName={fileName}
          showDirectDownload={false}
        />

        <div className="mt-6 text-center">
          <Button 
            onClick={resetForm}
            variant="outline"
            className="px-6"
          >
            Convert Another Webpage
          </Button>
        </div>
      </div>
    )
  }

  if (showPreview) {
    return (
      <div className={cn("w-full max-w-6xl mx-auto", className)}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-2"
            >
              ← Back
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="h-4 w-4" />
              <span className="font-medium">{new URL(url).hostname}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {showOptions ? 'Hide Options' : 'Show Options'}
            </Button>
            <Button
              onClick={convertToPdf}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Convert to PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Conversion Type Quick Selection - Always Visible */}
        <Card className="mb-6 bg-linear-to-r from-blue-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Conversion Method</h3>
                <p className="text-xs text-gray-600">Choose how you want to convert this website to PDF</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setOptions({...options, conversionType: 'text'})}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    options.conversionType === 'text'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  📝 Text Extract
                </button>
                <button
                  onClick={() => setOptions({...options, conversionType: 'screenshot'})}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    options.conversionType === 'screenshot'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  📸 Full Screenshot
                </button>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600 bg-white rounded p-2">
              {options.conversionType === 'screenshot' ? (
                <span>🖼️ <strong>Full Screenshot:</strong> Captures the entire website exactly as it appears, including all images, colors, and styling.</span>
              ) : (
                <span>📄 <strong>Text Extract:</strong> Extracts readable text content from the page. Faster and smaller file size.</span>
              )}
            </div>
          </CardContent>
        </Card>

        {showOptions && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Advanced PDF Options</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Page Format</label>
                  <Select value={options.format} onValueChange={(value: any) => setOptions({...options, format: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A3">A3</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Top Margin</label>
                  <Input
                    value={options.marginTop}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOptions({...options, marginTop: e.target.value})}
                    placeholder="1cm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bottom Margin</label>
                  <Input
                    value={options.marginBottom}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOptions({...options, marginBottom: e.target.value})}
                    placeholder="1cm"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="printBackground"
                    checked={options.printBackground}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOptions({...options, printBackground: e.target.checked})}
                    className="h-4 w-4"
                  />
                  <label htmlFor="printBackground" className="text-sm font-medium">
                    Print backgrounds
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Converting to PDF...</span>
                    <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-red-500" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {options.conversionType === 'screenshot' 
                  ? 'Capturing full website screenshot and converting to PDF. This includes all images, styling, and layout exactly as it appears on the website.'
                  : 'Converting webpage to PDF format. This process extracts the main content from the webpage and formats it as a readable PDF document.'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <X className="h-4 w-4" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gray-100 p-4 border-b flex items-center justify-between">
              <span className="text-sm font-medium">Website Preview</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">
                  This preview shows how the website will appear in the PDF
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="bg-white px-2 py-1 rounded">Desktop View</span>
                </div>
              </div>
            </div>
            
            <div className="relative" style={{ height: '800px' }}>
              {url && (
                <iframe
                  ref={iframeRef}
                  src={url}
                  className="w-full h-full border-0"
                  title="Website Preview"
                  onLoad={() => {
                    // Preview loaded
                  }}
                />
              )}
              
              {/* PDF Page Overlay Indicators */}
              <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>PDF Preview Mode</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">HTML to PDF</h1>
        <p className="text-gray-600 text-lg">
          Convert web pages to PDF documents with high accuracy
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="flex gap-2 mb-4">
              <button 
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium border-b-2 border-red-600"
              >
                Url
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enter the URL of the web page
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="url"
                  placeholder="Example: https://ilovepdf.com"
                  value={inputUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setInputUrl(e.target.value)
                    // Reset previous validation results when user types
                    setError('')
                    setValidationResult(null)
                  }}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 text-base"
                  disabled={isValidating}
                />
                {isValidating && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-red-700 text-sm">
                  <X className="h-4 w-4" />
                  {error}
                </div>
              </div>
            )}

            {validationResult?.valid && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <Eye className="h-4 w-4" />
                  Website is accessible and ready for conversion
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleUrlSubmit}
                disabled={!inputUrl.trim() || isValidating}
                className="bg-red-500 hover:bg-red-600 text-white px-8 h-12 text-base font-medium"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  'Add'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {inputUrl && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={resetForm}>
            Start Over
          </Button>
        </div>
      )}
    </div>
  )
}