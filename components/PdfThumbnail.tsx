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
    sm: 'w-40 h-52',    // Increased from w-32 h-44
    md: 'w-64 h-80',    // Increased from w-48 h-64
    lg: 'w-80 h-96'     // Increased from w-56 h-72
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
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
          <span className="text-xs text-gray-500">Loading...</span>
        </div>
      )
    }

    if (error || !thumbnailUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50">
          <FileText className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500">Page {pageNumber}</span>
        </div>
      )
    }

    return (
      <iframe
        src={`${thumbnailUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        className="w-full h-full border-0 bg-white pointer-events-none"
        title={`Page ${pageNumber}`}
      />
    )
  }

  return (
    <div className={cn('relative group', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border-2 transition-all cursor-pointer shadow-sm hover:shadow-md',
          sizeClasses[size],
          isSelected && selectionMode === 'exclude'
            ? 'border-red-300 bg-red-50'
            : isSelected && selectionMode === 'include'
            ? 'border-green-300 bg-green-50'
            : 'border-gray-200 hover:border-gray-300'
        )}
        onClick={handleClick}
      >
        {renderContent()}
        {renderSelectionIndicator()}
        
        {/* Selection overlay */}
        {isSelected && selectionMode !== 'view' && (
          <div
            className={cn(
              'absolute inset-0 transition-opacity',
              selectionMode === 'exclude'
                ? 'bg-red-500 bg-opacity-20'
                : 'bg-green-500 bg-opacity-20'
            )}
          />
        )}

        {/* Exclude overlay with X */}
        {isSelected && selectionMode === 'exclude' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <X className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
      </div>
      
      {/* Page number */}
      <div className="text-center mt-2">
        <span className="text-sm font-medium text-gray-700">
          {pageNumber}
        </span>
      </div>
    </div>
  )
}