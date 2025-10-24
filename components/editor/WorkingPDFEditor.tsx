'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  FileText, 
  Loader2, 
  Type, 
  Square, 
  Edit3, 
  Image, 
  PenTool, 
  Highlighter,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Hand,
  MousePointer,
  Minus
} from 'lucide-react';

interface PDFElement {
  id: string;
  type: 'text' | 'textbox' | 'highlight' | 'whiteout' | 'signature' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  content?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
}

interface WorkingPDFEditorProps {
  className?: string;
}

const WorkingPDFEditor: React.FC<WorkingPDFEditorProps> = ({ className }) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [elements, setElements] = useState<PDFElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [newTextPosition, setNewTextPosition] = useState({ x: 0, y: 0, pageNumber: 1 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Initialize PDF.js
  const initPdfjs = useCallback(async () => {
    if (typeof window !== 'undefined') {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        return pdfjsLib;
      } catch (error) {
        console.error('Failed to load PDF.js:', error);
        setError('Failed to initialize PDF renderer');
        return null;
      }
    }
    return null;
  }, []);

  // Load and render PDF
  const loadPDF = useCallback(async (pdfFile: File) => {
    try {
      setLoading(true);
      setError(null);
      
      const pdfjsLib = await initPdfjs();
      if (!pdfjsLib) return;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      setPdfDoc(pdf);
      setFile(pdfFile);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      // Initialize canvas refs array
      canvasRefs.current = new Array(pdf.numPages).fill(null);
      
      // Render all pages
      await renderAllPages(pdf, pdfjsLib);
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError('Failed to load PDF file');
    } finally {
      setLoading(false);
    }
  }, [initPdfjs]);

  // Render all PDF pages
  const renderAllPages = useCallback(async (pdf: any, pdfjsLib: any) => {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom });
      
      const canvas = canvasRefs.current[pageNum - 1];
      if (!canvas) continue;
      
      const context = canvas.getContext('2d');
      if (!context) continue;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
    }
  }, [zoom]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      loadPDF(selectedFile);
    } else {
      setError('Please select a valid PDF file');
    }
  }, [loadPDF]);

  // Handle page click for adding elements
  const handlePageClick = useCallback((event: React.MouseEvent, pageNumber: number) => {
    if (activeTool === 'select') return;
    
    const canvas = canvasRefs.current[pageNumber - 1];
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;
    
    if (activeTool === 'text') {
      setIsAddingText(true);
      setNewTextPosition({ x, y, pageNumber });
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    } else if (activeTool === 'textbox') {
      addElement({
        id: Date.now().toString(),
        type: 'textbox',
        x,
        y,
        width: 200,
        height: 30,
        pageNumber,
        content: 'Double click to edit',
        fontSize: 14,
        color: '#000000',
      });
    } else if (activeTool === 'highlight') {
      addElement({
        id: Date.now().toString(),
        type: 'highlight',
        x,
        y,
        width: 100,
        height: 20,
        pageNumber,
        backgroundColor: '#ffff0080',
      });
    } else if (activeTool === 'whiteout') {
      addElement({
        id: Date.now().toString(),
        type: 'whiteout',
        x,
        y,
        width: 100,
        height: 20,
        pageNumber,
        backgroundColor: '#ffffff',
      });
    }
  }, [activeTool, zoom]);

  // Add element to the PDF
  const addElement = useCallback((element: PDFElement) => {
    setElements(prev => [...prev, element]);
    setSelectedElement(element.id);
  }, []);

  // Handle text input submission
  const handleTextSubmit = useCallback((content: string) => {
    if (content.trim() && isAddingText) {
      addElement({
        id: Date.now().toString(),
        type: 'text',
        x: newTextPosition.x,
        y: newTextPosition.y,
        width: content.length * 8, // Approximate width
        height: 16,
        pageNumber: newTextPosition.pageNumber,
        content,
        fontSize: 14,
        color: '#000000',
      });
    }
    setIsAddingText(false);
  }, [isAddingText, newTextPosition, addElement]);

  // Handle zoom changes
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  // Re-render pages when zoom changes
  useEffect(() => {
    if (pdfDoc) {
      (async () => {
        const pdfjsLib = await initPdfjs();
        if (pdfjsLib) {
          await renderAllPages(pdfDoc, pdfjsLib);
        }
      })();
    }
  }, [pdfDoc, zoom, initPdfjs, renderAllPages]);

  // Export PDF with modifications
  const handleExport = useCallback(async () => {
    if (!file) {
      setError('No PDF to export');
      return;
    }

    try {
      setLoading(true);
      const { PDFDocument, rgb } = await import('pdf-lib');
      
      const arrayBuffer = await file.arrayBuffer();
      const existingPdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Apply all modifications
      for (const element of elements) {
        const page = existingPdfDoc.getPages()[element.pageNumber - 1];
        if (!page) continue;

        const { height: pageHeight } = page.getSize();

        if (element.type === 'text' || element.type === 'textbox') {
          page.drawText(element.content || '', {
            x: element.x,
            y: pageHeight - element.y - (element.fontSize || 14),
            size: element.fontSize || 14,
            color: rgb(0, 0, 0),
          });
        } else if (element.type === 'highlight') {
          page.drawRectangle({
            x: element.x,
            y: pageHeight - element.y - element.height,
            width: element.width,
            height: element.height,
            color: rgb(1, 1, 0),
            opacity: 0.5,
          });
        } else if (element.type === 'whiteout') {
          page.drawRectangle({
            x: element.x,
            y: pageHeight - element.y - element.height,
            width: element.width,
            height: element.height,
            color: rgb(1, 1, 1),
          });
        }
      }

      const pdfBytes = await existingPdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError('Failed to export PDF');
    } finally {
      setLoading(false);
    }
  }, [file, elements]);

  // Toolbar component
  const Toolbar = () => (
    <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-gray-900 mr-4">PDF Editor</h1>
          
          {/* Tool buttons */}
          <Button
            variant={activeTool === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTool('select')}
          >
            <MousePointer className="w-4 h-4" />
          </Button>
          
          <Button
            variant={activeTool === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTool('text')}
          >
            <Type className="w-4 h-4" />
          </Button>
          
          <Button
            variant={activeTool === 'textbox' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTool('textbox')}
          >
            <Square className="w-4 h-4" />
          </Button>
          
          <Button
            variant={activeTool === 'highlight' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTool('highlight')}
          >
            <Highlighter className="w-4 h-4" />
          </Button>
          
          <Button
            variant={activeTool === 'whiteout' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTool('whiteout')}
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>

          {/* Page navigation */}
          {pdfDoc && (
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Export button */}
          {pdfDoc && (
            <Button onClick={handleExport} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // No PDF loaded state
  if (!pdfDoc) {
    return (
      <div className={`working-pdf-editor ${className || ''}`}>
        <div className="min-h-screen bg-gray-50">
          <Toolbar />
          
          <div className="max-w-4xl mx-auto p-8">
            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
              <div className="p-12 text-center">
                <div className="space-y-6">
                  <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-blue-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Upload your PDF file
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Drag and drop your PDF here, or click to browse
                    </p>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Select PDF File
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>Supports PDF files up to 50MB</p>
                  </div>
                </div>
              </div>
            </Card>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PDF loaded - show editor
  return (
    <div className={`working-pdf-editor ${className || ''}`}>
      <div className="min-h-screen bg-gray-50">
        <Toolbar />
        
        <div className="flex-1 p-4">
          <div 
            ref={containerRef}
            className="max-w-4xl mx-auto space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]"
          >
            {/* Render all pages */}
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNum = index + 1;
              const pageElements = elements.filter(el => el.pageNumber === pageNum);
              
              return (
                <div key={pageNum} className="relative bg-white shadow-lg rounded-lg overflow-hidden">
                  {/* Page number indicator */}
                  <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-sm z-10">
                    Page {pageNum}
                  </div>
                  
                  {/* Canvas for PDF rendering */}
                  <canvas
                    ref={el => { canvasRefs.current[index] = el; }}
                    className="w-full cursor-crosshair"
                    style={{ 
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      cursor: activeTool === 'select' ? 'default' : 'crosshair'
                    }}
                    onClick={(e) => handlePageClick(e, pageNum)}
                  />
                  
                  {/* Overlay for elements */}
                  <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                    {pageElements.map((element) => (
                      <div
                        key={element.id}
                        className={`absolute border-2 ${
                          selectedElement === element.id ? 'border-blue-500' : 'border-blue-300'
                        } cursor-pointer`}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width,
                          height: element.height,
                          backgroundColor: element.backgroundColor || 'transparent',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElement(element.id);
                        }}
                      >
                        {(element.type === 'text' || element.type === 'textbox') && (
                          <div
                            className="w-full h-full flex items-center px-1 text-sm"
                            style={{ 
                              fontSize: element.fontSize || 14,
                              color: element.color || '#000000',
                            }}
                          >
                            {element.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Text input for adding new text */}
                  {isAddingText && newTextPosition.pageNumber === pageNum && (
                    <div
                      className="absolute z-20"
                      style={{
                        left: newTextPosition.x * zoom,
                        top: newTextPosition.y * zoom,
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      <Input
                        ref={textInputRef}
                        className="bg-white border-2 border-blue-500"
                        placeholder="Type your text..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTextSubmit(e.currentTarget.value);
                            e.currentTarget.value = '';
                          } else if (e.key === 'Escape') {
                            setIsAddingText(false);
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            handleTextSubmit(e.target.value);
                          } else {
                            setIsAddingText(false);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-900">Processing...</span>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-white hover:text-gray-200 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingPDFEditor;