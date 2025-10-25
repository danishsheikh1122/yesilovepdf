'use client';
import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Upload, Download, FileText, Zap, Eye, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pdfTrackers } from '@/lib/pdfTracking';
import SupabaseUploadStatus, { useSupabaseUploadInfo } from '@/components/SupabaseUploadStatus';

interface CompressionLevel {
  value: string;
  label: string;
  description: string;
  reduction: string;
}

const compressionLevels: CompressionLevel[] = [
  {
    value: 'basic',
    label: 'Light Compression',
    description: 'Preserves original quality with minimal optimization. Perfect for high-quality documents.',
    reduction: '~10-25% smaller'
  },
  {
    value: 'strong',
    label: 'Balanced Compression',
    description: 'Good balance between quality and file size. Suitable for most use cases.',
    reduction: '~50-65% smaller'
  },
  {
    value: 'extreme',
    label: 'Maximum Compression',
    description: 'More aggressive compression while maintaining readability.',
    reduction: '~70-80% smaller'
  }
];

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState('strong');
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    ratio: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [lastResponse, setLastResponse] = useState<Response | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setCompressionStats(null);
      setShowPreview(false);
      setCompressedBlob(null);
    } else {
      alert('Please select a valid PDF file');
    }
  }, []);

  const handleCompress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a PDF file');
      return;
    }

    setLoading(true);
    setCompressionStats(null);

    const formData = new FormData();
    formData.append('files', file);
    formData.append('compressionLevel', compressionLevel);

    try {
      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Compression failed');
      }

      // Store the response for Supabase upload info
      setLastResponse(response);

      // Get compression stats from headers
      const originalSize = parseInt(response.headers.get('X-Original-Size') || '0');
      const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || '0');
      const ratio = response.headers.get('X-Compression-Ratio') || '0';

      setCompressionStats({
        originalSize,
        compressedSize,
        ratio
      });

      // Store the compressed blob for preview
      const blob = await response.blob();
      setCompressedBlob(blob);
      setShowPreview(true);

      // Track the compression action
      await pdfTrackers.compress(file);

    } catch (error) {
      console.error('Compression error:', error);
      alert(error instanceof Error ? error.message : 'Failed to compress PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob || !file) return;

    const downloadUrl = URL.createObjectURL(compressedBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `compressed_${file.name}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setCompressionStats(null);
      setShowPreview(false);
      setCompressedBlob(null);
    } else {
      alert('Please drop a valid PDF file');
    }
  }, []);

  const handleBack = () => {
    setShowPreview(false);
    setCompressionStats(null);
    setCompressedBlob(null);
  };

  if (showPreview && compressedBlob) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Compression
            </Button>
            
            <div className="flex gap-4">
              <Button
                onClick={handleDownload}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Compressed PDF
              </Button>
            </div>
          </div>

          {/* Compression Stats */}
          {compressionStats && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Compression Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatFileSize(compressionStats.originalSize)}</div>
                    <div className="text-sm text-gray-600">Original Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatFileSize(compressionStats.compressedSize)}</div>
                    <div className="text-sm text-gray-600">Compressed Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{compressionStats.ratio}%</div>
                    <div className="text-sm text-gray-600">Size Reduction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatFileSize(compressionStats.originalSize - compressionStats.compressedSize)}
                    </div>
                    <div className="text-sm text-gray-600">Space Saved</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supabase Upload Status */}
          <SupabaseUploadStatus
            {...useSupabaseUploadInfo(lastResponse)}
            fileName={file?.name}
            onDirectDownload={handleDownload}
          />

          {/* PDF Preview */}
          <Card>
            <CardContent className="p-0">
              <div className="bg-gray-100 p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  compressed_{file?.name} • Preview
                </h3>
              </div>
              <div className="h-[600px] bg-gray-50">
                <iframe
                  src={URL.createObjectURL(compressedBlob)}
                  className="w-full h-full border-0"
                  title="Compressed PDF Preview"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Compress PDF</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Reduce your PDF file size while maintaining quality. Choose from different compression levels based on your needs.
          </p>
        </div>

        {/* File Upload */}
        <Card 
          className={cn(
            "border-2 border-dashed transition-all duration-300 cursor-pointer",
            file 
              ? "border-green-500 bg-green-50/50" 
              : "border-gray-300 hover:border-red-300 hover:bg-red-50/50"
          )}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CardContent className="p-12 text-center">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            
            {file ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-700 mb-2">{file.name}</h3>
                  <p className="text-green-600">{formatFileSize(file.size)}</p>
                </div>
                <label
                  htmlFor="pdf-upload"
                  className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors"
                >
                  Choose Different File
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-10 h-10 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Choose file or drag it here
                  </h3>
                  <p className="text-gray-600">
                    Split a PDF into multiple files or extract specific pages
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports .pdf files up to 100MB each
                  </p>
                </div>
                <label
                  htmlFor="pdf-upload"
                  className="inline-block px-8 py-3 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700 transition-colors text-lg font-medium"
                >
                  Browse Files
                </label>
                <p className="text-sm text-gray-500">
                  Press Enter after uploading to continue quickly
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compression Options */}
        {file && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Choose Compression Level</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {compressionLevels.map((level) => (
                  <label
                    key={level.value}
                    className={cn(
                      "block p-6 border-2 rounded-lg cursor-pointer transition-all duration-200",
                      compressionLevel === level.value
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-red-300 hover:bg-red-50/50"
                    )}
                  >
                    <input
                      type="radio"
                      name="compressionLevel"
                      value={level.value}
                      checked={compressionLevel === level.value}
                      onChange={(e) => setCompressionLevel(e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center space-y-2">
                      <div className="text-lg font-semibold text-gray-900">{level.label}</div>
                      <div className="text-sm text-gray-600">{level.description}</div>
                      <div className="text-xs font-medium text-red-600">{level.reduction}</div>
                    </div>
                  </label>
                ))}
              </div>

              <Button
                onClick={handleCompress}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-medium"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Compressing PDF...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Compress PDF
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}