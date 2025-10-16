"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pdfTrackers } from "@/lib/pdfTracking";
import {
  Upload,
  Type,
  Square,
  Circle,
  Minus,
  Edit3,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Download,
  Save,
  FileText,
  Palette,
} from "lucide-react";

// Type definitions
interface DrawingElement {
  id: string;
  type: "text" | "rectangle" | "circle" | "line";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  fontSize?: number;
  strokeWidth: number;
}

export default function BrowserPdfEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [currentColor, setCurrentColor] = useState("#FF0000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize PDF.js
  useEffect(() => {
    const initPdfJs = async () => {
      if (typeof window !== "undefined") {
        try {
          const pdfjs = await import("pdfjs-dist");

          // Configure worker
          pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
          setPdfjsLib(pdfjs);
        } catch (error) {
          console.error("Failed to load PDF.js:", error);
        }
      }
    };

    initPdfJs();
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || file.type !== "application/pdf") {
        alert("Please select a valid PDF file");
        return;
      }

      if (!pdfjsLib) {
        alert("PDF.js is not loaded yet. Please try again.");
        return;
      }

      setPdfFile(file);
      setIsLoading(true);

      try {
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
        console.error("Error loading PDF:", error);
        alert("Error loading PDF file. Please make sure it's a valid PDF.");
      } finally {
        setIsLoading(false);
      }
    },
    [pdfjsLib]
  );

  // Render PDF page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !pdfjsLib) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Setup overlay canvas
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = viewport.width;
        overlayCanvasRef.current.height = viewport.height;
      }

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Render PDF page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Re-render overlay elements
      renderOverlay();
    } catch (error) {
      console.error("Error rendering page:", error);
    }
  }, [pdfDoc, currentPage, scale, pdfjsLib]);

  // Render overlay elements
  const renderOverlay = useCallback(() => {
    if (!overlayCanvasRef.current) return;

    const canvas = overlayCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Clear overlay
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all elements
    elements.forEach((element) => {
      context.strokeStyle = element.color;
      context.lineWidth = element.strokeWidth;
      context.fillStyle = element.color;

      switch (element.type) {
        case "rectangle":
          if (element.width && element.height) {
            context.strokeRect(
              element.x,
              element.y,
              element.width,
              element.height
            );
          }
          break;
        case "circle":
          if (element.width) {
            context.beginPath();
            context.arc(
              element.x,
              element.y,
              element.width / 2,
              0,
              2 * Math.PI
            );
            context.stroke();
          }
          break;
        case "line":
          if (element.width && element.height) {
            context.beginPath();
            context.moveTo(element.x, element.y);
            context.lineTo(
              element.x + element.width,
              element.y + element.height
            );
            context.stroke();
          }
          break;
        case "text":
          if (element.text && element.fontSize) {
            context.font = `${element.fontSize}px Arial`;
            context.fillText(element.text, element.x, element.y);
          }
          break;
      }
    });
  }, [elements]);

  // Effect to re-render when page changes
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Effect to re-render overlay when elements change
  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

  // Add element to history
  const addToHistory = useCallback(
    (newElements: DrawingElement[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...newElements]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  // Handle canvas mouse events
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!overlayCanvasRef.current || selectedTool === "select") return;

      const rect = overlayCanvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (selectedTool === "text") {
        const text = prompt("Enter text:");
        if (text) {
          const newElement: DrawingElement = {
            id: Date.now().toString(),
            type: "text",
            x,
            y,
            text,
            color: currentColor,
            fontSize,
            strokeWidth,
          };
          const newElements = [...elements, newElement];
          setElements(newElements);
          addToHistory(newElements);
        }
        return;
      }

      setIsDrawing(true);
      const newElement: DrawingElement = {
        id: Date.now().toString(),
        type: selectedTool as any,
        x,
        y,
        width: 0,
        height: 0,
        color: currentColor,
        strokeWidth,
      };
      setElements([...elements, newElement]);
    },
    [selectedTool, elements, currentColor, strokeWidth, fontSize, addToHistory]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (
        !isDrawing ||
        !overlayCanvasRef.current ||
        selectedTool === "select" ||
        selectedTool === "text"
      )
        return;

      const rect = overlayCanvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setElements((prev) => {
        const newElements = [...prev];
        const lastElement = newElements[newElements.length - 1];

        if (lastElement) {
          lastElement.width = x - lastElement.x;
          lastElement.height = y - lastElement.y;
        }

        return newElements;
      });
    },
    [isDrawing, selectedTool]
  );

  const handleMouseUp = useCallback(async () => {
    if (isDrawing) {
      setIsDrawing(false);
      addToHistory(elements);

      // Track edit action when user finishes drawing
      if (pdfFile) {
        await pdfTrackers.edit(pdfFile);
      }
    }
  }, [isDrawing, elements, addToHistory, pdfFile]);

  // Navigation functions
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Zoom functions
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  // Tool selection
  const tools = [
    { id: "select", label: "Select", icon: Edit3 },
    { id: "text", label: "Text", icon: Type },
    { id: "rectangle", label: "Rectangle", icon: Square },
    { id: "circle", label: "Circle", icon: Circle },
    { id: "line", label: "Line", icon: Minus },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <FileText className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">PDF Editor</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload a PDF and add text, shapes, and annotations directly in your
            browser.
          </p>
        </div>

        {/* File Upload */}
        {!pdfFile && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Upload PDF to Edit
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Select a PDF file to start editing with text and shapes
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || !pdfjsLib}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                >
                  {isLoading
                    ? "Loading..."
                    : !pdfjsLib
                    ? "Initializing..."
                    : "Choose PDF File"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Editor Interface */}
        {pdfFile && pdfDoc && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Tools Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tool Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Drawing Tools</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {tools.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <Button
                          key={tool.id}
                          variant={
                            selectedTool === tool.id ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedTool(tool.id)}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{tool.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-full h-10 rounded border"
                  />
                </div>

                {/* Stroke Width */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Stroke Width: {strokeWidth}px
                  </label>
                  <Slider
                    value={[strokeWidth]}
                    onValueChange={(value) => setStrokeWidth(value[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Font Size: {fontSize}px
                  </label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    min={10}
                    max={48}
                    step={2}
                    className="w-full"
                  />
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={undo}
                      disabled={historyIndex <= 0}
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={redo}
                      disabled={historyIndex >= history.length - 1}
                    >
                      <Redo className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    New File
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Canvas Area */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {pdfFile.name} - Page {currentPage} of {totalPages}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        {Math.round(scale * 100)}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={zoomIn}
                        disabled={scale >= 3}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <Button
                      variant="outline"
                      onClick={goToPrevPage}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={goToNextPage}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                    </Button>
                  </div>

                  {/* Canvas Container */}
                  <div className="relative border border-gray-300 bg-white inline-block max-w-full overflow-auto">
                    <canvas
                      ref={canvasRef}
                      className="block"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute top-0 left-0 cursor-crosshair"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
