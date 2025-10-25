"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SketchPicker } from "react-color";
import { pdfTrackers } from "@/lib/pdfTracking";
import { 
  Type, 
  Square, 
  Circle, 
  Download, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut,
  Highlighter,
  Move,
  Minus,
  Upload
} from "lucide-react";

interface PdfEditorProps {
  pdfUrl?: string;
}

export default function PdfEditor({ pdfUrl = "/sample.pdf" }: PdfEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [tool, setTool] = useState<'select' | 'text' | 'rectangle' | 'circle' | 'highlight' | 'line'>('select');
  const [color, setColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(18);
  const [scale, setScale] = useState(1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState<any[]>([]);
  const [history, setHistory] = useState<any[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // PDF.js dynamic import to avoid SSR issues
  const loadPdf = useCallback(async (url: string) => {
    try {
      const { loadPDFJS } = await import('@/lib/pdfjs-cdn');
      const pdfjs = await loadPDFJS();
      
      // Set worker path
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      const loadingTask = pdfjs.getDocument(url);
      const pdf = await loadingTask.promise;
      
      // Render first page
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Setup overlay canvas
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.height = viewport.height;
        overlay.width = viewport.width;
      }
      
      if (!context) {
        console.error('Canvas context is null');
        return;
      }
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }, [scale]);

  useEffect(() => {
    loadPdf(pdfUrl);
  }, [loadPdf, pdfUrl]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      loadPdf(url);
    }
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'select') return;
    
    const pos = getMousePos(e);
    setStartPos(pos);
    setIsDrawing(true);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'select') return;
    
    const pos = getMousePos(e);
    const newElement = {
      tool,
      startPos,
      endPos: pos,
      color,
      fontSize,
      id: Date.now()
    };
    
    const newElements = [...elements, newElement];
    setElements(newElements);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    setIsDrawing(false);
    redrawCanvas();
  };

  const redrawCanvas = () => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    elements.forEach(element => {
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = 2;
      ctx.font = `${element.fontSize}px Arial`;
      
      switch (element.tool) {
        case 'rectangle':
          const width = element.endPos.x - element.startPos.x;
          const height = element.endPos.y - element.startPos.y;
          ctx.strokeRect(element.startPos.x, element.startPos.y, width, height);
          break;
          
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(element.endPos.x - element.startPos.x, 2) + 
            Math.pow(element.endPos.y - element.startPos.y, 2)
          );
          ctx.beginPath();
          ctx.arc(element.startPos.x, element.startPos.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
          
        case 'line':
          ctx.beginPath();
          ctx.moveTo(element.startPos.x, element.startPos.y);
          ctx.lineTo(element.endPos.x, element.endPos.y);
          ctx.stroke();
          break;
          
        case 'text':
          ctx.fillText('Edit me', element.startPos.x, element.startPos.y);
          break;
          
        case 'highlight':
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = element.color;
          const highlightWidth = element.endPos.x - element.startPos.x;
          const highlightHeight = element.endPos.y - element.startPos.y;
          ctx.fillRect(element.startPos.x, element.startPos.y, highlightWidth, highlightHeight);
          ctx.globalAlpha = 1;
          break;
      }
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
      redrawCanvas();
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
      redrawCanvas();
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const saveAnnotatedPdf = async () => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    
    try {
      // Track the PDF edit action
      await pdfTrackers.edit(pdfUrl);
    } catch (error) {
      console.error('Failed to track PDF edit:', error);
    }
    
    // Create a new canvas to combine both layers
    const combinedCanvas = document.createElement('canvas');
    const ctx = combinedCanvas.getContext('2d');
    if (!ctx) return;
    
    combinedCanvas.width = canvas.width;
    combinedCanvas.height = canvas.height;
    
    // Draw PDF first, then overlay
    ctx.drawImage(canvas, 0, 0);
    ctx.drawImage(overlay, 0, 0);
    
    // Download as image
    const link = document.createElement('a');
    link.download = 'edited-pdf.png';
    link.href = combinedCanvas.toDataURL();
    link.click();
  };

  useEffect(() => {
    redrawCanvas();
  }, [elements]);

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* File Upload */}
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {/* Tools */}
          <div className="flex gap-2">
            <Button
              variant={tool === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('select')}
            >
              <Move className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('text')}
            >
              <Type className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('rectangle')}
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('circle')}
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('line')}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'highlight' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('highlight')}
            >
              <Highlighter className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Font Size */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Size:</span>
            <div className="w-24">
              <Slider
                min={10}
                max={60}
                step={2}
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
              />
            </div>
          </div>
          
          {/* Color Picker */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-12 h-8"
              style={{ backgroundColor: color }}
            />
            {showColorPicker && (
              <div className="absolute top-12 z-50">
                <div 
                  className="fixed inset-0"
                  onClick={() => setShowColorPicker(false)}
                />
                <SketchPicker
                  color={color}
                  onChange={(colorResult) => setColor(colorResult.hex)}
                />
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={undo}>
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo}>
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button onClick={saveAnnotatedPdf}>
              <Download className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
      
      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-4">
        <div className="relative mx-auto border shadow-lg bg-white" style={{ display: 'inline-block' }}>
          <canvas
            ref={canvasRef}
            className="block"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
          />
          <canvas
            ref={overlayRef}
            className="absolute top-0 left-0 cursor-crosshair"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
}