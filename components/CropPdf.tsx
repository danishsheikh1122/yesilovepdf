'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Upload } from 'lucide-react';

// Dynamic import to avoid SSR issues
let pdfjsLib: any = null;

const initPdfJs = async () => {
  if (typeof window !== 'undefined' && !pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }
  return pdfjsLib;
};

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragStart {
  x: number;
  y: number;
}

export default function CropPdf() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragStart>({ x: 0, y: 0 });
  const [pageSelection, setPageSelection] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

    // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }

    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setPdfFile(file);
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setCropArea(null);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle files selected from FileUpload component
  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Render PDF page to canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale: zoom / 100 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }, [pdfDoc, currentPage, zoom]);

  // Render page when dependencies change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      renderPage();
    }
  }, [renderPage]);

  // Handle crop area creation
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDragStart({ x, y });
    setIsDragging(true);
    setCropArea({ x, y, width: 0, height: 0 });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = currentX - dragStart.x;
    const height = currentY - dragStart.y;
    
    setCropArea({
      x: width > 0 ? dragStart.x : currentX,
      y: height > 0 ? dragStart.y : currentY,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Crop PDF processing
  const handleCropPdf = async () => {
    if (!pdfFile || !cropArea || !canvasRef.current) {
      alert('Please select a crop area first');
      return;
    }

    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const scaleX = canvas.width / canvas.getBoundingClientRect().width;
      const scaleY = canvas.height / canvas.getBoundingClientRect().height;
      
      // Scale crop coordinates to actual canvas size
      const scaledCrop = {
        x: cropArea.x * scaleX,
        y: cropArea.y * scaleY,
        width: cropArea.width * scaleX,
        height: cropArea.height * scaleY,
        pageSelection,
        selectedPages: pageSelection === 'current' ? [currentPage - 1] : []
      };

      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('cropData', JSON.stringify(scaledCrop));

      const response = await fetch('/api/crop', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to crop PDF');
      }

      // Download cropped PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cropped-${pdfFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error cropping PDF:', error);
      alert('Error cropping PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset crop area
  const handleRestore = () => {
    setCropArea(null);
  };

  // Navigation handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(50, Math.min(200, newZoom)));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Crop PDF
        </h1>

        {!pdfDoc ? (
          <div className="w-full max-w-4xl mx-auto">
            <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
              <CardContent className="p-12">
                <div
                  className="flex flex-col items-center justify-center text-center space-y-4"
                  onDragEnter={(e) => e.preventDefault()}
                  onDragLeave={(e) => e.preventDefault()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type === 'application/pdf');
                    if (files.length > 0) {
                      handleFilesSelected(files);
                    }
                  }}
                >
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <Upload className="w-10 h-10 text-red-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Select PDF files to crop
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Choose a PDF file and select the area you want to crop.
                    </p>
                  </div>

                  <div className="flex flex-col items-center space-y-3">
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
                      onClick={() => document.getElementById('crop-pdf-upload')?.click()}
                    >
                      Select PDF files
                    </Button>
                    <p className="text-sm text-gray-500">or drop PDFs here</p>
                  </div>

                  <input
                    id="crop-pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) handleFilesSelected(files);
                    }}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
            
            {isLoading && (
              <div className="text-center mt-4">
                <div className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Loading PDF...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Preview Area */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="space-y-4">
                  {/* Canvas Container */}
                  <div 
                    ref={containerRef}
                    className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-white"
                    style={{ maxHeight: '70vh' }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto cursor-crosshair"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />
                    
                    {/* Crop Overlay: dim outside, transparent inside + corner handles */}
                    {cropArea && (
                      <>
                        <div
                          className="absolute bg-black bg-opacity-40 pointer-events-none"
                          style={{ left: 0, top: 0, width: '100%', height: `${cropArea.y}px` }}
                        />
                        <div
                          className="absolute bg-black bg-opacity-40 pointer-events-none"
                          style={{ left: 0, top: `${cropArea.y}px`, width: `${cropArea.x}px`, height: `${cropArea.height}px` }}
                        />
                        <div
                          className="absolute bg-black bg-opacity-40 pointer-events-none"
                          style={{ left: `${cropArea.x + cropArea.width}px`, top: `${cropArea.y}px`, width: `calc(100% - ${cropArea.x + cropArea.width}px)`, height: `${cropArea.height}px` }}
                        />
                        <div
                          className="absolute bg-black bg-opacity-40 pointer-events-none"
                          style={{ left: 0, top: `${cropArea.y + cropArea.height}px`, width: '100%', height: `calc(100% - ${cropArea.y + cropArea.height}px)` }}
                        />

                        <div
                          className="absolute border-2 border-dashed border-blue-400 pointer-events-auto"
                          style={{ left: `${cropArea.x}px`, top: `${cropArea.y}px`, width: `${cropArea.width}px`, height: `${cropArea.height}px` }}
                        />

                        <div className="absolute w-4 h-4 bg-white border-2 border-blue-400 rounded-full shadow" style={{ left: `${cropArea.x - 6}px`, top: `${cropArea.y - 6}px` }} />
                        <div className="absolute w-4 h-4 bg-white border-2 border-blue-400 rounded-full shadow" style={{ left: `${cropArea.x + cropArea.width - 6}px`, top: `${cropArea.y - 6}px` }} />
                        <div className="absolute w-4 h-4 bg-white border-2 border-blue-400 rounded-full shadow" style={{ left: `${cropArea.x - 6}px`, top: `${cropArea.y + cropArea.height - 6}px` }} />
                        <div className="absolute w-4 h-4 bg-white border-2 border-blue-400 rounded-full shadow" style={{ left: `${cropArea.x + cropArea.width - 6}px`, top: `${cropArea.y + cropArea.height - 6}px` }} />
                      </>
                    )}
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                      >
                        ←
                      </Button>
                      <span className="text-sm font-medium">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        →
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor="zoom" className="text-sm">
                        Zoom:
                      </Label>
                      <select
                        value={zoom}
                        onChange={(e) => handleZoomChange(Number(e.target.value))}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value={50}>50%</option>
                        <option value={75}>75%</option>
                        <option value={100}>100%</option>
                        <option value={125}>125%</option>
                        <option value={150}>150%</option>
                        <option value={200}>200%</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Crop Controls Sidebar */}
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Crop PDF
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRestore}
                    className="text-red-600 hover:text-red-700"
                  >
                    Restore
                  </Button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    Click and drag on the document to create the crop area. 
                    You can resize it if needed.
                  </p>
                </div>

                {/* Page Selection */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-medium text-gray-900">Pages:</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pageSelection"
                        value="all"
                        checked={pageSelection === 'all'}
                        onChange={(e) => setPageSelection(e.target.value)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">All pages</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pageSelection"
                        value="current"
                        checked={pageSelection === 'current'}
                        onChange={(e) => setPageSelection(e.target.value)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">Current page</span>
                    </label>
                  </div>
                </div>

                {/* Crop Action Button */}
                <Button
                  onClick={handleCropPdf}
                  disabled={!cropArea || isProcessing}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Crop PDF
                      <span className="text-lg">✂️</span>
                    </div>
                  )}
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}