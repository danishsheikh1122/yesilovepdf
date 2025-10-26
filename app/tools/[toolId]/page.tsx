"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Download,
  CheckCircle,
  Home,
  RotateCcw,
  Upload,
  FileText,
  Plus,
  X,
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import PdfGallery from "@/components/PdfGallery";
import EnhancedMerge from "@/components/EnhancedMergeNew";
import PdfOrganizer from "@/components/PdfOrganizer";
import ImageOrganizer from "@/components/ImageOrganizer";
import SimplePdfEditor from "@/components/SimplePdfEditor";
import AddPageNumbersComponent from "@/components/AddPageNumbersComponent";
import dynamic from "next/dynamic";
import SupabaseUploadStatus, { useSupabaseUploadInfo } from "@/components/SupabaseUploadStatus";

// Dynamic import to prevent SSR issues with PDF.js
const AddTextWatermarkComponent = dynamic(
  () => import("@/components/AddTextWatermarkComponent"),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading watermark tool...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
);

const toolConfig: Record<string, any> = {
  merge: {
    title: "Merge PDF",
    description: "Combine multiple PDF files into one document",
    acceptedTypes: [".pdf"],
    multiple: true,
    minFiles: 2,
  },
  split: {
    title: "Split PDF",
    description: "Split a PDF into multiple files or extract specific pages",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  compress: {
    title: "Compress PDF",
    description: "Reduce PDF file size while maintaining quality",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  "remove-pages": {
    title: "Remove Pages",
    description: "Delete unwanted pages from your PDF documents",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  "extract-pages": {
    title: "Extract Pages",
    description: "Extract specific pages from PDF to create new documents",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  organize: {
    title: "Organize PDF",
    description: "Reorder, rotate, and manage pages",
    acceptedTypes: [".pdf"],
    multiple: true,
    minFiles: 1,
  },
  "scan-to-pdf": {
    title: "Scan to PDF",
    description: "Convert scanned images to searchable PDFs",
    acceptedTypes: [".jpg", ".jpeg", ".png", ".tiff"],
    multiple: true,
    minFiles: 1,
  },
  repair: {
    title: "Repair PDF",
    description: "Fix corrupted or damaged PDF files",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  ocr: {
    title: "OCR PDF",
    description: "Make scanned PDFs searchable",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  "jpg-to-pdf": {
    title: "Image to PDF",
    description: "Convert images to PDF",
    acceptedTypes: [".jpg", ".jpeg", ".png", ".webp"],
    multiple: true,
    minFiles: 1,
  },
  "word-to-pdf": {
    title: "WORD to PDF",
    description: "Convert Word documents to PDF",
    acceptedTypes: [".doc", ".docx"],
    multiple: false,
    minFiles: 1,
  },
  "powerpoint-to-pdf": {
    title: "PowerPoint to PDF",
    description: "Convert presentations to PDF",
    acceptedTypes: [".ppt", ".pptx"],
    multiple: false,
    minFiles: 1,
  },
  "excel-to-pdf": {
    title: "Excel to PDF",
    description: "Convert spreadsheets to PDF",
    acceptedTypes: [".xls", ".xlsx"],
    multiple: false,
    minFiles: 1,
  },
  "html-to-pdf": {
    title: "HTML to PDF",
    description: "Convert web pages to PDF",
    acceptedTypes: [".html", ".htm"],
    multiple: false,
    minFiles: 1,
  },
  "pdf-to-jpg": {
    title: "PDF to JPG",
    description: "Convert PDF pages to images",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  "pdf-to-word": {
    title: "PDF to WORD",
    description: "Convert PDF to editable Word format",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  "pdf-to-powerpoint": {
    title: "PDF to PowerPoint",
    description: "Convert PDF to PowerPoint",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  "pdf-to-excel": {
    title: "PDF to Excel",
    description: "Extract data to Excel format",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  rotate: {
    title: "Rotate PDF",
    description: "Rotate PDF pages",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  "add-page-numbers": {
    title: "Add Page Numbers",
    description: "Add page numbers to PDF",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  "add-watermark": {
    title: "Add Watermark",
    description: "Add watermarks to protect documents",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  crop: {
    title: "Crop PDF",
    description: "Crop PDF pages",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
  edit: {
    title: "Edit PDF",
    description: "Edit PDF content",
    acceptedTypes: [".pdf"],
    multiple: false,
    minFiles: 1,
  },
};

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const toolId = params.toolId as string;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "processing" | "complete">(
    "idle"
  );
  const [options, setOptions] = useState<Record<string, any>>({});
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageOperations, setPageOperations] = useState<any[]>([]);
  const [compressionResult, setCompressionResult] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: string;
    downloadUrl: string;
    filename: string;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [lastResponse, setLastResponse] = useState<Response | null>(null);

  const tool = toolConfig[toolId];

  // Scroll to top when component mounts or toolId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [toolId]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const filteredFiles = files.filter(file =>
      tool.acceptedTypes.some((type: string) =>
        file.type.includes(type.replace('.', '')) || file.name.toLowerCase().endsWith(type)
      )
    );
    
    if (filteredFiles.length > 0) {
      if (tool.multiple) {
        setSelectedFiles(prev => [...prev, ...filteredFiles]);
      } else {
        setSelectedFiles(filteredFiles.slice(0, 1));
      }
    }
  }, [tool]);

  // Keyboard handler for Enter key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Enter" && selectedFiles.length >= tool.minFiles) {
      // If it's a tool that needs special handling, don't auto-proceed
      if (toolId === "organize" || toolId === "scan-to-pdf" ||
          (toolId === "remove-pages" && selectedPages.length === 0) ||
          (toolId === "extract-pages" && selectedPages.length === 0)) {
        return;
      }
      
      // Auto-proceed to processing for simple tools
      if (toolId !== "merge") {
        // Call handleProcess function if available
        const processBtn = document.querySelector('[data-process-btn]') as HTMLButtonElement;
        if (processBtn && !processBtn.disabled) {
          processBtn.click();
        }
      }
    }
  }, [selectedFiles, tool, toolId, selectedPages]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Special case for edit tool - show PDF editor
  if (toolId === 'edit') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <SimplePdfEditor />
          </div>
        </div>
      </div>
    );
  }

  // Helper function to format file sizes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Clear selected pages when files change
  useEffect(() => {
    setSelectedPages([]);
  }, [selectedFiles]);

  // Initialize quality option for pdf-to-jpg
  useEffect(() => {
    if (toolId === 'pdf-to-jpg' && !options.quality) {
      setOptions(prev => ({ ...prev, quality: 75 }));
    }
  }, [toolId, options.quality]);

  // Initialize default options for add-page-numbers
  useEffect(() => {
    if (toolId === 'add-page-numbers' && Object.keys(options).length === 0) {
      setOptions({
        position: 'bottom-right',
        format: 'number',
        startNumber: 1,
        fontSize: 12,
        color: '#000000',
        marginX: 20,
        marginY: 20
      });
    }
  }, [toolId, options]);

  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Tool not found
          </h1>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }



  const handleProcess = async (overrideOptions?: Record<string, any>) => {
    if (selectedFiles.length >= tool.minFiles) {
      setProcessing(true);
      setStatus("processing");
      setProgress(0);

      try {
        // Simulate initial progress
        await new Promise(resolve => setTimeout(resolve, 100));
        setProgress(10);

        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("files", file));

        setProgress(20);

        // Use overrideOptions (from child component) when provided, otherwise use local options
        const finalOptions = overrideOptions && Object.keys(overrideOptions).length > 0 ? overrideOptions : options;

        // Add tool-specific options
        Object.keys(finalOptions).forEach((key) => {
          // Ensure values are strings when appending
          const value = finalOptions[key];
          formData.append(key, value === undefined || value === null ? '' : String(value));
        });

        // Add selected pages for tools that need them
        if (
          (toolId === "remove-pages" || toolId === "extract-pages") &&
          selectedPages.length > 0
        ) {
          const pagesString = selectedPages.sort((a, b) => a - b).join(",");
          formData.append(
            toolId === "remove-pages" ? "pagesToRemove" : "pagesToExtract",
            pagesString
          );
        }

        setProgress(30);

        console.log('🔄 Frontend: Starting API call to', `/api/${toolId}`);
        
        // Start simulated progress during API call
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev < 60) return prev + 2;
            return prev;
          });
        }, 300);

        const response = await fetch(`/api/${toolId}`, {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setProgress(65);
        console.log('📡 Frontend: API response status:', response.status);

        if (!response.ok) {
          console.error('❌ Frontend: API response not ok:', response.status);
          try {
            const errorData = await response.json();
            console.error('❌ Frontend: Error data:', errorData);
            throw new Error(errorData.error || `Failed to process ${tool.title}`);
          } catch (e) {
            throw new Error(`Failed to process ${tool.title}`);
          }
        }

        // Store the response for Supabase upload info
        setLastResponse(response);

        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(75);

        // Handle compression tool differently - it returns JSON with compression stats
        if (toolId === 'compress') {
          console.log('📊 Frontend: Processing compression response');
          const result = await response.json();
          console.log('📊 Frontend: Compression result:', result);
          
          setCompressionResult({
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            compressionRatio: result.compressionRatio,
            downloadUrl: result.downloadUrl,
            filename: result.filename
          });
          setProgress(100);
          setStatus("complete");
          setProcessing(false);
          console.log('✅ Frontend: Compression complete');
          return;
        }

        // For other tools, handle as blob download
        setProgress(85);
        await new Promise(resolve => setTimeout(resolve, 100));
        const blob = await response.blob();
        setProgress(93);
        await new Promise(resolve => setTimeout(resolve, 100));
        const url = URL.createObjectURL(blob);
        setProgress(97);
        const a = document.createElement("a");
        a.href = url;

        // Set appropriate filename based on tool and content type
        const contentType = response.headers.get("content-type");
        const contentDisposition = response.headers.get("content-disposition");

        let filename = "result";
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(
            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
          );
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, "");
          }
        } else {
          // Default filenames based on tool
          switch (toolId) {
            case "merge":
              filename = "merged-document.pdf";
              break;
            case "split":
              filename = "split-pages.zip";
              break;
            case "compress":
              filename = `compressed-${
                selectedFiles[0]?.name || "document.pdf"
              }`;
              break;
            case "jpg-to-pdf":
              filename = "images-to-pdf.pdf";
              break;
            case "pdf-to-jpg":
              filename = contentType?.includes("zip")
                ? "pdf-images.zip"
                : "page-1.jpg";
              break;
            case "pdf-to-word":
              filename = `${
                selectedFiles[0]?.name?.replace('.pdf', '') || "document"
              }.docx`;
              break;
            case "pdf-to-powerpoint":
              filename = `${
                selectedFiles[0]?.name?.replace('.pdf', '') || "presentation"
              }.pptx`;
              break;
            case "rotate":
              filename = `rotated-${selectedFiles[0]?.name || "document.pdf"}`;
              break;
            case "remove-pages":
              filename = `removed-pages-${
                selectedFiles[0]?.name || "document.pdf"
              }`;
              break;
            case "extract-pages":
              filename = `extracted-pages-${
                selectedFiles[0]?.name || "document.pdf"
              }`;
              break;
            default:
              filename = `processed-${selectedFiles[0]?.name || "document"}`;
          }
        }

        a.download = filename;
        a.click();

        setProgress(100);
        setStatus("complete");
        setProcessing(false);

        // Clean up
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`❌ Frontend: ${toolId} error:`, error);
        console.error('❌ Frontend: Full error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          name: error instanceof Error ? error.name : 'Unknown',
          error: error
        });
        alert(
          error instanceof Error
            ? error.message
            : `Failed to process ${tool.title}. Please try again.`
        );
        setProcessing(false);
        setStatus("idle");
        setProgress(0);
      }
    }
  };

  const handleEnhancedMerge = async (
    files: File[],
    excludedPages: number[]
  ) => {
    setProcessing(true);
    setStatus("processing");
    setProgress(0);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgress(10);

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      setProgress(20);

      if (excludedPages.length > 0) {
        formData.append("excludedPages", excludedPages.join(","));
      }

      setProgress(30);

      // Start simulated progress during API call
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 60) return prev + 2;
          return prev;
        });
      }, 300);

      const response = await fetch("/api/merge", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(65);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to merge PDFs");
      }

      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(75);

      // Download the merged file
      setProgress(85);
      await new Promise(resolve => setTimeout(resolve, 100));
      const blob = await response.blob();
      setProgress(93);
      await new Promise(resolve => setTimeout(resolve, 100));
      const url = URL.createObjectURL(blob);
      setProgress(97);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged-document.pdf";
      a.click();

      setProgress(100);
      setStatus("complete");
      setProcessing(false);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Enhanced merge error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to merge PDFs. Please try again."
      );
      setProcessing(false);
      setStatus("idle");
      setProgress(0);
    }
  };

  const handleStartOver = () => {
    setStatus("idle");
    setProgress(0);
    setSelectedFiles([]);
    setSelectedPages([]);
    setPageOperations([]);
    setOptions({});
    setCompressionResult(null);
  };

  const handleImageOrganize = async (operations: any[], imageOptions: any) => {
    if (operations.length === 0) return;
    
    setProcessing(true);
    setStatus("processing");

    try {
      setProgress(20);

      const formData = new FormData();
      
      // Add files in the new order
      operations.forEach((op) => {
        formData.append("files", op.file);
      });

      // Add rotation data
      const rotations = operations.map(op => op.rotation);
      formData.append("rotations", JSON.stringify(rotations));

      // Add PDF options
      formData.append("pageSize", imageOptions.pageSize || "a4");
      formData.append("orientation", imageOptions.orientation || "portrait");
      formData.append("margin", imageOptions.margin || "10");

      setProgress(40);

      const response = await fetch(`/api/scan-to-pdf`, {
        method: "POST",
        body: formData,
      });

      setProgress(60);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to convert images to PDF");
      }

      setProgress(80);

      // Download the PDF file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "images-to-pdf.pdf";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }
      
      a.download = filename;
      a.click();

      setProgress(100);
      setStatus("complete");
      setProcessing(false);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Image organize error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to convert images to PDF. Please try again."
      );
      setProcessing(false);
      setStatus("idle");
      setProgress(0);
    }
  };

  const handleOrganize = async (operations: any[]) => {
    if (selectedFiles.length === 0) return;
    
    setProcessing(true);
    setStatus("processing");
    setProgress(0);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgress(10);

      const formData = new FormData();
      formData.append("files", selectedFiles[0]); // Organize works with single file
      formData.append("pageOperations", JSON.stringify(operations));

      setProgress(30);

      // Start simulated progress during API call
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 60) return prev + 2;
          return prev;
        });
      }, 300);

      const response = await fetch(`/api/organize`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(65);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to organize PDF");
      }

      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(75);

      // Download the organized file
      setProgress(85);
      await new Promise(resolve => setTimeout(resolve, 100));
      const blob = await response.blob();
      setProgress(93);
      await new Promise(resolve => setTimeout(resolve, 100));
      const url = URL.createObjectURL(blob);
      setProgress(97);
      const a = document.createElement("a");
      a.href = url;
      
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "organized-document.pdf";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }
      
      a.download = filename;
      a.click();

      setProgress(100);
      setStatus("complete");
      setProcessing(false);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Organize error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to organize PDF. Please try again."
      );
      setProcessing(false);
      setStatus("idle");
      setProgress(0);
    }
  };

  if (status === "processing") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              {/* Progress Ring */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-32 h-32 mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#E5E7EB"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#10B981"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{progress}%</span>
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Processing {tool.title}
                </h2>
                <p className="text-sm text-gray-600 text-center">
                  {progress < 30 && "Uploading files..."}
                  {progress >= 30 && progress < 70 && "Processing your files..."}
                  {progress >= 70 && progress < 100 && "Finalizing..."}
                  {progress === 100 && "Complete!"}
                </p>
              </div>

              {/* File Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Files</span>
                  <span className="font-medium text-gray-900">{selectedFiles.length} file(s)</span>
                </div>
                {selectedFiles[0] && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Name</span>
                    <span className="font-medium text-gray-900 truncate ml-4 max-w-[200px]">
                      {selectedFiles[0].name}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{tool.title}</h1>
                <p className="text-sm text-gray-600">Processing complete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Compression Results */}
          {toolId === 'compress' && compressionResult && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compression Results</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Original</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatFileSize(compressionResult.originalSize)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Compressed</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatFileSize(compressionResult.compressedSize)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Saved</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {compressionResult.compressionRatio}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Download Section */}
          <SupabaseUploadStatus
            {...useSupabaseUploadInfo(lastResponse)}
            fileName={selectedFiles[0]?.name}
            showDirectDownload={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{tool.title}</h1>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {toolId === "merge" ? (
          <EnhancedMerge
            onMerge={handleEnhancedMerge}
            processing={processing}
          />
        ) : toolId === "add-page-numbers" && selectedFiles.length > 0 ? (
          <AddPageNumbersComponent
            files={selectedFiles}
            onProcess={handleProcess}
            processing={processing}
            onBack={() => setSelectedFiles([])}
          />
        ) : toolId === "add-watermark" && selectedFiles.length > 0 ? (
          <AddTextWatermarkComponent
            files={selectedFiles}
            onProcess={handleProcess}
            processing={processing}
            onBack={() => setSelectedFiles([])}
          />
        ) : selectedFiles.length === 0 ? (
          /* Simple Upload Interface */
          <div className="w-full max-w-4xl mx-auto">
            <Card
              className={`border-2 border-dashed transition-all duration-300 cursor-pointer ${
                dragActive
                  ? "border-red-400 bg-red-50/50"
                  : "border-gray-300 hover:border-red-400 hover:bg-red-50/30"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                    dragActive ? "bg-red-200" : "bg-red-100"
                  }`}>
                    <Upload className={`w-10 h-10 transition-colors ${
                      dragActive ? "text-red-700" : "text-red-600"
                    }`} />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {dragActive
                        ? "Drop your files here"
                        : tool.multiple
                        ? "Choose files or drag them here"
                        : "Choose file or drag it here"}
                    </h3>
                    <p className="text-gray-600 mb-4">{tool.description}</p>
                    <p className="text-sm text-gray-500">
                      Supports {tool.acceptedTypes.join(", ")} files up to 100MB
                      each
                    </p>
                  </div>

                  <div className="flex flex-col items-center space-y-3">
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      Browse Files
                    </Button>
                    <p className="text-xs text-gray-500">
                      Press Enter after uploading to continue quickly
                    </p>
                  </div>

                  <input
                    id="file-upload"
                    type="file"
                    multiple={tool.multiple}
                    accept={tool.acceptedTypes.join(",")}
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* File Processing Interface */
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {tool.title}
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("file-upload-more")?.click()
                    }
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {tool.multiple ? "Add more files" : "Replace file"}
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    {selectedFiles.length} file
                    {selectedFiles.length !== 1 ? "s" : ""}
                  </span>
                  {selectedPages.length > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        {selectedPages.length} page
                        {selectedPages.length !== 1 ? "s" : ""} selected
                      </span>
                    </>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* File List */}
            {toolId === "scan-to-pdf" ? (
              /* Special handling for scan-to-pdf - show ImageOrganizer instead of file list */
              <ImageOrganizer
                files={selectedFiles}
                onOrganize={handleImageOrganize}
                onFilesChange={setSelectedFiles}
                className="border-0 shadow-none bg-transparent"
              />
            ) : (
              <div className="space-y-4">
                {selectedFiles.map((file, index) => (
                  <Card key={`${file.name}-${index}`} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {file.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSelectedFiles((files) =>
                                files.filter((_, i) => i !== index)
                              )
                            }
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {file.type === "application/pdf" &&
                      (toolId === "remove-pages" ||
                        toolId === "extract-pages") && (
                        <CardContent className="pt-0">
                          <PdfGallery
                            file={file}
                            selectionMode={
                              toolId === "remove-pages" ? "exclude" : "include"
                            }
                            selectedPages={selectedPages}
                            onPagesSelected={setSelectedPages}
                            className="border-0 shadow-none bg-transparent"
                          />
                        </CardContent>
                      )}

                    {file.type === "application/pdf" && toolId === "organize" && (
                      <CardContent className="pt-0">
                        <PdfOrganizer
                          file={file}
                          onOrganize={handleOrganize}
                          className="border-0 shadow-none bg-transparent"
                        />
                      </CardContent>
                    )}
                  </Card>
                ))}
                {/* Image Quality Control (only for pdf-to-jpg) */}
                {toolId === 'pdf-to-jpg' && (
                  <Card className="p-6 border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Image Quality
                      </h3>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setOptions(prev => ({ ...prev, quality: 50 }))}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            options.quality === 50
                              ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-semibold text-lg">Standard</div>
                            <div className="text-sm opacity-80">Smaller files</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setOptions(prev => ({ ...prev, quality: 75 }))}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            options.quality === 75
                              ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-semibold text-lg">High</div>
                            <div className="text-sm opacity-80">Recommended</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setOptions(prev => ({ ...prev, quality: 100 }))}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            options.quality === 100
                              ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-semibold text-lg">Maximum</div>
                            <div className="text-sm opacity-80">Best quality</div>
                          </div>
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 text-center mt-4">
                        Choose the quality that best fits your needs. Higher quality produces sharper images but larger file sizes.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Tool-specific options */}
            <div className="space-y-6">
              {toolId === "split" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Split Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Split Method
                      </label>
                      <Select
                        value={options.splitOption || "all-pages"}
                        onValueChange={(value: string) =>
                          setOptions({ ...options, splitOption: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-pages">
                            Split into individual pages
                          </SelectItem>
                          <SelectItem value="custom-range">
                            Custom page range
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {options.splitOption === "custom-range" && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Page Range
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 1-5,7,9-12"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={options.pageRange || ""}
                          onChange={(e) =>
                            setOptions({
                              ...options,
                              pageRange: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use commas and hyphens (e.g., 1-5,7,9-12)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {toolId === "compress" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Compression Settings</CardTitle>
                    <p className="text-sm text-gray-600">Choose compression level based on your needs</p>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={options.compressionLevel || "basic"}
                      onValueChange={(value: string) =>
                        setOptions({ ...options, compressionLevel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">
                          Basic - Minimal compression (recommended for documents)
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium - Balanced compression and quality
                        </SelectItem>
                        <SelectItem value="strong">
                          Strong - Significant size reduction (~40-60%)
                        </SelectItem>
                        <SelectItem value="extreme">
                          Maximum - Smallest file size (~50-70% reduction)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Higher compression may reduce image quality and text sharpness
                    </p>
                  </CardContent>
                </Card>
              )}

              {toolId === "rotate" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rotation Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Rotation
                      </label>
                      <Select
                        value={options.rotation || "90"}
                        onValueChange={(value: string) =>
                          setOptions({ ...options, rotation: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="90">90° Clockwise</SelectItem>
                          <SelectItem value="180">180°</SelectItem>
                          <SelectItem value="270">
                            90° Counter-clockwise
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Process Button - Hide for organize, scan-to-pdf, add-page-numbers, and add-watermark tools since they have their own controls */}
            {toolId !== "organize" && toolId !== "scan-to-pdf" && toolId !== "add-page-numbers" && toolId !== "add-watermark" && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Ready to {tool.title.toLowerCase()}
                      {selectedPages.length > 0 &&
                        ` ${selectedPages.length} page${
                          selectedPages.length !== 1 ? "s" : ""
                        } from`}
                      {selectedFiles.length} file
                      {selectedFiles.length !== 1 ? "s" : ""}
                      {selectedFiles.length >= tool.minFiles &&
                        toolId !== "remove-pages" &&
                        toolId !== "extract-pages" && (
                          <span className="ml-2 text-xs text-blue-600">(Press Enter ⏎)</span>
                        )}
                    </div>
                    <Button
                      data-process-btn
                      onClick={handleProcess}
                      disabled={
                        selectedFiles.length < tool.minFiles ||
                        ((toolId === "remove-pages" ||
                          toolId === "extract-pages") &&
                          selectedPages.length === 0)
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {tool.title}
                    </Button>
                  </div>

                  {selectedFiles.length < tool.minFiles && (
                    <p className="text-sm text-gray-500 text-center mt-3">
                      {tool.multiple
                        ? `Please upload at least ${tool.minFiles} files`
                        : "Please upload a file to continue"}
                    </p>
                  )}

                  {selectedFiles.length >= tool.minFiles &&
                    (toolId === "remove-pages" || toolId === "extract-pages") &&
                    selectedPages.length === 0 && (
                      <p className="text-sm text-orange-600 text-center mt-3">
                        Please select pages to{" "}
                        {toolId === "remove-pages" ? "remove" : "extract"}
                      </p>
                    )}
                </CardContent>
              </Card>
            )}

            <input
              id="file-upload-more"
              type="file"
              multiple={tool.multiple}
              accept={tool.acceptedTypes.join(",")}
              onChange={(e) => {
                if (e.target.files) {
                  if (tool.multiple) {
                    setSelectedFiles((prev) => [
                      ...prev,
                      ...Array.from(e.target.files!),
                    ]);
                  } else {
                    setSelectedFiles(Array.from(e.target.files));
                  }
                }
              }}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}
