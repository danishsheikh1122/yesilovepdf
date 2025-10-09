'use client'

import { useState, useEffect } from 'react'
import { Check, X, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PdfThumbnailProps {
  file: File
  pageNumber: number
  isSelected?: boolean
  onToggleSelect?: () => void
  selectionMode?: 'include' | 'exclude' | 'view'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function PdfThumbnail({
  file,
  pageNumber,
  isSelected = false,
  onToggleSelect,
  selectionMode = 'view',
  size = 'md',
  className
}: PdfThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const sizeClasses = {
    sm: 'w-28 h-40 sm:w-32 sm:h-44',    // Responsive sizing for small thumbnails
    md: 'w-36 h-52 sm:w-40 sm:h-56',    // Responsive sizing for medium thumbnails
    lg: 'w-44 h-60 sm:w-48 sm:h-64'     // Responsive sizing for large thumbnails
  }

  useEffect(() => {
    loadPdfPage()
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl)
      }
    }
  }, [file, pageNumber])

  const loadPdfPage = async () => {
    try {
      setLoading(true)
      setError(false)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('pageNumber', pageNumber.toString())

      const response = await fetch('/api/pdf-thumbnail', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setThumbnailUrl(url)
      } else {
        console.error('Server returned error:', response.status)
        setError(true)
      }
    } catch (err) {
      console.error('Error loading PDF page:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    if (onToggleSelect && selectionMode !== 'view') {
      onToggleSelect()
    }
  }

  const renderSelectionIndicator = () => {
    if (selectionMode === 'view') return null

    const isIncluded = selectionMode === 'include' ? isSelected : !isSelected

    return (
      <div className="absolute top-2 right-2 z-10">
        <div
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
            isIncluded
              ? 'bg-green-500 border-green-500 text-white'
              : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
          )}
        >
          {isIncluded && <Check className="w-4 h-4" />}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
          <span className="text-xs text-gray-500">Loading page {pageNumber}...</span>
        </div>
      )
    }

    if (error || !thumbnailUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50">
          <FileText className="w-12 h-12 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-600">Page {pageNumber}</span>
          <span className="text-xs text-gray-400 mt-1">Preview unavailable</span>
        </div>
      )
    }

    return (
      <div className="w-full h-full relative bg-white overflow-hidden">
        <iframe
          src={`${thumbnailUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          className="w-full h-full border-0 pointer-events-none absolute inset-0"
          title={`Page ${pageNumber}`}
        />
      </div>
    )
  }

  return (
    <div className={cn('relative group flex flex-col items-center', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border-2 transition-all cursor-pointer shadow-md hover:shadow-xl flex-shrink-0',
          sizeClasses[size],
          isSelected && selectionMode === 'exclude'
            ? 'border-red-400 bg-red-50 ring-2 ring-red-200'
            : isSelected && selectionMode === 'include'
            ? 'border-green-400 bg-green-50 ring-2 ring-green-200'
            : 'border-gray-300 hover:border-gray-400 bg-white'
        )}
        onClick={handleClick}
      >
        {renderContent()}
        {renderSelectionIndicator()}
        
        {/* Selection overlay */}
        {isSelected && selectionMode !== 'view' && (
          <div
            className={cn(
              'absolute inset-0 transition-opacity pointer-events-none',
              selectionMode === 'exclude'
                ? 'bg-red-500 bg-opacity-10'
                : 'bg-green-500 bg-opacity-10'
            )}
          />
        )}

        {/* Exclude overlay with X */}
        {isSelected && selectionMode === 'exclude' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <X className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
      </div>
      
      {/* Page number */}
      <div className="text-center mt-2 flex-shrink-0">
        <span className="text-xs font-semibold text-gray-700 bg-white px-2 py-1 rounded-full border border-gray-200 shadow-sm">
          Page {pageNumber}
        </span>
      </div>
    </div>
  )
}