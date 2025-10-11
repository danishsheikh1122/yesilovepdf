'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, RotateCw, GripVertical, Trash2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PdfPageInfo {
  pageNumber: number
  width: number
  height: number
  rotation: number
}

interface PageOperation {
  originalPageIndex: number
  rotation: number
  newPosition: number
}

interface PdfOrganizerProps {
  file: File
  onOrganize?: (operations: PageOperation[]) => void
  className?: string
}

interface PageThumbnail {
  pageNumber: number
  imageUrl: string | null
  loading: boolean
  error: boolean
}

interface OrganizedPage {
  originalPageIndex: number
  pageInfo: PdfPageInfo
  rotation: number
  id: string
}

export default function PdfOrganizer({ 
  file, 
  onOrganize,
  className 
}: PdfOrganizerProps) {
  const [pdfInfo, setPdfInfo] = useState<{
    pageCount: number
    pages: PdfPageInfo[]
    fileName: string
    fileSize: number
  } | null>(null)
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([])
  const [organizedPages, setOrganizedPages] = useState<OrganizedPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  useEffect(() => {
    loadPdfInfo()
  }, [file])

  useEffect(() => {
    if (pdfInfo) {
      // Initialize organized pages with original order
      const initialPages = pdfInfo.pages.map((page, index) => ({
        originalPageIndex: index,
        pageInfo: page,
        rotation: 0, // Start with no additional rotation
        id: `page-${index}`
      }))
      setOrganizedPages(initialPages)
      loadThumbnails()
    }
  }, [pdfInfo])

  // Cleanup blob URLs when component unmounts or file changes
  useEffect(() => {
    return () => {
      thumbnails.forEach(thumbnail => {
        if (thumbnail.imageUrl) {
          URL.revokeObjectURL(thumbnail.imageUrl)
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
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load PDF info')
      }
      
      const data = await response.json()
      setPdfInfo(data)
      
      // Initialize thumbnails array
      const initialThumbnails = data.pages.map((page: PdfPageInfo) => ({
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
        body: formData
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const imageUrl = URL.createObjectURL(blob)
        
        setThumbnails(prev => prev.map(thumb => 
          thumb.pageNumber === pageNumber 
            ? { ...thumb, imageUrl, loading: false }
            : thumb
        ))
      } else {
        throw new Error('Failed to load thumbnail')
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

  const rotatePage = (pageId: string, rotationDelta: number) => {
    setOrganizedPages(prev => prev.map(page => 
      page.id === pageId 
        ? { ...page, rotation: (page.rotation + rotationDelta) % 360 }
        : page
    ))
  }

  const removePage = (pageId: string) => {
    setOrganizedPages(prev => prev.filter(page => page.id !== pageId))
  }

  const duplicatePage = (pageId: string) => {
    const pageToClone = organizedPages.find(page => page.id === pageId)
    if (pageToClone) {
      const newPage = {
        ...pageToClone,
        id: `${pageId}-clone-${Date.now()}`
      }
      setOrganizedPages(prev => {
        const index = prev.findIndex(page => page.id === pageId)
        return [...prev.slice(0, index + 1), newPage, ...prev.slice(index + 1)]
      })
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, pageId: string) => {
    setDraggedItem(pageId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, pageId: string) => {
    e.preventDefault()
    setDragOverItem(pageId)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    // Only clear if we're leaving the component entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetPageId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetPageId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    setOrganizedPages(prev => {
      const newPages = [...prev]
      const draggedIndex = newPages.findIndex(page => page.id === draggedItem)
      const targetIndex = newPages.findIndex(page => page.id === targetPageId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedPage] = newPages.splice(draggedIndex, 1)
        newPages.splice(targetIndex, 0, draggedPage)
      }
      
      return newPages
    })

    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleOrganize = () => {
    const operations: PageOperation[] = organizedPages.map((page, index) => ({
      originalPageIndex: page.originalPageIndex,
      rotation: page.rotation,
      newPosition: index
    }))
    
    onOrganize?.(operations)
  }

  if (loading) {
    return (
      <Card className={cn("bg-white/90 backdrop-blur-sm shadow-lg", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PDF pages...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("bg-white/90 backdrop-blur-sm shadow-lg", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-red-600">
              <X className="w-12 h-12 mx-auto mb-4" />
              <p className="font-medium">Error loading PDF</p>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Organize PDF Pages</h3>
            <div className="text-sm text-gray-600">
              {organizedPages.length} page{organizedPages.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            Drag pages to reorder • Click rotate to turn pages • Remove unwanted pages
          </div>

          {organizedPages.length > 0 && (
            <div className="flex items-center space-x-2 mb-4">
              <Button 
                onClick={handleOrganize}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Apply Organization
              </Button>
              <span className="text-sm text-gray-500">
                {organizedPages.length} pages will be organized
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {organizedPages.map((page, index) => {
            const thumbnail = thumbnails.find(t => t.pageNumber === page.pageInfo.pageNumber)
            const aspectRatio = page.pageInfo.height / page.pageInfo.width
            const totalRotation = page.pageInfo.rotation + page.rotation
            const isDraggedOver = dragOverItem === page.id
            const isBeingDragged = draggedItem === page.id
            
            return (
              <div
                key={page.id}
                draggable
                onDragStart={(e) => handleDragStart(e, page.id)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, page.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, page.id)}
                className={cn(
                  "relative group cursor-move transition-all duration-200",
                  isBeingDragged && "opacity-50 scale-95",
                  isDraggedOver && "scale-105"
                )}
              >
                <Card 
                  className={cn(
                    "border-2 transition-all duration-200",
                    isDraggedOver && "border-blue-500 bg-blue-50",
                    !isDraggedOver && "border-gray-200 hover:border-blue-300"
                  )}
                >
                  <CardContent className="p-3">
                    {/* Drag Handle */}
                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="bg-gray-800 text-white p-1 rounded text-xs flex items-center">
                        <GripVertical className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Page Controls */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="h-6 w-6 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => rotatePage(page.id, 90)}
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => removePage(page.id)}
                        title="Remove page"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* PDF Page Thumbnail */}
                    <div 
                      className={cn(
                        "w-full bg-gray-100 rounded border flex items-center justify-center relative overflow-hidden",
                        aspectRatio > 1.4 ? "aspect-[1/1.4]" : "aspect-[1/1]"
                      )}
                      style={{ 
                        transform: totalRotation ? `rotate(${totalRotation}deg)` : undefined 
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
                          <span className="text-xs text-gray-500">Error</span>
                        </div>
                      )}
                      
                      {thumbnail?.imageUrl && (
                        <img 
                          src={thumbnail.imageUrl} 
                          alt={`Page ${page.pageInfo.pageNumber}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      )}

                      {!thumbnail?.imageUrl && !thumbnail?.loading && !thumbnail?.error && (
                        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center space-y-1">
                          <div className="h-1 bg-gray-200 rounded-full mx-2 mt-1"></div>
                          <div className="h-1 bg-gray-200 rounded-full mx-2 mt-1 w-3/4"></div>
                          <div className="h-1 bg-gray-200 rounded-full mx-2 mt-1"></div>
                          <div className="h-1 bg-gray-200 rounded-full mx-2 mt-1 w-2/3"></div>
                          <div className="flex-grow"></div>
                          <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center mt-2">
                      <div className="text-xs font-medium text-gray-700">
                        Page {page.pageInfo.pageNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        Position {index + 1}
                      </div>
                      {page.rotation !== 0 && (
                        <div className="text-xs text-blue-600">
                          +{page.rotation}° rotated
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        {organizedPages.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">All pages have been removed</p>
            <p className="text-sm text-gray-500 mt-1">Upload a new file to start organizing</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}