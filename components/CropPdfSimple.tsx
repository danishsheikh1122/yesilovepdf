"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Upload } from "lucide-react";
import { pdfTrackers } from "@/lib/pdfTracking";

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

export default function CropPdfSimple() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragStart>({ x: 0, y: 0 });
  const [pageSelection, setPageSelection] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert PDF to images for preview
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      alert("Please select a valid PDF file");
      return;
    }

    setIsLoading(true);
    try {
      // We'll convert PDF pages to images using our backend
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pdf-to-images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process PDF");
      }

      const { pages } = await response.json();

      setPdfFile(file);
      setPdfPages(pages);
      setTotalPages(pages.length);
      setCurrentPage(0);
      setCropArea(null);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Error loading PDF file");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle crop area creation
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragStart({ x, y });
    setIsDragging(true);
    setCropArea({ x, y, width: 0, height: 0 });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
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
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Crop PDF processing
  const handleCropPdf = async () => {
    if (!pdfFile || !cropArea || !imageRef.current) {
      alert("Please select a crop area first");
      return;
    }

    setIsProcessing(true);

    try {
      const image = imageRef.current;
      const scaleX = 1; // We'll calculate proper scaling in backend
      const scaleY = 1;

      // Get image dimensions for scaling
      const imageRect = image.getBoundingClientRect();
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;

      const scaleFactorX = naturalWidth / imageRect.width;
      const scaleFactorY = naturalHeight / imageRect.height;

      // Scale crop coordinates to actual image size
      const scaledCrop = {
        x: cropArea.x * scaleFactorX,
        y: cropArea.y * scaleFactorY,
        width: cropArea.width * scaleFactorX,
        height: cropArea.height * scaleFactorY,
        pageSelection,
        selectedPages: pageSelection === "current" ? [currentPage] : [],
      };

      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("cropData", JSON.stringify(scaledCrop));

      const response = await fetch("/api/crop", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to crop PDF");
      }

      // Download cropped PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cropped-${pdfFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Track the crop action
      await pdfTrackers.crop(pdfFile);
    } catch (error) {
      console.error("Error cropping PDF:", error);
      alert("Error cropping PDF. Please try again.");
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
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
      setCropArea(null); // Reset crop when changing pages
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

        {pdfPages.length === 0 ? (
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
                    const files = Array.from(e.dataTransfer.files || []).filter(
                      (f) => f.type === "application/pdf"
                    );
                    if (files.length > 0) {
                      handleFileUpload(files[0]);
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
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Select PDF files"}
                    </Button>
                    <p className="text-sm text-gray-500">or drop PDFs here</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Preview Area */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="space-y-4">
                  {/* Image Container */}
                  <div
                    ref={containerRef}
                    className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-white cursor-crosshair"
                    style={{ maxHeight: "70vh" }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      ref={imageRef}
                      src={pdfPages[currentPage]}
                      alt={`Page ${currentPage + 1}`}
                      className="max-w-full h-auto"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "top left",
                      }}
                      draggable={false}
                    />

                    {/* Crop Overlay */}
                    {cropArea && (
                      <>
                        {/* Semi-transparent overlay outside crop area */}
                        <div
                          className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none"
                          style={{
                            clipPath: `polygon(
                              0% 0%, 
                              0% 100%, 
                              ${cropArea.x}px 100%, 
                              ${cropArea.x}px ${cropArea.y}px, 
                              ${cropArea.x + cropArea.width}px ${cropArea.y}px, 
                              ${cropArea.x + cropArea.width}px ${
                              cropArea.y + cropArea.height
                            }px,
                              ${cropArea.x}px ${
                              cropArea.y + cropArea.height
                            }px,
                              ${cropArea.x}px 100%, 
                              100% 100%, 
                              100% 0%
                            )`,
                          }}
                        />
                        {/* Crop area border */}
                        <div
                          className="absolute border-2 border-red-500 pointer-events-none"
                          style={{
                            left: `${cropArea.x}px`,
                            top: `${cropArea.y}px`,
                            width: `${cropArea.width}px`,
                            height: `${cropArea.height}px`,
                          }}
                        />
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
                        disabled={currentPage <= 0}
                      >
                        ←
                      </Button>
                      <span className="text-sm font-medium">
                        {currentPage + 1} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
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
                        onChange={(e) =>
                          handleZoomChange(Number(e.target.value))
                        }
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
                    Click and drag on the document to create the crop area. You
                    can resize it if needed.
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
                        checked={pageSelection === "all"}
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
                        checked={pageSelection === "current"}
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
