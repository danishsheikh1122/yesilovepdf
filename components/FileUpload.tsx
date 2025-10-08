'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  multiple?: boolean
}

export default function FileUpload({ 
  onFilesSelected, 
  acceptedTypes = ['.pdf'], 
  maxFiles = 10,
  multiple = true 
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = multiple ? [...uploadedFiles, ...acceptedFiles] : acceptedFiles
    setUploadedFiles(newFiles)
    onFilesSelected(newFiles)
  }, [uploadedFiles, multiple, onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    multiple
  })

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <Card 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed transition-all duration-300 cursor-pointer",
          isDragActive 
            ? "border-blue-400 bg-blue-50/50" 
            : "border-gray-300 hover:border-blue-300 hover:bg-blue-50/30"
        )}
      >
        <CardContent className="p-12 text-center">
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-colors",
              isDragActive ? "bg-blue-100" : "bg-gray-100"
            )}>
              <Upload className={cn(
                "w-10 h-10 transition-colors",
                isDragActive ? "text-blue-600" : "text-gray-500"
              )} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isDragActive ? "Drop your files here" : "Choose files or drag them here"}
              </h3>
              <p className="text-gray-600">
                Supports {acceptedTypes.join(', ')} files up to 100MB each
              </p>
            </div>
            <Button 
              type="button" 
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              Browse Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Uploaded Files</h4>
          {uploadedFiles.map((file, index) => (
            <Card key={index} className="bg-gray-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}