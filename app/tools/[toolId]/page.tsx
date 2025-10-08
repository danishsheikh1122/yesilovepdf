'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Download, CheckCircle, Home, RotateCcw } from 'lucide-react'
import FileUpload from '@/components/FileUpload'

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

  const tool = toolConfig[toolId]

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
      
      // Simulate processing with progress
      const steps = [
        { progress: 20, text: 'Uploading files...' },
        { progress: 40, text: 'Analyzing documents...' },
        { progress: 60, text: 'Processing...' },
        { progress: 80, text: 'Optimizing output...' },
        { progress: 100, text: 'Complete!' }
      ]

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setProgress(step.progress)
      }

      setStatus('complete')
      setProcessing(false)
    }
  }

  const handleStartOver = () => {
    setStatus('idle')
    setProgress(0)
    setSelectedFiles([])
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
              </CardContent>
            </Card>
          </div>

          {/* Options & Process Section */}
          <div className="space-y-6">
            {/* Tool-specific options */}
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
                  disabled={selectedFiles.length < tool.minFiles}
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
      </div>
    </div>
  )
}