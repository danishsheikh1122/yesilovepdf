'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Trash2, Eye, CheckSquare, Square } from 'lucide-react'
import PdfThumbnail from './PdfThumbnail'
import { cn } from '@/lib/utils'

interface PdfGalleryProps {
  file: File
  onPagesSelected?: (selectedPages: number[]) => void
  selectionMode?: 'include' | 'exclude' | 'view'
  selectedPages?: number[]
  title?: string
  className?: string
}

export default function PdfGallery({
  file,
  onPagesSelected,
  selectionMode = 'view',
  selectedPages = [],
  title,
  className
}: PdfGalleryProps) {
  const [pageCount, setPageCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [internalSelectedPages, setInternalSelectedPages] = useState<number[]>(selectedPages)

  useEffect(() => {
    loadPdfInfo()
  }, [file])

  useEffect(() => {
    setInternalSelectedPages(selectedPages)
  }, [selectedPages])

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

      if (response.ok) {
        const data = await response.json()
        setPageCount(data.pageCount)
      } else {
        setError('Failed to load PDF information')
      }
    } catch (err) {
      console.error('Error loading PDF info:', err)
      setError('Failed to load PDF information')
    } finally {
      setLoading(false)
    }
  }

  const handlePageToggle = (pageNumber: number) => {
    if (selectionMode === 'view') return

    const newSelectedPages = internalSelectedPages.includes(pageNumber)
      ? internalSelectedPages.filter(p => p !== pageNumber)
      : [...internalSelectedPages, pageNumber]

    setInternalSelectedPages(newSelectedPages)
    onPagesSelected?.(newSelectedPages)
  }

  const handleSelectAll = () => {
    const allPages = Array.from({ length: pageCount }, (_, i) => i + 1)
    setInternalSelectedPages(allPages)
    onPagesSelected?.(allPages)
  }

  const handleSelectNone = () => {
    setInternalSelectedPages([])
    onPagesSelected?.([])
  }

  const isPageSelected = (pageNumber: number) => {
    return internalSelectedPages.includes(pageNumber)
  }

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading PDF pages...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || pageCount === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <FileText className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-500">{error || 'No pages found'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {title || file.name}
          </CardTitle>
          <span className="text-sm text-gray-500">
            {pageCount} page{pageCount !== 1 ? 's' : ''}
          </span>
        </div>
        
        {selectionMode !== 'view' && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-8"
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
              className="h-8"
            >
              <Square className="w-4 h-4 mr-1" />
              Select None
            </Button>
            {internalSelectedPages.length > 0 && (
              <span className="text-sm text-gray-600 ml-2">
                {internalSelectedPages.length} selected
              </span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 justify-items-center auto-rows-max">
          {Array.from({ length: pageCount }, (_, index) => {
            const pageNumber = index + 1
            return (
              <div key={pageNumber} className="flex flex-col items-center space-y-2 w-full max-w-fit">
                <PdfThumbnail
                  file={file}
                  pageNumber={pageNumber}
                  isSelected={isPageSelected(pageNumber)}
                  onToggleSelect={() => handlePageToggle(pageNumber)}
                  selectionMode={selectionMode}
                  size="sm"
                />
              </div>
            )
          })}
        </div>
        
        {selectionMode === 'exclude' && internalSelectedPages.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <Trash2 className="w-4 h-4 inline mr-1" />
              {internalSelectedPages.length} page{internalSelectedPages.length !== 1 ? 's' : ''} will be removed
            </p>
          </div>
        )}
        
        {selectionMode === 'include' && internalSelectedPages.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <Eye className="w-4 h-4 inline mr-1" />
              {internalSelectedPages.length} page{internalSelectedPages.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}