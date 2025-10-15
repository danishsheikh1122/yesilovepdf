"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Upload, Type, Square, Circle, Minus, Edit3, Undo, Redo, ZoomIn, ZoomOut, Download, Save } from 'lucide-react';

// Dynamically import PDF.js only in browser environment
let pdfjsLib: any = null;

if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((pdfjs) => {
    pdfjsLib = pdfjs;
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  });
}

interface DrawingElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  fontSize?: number;
  strokeWidth: number;
}

export default function PdfEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }

    setPdfFile(file);
    
    try {
      // Ensure PDF.js is loaded
      if (!pdfjsLib) {
        const pdfjs = await import('pdfjs-dist');
        pdfjsLib = pdfjs;
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      // Clear any existing elements
      setElements([]);
      setHistory([]);
      setHistoryIndex(-1);
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF file');
    }
  }, []);

  // Render PDF page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !pdfjsLib) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Setup overlay canvas
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = viewport.width;
        overlayCanvasRef.current.height = viewport.height;
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Redraw overlay elements
      drawOverlayElements();
      
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }, [pdfDoc, currentPage, scale]);

  // Draw overlay elements
  const drawOverlayElements = useCallback(() => {
    if (!overlayCanvasRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all elements
    elements.forEach(element => {
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      
      switch (element.type) {
        case 'rectangle':
          ctx.strokeRect(element.x, element.y, element.width || 100, element.height || 50);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(element.x, element.y, (element.width || 50) / 2, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case 'line':
          ctx.beginPath();
          ctx.moveTo(element.x, element.y);
          ctx.lineTo(element.x + (element.width || 100), element.y + (element.height || 0));
          ctx.stroke();
          break;
        case 'text':
          ctx.font = `${element.fontSize || 16}px Arial`;
          ctx.fillText(element.text || 'Text', element.x, element.y);
          break;
      }
      
      // Highlight selected element
      if (selectedElement === element.id) {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(element.x - 5, element.y - 5, (element.width || 50) + 10, (element.height || 20) + 10);
        ctx.setLineDash([]);
      }
    });
  }, [elements, selectedElement]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current) return;
    
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (selectedTool === 'select') {
      // Find clicked element
      const clickedElement = elements.find(el => {
        return x >= el.x && x <= el.x + (el.width || 50) &&
               y >= el.y - (el.fontSize || 16) && y <= el.y + (el.height || 20);
      });
      
      setSelectedElement(clickedElement?.id || null);
      drawOverlayElements();
    } else {
      // Add new element
      const newElement: DrawingElement = {
        id: Date.now().toString(),
        type: selectedTool as any,
        x,
        y,
        color: currentColor,
        strokeWidth,
        fontSize,
        width: selectedTool === 'rectangle' ? 100 : selectedTool === 'circle' ? 100 : selectedTool === 'line' ? 100 : undefined,
        height: selectedTool === 'rectangle' ? 50 : selectedTool === 'line' ? 0 : undefined,
        text: selectedTool === 'text' ? 'Edit text' : undefined,
      };
      
      const newElements = [...elements, newElement];
      setElements(newElements);
      
      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newElements);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [selectedTool, elements, currentColor, strokeWidth, fontSize, history, historyIndex]);

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Save/Download functionality
  const saveEditedPdf = useCallback(() => {
    if (!canvasRef.current || !overlayCanvasRef.current) return;
    
    // Create a temporary canvas to combine PDF and overlay
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    
    // Draw PDF
    tempCtx.drawImage(canvasRef.current, 0, 0);
    
    // Draw overlay
    tempCtx.drawImage(overlayCanvasRef.current, 0, 0);
    
    // Download as image
    const link = document.createElement('a');
    link.download = `edited-page-${currentPage}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
  }, [currentPage]);

  // Effect to render page when dependencies change
  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [renderPage]);

  // Effect to redraw overlay when elements change
  useEffect(() => {
    drawOverlayElements();
  }, [drawOverlayElements]);

  // If no PDF is uploaded, show upload interface
  if (!pdfFile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Upload className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload PDF to Edit</h3>
        <p className="text-gray-500 mb-6">Select a PDF file to start editing</p>
        <Button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Choose PDF File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-gray-100">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-white shadow-sm border-b">
        {/* File Operations */}
        <Button
          variant={selectedTool === 'select' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTool('select')}
          className="flex items-center gap-1"
        >
          <Edit3 className="w-4 h-4" />
          Select
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Drawing Tools */}
        <Button
          variant={selectedTool === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTool('text')}
        >
          <Type className="w-4 h-4" />
        </Button>

        <Button
          variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTool('rectangle')}
        >
          <Square className="w-4 h-4" />
        </Button>

        <Button
          variant={selectedTool === 'circle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTool('circle')}
        >
          <Circle className="w-4 h-4" />
        </Button>

        <Button
          variant={selectedTool === 'line' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTool('line')}
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Style Controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Size:</label>
          <Slider
            value={[strokeWidth]}
            onValueChange={(value) => setStrokeWidth(value[0])}
            max={10}
            min={1}
            step={1}
            className="w-20"
          />
        </div>

        {/* Color Picker */}
        <input
          type="color"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
        />

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* History Controls */}
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={historyIndex <= 0}
        >
          <Undo className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
        >
          <Redo className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Zoom Controls */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale(scale * 1.2)}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale(scale / 1.2)}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <div className="flex-1" />

        {/* Save Controls */}
        <Button
          onClick={saveEditedPdf}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Save Page
        </Button>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-center gap-4 p-2 bg-white border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-200 p-4">
        <div className="flex justify-center">
          <div className="relative shadow-lg">
            {/* PDF Canvas */}
            <canvas
              ref={canvasRef}
              className="border border-gray-300 bg-white"
            />
            {/* Overlay Canvas for annotations */}
            <canvas
              ref={overlayCanvasRef}
              className="absolute top-0 left-0 cursor-crosshair"
              onClick={handleCanvasClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}