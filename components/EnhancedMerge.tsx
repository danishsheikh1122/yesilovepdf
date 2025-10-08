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

  useEffect(() => {
    // Calculate total pages and global indices
    let globalIndex = 0
    const updatedFiles = files.map(fileData => ({
      ...fileData,
      pages: fileData.pages.map(page => ({
        ...page,
        globalIndex: globalIndex++
      }))
    }))
    setFiles(updatedFiles)
    setTotalPages(globalIndex)
  }, [files.length])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    )
    
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      addFiles(Array.from(selectedFiles))
    }
  }

  const addFiles = async (newFiles: File[]) => {
    for (const file of newFiles) {
      await addSingleFile(file)
    }
  }

  const addSingleFile = async (file: File) => {
    try {
      // Get PDF info
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/pdf-info', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to load PDF info')

      const pdfInfo = await response.json()
      
      // Create pages array
      const pages = Array.from({ length: pdfInfo.pageCount }, (_, i) => ({
        pageNumber: i + 1,
        globalIndex: 0, // Will be set in useEffect
        included: true,
        loading: true,
        error: false
      }))

      const fileWithPages: FileWithPages = {
        file,
        pageCount: pdfInfo.pageCount,
        pages
      }

      setFiles(prev => [...prev, fileWithPages])

      // Load thumbnails for this file
      loadThumbnailsForFile(fileWithPages, files.length)
    } catch (error) {
      console.error('Error adding file:', error)
    }
  }

  const loadThumbnailsForFile = async (fileData: FileWithPages, fileIndex: number) => {
    for (let pageNum = 1; pageNum <= fileData.pageCount; pageNum++) {
      try {
        const formData = new FormData()
        formData.append('file', fileData.file)
        formData.append('pageNumber', pageNum.toString())

        const response = await fetch('/api/pdf-thumbnail', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const imageBlob = await response.blob()
          const thumbnailUrl = URL.createObjectURL(imageBlob)
          
          setFiles(prev => prev.map((file, index) => 
            index === fileIndex 
              ? {
                  ...file,
                  pages: file.pages.map(page => 
                    page.pageNumber === pageNum
                      ? { ...page, thumbnailUrl, loading: false, error: false }
                      : page
                  )
                }
              : file
          ))
        } else {
          setFiles(prev => prev.map((file, index) => 
            index === fileIndex 
              ? {
                  ...file,
                  pages: file.pages.map(page => 
                    page.pageNumber === pageNum
                      ? { ...page, loading: false, error: true }
                      : page
                  )
                }
              : file
          ))
        }
      } catch (error) {
        console.error(`Error loading thumbnail for page ${pageNum}:`, error)
      }
    }
  }

  const togglePageInclusion = (fileIndex: number, pageNumber: number) => {
    setFiles(prev => prev.map((file, index) => 
      index === fileIndex 
        ? {
            ...file,
            pages: file.pages.map(page => 
              page.pageNumber === pageNumber
                ? { ...page, included: !page.included }
                : page
            )
          }
        : file
    ))
  }

  const removeFile = (fileIndex: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, index) => index !== fileIndex)
      // Clean up blob URLs
      prev[fileIndex].pages.forEach(page => {
        if (page.thumbnailUrl) {
          URL.revokeObjectURL(page.thumbnailUrl)
        }
      })
      return newFiles
    })
  }

  const getIncludedPages = () => {
    const includedPages: Array<{ file: File; pageNumber: number }> = []
    files.forEach(fileData => {
      fileData.pages.forEach(page => {
        if (page.included) {
          includedPages.push({
            file: fileData.file,
            pageNumber: page.pageNumber
          })
        }
      })
    })
    return includedPages
  }

  const handleMerge = async () => {
    const includedPages = getIncludedPages()
    if (includedPages.length < 2) {
      alert('Please select at least 2 pages to merge')
      return
    }

    // For now, we'll pass the files and excluded pages info
    // You might want to modify the merge API to handle page selections
    const excludedPages: number[] = []
    let globalIndex = 0
    
    files.forEach(fileData => {
      fileData.pages.forEach(page => {
        if (!page.included) {
          excludedPages.push(globalIndex)
        }
        globalIndex++
      })
    })

    await onMerge(files.map(f => f.file), excludedPages)
  }

  const includedPagesCount = files.reduce((total, file) => 
    total + file.pages.filter(page => page.included).length, 0
  )

  if (files.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Merge PDF files</h1>
          <p className="text-gray-600">
            Combine PDFs in the order you want with the easiest PDF merger available.
          </p>
        </div>

        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200",
            dragActive 
              ? "border-red-400 bg-red-50" 
              : "border-gray-300 hover:border-red-400 hover:bg-red-50/30"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center">
              <Upload className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <span className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-medium inline-block transition-colors">
                  Select PDF files
                </span>
              </label>
            </div>
            
            <p className="text-gray-500">or drop PDFs here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Merge PDF</h1>
        <p className="text-gray-600">
          To change the order of your PDFs, drag and drop the files as you want.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {files.map((fileData, fileIndex) => (
              <Card key={`${fileData.file.name}-${fileIndex}`} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {fileIndex + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-medium truncate max-w-md">
                          {fileData.file.name}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {fileData.pageCount} pages • {fileData.pages.filter(p => p.included).length} selected
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileIndex)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    {fileData.pages.map((page) => (
                      <div
                        key={`${fileIndex}-${page.pageNumber}`}
                        className={cn(
                          "relative group cursor-pointer transition-all duration-200",
                          page.included ? "opacity-100" : "opacity-50"
                        )}
                        onClick={() => togglePageInclusion(fileIndex, page.pageNumber)}
                      >
                        <div className={cn(
                          "aspect-[3/4] border-2 rounded-lg overflow-hidden transition-all",
                          page.included 
                            ? "border-blue-300 shadow-md" 
                            : "border-red-300 shadow-sm"
                        )}>
                          {page.loading && (
                            <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                              <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                            </div>
                          )}
                          
                          {page.error && (
                            <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                              <X className="w-4 h-4 text-gray-400 mb-1" />
                              <span className="text-xs text-gray-500">Error</span>
                            </div>
                          )}
                          
                          {page.thumbnailUrl && (
                            <img
                              src={page.thumbnailUrl}
                              alt={`Page ${page.pageNumber}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          
                          {/* Selection overlay */}
                          <div className={cn(
                            "absolute inset-0 flex items-center justify-center transition-all",
                            page.included 
                              ? "bg-transparent" 
                              : "bg-red-500/20"
                          )}>
                            {!page.included && (
                              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <X className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-center mt-1">
                          <span className="text-xs font-medium text-gray-600">
                            {page.pageNumber}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add more files button */}
            <Card className="border-2 border-dashed border-gray-300 hover:border-red-400 transition-colors">
              <CardContent className="p-6">
                <label className="cursor-pointer flex items-center justify-center space-x-2 text-gray-600 hover:text-red-500">
                  <input
                    type="file"
                    multiple
                    accept="application/pdf"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <Plus className="w-5 h-5" />
                  <span>Add more files</span>
                </label>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Merge PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>To change the order of your PDFs, drag and drop the files as you want.</p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-blue-900">
                    {includedPagesCount} pages selected
                  </p>
                  <p className="text-blue-700">
                    from {files.length} file{files.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleMerge}
                disabled={processing || includedPagesCount < 2}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3"
                size="lg"
              >
                {processing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Merging...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Merge PDF</span>
                  </div>
                )}
              </Button>

              {includedPagesCount < 2 && (
                <p className="text-xs text-orange-600 text-center">
                  Select at least 2 pages to merge
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}