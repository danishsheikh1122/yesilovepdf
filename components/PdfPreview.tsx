'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Check, Eye, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PdfPageInfo {
  pageNumber: number
  width: number
  height: number
  rotation: number
}

interface PdfPreviewProps {
  file: File
  onPagesSelected?: (selectedPages: number[]) => void
  selectionMode?: 'remove' | 'extract' | 'view'
  selectedPages?: number[]
  className?: string
}

interface PageThumbnail {
  pageNumber: number
  imageUrl: string | null
  loading: boolean
  error: boolean
}

export default function PdfPreview({ 
  file, 
  onPagesSelected, 
  selectionMode = 'view',
  selectedPages = [],
  className 
}: PdfPreviewProps) {
  const [pdfInfo, setPdfInfo] = useState<{
    pageCount: number
    pages: PdfPageInfo[]
    fileName: string
    fileSize: number
  } | null>(null)
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [internalSelectedPages, setInternalSelectedPages] = useState<number[]>(selectedPages)

  useEffect(() => {
    loadPdfInfo()
  }, [file])

  useEffect(() => {
    setInternalSelectedPages(selectedPages)
  }, [selectedPages])

  useEffect(() => {
    if (pdfInfo) {
      loadThumbnails()
    }
  }, [pdfInfo])

  // Cleanup blob URLs when component unmounts or file changes
  useEffect(() => {
    return () => {
      thumbnails.forEach(thumb => {
        if (thumb.imageUrl) {
          URL.revokeObjectURL(thumb.imageUrl)
        }
      })
    }
  }, [file])

  const loadPdfInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/pdf-info', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load PDF information')
      }

      const info = await response.json()
      setPdfInfo(info)
      
      // Initialize thumbnail state
      const initialThumbnails = info.pages.map((page: PdfPageInfo) => ({
        pageNumber: page.pageNumber,
        imageUrl: null,
        loading: true,
        error: false
      }))
      setThumbnails(initialThumbnails)
      
    } catch (error) {
      console.error('PDF info error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load PDF')
    } finally {
      setLoading(false)
    }
  }

  const loadThumbnails = async () => {
    if (!pdfInfo) return

    // Load thumbnails for all pages
    for (let i = 0; i < pdfInfo.pageCount; i++) {
      const pageNumber = i + 1
      loadPageThumbnail(pageNumber)
    }
  }

  const loadPageThumbnail = async (pageNumber: number) => {
    try {
      // Check if we already have this thumbnail
      const existingThumbnail = thumbnails.find(t => t.pageNumber === pageNumber)
      if (existingThumbnail?.imageUrl || existingThumbnail?.error) {
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('pageNumber', pageNumber.toString())

      const response = await fetch('/api/pdf-thumbnail', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const imageBlob = await response.blob()
        const imageUrl = URL.createObjectURL(imageBlob)
        
        setThumbnails(prev => prev.map(thumb => 
          thumb.pageNumber === pageNumber 
            ? { ...thumb, imageUrl, loading: false, error: false }
            : thumb
        ))
      } else {
        setThumbnails(prev => prev.map(thumb => 
          thumb.pageNumber === pageNumber 
            ? { ...thumb, loading: false, error: true }
            : thumb
        ))
      }
    } catch (error) {
      console.error(`Error loading thumbnail for page ${pageNumber}:`, error)
      setThumbnails(prev => prev.map(thumb => 
        thumb.pageNumber === pageNumber 
          ? { ...thumb, loading: false, error: true }
          : thumb
      ))
    }
  }

  const togglePageSelection = (pageNumber: number) => {
    const newSelection = internalSelectedPages.includes(pageNumber)
      ? internalSelectedPages.filter(p => p !== pageNumber)
      : [...internalSelectedPages, pageNumber]
    
    setInternalSelectedPages(newSelection)
    onPagesSelected?.(newSelection)
  }

  const selectAllPages = () => {
    if (!pdfInfo) return
    const allPages = Array.from({ length: pdfInfo.pageCount }, (_, i) => i + 1)
    setInternalSelectedPages(allPages)
    onPagesSelected?.(allPages)
  }

  const clearSelection = () => {
    setInternalSelectedPages([])
    onPagesSelected?.([])
  }

  if (loading) {
    return (
      <Card className={cn("bg-white/90 backdrop-blur-sm shadow-lg", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="text-gray-600 ml-2">Loading PDF preview...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("bg-white/90 backdrop-blur-sm shadow-lg", className)}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadPdfInfo} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!pdfInfo) {
    return null
  }

  return (
    <Card className={cn("bg-white/90 backdrop-blur-sm shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">PDF Pages</h3>
            <div className="text-sm text-gray-600">
              {pdfInfo.pageCount} page{pdfInfo.pageCount !== 1 ? 's' : ''}
            </div>
          </div>
          
          {selectionMode !== 'view' && (
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm text-gray-600">
                {internalSelectedPages.length} selected
              </span>
              {selectionMode === 'remove' && (
                <span className="text-sm text-red-600">
                  (will be removed)
                </span>
              )}
              {selectionMode === 'extract' && (
                <span className="text-sm text-green-600">
                  (will be extracted)
                </span>
              )}
              <Button 
                onClick={selectAllPages}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                Select All
              </Button>
              <Button 
                onClick={clearSelection}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {pdfInfo.pages.map((page) => {
            const isSelected = internalSelectedPages.includes(page.pageNumber)
            const aspectRatio = page.height / page.width
            const thumbnail = thumbnails.find(t => t.pageNumber === page.pageNumber)
            
            return (
              <div
                key={page.pageNumber}
                className={cn(
                  "relative group cursor-pointer transition-all duration-200",
                  selectionMode !== 'view' && "hover:scale-105"
                )}
                onClick={() => selectionMode !== 'view' && togglePageSelection(page.pageNumber)}
              >
                <Card 
                  className={cn(
                    "border-2 transition-all duration-200",
                    isSelected && selectionMode === 'remove' && "border-red-500 bg-red-50",
                    isSelected && selectionMode === 'extract' && "border-green-500 bg-green-50",
                    !isSelected && "border-gray-200 hover:border-blue-300"
                  )}
                >
                  <CardContent className="p-3">
                    {/* Real PDF Page Thumbnail */}
                    <div 
                      className={cn(
                        "w-full bg-gray-100 rounded border flex items-center justify-center relative overflow-hidden",
                        aspectRatio > 1.4 ? "aspect-[1/1.4]" : "aspect-[1/1]"
                      )}
                      style={{ 
                        transform: page.rotation ? `rotate(${page.rotation}deg)` : undefined 
                      }}
                    >
                      {thumbnail?.loading && (
                        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                          <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                      )}
                      
                      {thumbnail?.error && (
                        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                          <X className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Failed to load</span>
                        </div>
                      )}
                      
                      {thumbnail?.imageUrl && (
                        <img
                          src={thumbnail.imageUrl}
                          alt={`Page ${page.pageNumber}`}
                          className="w-full h-full object-contain"
                          onLoad={() => {
                            // Optionally handle image load
                          }}
                          onError={() => {
                            setThumbnails(prev => prev.map(thumb => 
                              thumb.pageNumber === page.pageNumber 
                                ? { ...thumb, error: true }
                                : thumb
                            ))
                          }}
                        />
                      )}
                      
                      {/* Fallback when no thumbnail data yet */}
                      {!thumbnail && (
                        <div className="w-full h-full bg-white shadow-inner flex flex-col">
                          <div className="h-2 bg-gray-200 rounded-full mx-2 mt-2"></div>
                          <div className="h-1 bg-gray-200 rounded-full mx-2 mt-1"></div>
                          <div className="h-1 bg-gray-200 rounded-full mx-2 mt-1 w-3/4"></div>
                          <div className="h-1 bg-gray-200 rounded-full mx-2 mt-1"></div>
                          <div className="h-1 bg-gray-200 rounded-full mx-2 mt-1 w-2/3"></div>
                          <div className="flex-grow"></div>
                          <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        </div>
                      )}
                      
                      {/* Selection overlay */}
                      {selectionMode !== 'view' && (
                        <div className={cn(
                          "absolute inset-0 flex items-center justify-center",
                          isSelected ? "bg-black/20" : "bg-black/0 group-hover:bg-black/10"
                        )}>
                          {isSelected && (
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              selectionMode === 'remove' ? "bg-red-500" : "bg-green-500"
                            )}>
                              {selectionMode === 'remove' ? (
                                <X className="w-5 h-5 text-white" />
                              ) : (
                                <Check className="w-5 h-5 text-white" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center mt-2">
                      <span className="text-xs font-medium text-gray-700">
                        Page {page.pageNumber}
                      </span>
                      {page.rotation !== 0 && (
                        <div className="text-xs text-gray-500">
                          {page.rotation}° rotated
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        {selectionMode !== 'view' && internalSelectedPages.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Selected pages:</strong> {internalSelectedPages.sort((a, b) => a - b).join(', ')}
            </p>
            {selectionMode === 'remove' && (
              <p className="text-xs text-red-600 mt-1">
                These pages will be removed from the PDF
              </p>
            )}
            {selectionMode === 'extract' && (
              <p className="text-xs text-green-600 mt-1">
                Only these pages will be kept in the new PDF
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}