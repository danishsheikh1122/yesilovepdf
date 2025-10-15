'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { usePDFEditorStore } from '@/stores/editorStore';
import { AdvancedPDFRenderer } from './AdvancedPDFRenderer';
import { InteractiveOverlay } from './InteractiveOverlayPro';
import { PropertiesPanel } from './PropertiesPanel';
import SejdaToolbar from './SejdaToolbar';
import SignatureTool from './tools/SignatureToolSimple';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  dir: string;
  fontName: string;
}

interface WorkingPDFEditorProps {
  className?: string;
}

const WorkingPDFEditor: React.FC<WorkingPDFEditorProps> = ({ className }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    file,
    setFile,
    pdfDoc,
    setPdfDoc,
    currentPage,
    zoom,
    setLoading,
    isLoading,
    setError,
    error,
    activeTool,
    elements,
    resetEditor,
    undo,
    redo,
    history,
  } = usePDFEditorStore();

  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState({ x: 100, y: 100 });
  const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (history.canUndo) {
          undo();
          console.log('Undo triggered');
        }
      }
      
      // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac) or Ctrl+Shift+Z
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        if (history.canRedo) {
          redo();
          console.log('Redo triggered');
        }
      }

      // Delete: Delete or Backspace key
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Only delete if not typing in an input/textarea
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          // Delete functionality will be handled in the properties panel
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, history.canUndo, history.canRedo]);

  // Initialize PDF.js
  const initPdfjs = useCallback(async () => {
    if (typeof window !== 'undefined') {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
        return pdfjsLib;
      } catch (error) {
        console.error('Failed to load PDF.js:', error);
        setError('Failed to initialize PDF renderer');
        return null;
      }
    }
    return null;
  }, [setError]);

  // Handle file upload
  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    if (!uploadedFile || uploadedFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const pdfjsLib = await initPdfjs();
      if (!pdfjsLib) return;

      const arrayBuffer = await uploadedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      setFile(uploadedFile);
      setPdfDoc(pdf);
      
      // Get dimensions for all pages
      const dimensions = new Map<number, { width: number; height: number }>();
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        dimensions.set(i, {
          width: viewport.width,
          height: viewport.height
        });
      }
      setPageDimensions(dimensions);
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError('Failed to load PDF file');
    } finally {
      setLoading(false);
    }
  }, [setFile, setPdfDoc, setLoading, setError, initPdfjs]);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  }, [handleFileUpload]);

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  // Handle text click for direct editing
  const handleTextClick = useCallback((textItem: TextItem, pageNumber: number) => {
    console.log('Text clicked:', textItem, 'on page:', pageNumber);
  }, []);

  // Handle signature tool
  const handleSignatureClick = useCallback((event: React.MouseEvent) => {
    if (activeTool === 'signature') {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      setSignaturePosition({ x: x / zoom, y: y / zoom });
      setSignatureDialogOpen(true);
    }
  }, [activeTool, zoom]);

  // Export PDF with modifications
  const handleExport = useCallback(async () => {
    if (!pdfDoc || !file) {
      setError('No PDF loaded to export');
      return;
    }

    try {
      setLoading(true);
      
      // Import pdf-lib for PDF modification
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      
      // Load the original PDF
      const arrayBuffer = await file.arrayBuffer();
      const existingPdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Apply all modifications from elements
      for (const element of elements) {
        const page = existingPdfDoc.getPages()[element.pageNumber - 1];
        if (!page) continue;

        const { width: pageWidth, height: pageHeight } = page.getSize();

        switch (element.type) {
          case 'textbox':
            const textData = element.data as any;
            if (textData.text && textData.text.trim()) {
              const font = await existingPdfDoc.embedFont(StandardFonts.Helvetica);
              page.drawText(textData.text, {
                x: element.x,
                y: pageHeight - element.y - element.height,
                size: textData.fontSize || 16,
                font,
                color: rgb(0, 0, 0),
                maxWidth: element.width,
              });
            }
            break;

          case 'whiteout':
            page.drawRectangle({
              x: element.x,
              y: pageHeight - element.y - element.height,
              width: element.width,
              height: element.height,
              color: rgb(1, 1, 1),
              borderColor: rgb(0.8, 0.8, 0.8),
              borderWidth: 1,
            });
            break;

          case 'highlight':
            page.drawRectangle({
              x: element.x,
              y: pageHeight - element.y - element.height,
              width: element.width,
              height: element.height,
              color: rgb(1, 1, 0),
              opacity: 0.3,
            });
            break;

          case 'pen':
            page.drawRectangle({
              x: element.x,
              y: pageHeight - element.y - element.height,
              width: element.width,
              height: element.height,
              color: rgb(1, 0, 0),
            });
            break;

          case 'signature':
            const signatureData = element.data as any;
            if (signatureData.signatureData) {
              try {
                // Convert data URL to bytes
                const base64Data = signatureData.signatureData.split(',')[1];
                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                
                let image;
                if (signatureData.signatureData.includes('png')) {
                  image = await existingPdfDoc.embedPng(imageBytes);
                } else {
                  image = await existingPdfDoc.embedJpg(imageBytes);
                }
                
                page.drawImage(image, {
                  x: element.x,
                  y: pageHeight - element.y - element.height,
                  width: element.width,
                  height: element.height,
                });
              } catch (error) {
                console.warn('Failed to embed signature image:', error);
              }
            }
            break;

          case 'checkbox':
            // Draw checkbox
            page.drawRectangle({
              x: element.x,
              y: pageHeight - element.y - element.height,
              width: element.width,
              height: element.height,
              borderColor: rgb(0, 0, 0),
              borderWidth: 2,
            });
            
            // Draw checkmark if checked
            if ((element.data as any).checked) {
              page.drawText('✓', {
                x: element.x + 2,
                y: pageHeight - element.y - element.height + 2,
                size: element.height - 4,
                color: rgb(0, 0, 0),
              });
            }
            break;

          case 'radio':
            // Draw radio button circle
            // Note: pdf-lib doesn't have native circle support, so we'll use text
            page.drawText((element.data as any).selected ? '●' : '○', {
              x: element.x,
              y: pageHeight - element.y - element.height,
              size: element.height,
              color: rgb(0, 0, 0),
            });
            break;
        }
      }

      // Save the modified PDF
      const pdfBytes = await existingPdfDoc.save();
      
      // Download the file
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
  }, [pdfDoc, file, elements, setLoading, setError]);

  // Reset editor
  const handleReset = useCallback(() => {
    resetEditor();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [resetEditor]);

  // No PDF loaded state - Using Sejda-like styling
  if (!pdfDoc) {
    return (
      <div className={`working-pdf-editor ${className || ''}`}>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                PDF Editor <span className="text-blue-600">BETA</span>
              </h1>
              <p className="text-gray-600">
                Edit PDF files online. Add text, images, signatures, and more.
              </p>
            </div>
          </div>

          {/* Upload Area with Sejda styling */}
          <div className="max-w-4xl mx-auto p-8">
            <Card 
              className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
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
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                      disabled={isLoading}
                    >
                      {isLoading ? (
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
                    <p>Your files are processed locally and never uploaded to servers</p>
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

  // PDF loaded - show editor with Sejda-like layout and scrollable pages
  return (
    <div className={`working-pdf-editor ${className || ''}`}>
      <div className="min-h-screen bg-gray-50">
        {/* Toolbar */}
        <SejdaToolbar
          onFileUpload={handleFileUpload}
          onExport={handleExport}
        />

        {/* Main Editor Area */}
        <div className="flex-1 flex">
          {/* PDF Viewer with scrollable pages */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Render all pages in a scrollable layout */}
              {pdfDoc && Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((pageNum) => {
                const dimensions = pageDimensions.get(pageNum) || { width: 800, height: 1100 };
                const scaledWidth = dimensions.width * zoom;
                const scaledHeight = dimensions.height * zoom;
                
                return (
                <div 
                  key={pageNum}
                  className="relative bg-white shadow-lg rounded-lg overflow-visible mb-4"
                  style={{ 
                    width: `${scaledWidth}px`,
                    height: `${scaledHeight}px`,
                    margin: '0 auto'
                  }}
                  onClick={handleSignatureClick}
                >
                  {/* Page number indicator */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm z-50">
                    Page {pageNum}
                  </div>
                  
                  <AdvancedPDFRenderer
                    onTextClick={handleTextClick}
                    className="w-full"
                    pageNumber={pageNum}
                  />
                  
                  {/* Interactive Overlay for each page */}
                  <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: 30 }}>
                    <InteractiveOverlay
                      width={scaledWidth}
                      height={scaledHeight}
                      pageNumber={pageNum}
                      scale={zoom}
                    />
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* Properties Sidebar */}
          <PropertiesPanel />
        </div>

        {/* Signature Dialog */}
        <SignatureTool
          isOpen={signatureDialogOpen}
          onClose={() => setSignatureDialogOpen(false)}
          position={signaturePosition}
          pageNumber={currentPage}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-900">Processing...</span>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-white hover:text-gray-200"
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