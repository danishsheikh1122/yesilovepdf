'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

import { Download, Eye, Settings, FileText, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
// Simple file info display without PDF.js to avoid build issues

interface AddPageNumbersProps {
  files: File[]
  onProcess: (options: any) => Promise<void>
  processing: boolean
  onBack: () => void
}

export default function AddPageNumbersComponent({ 
  files, 
  onProcess, 
  processing, 
  onBack 
}: AddPageNumbersProps) {
  const [options, setOptions] = useState({
    position: 'bottom-right',
    format: '{page}',
    fontColor: '#000000',
    fontFamily: 'Helvetica',
    startPage: 1
  })

  const [showSuccess, setShowSuccess] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)

  const positions = [
    { value: 'top-left', label: 'Top Left', icon: '↖' },
    { value: 'top-center', label: 'Top Center', icon: '↑' },
    { value: 'top-right', label: 'Top Right', icon: '↗' },
    { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
    { value: 'bottom-center', label: 'Bottom Center', icon: '↓' },
    { value: 'bottom-right', label: 'Bottom Right', icon: '↘' }
  ]

  const formats = [
    { value: '{page}', label: 'Page Number Only', example: '1, 2, 3...' },
    { value: 'Page {page}', label: 'Page X', example: 'Page 1, Page 2...' },
    { value: '{page} of {total}', label: 'Page X of Y', example: '1 of 10, 2 of 10...' },
    { value: '{page}/{total}', label: 'X/Y Format', example: '1/10, 2/10...' },
    { value: '- {page} -', label: 'Dash Format', example: '- 1 -, - 2 -...' }
  ]

  const fontFamilies = [
    'Helvetica',
    'Times-Roman',
    'Courier',
    'Arial',
    'Georgia'
  ]

  const handleProcess = async () => {
    try {
      await onProcess(options)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Processing error:', error)
    }
  }

  const getPreviewText = (pageNum: number = 1, totalPages: number = 10) => {
    return options.format
      .replace('{page}', pageNum.toString())
      .replace('{total}', totalPages.toString())
  }

  // Load PDF preview when files change
  useEffect(() => {
    if (files.length > 0) {
      loadPdfPreview()
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



  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      fontSize: '12px',
      color: options.fontColor,
      fontFamily: options.fontFamily,
      userSelect: 'none' as const,
      pointerEvents: 'none' as const,
      fontWeight: '600' as const,
      padding: '4px 8px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '4px',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }

    const margin = 20 // Fixed margin

    switch (options.position) {
      case 'top-left':
        return { ...baseStyle, top: `${margin}px`, left: `${margin}px` }
      case 'top-center':
        return { ...baseStyle, top: `${margin}px`, left: '50%', transform: 'translateX(-50%)' }
      case 'top-right':
        return { ...baseStyle, top: `${margin}px`, right: `${margin}px` }
      case 'bottom-left':
        return { ...baseStyle, bottom: `${margin}px`, left: `${margin}px` }
      case 'bottom-center':
        return { ...baseStyle, bottom: `${margin}px`, left: '50%', transform: 'translateX(-50%)' }
      case 'bottom-right':
        return { ...baseStyle, bottom: `${margin}px`, right: `${margin}px` }
      default:
        return { ...baseStyle, bottom: `${margin}px`, right: `${margin}px` }
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-600" />
            Add Page Numbers
          </h1>
          <p className="text-gray-600 mt-2">
            Customize page numbering for your PDF document
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md text-sm font-medium">
          <FileText className="w-4 h-4" />
          {files.length} file{files.length > 1 ? 's' : ''} selected
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Live PDF Preview Panel */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Document Preview - Page 1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden w-full">
                {files.length === 0 ? (
                  /* Sample Preview when no file */
                  <div className="aspect-[8.5/11] p-6 text-gray-800">
                    <div className="text-center mb-6">
                      <h1 className="text-lg font-bold text-gray-900 mb-1">Document Title</h1>
                      <p className="text-sm text-gray-600">Sample PDF Document</p>
                      <div className="w-12 h-0.5 bg-gray-400 mx-auto mt-2"></div>
                    </div>
                    
                    <div className="space-y-4 text-xs leading-relaxed">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Introduction</h3>
                        <p className="text-gray-700">
                          This is a sample document that demonstrates how page numbers will appear 
                          when added to your PDF. Upload a PDF to see the actual first page preview.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Content Section</h3>
                        <p className="text-gray-700 mb-2">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do 
                          eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Real PDF Preview */
                  <div className="relative">
                    {previewLoading ? (
                      <div className="aspect-[8.5/11] flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mb-2 mx-auto" />
                          <p className="text-sm text-gray-500">Loading PDF preview...</p>
                        </div>
                      </div>
                    ) : pdfPreviewUrl ? (
                      /* PDF Iframe Preview */
                      <div className="relative bg-white border rounded-lg overflow-hidden">
                        <iframe
                          src={`${pdfPreviewUrl}#page=1&view=FitH`}
                          className="w-full border-0"
                          style={{ height: '600px', minHeight: '600px' }}
                          title="PDF Preview"
                        />
                        
                        {/* Page Number Overlay */}
                        <div style={getPositionStyle()} className="z-10 pointer-events-none">
                          {getPreviewText(1, 10)}
                        </div>
                        
                        {/* File info indicator */}
                        <div className="absolute top-2 left-2 text-xs text-gray-500 bg-white bg-opacity-90 px-2 py-1 rounded shadow max-w-xs break-words">
                          <span className="break-all">{files[0].name}</span> • First Page Preview
                        </div>
                      </div>
                    ) : (
                      /* Fallback enhanced preview */
                      <div className="aspect-[8.5/11] p-6 text-gray-800 bg-white border rounded-lg">
                        <div className="text-center mb-6">
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-6 h-6 text-red-600" />
                          </div>
                          <h1 className="text-lg font-bold text-gray-900 mb-1 break-words break-all px-2">
                            {files[0].name.replace(/\.pdf$/i, '')}
                          </h1>
                          <p className="text-sm text-gray-600">
                            PDF Document • {(files[0].size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                        
                        <div className="space-y-4 text-xs">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-2">📄 Document Ready</h3>
                            <p className="text-blue-700">
                              Page numbers will be added to your PDF document in the selected position.
                            </p>
                          </div>
                        </div>
                        
                        {/* Page Number Overlay */}
                        <div style={getPositionStyle()} className="z-10">
                          {getPreviewText(1, 10)}
                        </div>
                      </div>
                    )}
                  </div>
                )}


              </div>
            </CardContent>
          </Card>
        </div>

        {/* Options Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Position Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Position & Layout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2 block">
                  Page Number Position
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {positions.map((pos) => (
                    <Button
                      key={pos.value}
                      variant={options.position === pos.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setOptions({ ...options, position: pos.value })}
                      className={cn(
                        "h-auto py-3 px-2 flex flex-col items-center gap-1 transition-all duration-200",
                        options.position === pos.value 
                          ? "bg-red-600 text-white shadow-md transform scale-105" 
                          : "hover:bg-gray-50 hover:scale-102"
                      )}
                    >
                      <span className="text-lg">{pos.icon}</span>
                      <span className="text-xs font-medium text-center whitespace-normal break-words">{pos.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 my-4"></div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2 block">
                  Number Format
                </div>
                <Select
                  value={options.format}
                  onValueChange={(value) => setOptions({ ...options, format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{format.label}</span>
                          <span className="text-xs text-gray-500">{format.example}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


            </CardContent>
          </Card>

          {/* Typography Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2 block">
                  Font Family
                </div>
                <Select
                  value={options.fontFamily}
                  onValueChange={(value) => setOptions({ ...options, fontFamily: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2 block">
                  Color
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={options.fontColor}
                    onChange={(e) => setOptions({ ...options, fontColor: e.target.value })}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{options.fontColor}</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2 block">
                  Start Page Number
                </div>
                <Select
                  value={options.startPage.toString()}
                  onValueChange={(value) => setOptions({ ...options, startPage: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Start from page {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Button
                  onClick={handleProcess}
                  disabled={processing}
                  className={cn(
                    "w-full py-3 text-lg font-medium transition-all duration-300 transform hover:scale-[1.02]",
                    processing 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : showSuccess
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700",
                    "text-white"
                  )}
                  size="lg"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Adding Page Numbers...
                    </>
                  ) : showSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Success! Download Started
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Add Page Numbers
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={onBack}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}