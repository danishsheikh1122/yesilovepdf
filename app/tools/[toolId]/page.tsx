'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Download, CheckCircle, Home, RotateCcw } from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import PdfGallery from '@/components/PdfGallery'
import EnhancedMerge from '@/components/EnhancedMergeNew'

const toolConfig: Record<string, any> = {
  merge: {
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one document',
    acceptedTypes: ['.pdf'],
    multiple: true,
    minFiles: 2
  },
  split: {
    title: 'Split PDF',
    description: 'Split a PDF into multiple files or extract specific pages',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  compress: {
    title: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  'remove-pages': {
    title: 'Remove Pages',
    description: 'Delete unwanted pages from your PDF documents',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  'extract-pages': {
    title: 'Extract Pages',
    description: 'Extract specific pages from PDF to create new documents',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  organize: {
    title: 'Organize PDF',
    description: 'Reorder, rotate, and manage pages',
    acceptedTypes: ['.pdf'],
    multiple: true,
    minFiles: 1
  },
  'scan-to-pdf': {
    title: 'Scan to PDF',
    description: 'Convert scanned images to searchable PDFs',
    acceptedTypes: ['.jpg', '.jpeg', '.png', '.tiff'],
    multiple: true,
    minFiles: 1
  },
  repair: {
    title: 'Repair PDF',
    description: 'Fix corrupted or damaged PDF files',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  ocr: {
    title: 'OCR PDF',
    description: 'Make scanned PDFs searchable',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  'jpg-to-pdf': {
    title: 'JPG to PDF',
    description: 'Convert images to PDF',
    acceptedTypes: ['.jpg', '.jpeg', '.png', '.webp'],
    multiple: true,
    minFiles: 1
  },
  'word-to-pdf': {
    title: 'WORD to PDF',
    description: 'Convert Word documents to PDF',
    acceptedTypes: ['.doc', '.docx'],
    multiple: false,
    minFiles: 1
  },
  'powerpoint-to-pdf': {
    title: 'PowerPoint to PDF',
    description: 'Convert presentations to PDF',
    acceptedTypes: ['.ppt', '.pptx'],
    multiple: false,
    minFiles: 1
  },
  'excel-to-pdf': {
    title: 'Excel to PDF',
    description: 'Convert spreadsheets to PDF',
    acceptedTypes: ['.xls', '.xlsx'],
    multiple: false,
    minFiles: 1
  },
  'html-to-pdf': {
    title: 'HTML to PDF',
    description: 'Convert web pages to PDF',
    acceptedTypes: ['.html', '.htm'],
    multiple: false,
    minFiles: 1
  },
  'pdf-to-jpg': {
    title: 'PDF to JPG',
    description: 'Convert PDF pages to images',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  'pdf-to-word': {
    title: 'PDF to WORD',
    description: 'Convert PDF to editable Word format',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  'pdf-to-powerpoint': {
    title: 'PDF to PowerPoint',
    description: 'Convert PDF to PowerPoint',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  'pdf-to-excel': {
    title: 'PDF to Excel',
    description: 'Extract data to Excel format',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  'pdf-to-pdfa': {
    title: 'PDF to PDF/A',
    description: 'Convert to archival format',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  rotate: {
    title: 'Rotate PDF',
    description: 'Rotate PDF pages',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  'add-page-numbers': {
    title: 'Add Page Numbers',
    description: 'Add page numbers to PDF',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  'add-watermark': {
    title: 'Add Watermark',
    description: 'Add watermarks to protect documents',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  crop: {
    title: 'Crop PDF',
    description: 'Crop PDF pages',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  },
  edit: {
    title: 'Edit PDF',
    description: 'Edit PDF content',
    acceptedTypes: ['.pdf'],
    multiple: false,
    minFiles: 1
  }
}

export default function ToolPage() {
  const params = useParams()
  const router = useRouter()
  const toolId = params.toolId as string
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete'>('idle')
  const [options, setOptions] = useState<Record<string, any>>({})
  const [selectedPages, setSelectedPages] = useState<number[]>([])

  const tool = toolConfig[toolId]

  // Clear selected pages when files change
  useEffect(() => {
    setSelectedPages([])
  }, [selectedFiles])

  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tool not found</h1>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  const handleProcess = async () => {
    if (selectedFiles.length >= tool.minFiles) {
      setProcessing(true)
      setStatus('processing')
      
      try {
        setProgress(20)
        
        const formData = new FormData()
        selectedFiles.forEach(file => formData.append('files', file))
        
        // Add tool-specific options
        Object.keys(options).forEach(key => {
          formData.append(key, options[key])
        })
        
        // Add selected pages for tools that need them
        if ((toolId === 'remove-pages' || toolId === 'extract-pages') && selectedPages.length > 0) {
          const pagesString = selectedPages.sort((a, b) => a - b).join(',')
          formData.append(
            toolId === 'remove-pages' ? 'pagesToRemove' : 'pagesToExtract', 
            pagesString
          )
        }
        
        setProgress(40)
        
        const response = await fetch(`/api/${toolId}`, {
          method: 'POST',
          body: formData,
        })
        
        setProgress(60)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to process ${tool.title}`)
        }
        
        setProgress(80)
        
        // Download the result file
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Set appropriate filename based on tool and content type
        const contentType = response.headers.get('content-type')
        const contentDisposition = response.headers.get('content-disposition')
        
        let filename = 'result'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '')
          }
        } else {
          // Default filenames based on tool
          switch (toolId) {
            case 'merge':
              filename = 'merged-document.pdf'
              break
            case 'split':
              filename = 'split-pages.zip'
              break
            case 'compress':
              filename = `compressed-${selectedFiles[0]?.name || 'document.pdf'}`
              break
            case 'jpg-to-pdf':
              filename = 'images-to-pdf.pdf'
              break
            case 'pdf-to-jpg':
              filename = contentType?.includes('zip') ? 'pdf-images.zip' : 'page-1.jpg'
              break
            case 'rotate':
              filename = `rotated-${selectedFiles[0]?.name || 'document.pdf'}`
              break
            case 'remove-pages':
              filename = `removed-pages-${selectedFiles[0]?.name || 'document.pdf'}`
              break
            case 'extract-pages':
              filename = `extracted-pages-${selectedFiles[0]?.name || 'document.pdf'}`
              break
            default:
              filename = `processed-${selectedFiles[0]?.name || 'document'}`
          }
        }
        
        a.download = filename
        a.click()
        
        setProgress(100)
        setStatus('complete')
        setProcessing(false)
        
        // Clean up
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error(`${toolId} error:`, error)
        alert(error instanceof Error ? error.message : `Failed to process ${tool.title}. Please try again.`)
        setProcessing(false)
        setStatus('idle')
        setProgress(0)
      }
    }
  }

  const handleEnhancedMerge = async (files: File[], excludedPages: number[]) => {
    setProcessing(true)
    setStatus('processing')
    
    try {
      setProgress(20)
      
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      
      if (excludedPages.length > 0) {
        formData.append('excludedPages', excludedPages.join(','))
      }
      
      setProgress(40)
      
      const response = await fetch('/api/merge', {
        method: 'POST',
        body: formData,
      })
      
      setProgress(60)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to merge PDFs')
      }
      
      setProgress(80)
      
      // Download the merged file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'merged-document.pdf'
      a.click()
      
      setProgress(100)
      setStatus('complete')
      setProcessing(false)
      
      // Clean up
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Enhanced merge error:', error)
      alert(error instanceof Error ? error.message : 'Failed to merge PDFs. Please try again.')
      setProcessing(false)
      setStatus('idle')
      setProgress(0)
    }
  }

  const handleStartOver = () => {
    setStatus('idle')
    setProgress(0)
    setSelectedFiles([])
    setSelectedPages([])
    setOptions({})
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <div className="w-8 h-8 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Your Files
            </h2>
            
            <p className="text-gray-600 mb-6">
              Please wait while we process your {tool.title.toLowerCase()}...
            </p>

            <div className="space-y-4">
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-gray-500">
                {progress}% complete
              </p>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Files:</strong> {selectedFiles.length} file(s)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Success! 🎉
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your {tool.title.toLowerCase()} has been completed successfully!
            </p>

            <div className="space-y-3">
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Result
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleStartOver}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start Over
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => router.push('/')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Tools
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{tool.title}</h1>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {toolId === 'merge' ? (
          <EnhancedMerge
            onMerge={handleEnhancedMerge}
            processing={processing}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* File Upload Section */}
            <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">
                  {tool.multiple ? 'Upload Files' : 'Upload File'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesSelected={setSelectedFiles}
                  acceptedTypes={tool.acceptedTypes}
                  multiple={tool.multiple}
                  maxFiles={tool.multiple ? 10 : 1}
                />
                
                {/* PDF Preview for single PDF tools */}
                {selectedFiles.length > 0 && !tool.multiple && selectedFiles[0].type === 'application/pdf' && (
                  <div className="mt-6">
                    <PdfGallery
                      file={selectedFiles[0]}
                      selectionMode={
                        toolId === 'remove-pages' ? 'exclude' :
                        toolId === 'extract-pages' ? 'include' : 'view'
                      }
                      selectedPages={selectedPages}
                      onPagesSelected={setSelectedPages}
                    />
                  </div>
                )}
                
                {/* PDF Preview for merge tool */}
                {toolId === 'merge' && selectedFiles.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium text-gray-900">PDF Previews</h4>
                    {selectedFiles.map((file, index) => (
                      file.type === 'application/pdf' && (
                        <div key={`${file.name}-${index}`} className="border rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            File {index + 1}: {file.name}
                          </h5>
                          <PdfGallery
                            file={file}
                            selectionMode="view"
                            className="border-0 shadow-none bg-transparent"
                          />
                        </div>
                      )
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Options & Process Section */}
          <div className="space-y-6">
            {/* Tool-specific options */}

            {toolId === 'split' && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Split Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Split Method</label>
                    <Select 
                      value={options.splitOption || 'all-pages'} 
                      onValueChange={(value: string) => setOptions({...options, splitOption: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-pages">Split into individual pages</SelectItem>
                        <SelectItem value="custom-range">Custom page range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {options.splitOption === 'custom-range' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Page Range</label>
                      <input
                        type="text"
                        placeholder="e.g., 1-5,7,9-12"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={options.pageRange || ''}
                        onChange={(e) => setOptions({...options, pageRange: e.target.value})}
                      />
                      <p className="text-xs text-gray-500 mt-1">Use commas and hyphens (e.g., 1-5,7,9-12)</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {toolId === 'compress' && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Compression Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={options.compressionLevel || 'basic'} 
                    onValueChange={(value: string) => setOptions({...options, compressionLevel: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (Recommended)</SelectItem>
                      <SelectItem value="strong">Strong Compression</SelectItem>
                      <SelectItem value="extreme">Maximum Compression</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {toolId === 'jpg-to-pdf' && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">PDF Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Page Size</label>
                    <Select 
                      value={options.pageSize || 'a4'} 
                      onValueChange={(value: string) => setOptions({...options, pageSize: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Orientation</label>
                    <Select 
                      value={options.orientation || 'portrait'} 
                      onValueChange={(value: string) => setOptions({...options, orientation: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {toolId === 'pdf-to-jpg' && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Image Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Format</label>
                    <Select 
                      value={options.format || 'jpeg'} 
                      onValueChange={(value: string) => setOptions({...options, format: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jpeg">JPEG</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Quality</label>
                    <Select 
                      value={options.quality || '85'} 
                      onValueChange={(value: string) => setOptions({...options, quality: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">Low (60%)</SelectItem>
                        <SelectItem value="85">Medium (85%)</SelectItem>
                        <SelectItem value="95">High (95%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {toolId === 'rotate' && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Rotation Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Rotation</label>
                    <Select 
                      value={options.rotation || '90'} 
                      onValueChange={(value: string) => setOptions({...options, rotation: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90° Clockwise</SelectItem>
                        <SelectItem value="180">180°</SelectItem>
                        <SelectItem value="270">90° Counter-clockwise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Pages</label>
                    <Select 
                      value={options.pages || 'all'} 
                      onValueChange={(value: string) => setOptions({...options, pages: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pages</SelectItem>
                        <SelectItem value="odd">Odd Pages</SelectItem>
                        <SelectItem value="even">Even Pages</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {options.pages === 'custom' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Page Range</label>
                      <input
                        type="text"
                        placeholder="e.g., 1,3,5-8"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={options.customPages || ''}
                        onChange={(e) => setOptions({...options, pages: e.target.value})}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {(toolId === 'remove-pages' || toolId === 'extract-pages') && selectedFiles.length > 0 && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {toolId === 'remove-pages' ? 'Pages to Remove' : 'Pages to Extract'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedPages.length > 0 ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>Selected pages:</strong> {selectedPages.sort((a, b) => a - b).join(', ')}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {toolId === 'remove-pages' 
                            ? 'These pages will be removed from the PDF' 
                            : 'Only these pages will be kept in the new PDF'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          👆 Click on pages in the preview above to select them
                        </p>
                      </div>
                    )}
                    
                    {/* Fallback text input for manual entry */}
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        Or enter page numbers manually
                      </summary>
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="e.g., 1,3,5-8"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={selectedPages.join(',')}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value) {
                              // Parse manual input
                              const pages: number[] = []
                              const ranges = value.split(',').map(range => range.trim())
                              
                              for (const range of ranges) {
                                if (range.includes('-')) {
                                  const [start, end] = range.split('-').map(num => parseInt(num.trim()))
                                  if (!isNaN(start) && !isNaN(end) && start <= end) {
                                    for (let i = start; i <= end; i++) {
                                      if (i > 0) pages.push(i)
                                    }
                                  }
                                } else {
                                  const pageNum = parseInt(range)
                                  if (!isNaN(pageNum) && pageNum > 0) {
                                    pages.push(pageNum)
                                  }
                                }
                              }
                              setSelectedPages([...new Set(pages)].sort((a, b) => a - b))
                            } else {
                              setSelectedPages([])
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">Use commas and hyphens (e.g., 1,3,5-8)</p>
                      </div>
                    </details>
                  </div>
                </CardContent>
              </Card>
            )}

            {toolId === 'rotate' && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Compression Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={options.compressionLevel || 'basic'} 
                    onValueChange={(value: string) => setOptions({...options, compressionLevel: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (Recommended)</SelectItem>
                      <SelectItem value="strong">Strong Compression</SelectItem>
                      <SelectItem value="extreme">Maximum Compression</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {toolId === 'rotate' && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Rotation</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={options.rotation || '90'} 
                    onValueChange={(value: string) => setOptions({...options, rotation: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90° Clockwise</SelectItem>
                      <SelectItem value="180">180°</SelectItem>
                      <SelectItem value="270">90° Counter-clockwise</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Process Button */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <Button 
                  onClick={handleProcess}
                  disabled={
                    selectedFiles.length < tool.minFiles ||
                    ((toolId === 'remove-pages' || toolId === 'extract-pages') && selectedPages.length === 0)
                  }
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-lg font-semibold"
                  size="lg"
                >
                  {tool.title}
                </Button>
                
                {selectedFiles.length < tool.minFiles && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    {tool.multiple 
                      ? `Please upload at least ${tool.minFiles} files`
                      : 'Please upload a file to continue'
                    }
                  </p>
                )}
                
                {selectedFiles.length >= tool.minFiles && 
                 (toolId === 'remove-pages' || toolId === 'extract-pages') && 
                 selectedPages.length === 0 && (
                  <p className="text-sm text-orange-600 text-center mt-2">
                    Please select pages to {toolId === 'remove-pages' ? 'remove' : 'extract'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-800 mb-2">✨ Features</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Fast processing</li>
                  <li>• Secure & private</li>
                  <li>• No file limits</li>
                  <li>• Auto-cleanup</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}