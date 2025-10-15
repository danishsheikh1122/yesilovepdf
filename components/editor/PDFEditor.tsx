'use client';

import React, { useRef, useState, useCallback } from 'react';
import { usePDFEditorStore } from '@/stores/editorStore';
import PDFRenderer from './PDFRenderer';
import EditorToolbar from './EditorToolbar';
import EditorCanvas from './EditorCanvas';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';

interface PDFEditorProps {
  className?: string;
}

export const PDFEditor: React.FC<PDFEditorProps> = ({ className }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  const {
    file,
    pdfDoc,
    zoom,
    mode,
    isLoading,
    error,
    setFile,
    setPdfDoc,
    setLoading,
    setError,
    setMode,
    resetEditor,
  } = usePDFEditorStore();

  // Initialize PDF.js and load PDF
  const initializePdf = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      // Dynamic import to avoid SSR issues
      const pdfjsLib = await import('pdfjs-dist');
      
      // Ensure worker is configured
      if (typeof window !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
      }

      // Load PDF from file
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      setPdfDoc(pdf);
      setFile(file);
      setMode('edit');
      
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF file. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setFile, setPdfDoc, setLoading, setError, setMode]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      initializePdf(selectedFile);
    } else {
      setError('Please select a valid PDF file.');
    }
  }, [initializePdf, setError]);

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      initializePdf(droppedFile);
    } else {
      setError('Please drop a valid PDF file.');
    }
  }, [initializePdf, setError]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleNewFile = useCallback(() => {
    resetEditor();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, [resetEditor]);

  // Calculate canvas dimensions based on PDF page and zoom
  const getCanvasDimensions = () => {
    if (!pdfDoc) return { width: 800, height: 600 };
    
    // This would need to be calculated from the actual PDF page size
    // For now, using standard A4 proportions
    const baseWidth = 595; // A4 width in points
    const baseHeight = 842; // A4 height in points
    
    return {
      width: baseWidth * zoom,
      height: baseHeight * zoom,
    };
  };

  const canvasDimensions = getCanvasDimensions();

  if (!file || !pdfDoc) {
    return (
      <div className={`pdf-editor h-screen bg-gray-50 ${className || ''}`}>
        {/* Upload interface */}
        <div className="flex items-center justify-center h-full">
          <div 
            className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
          >
            <div className="text-center">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upload PDF to Edit
              </h2>
              <p className="text-gray-600 mb-6">
                Drag and drop your PDF file here, or click to browse
              </p>
              
              <Button 
                onClick={handleNewFile}
                className="w-full mb-4"
                size="lg"
              >
                <FileText className="w-5 h-5 mr-2" />
                Choose PDF File
              </Button>
              
              {error && (
                <div className="text-red-600 text-sm mt-2">
                  {error}
                </div>
              )}
              
              {isLoading && (
                <div className="text-blue-600 text-sm mt-2">
                  Loading PDF...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={`pdf-editor h-screen flex flex-col bg-gray-50 ${className || ''}`}>
      {/* Toolbar */}
      <EditorToolbar />

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Content Area */}
        <div className="flex-1 relative overflow-auto bg-gray-100">
          <div className="relative inline-block">
            {/* PDF Renderer */}
            <PDFRenderer className="relative" />
            
            {/* Interactive Canvas Overlay */}
            {mode === 'edit' && (
              <EditorCanvas
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                scale={zoom}
                className="absolute top-0 left-0 pointer-events-auto"
              />
            )}
          </div>
        </div>

        {/* Properties Panel (optional) */}
        {/* This could be added later for detailed element properties */}
      </div>

      {/* Hidden file input for toolbar actions */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default PDFEditor;