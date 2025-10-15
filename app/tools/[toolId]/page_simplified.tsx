"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import EnhancedMerge from "@/components/EnhancedMergeNew";
import PdfOrganizer from "@/components/PdfOrganizer";
import ImageOrganizer from "@/components/ImageOrganizer";
import AddPageNumbersComponent from "@/components/AddPageNumbersComponent";
import dynamic from "next/dynamic";

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
    title: "JPG to PDF",
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
  const [status, setStatus] = useState<"idle" | "processing" | "complete">("idle");
  const [options, setOptions] = useState<Record<string, any>>({});
  const [dragActive, setDragActive] = useState(false);

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

  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tool not found</h1>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleProcess = async (overrideOptions?: Record<string, any>) => {
    if (selectedFiles.length >= tool.minFiles) {
      setProcessing(true);
      setStatus("processing");

      try {
        setProgress(20);

        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("files", file));

        const finalOptions = overrideOptions && Object.keys(overrideOptions).length > 0 ? overrideOptions : options;

        Object.keys(finalOptions).forEach((key) => {
          const value = finalOptions[key];
          formData.append(key, value === undefined || value === null ? '' : String(value));
        });

        setProgress(40);

        const response = await fetch(`/api/${toolId}`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to process ${tool.title}`);
        }

        setProgress(80);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        let filename = `processed-${selectedFiles[0]?.name || "document"}`;
        switch (toolId) {
          case "merge":
            filename = "merged-document.pdf";
            break;
          case "compress":
            filename = `compressed-${selectedFiles[0]?.name || "document.pdf"}`;
            break;
          default:
            filename = `${toolId}-${selectedFiles[0]?.name || "document"}`;
        }
        
        a.download = filename;
        a.click();

        setProgress(100);
        setStatus("complete");
        setProcessing(false);

        URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`Error processing ${tool.title}:`, error);
        alert(error instanceof Error ? error.message : `Failed to process ${tool.title}. Please try again.`);
        setProcessing(false);
        setStatus("idle");
        setProgress(0);
      }
    }
  };

  const handleStartOver = () => {
    setStatus("idle");
    setProgress(0);
    setSelectedFiles([]);
    setOptions({});
  };

  if (status === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Success! 🎉</h2>
            <p className="text-gray-600 mb-6">Your {tool.title.toLowerCase()} has been completed successfully!</p>

            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={handleStartOver}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
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
        {selectedFiles.length === 0 ? (
          /* File Upload Interface */
          <div className="w-full max-w-2xl mx-auto">
            <Card className="border-2 border-dashed border-gray-300 hover:border-red-400 transition-colors duration-300">
              <CardContent className="p-12">
                <div
                  className={`text-center cursor-pointer transition-all duration-300 ${
                    dragActive ? "scale-105" : ""
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-10 h-10 text-red-600" />
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Choose file or drag it here
                  </h3>

                  <p className="text-gray-600 mb-4">{tool.description}</p>

                  <p className="text-sm text-gray-500 mb-6">
                    Supports {tool.acceptedTypes.join(", ")} files up to 100MB each
                  </p>

                  <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3">
                    Browse Files
                  </Button>

                  <p className="text-xs text-gray-400 mt-4">
                    Press Enter after uploading to continue quickly
                  </p>

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
            {toolId === "merge" ? (
              <EnhancedMerge
                files={selectedFiles}
                onMerge={handleProcess}
                onFilesChange={setSelectedFiles}
              />
            ) : toolId === "organize" ? (
              <PdfOrganizer
                files={selectedFiles}
                onOrganize={(operations) => handleProcess({ operations })}
                onFilesChange={setSelectedFiles}
              />
            ) : toolId === "scan-to-pdf" ? (
              <ImageOrganizer
                files={selectedFiles}
                onOrganize={handleProcess}
                onFilesChange={setSelectedFiles}
                className="border-0 shadow-none bg-transparent"
              />
            ) : toolId === "add-page-numbers" ? (
              <AddPageNumbersComponent
                files={selectedFiles}
                onProcess={handleProcess}
                onFilesChange={setSelectedFiles}
              />
            ) : toolId === "add-watermark" ? (
              <AddTextWatermarkComponent
                files={selectedFiles}
                onProcess={handleProcess}
                onFilesChange={setSelectedFiles}
              />
            ) : (
              /* Default File List and Processing */
              <div className="space-y-6">
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
                    </div>
                  </CardHeader>
                </Card>

                {/* Simple File List */}
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
                    </Card>
                  ))}
                </div>

                {/* Process Button */}
                <div className="flex justify-center pt-6">
                  <Button
                    onClick={() => handleProcess()}
                    disabled={processing || selectedFiles.length < tool.minFiles}
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 min-w-[200px]"
                  >
                    {processing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      `Process ${selectedFiles.length} file${selectedFiles.length !== 1 ? "s" : ""}`
                    )}
                  </Button>
                </div>

                {/* Progress Bar */}
                {processing && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing...</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Hidden input for adding more files */}
            <input
              id="file-upload-more"
              type="file"
              multiple={tool.multiple}
              accept={tool.acceptedTypes.join(",")}
              onChange={(e) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);
                  if (tool.multiple) {
                    setSelectedFiles(prev => [...prev, ...newFiles]);
                  } else {
                    setSelectedFiles(newFiles);
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