'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, RotateCw, GripVertical, Trash2, Image as ImageIcon, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ImageOperation {
  originalIndex: number
  rotation: number
  newPosition: number
  file: File
}

interface ImageOrganizerProps {
  files: File[]
  onOrganize?: (operations: ImageOperation[], options: any) => void
  onFilesChange?: (files: File[]) => void
  className?: string
}

interface OrganizedImage {
  originalIndex: number
  file: File
  rotation: number
  id: string
  previewUrl: string
}

export default function ImageOrganizer({ 
  files, 
  onOrganize,
  onFilesChange,
  className 
}: ImageOrganizerProps) {
  const [organizedImages, setOrganizedImages] = useState<OrganizedImage[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [options, setOptions] = useState({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: '10'
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initialize organized images with original order
    const initialImages = files.map((file, index) => ({
      originalIndex: index,
      file: file,
      rotation: 0,
      id: `image-${index}-${Date.now()}`,
      previewUrl: URL.createObjectURL(file)
    }))
    setOrganizedImages(initialImages)

    // Cleanup previous URLs
    return () => {
      initialImages.forEach(img => {
        URL.revokeObjectURL(img.previewUrl)
      })
    }
  }, [files])

  const rotateImage = (imageId: string, rotationDelta: number) => {
    setOrganizedImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, rotation: (img.rotation + rotationDelta) % 360 }
        : img
    ))
  }

  const removeImage = (imageId: string) => {
    const imageToRemove = organizedImages.find(img => img.id === imageId)
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.previewUrl)
      const newImages = organizedImages.filter(img => img.id !== imageId)
      setOrganizedImages(newImages)
      
      // Update parent component with new file list
      const newFiles = newImages.map(img => img.file)
      onFilesChange?.(newFiles)
    }
  }

  const duplicateImage = (imageId: string) => {
    const imageToClone = organizedImages.find(img => img.id === imageId)
    if (imageToClone) {
      const newImage = {
        ...imageToClone,
        id: `${imageId}-clone-${Date.now()}`,
        previewUrl: URL.createObjectURL(imageToClone.file)
      }
      setOrganizedImages(prev => {
        const index = prev.findIndex(img => img.id === imageId)
        return [...prev.slice(0, index + 1), newImage, ...prev.slice(index + 1)]
      })
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, imageId: string) => {
    setDraggedItem(imageId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, imageId: string) => {
    e.preventDefault()
    setDragOverItem(imageId)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetImageId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetImageId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    setOrganizedImages(prev => {
      const newImages = [...prev]
      const draggedIndex = newImages.findIndex(img => img.id === draggedItem)
      const targetIndex = newImages.findIndex(img => img.id === targetImageId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedImage] = newImages.splice(draggedIndex, 1)
        newImages.splice(targetIndex, 0, draggedImage)
      }
      
      return newImages
    })

    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleAddMoreImages = (newFiles: FileList | null) => {
    if (!newFiles) return
    
    const imageFiles = Array.from(newFiles).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map((file, index) => ({
        originalIndex: organizedImages.length + index,
        file: file,
        rotation: 0,
        id: `image-${organizedImages.length + index}-${Date.now()}`,
        previewUrl: URL.createObjectURL(file)
      }))
      
      setOrganizedImages(prev => [...prev, ...newImages])
      
      // Update parent component with new file list
      const allFiles = [...organizedImages.map(img => img.file), ...imageFiles]
      onFilesChange?.(allFiles)
    }
  }

  const handleConvertToPdf = () => {
    const operations: ImageOperation[] = organizedImages.map((img, index) => ({
      originalIndex: img.originalIndex,
      rotation: img.rotation,
      newPosition: index,
      file: img.file
    }))
    
    onOrganize?.(operations, options)
  }

  return (
    <Card className={cn("bg-white/90 backdrop-blur-sm shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Organize Images</h3>
            <div className="text-sm text-gray-600">
              {organizedImages.length} image{organizedImages.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            Drag images to reorder • Click rotate to turn images • Remove unwanted images
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Page Size
              </label>
              <Select
                value={options.pageSize}
                onValueChange={(value) => setOptions(prev => ({ ...prev, pageSize: value }))}
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Orientation
              </label>
              <Select
                value={options.orientation}
                onValueChange={(value) => setOptions(prev => ({ ...prev, orientation: value }))}
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

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Margin (mm)
              </label>
              <Select
                value={options.margin}
                onValueChange={(value) => setOptions(prev => ({ ...prev, margin: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No margin</SelectItem>
                  <SelectItem value="5">5mm</SelectItem>
                  <SelectItem value="10">10mm</SelectItem>
                  <SelectItem value="15">15mm</SelectItem>
                  <SelectItem value="20">20mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add More Images</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleAddMoreImages(e.target.files)}
                className="hidden"
              />
            </div>

            {organizedImages.length > 0 && (
              <Button 
                onClick={handleConvertToPdf}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Convert to PDF
              </Button>
            )}
          </div>
        </div>

        {organizedImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {organizedImages.map((image, index) => {
              const isDraggedOver = dragOverItem === image.id
              const isBeingDragged = draggedItem === image.id
              
              return (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, image.id)}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, image.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, image.id)}
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

                      {/* Image Controls */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="h-6 w-6 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => rotateImage(image.id, 90)}
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => removeImage(image.id)}
                          title="Remove image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Image Preview */}
                      <div 
                        className="w-full bg-gray-100 rounded border flex items-center justify-center relative overflow-hidden aspect-square"
                        style={{ 
                          transform: image.rotation ? `rotate(${image.rotation}deg)` : undefined 
                        }}
                      >
                        <img 
                          src={image.previewUrl} 
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      
                      <div className="text-center mt-2">
                        <div className="text-xs font-medium text-gray-700">
                          Image {index + 1}
                        </div>
                        <div className="text-xs text-gray-500">
                          {image.file.name}
                        </div>
                        {image.rotation !== 0 && (
                          <div className="text-xs text-blue-600">
                            {image.rotation}° rotated
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No images uploaded</p>
            <p className="text-sm text-gray-500 mt-1">Add images to start organizing</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}