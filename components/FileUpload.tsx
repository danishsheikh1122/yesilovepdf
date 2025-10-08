'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
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

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= uploadedFiles.length) return
    
    const newFiles = [...uploadedFiles]
    const [movedFile] = newFiles.splice(fromIndex, 1)
    newFiles.splice(toIndex, 0, movedFile)
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
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            {multiple && uploadedFiles.length > 1 && (
              <p className="text-sm text-gray-500">
                Files will be merged in this order
              </p>
            )}
          </div>
          {uploadedFiles.map((file, index) => (
            <Card key={`${file.name}-${index}`} className="bg-gray-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {multiple && uploadedFiles.length > 1 && (
                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveFile(index, index - 1)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveFile(index, index + 1)}
                        disabled={index === uploadedFiles.length - 1}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                        #{index + 1}
                      </span>
                      <p className="font-medium text-gray-900 truncate max-w-xs">
                        {file.name}
                      </p>
                    </div>
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
          {multiple && uploadedFiles.length >= 2 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ Ready to merge! Your PDFs will be combined in the order shown above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}