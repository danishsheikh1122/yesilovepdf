'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, Check, Download, Plus, ArrowUpDown, Trash2, FileText, Loader2 } from 'lucide-react'
import PdfGallery from './PdfGallery'
import { cn } from '@/lib/utils'

interface FileWithPages {
  file: File
  pageCount: number
  excludedPages: number[]
}

interface EnhancedMergeProps {
  onMerge: (files: File[], excludedPages: number[]) => Promise<void>
  processing: boolean
}

export default function EnhancedMerge({ onMerge, processing }: EnhancedMergeProps) {
  const [files, setFiles] = useState<FileWithPages[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [totalPages, setTotalPages] = useState(0)
  const [loadingFiles, setLoadingFiles] = useState<string[]>([])

  useEffect(() => {
    const total = files.reduce((sum, file) => sum + (file.pageCount - file.excludedPages.length), 0)
    setTotalPages(total)
  }, [files])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      await handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = async (newFiles: File[]) => {
    const pdfFiles = newFiles.filter(file => file.type === 'application/pdf')
    
    for (const file of pdfFiles) {
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        continue // Skip duplicates
      }

      setLoadingFiles(prev => [...prev, file.name])
      
      try {
        const pageCount = await getPageCount(file)
        setFiles(prev => [...prev, {
          file,
          pageCount,
          excludedPages: []
        }])
      } catch (error) {
        console.error('Error loading file:', error)
      } finally {
        setLoadingFiles(prev => prev.filter(name => name !== file.name))
      }
    }
  }

  const getPageCount = async (file: File): Promise<number> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/pdf-info', {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      return data.pageCount
    }
    throw new Error('Failed to get page count')
  }

  const handlePageSelection = (fileIndex: number, excludedPages: number[]) => {
    setFiles(prev => prev.map((file, index) => 
      index === fileIndex 
        ? { ...file, excludedPages }
        : file
    ))
  }

  const removeFile = (fileIndex: number) => {
    setFiles(prev => prev.filter((_, index) => index !== fileIndex))
  }

  const moveFile = (fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      const [moved] = newFiles.splice(fromIndex, 1)
      newFiles.splice(toIndex, 0, moved)
      return newFiles
    })
  }

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please select at least 2 PDF files to merge')
      return
    }

    if (totalPages === 0) {
      alert('No pages selected for merging')
      return
    }

    // Calculate global excluded pages
    const excludedPages: number[] = []
    let globalIndex = 0
    
    files.forEach(fileData => {
      for (let i = 1; i <= fileData.pageCount; i++) {
        if (fileData.excludedPages.includes(i)) {
          excludedPages.push(globalIndex)
        }
        globalIndex++
      }
    })

    await onMerge(files.map(f => f.file), excludedPages)
  }

  if (files.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
          <CardContent className="p-12">
            <div
              className={cn(
                'flex flex-col items-center justify-center text-center space-y-4',
                dragActive && 'scale-105'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <Upload className="w-10 h-10 text-red-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select PDF files to merge
                </h3>
                <p className="text-gray-600 mb-4">
                  Combine PDFs in the order you want with the easiest PDF merger available.
                </p>
              </div>

              <div className="flex flex-col items-center space-y-3">
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Select PDF files
                </Button>
                <p className="text-sm text-gray-500">or drop PDFs here</p>
              </div>

              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf"
                onChange={handleChange}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Merge PDF Files
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload-more')?.click()}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add more files
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{totalPages} page{totalPages !== 1 ? 's' : ''} to merge</span>
          </div>
        </CardHeader>
      </Card>

      {/* File List */}
      <div className="space-y-4">
        {files.map((fileData, index) => (
          <Card key={`${fileData.file.name}-${index}`} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{fileData.file.name}</h4>
                    <p className="text-sm text-gray-500">
                      {fileData.pageCount} pages • {(fileData.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFile(index, index - 1)}
                      className="h-8 w-8 p-0"
                    >
                      ↑
                    </Button>
                  )}
                  {index < files.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFile(index, index + 1)}
                      className="h-8 w-8 p-0"
                    >
                      ↓
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <PdfGallery
                file={fileData.file}
                onPagesSelected={(excludedPages) => handlePageSelection(index, excludedPages)}
                selectionMode="exclude"
                selectedPages={fileData.excludedPages}
                className="border-0 shadow-none bg-transparent"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading Files */}
      {loadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">
                Loading {loadingFiles.join(', ')}...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Merge Button */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Ready to merge {totalPages} page{totalPages !== 1 ? 's' : ''} from {files.length} file{files.length !== 1 ? 's' : ''}
            </div>
            <Button
              onClick={handleMerge}
              disabled={files.length < 2 || totalPages === 0 || processing}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Merge PDFs
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <input
        id="file-upload-more"
        type="file"
        multiple
        accept=".pdf"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}