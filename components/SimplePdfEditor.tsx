"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Upload,
  Type,
  Square,
  Circle,
  Minus,
  Pen,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
} from "lucide-react";
import { pdfTrackers } from "@/lib/pdfTracking";

interface DrawingElement {
  id: string;
  type: "text" | "rectangle" | "circle" | "line" | "freehand";
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color: string;
  fontSize?: number;
  strokeWidth: number;
  points?: { x: number; y: number }[];
}

export default function SimplePdfEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [currentColor, setCurrentColor] = useState("#FF0000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(16);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingElement | null>(
    null
  );
  const [scale, setScale] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || file.type !== "application/pdf") {
        alert("Please select a valid PDF file");
        return;
      }

      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);

      // Clear any existing elements
      setElements([]);
      setHistory([]);
      setHistoryIndex(-1);
    },
    []
  );

  // Draw all elements on canvas
  const drawElements = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all elements
    [...elements, currentDrawing].filter(Boolean).forEach((element) => {
      if (!element) return;

      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      switch (element.type) {
        case "rectangle":
          if (element.width && element.height) {
            ctx.strokeRect(element.x, element.y, element.width, element.height);
          }
          break;
        case "circle":
          if (element.radius) {
            ctx.beginPath();
            ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;
        case "line":
          if (element.x2 !== undefined && element.y2 !== undefined) {
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(element.x2, element.y2);
            ctx.stroke();
          }
          break;
        case "freehand":
          if (element.points && element.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            element.points.forEach((point) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;
        case "text":
          if (element.text) {
            ctx.font = `${element.fontSize || 16}px Arial`;
            ctx.fillText(element.text, element.x, element.y);
          }
          break;
      }

      // Highlight selected element
      if (selectedElement === element.id) {
        ctx.strokeStyle = "#007bff";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const padding = 10;
        ctx.strokeRect(
          element.x - padding,
          element.y - padding,
          (element.width || element.radius || 50) + padding * 2,
          (element.height || element.radius || 20) + padding * 2
        );
        ctx.setLineDash([]);
      }
    });
  }, [elements, selectedElement, currentDrawing]);

  // Handle canvas mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || selectedTool === "select") return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      setIsDrawing(true);

      const newElement: DrawingElement = {
        id: Date.now().toString(),
        type: selectedTool as any,
        x,
        y,
        color: currentColor,
        strokeWidth,
        fontSize,
        points: selectedTool === "freehand" ? [{ x, y }] : undefined,
      };

      if (selectedTool === "text") {
        const text = prompt("Enter text:");
        if (text) {
          newElement.text = text;
          addElementToHistory([...elements, newElement]);
        }
        setIsDrawing(false);
      } else {
        setCurrentDrawing(newElement);
      }
    },
    [selectedTool, currentColor, strokeWidth, fontSize, elements, scale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !currentDrawing || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const updatedElement = { ...currentDrawing };

      switch (currentDrawing.type) {
        case "rectangle":
          updatedElement.width = x - currentDrawing.x;
          updatedElement.height = y - currentDrawing.y;
          break;
        case "circle":
          const dx = x - currentDrawing.x;
          const dy = y - currentDrawing.y;
          updatedElement.radius = Math.sqrt(dx * dx + dy * dy);
          break;
        case "line":
          updatedElement.x2 = x;
          updatedElement.y2 = y;
          break;
        case "freehand":
          updatedElement.points = [...(updatedElement.points || []), { x, y }];
          break;
      }

      setCurrentDrawing(updatedElement);
    },
    [isDrawing, currentDrawing, scale]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentDrawing) {
      addElementToHistory([...elements, currentDrawing]);
      setCurrentDrawing(null);
    }
    setIsDrawing(false);
  }, [isDrawing, currentDrawing, elements]);

  const addElementToHistory = useCallback(
    (newElements: DrawingElement[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newElements);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setElements(newElements);
    },
    [history, historyIndex]
  );

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1] || []);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Clear all annotations
  const clearAll = useCallback(() => {
    if (confirm("Are you sure you want to clear all annotations?")) {
      addElementToHistory([]);
    }
  }, [addElementToHistory]);

  // Save as image
  const saveAsImage = useCallback(async () => {
    if (!pdfContainerRef.current || !canvasRef.current) return;

    try {
      // Use html2canvas or similar to capture the combined view
      const link = document.createElement("a");
      link.download = `edited-${pdfFile?.name || "document"}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();

      // Track the edit action
      if (pdfFile) await pdfTrackers.edit(pdfFile);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving file");
    }
  }, [pdfFile]);

  // Redraw when elements change
  React.useEffect(() => {
    drawElements();
  }, [drawElements]);

  // Update canvas size when PDF container size changes
  React.useEffect(() => {
    if (pdfContainerRef.current && canvasRef.current) {
      const resizeCanvas = () => {
        const container = pdfContainerRef.current;
        const canvas = canvasRef.current;
        if (container && canvas) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
          drawElements();
        }
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, [pdfUrl, drawElements]);

  // If no PDF is uploaded, show upload interface
  if (!pdfFile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Upload className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Upload PDF to Edit
        </h3>
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
    <div className="flex flex-col w-full h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-white shadow-sm border-b">
        {/* Tools */}
        <Button
          variant={selectedTool === "select" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTool("select")}
        >
          Select
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant={selectedTool === "text" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTool("text")}
          title="Add Text"
        >
          <Type className="w-4 h-4" />
        </Button>

        <Button
          variant={selectedTool === "freehand" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTool("freehand")}
          title="Draw Freehand"
        >
          <Pen className="w-4 h-4" />
        </Button>

        <Button
          variant={selectedTool === "rectangle" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTool("rectangle")}
          title="Rectangle"
        >
          <Square className="w-4 h-4" />
        </Button>

        <Button
          variant={selectedTool === "circle" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTool("circle")}
          title="Circle"
        >
          <Circle className="w-4 h-4" />
        </Button>

        <Button
          variant={selectedTool === "line" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTool("line")}
          title="Line"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

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
          className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
          title="Choose Color"
        />

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* History Controls */}
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={historyIndex <= 0}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          title="Clear All"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Zoom Controls */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale(Math.min(scale * 1.2, 3))}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale(Math.max(scale / 1.2, 0.5))}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <div className="flex-1" />

        {/* Save Controls */}
        <Button onClick={saveAsImage} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Save
        </Button>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200 p-4">
        <div className="flex justify-center">
          <div
            ref={pdfContainerRef}
            className="relative bg-white shadow-lg"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            {/* PDF Viewer */}
            <iframe
              src={pdfUrl}
              className="w-full h-[800px] border-0"
              title="PDF Viewer"
            />
            {/* Overlay Canvas for annotations */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full cursor-crosshair pointer-events-auto"
              style={{ touchAction: "none" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
