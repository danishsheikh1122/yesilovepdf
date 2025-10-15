'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Eye, Settings, FileText, CheckCircle, RefreshCw, Type, Copy, RotateCcw, Upload, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddTextWatermarkProps {
  files: File[]
  onProcess: (options: any) => Promise<void>
  processing: boolean
  onBack: () => void
}

export default function AddTextWatermarkComponent({ 
  files, 
  onProcess, 
  processing, 
  onBack 
}: AddTextWatermarkProps) {
  const [options, setOptions] = useState({
    text: 'CONFIDENTIAL',
    fontColor: '#666666',
    fontFamily: 'Helvetica',
    fontSize: 48,
    opacity: 0.15,
    watermarkType: 'tilted', // 'tilted' or 'fullpage'
  })

  const [showSuccess, setShowSuccess] = useState(false)
  const [previewScale, setPreviewScale] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const watermarkStyles = [
    {
      value: 'tilted',
      label: 'Tilted Watermark',
      description: 'Diagonal repeating pattern across the page',
      icon: <RotateCcw className="w-4 h-4" />
    }
  ]

  // Load PDF preview and set total pages based on file
  useEffect(() => {
    if (files.length > 0) {
      loadPdfPreview()
      // Estimate pages based on file size (rough approximation)
      const fileSizeMB = files[0].size / (1024 * 1024)
      const estimatedPages = Math.max(1, Math.round(fileSizeMB / 0.1)) // Roughly 100KB per page
      setTotalPages(Math.min(estimatedPages, 50)) // Cap at 50 for demo
      setCurrentPage(1)
    } else {
      setPdfPreviewUrl(null)
    }
    
    // Cleanup URL when component unmounts
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
    }
  }, [files])

  // Cleanup URL when preview URL changes
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
    }
  }, [pdfPreviewUrl])

  const loadPdfPreview = async () => {
    if (files.length === 0) return
    
    setPreviewLoading(true)
    
    try {
      const file = files[0]
      // Create a URL for the PDF file to embed in iframe
      const url = URL.createObjectURL(file)
      setPdfPreviewUrl(url)
    } catch (error) {
      console.error('Error creating PDF preview:', error)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Navigation functions
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const zoomIn = () => {
    setPreviewScale(prev => Math.min(prev + 0.25, 2))
  }

  const zoomOut = () => {
    setPreviewScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const resetZoom = () => {
    setPreviewScale(1)
  }

  const handleProcess = async () => {
    try {
      await onProcess(options)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
    } catch (error) {
      console.error('Error processing watermark:', error)
    }
  }

  // Create watermark preview component
  const WatermarkPreview = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="absolute transform -rotate-45"
            style={{
              fontSize: `${options.fontSize * previewScale * 0.4}px`,
              fontFamily: options.fontFamily,
              color: options.fontColor,
              opacity: options.opacity,
              left: `${(i % 3) * 40 - 20}%`,
              top: `${Math.floor(i / 3) * 60 + 20}%`,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {options.text}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Type className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Add Text Watermark</h1>
          </div>
          <p className="text-gray-600">
            Add custom text watermarks to your PDF with professional styling options.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Preview Section */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview
                  </div>
                  {files.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={zoomOut}
                        disabled={previewScale <= 0.5}
                        className="h-8 w-8 p-0"
                      >
                        -
                      </Button>
                      <span className="text-sm text-gray-600 min-w-[60px] text-center">
                        {Math.round(previewScale * 100)}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={zoomIn}
                        disabled={previewScale >= 2}
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetZoom}
                        className="h-8 px-2 text-xs"
                      >
                        Reset
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      Upload a PDF to see preview with live watermark overlay
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {previewLoading ? (
                      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mb-2 mx-auto" />
                          <p className="text-sm text-gray-500">Loading PDF preview...</p>
                        </div>
                      </div>
                    ) : pdfPreviewUrl ? (
                      /* Real PDF Preview with Watermark Overlay */
                      <div className="relative bg-white border shadow-sm rounded-lg overflow-hidden" 
                           style={{ width: `${600 * previewScale}px`, maxWidth: '100%', margin: '0 auto' }}>
                        <iframe
                          src={`${pdfPreviewUrl}#page=1&view=FitH`}
                          className="w-full border-0"
                          style={{ height: `${700 * previewScale}px` }}
                          title="PDF Preview with Watermark"
                        />
                        
                        {/* Watermark Overlay */}
                        <WatermarkPreview />

                        {/* File name indicator */}
                        <div className="absolute top-2 left-2 text-xs text-gray-500 bg-white bg-opacity-90 px-2 py-1 rounded shadow-sm">
                          {files[0].name} • Page 1 Preview
                        </div>
                      </div>
                    ) : (
                      /* Fallback preview */
                      <div className="relative bg-white border shadow-sm rounded-lg overflow-hidden p-6"
                           style={{ width: `${600 * previewScale}px`, height: `${700 * previewScale}px`, maxWidth: '100%', margin: '0 auto' }}>
                        <div className="text-center mb-6">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <h1 className="text-lg font-bold text-gray-900 mb-1">
                            {files[0].name.replace(/\.pdf$/i, '')}
                          </h1>
                          <p className="text-sm text-gray-600">
                            PDF Document • Watermark Preview
                          </p>
                        </div>
                        
                        <div className="space-y-4 text-xs">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-2">🔖 Watermark Preview</h3>
                            <p className="text-blue-700">
                              Your watermark will be applied diagonally across all pages of the PDF.
                            </p>
                          </div>
                        </div>
                        
                        {/* Watermark Overlay */}
                        <WatermarkPreview />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Info */}
            {files.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 break-words break-all">{files[0].name}</p>
                      <p className="text-sm text-gray-500">
                        {(files[0].size / 1024 / 1024).toFixed(2)} MB • Est. {totalPages} pages
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Settings Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Watermark Style Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Watermark Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {watermarkStyles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setOptions({ ...options, watermarkType: style.value })}
                      className={cn(
                        "p-4 border-2 rounded-lg text-left transition-all hover:shadow-md transform hover:scale-[1.02]",
                        options.watermarkType === style.value
                          ? "border-red-500 bg-red-50 shadow-md"
                          : "border-gray-200 hover:border-red-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          options.watermarkType === style.value
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-600"
                        )}>
                          {style.icon}
                        </div>
                        <div>
                          <h3 className={cn(
                            "font-medium",
                            options.watermarkType === style.value
                              ? "text-red-900"
                              : "text-gray-900"
                          )}>{style.label}</h3>
                          <p className={cn(
                            "text-sm",
                            options.watermarkType === style.value
                              ? "text-red-600"
                              : "text-gray-500"
                          )}>{style.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Text Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Text Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="watermark-text">Watermark Text</Label>
                  <Input
                    id="watermark-text"
                    value={options.text}
                    onChange={(e) => setOptions({ ...options, text: e.target.value })}
                    placeholder="Enter watermark text..."
                    className="font-medium"
                  />
                  
                  
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select value={options.fontFamily} onValueChange={(value) => setOptions({ ...options, fontFamily: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Times">Times</SelectItem>
                      <SelectItem value="Courier">Courier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="font-size">Font Size</Label>
                    <Select value={options.fontSize.toString()} onValueChange={(value) => setOptions({ ...options, fontSize: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">Small (24px)</SelectItem>
                        <SelectItem value="36">Medium (36px)</SelectItem>
                        <SelectItem value="48">Large (48px)</SelectItem>
                        <SelectItem value="60">Extra Large (60px)</SelectItem>
                        <SelectItem value="72">Huge (72px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opacity">Opacity</Label>
                    <Select value={options.opacity.toString()} onValueChange={(value) => setOptions({ ...options, opacity: parseFloat(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.1">Very Light (10%)</SelectItem>
                        <SelectItem value="0.15">Light (15%)</SelectItem>
                        <SelectItem value="0.25">Medium (25%)</SelectItem>
                        <SelectItem value="0.4">Dark (40%)</SelectItem>
                        <SelectItem value="0.6">Very Dark (60%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-color">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="font-color"
                      type="color"
                      value={options.fontColor}
                      onChange={(e) => setOptions({ ...options, fontColor: e.target.value })}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={options.fontColor}
                      onChange={(e) => setOptions({ ...options, fontColor: e.target.value })}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Button */}
            <Button
              onClick={handleProcess}
              disabled={processing || files.length === 0 || !options.text.trim()}
              className={cn(
                "w-full h-12 text-base font-medium transition-all transform hover:scale-[1.02] disabled:transform-none",
                processing 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : showSuccess
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700",
                "text-white border-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Adding Watermark...
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Watermark Added Successfully!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Add Watermark & Download
                </>
              )}
            </Button>

            {files.length === 0 ? (
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">
                  📄 Please upload a PDF file to continue
                </p>
              </div>
            ) : !options.text.trim() ? (
              <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700 font-medium">
                  ✍️ Please enter watermark text
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}