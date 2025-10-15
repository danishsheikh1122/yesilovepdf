"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import PdfEditorAdvanced, { PageData } from '@/components/PdfEditorAdvanced';
import EditorToolbar, { ToolType } from '@/components/EditorToolbar';
import PropertiesPanel from '@/components/PropertiesPanel';
import ThumbnailNavigationPanel from '@/components/ThumbnailNavigationPanel';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
// Dynamic import for pdfjs-dist to avoid canvas build issues
let pdfjsLib: any = null;

// Initialize PDF.js asynchronously
const initPdfjs = async () => {
  if (typeof window !== 'undefined' && !pdfjsLib) {
    try {
      const pdfjs = await import('pdfjs-dist/webpack');
      pdfjsLib = pdfjs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
    } catch (error) {
      console.error('Failed to load PDF.js:', error);
    }
  }
};

// Simple toast implementation
const useToast = () => {
  const toast = ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    console.log(`[${variant || 'info'}] ${title}: ${description}`);
    // In production, integrate with a toast library like sonner or react-hot-toast
  };
  return { toast };
};

export default function PdfEditorPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);

  // Editor hook
  const editor = PdfEditorAdvanced({ url: pdfUrl });

  // Initialize PDF.js on mount
  useEffect(() => {
    initPdfjs();
  }, []);

  // Load PDF document for thumbnails
  useEffect(() => {
    if (!pdfUrl) return;

    const loadPdf = async () => {
      try {
        // Ensure PDF.js is loaded
        await initPdfjs();
        if (!pdfjsLib) {
          console.error('PDF.js not available');
          return;
        }
        
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
      } catch (error) {
        console.error('Error loading PDF for thumbnails:', error);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid File',
        description: 'Please select a valid PDF file.',
        variant: 'destructive',
      });
      return;
    }

    setPdfFile(file);
    const url = URL.createObjectURL(file);
    setPdfUrl(url);

    toast({
      title: 'PDF Loaded',
      description: `${file.name} loaded successfully.`,
    });
  }, [toast]);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      const pagesData = await editor.exportPagesAsImages();
      
      if (pagesData.length === 0) {
        toast({
          title: 'No Pages',
          description: 'No pages to save.',
          variant: 'destructive',
        });
        return;
      }

      // Convert canvases to data URLs
      const pageDataUrls = pagesData.map((pageData) => {
        return pageData.canvas.toDataURL('image/png');
      });

      // Send to server
      const response = await fetch('/api/pdf-edit-merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pages: pageDataUrls }),
      });

      if (!response.ok) {
        throw new Error('Failed to merge PDF pages');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFile?.name.replace('.pdf', '-edited.pdf') || 'edited-document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF Saved',
        description: 'Your edited PDF has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error saving PDF:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [editor, pdfFile, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        editor.undo();
      }
      
      // Redo: Ctrl+Y / Cmd+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        editor.redo();
      }

      // Delete: Del / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && editor.selectedId) {
        e.preventDefault();
        editor.deleteElement(editor.selectedId);
      }

      // Save: Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Toggle properties panel: P
      if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowPropertiesPanel(!showPropertiesPanel);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, handleSave, showPropertiesPanel]);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    editor.setScale(Math.min(editor.scale + 0.25, 3));
  }, [editor]);

  const handleZoomOut = useCallback(() => {
    editor.setScale(Math.max(editor.scale - 0.25, 0.5));
  }, [editor]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <EditorToolbar
        currentTool={editor.currentTool}
        onToolChange={(tool) => editor.setCurrentTool(tool)}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onSave={handleSave}
        onDelete={editor.selectedId ? () => editor.deleteElement(editor.selectedId!) : undefined}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        hasSelection={!!editor.selectedId}
        scale={editor.scale}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnail Navigation */}
        {pdfDoc && (
          <ThumbnailNavigationPanel
            pdfDoc={pdfDoc}
            currentPage={editor.currentPage}
            onPageChange={editor.setCurrentPage}
          />
        )}

        {/* Editor Canvas */}
        <div className="flex-1 overflow-auto bg-gray-200 p-8">
          {!pdfUrl ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Edit PDF Document</h2>
                <p className="text-gray-600 max-w-md">
                  Upload a PDF to start editing. Add text, shapes, highlights, and more with our powerful editor.
                </p>
                <Button
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="mr-2" size={20} />
                  Upload PDF
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {/* Page Navigation */}


              {/* Editor Viewer */}
              <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-300">
                {editor.loading ? (
                  <div className="flex items-center justify-center p-20">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                  </div>
                ) : (
                  editor.renderViewer()
                )}
              </div>

              {/* Upload New File Button */}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2" size={16} />
                Upload Different PDF
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {showPropertiesPanel && pdfUrl && (
          <PropertiesPanel
            fontSize={editor.fontSize}
            fontFamily={editor.fontFamily}
            fontStyle={editor.fontStyle}
            textDecoration={editor.textDecoration}
            textColor={editor.textColor}
            onFontSizeChange={editor.setFontSize}
            onFontFamilyChange={editor.setFontFamily}
            onFontStyleChange={editor.setFontStyle}
            onTextDecorationChange={editor.setTextDecoration}
            onTextColorChange={editor.setTextColor}
            fillColor={editor.fillColor}
            strokeColor={editor.strokeColor}
            strokeWidth={editor.strokeWidth}
            opacity={editor.opacity}
            onFillColorChange={editor.setFillColor}
            onStrokeColorChange={editor.setStrokeColor}
            onStrokeWidthChange={editor.setStrokeWidth}
            onOpacityChange={editor.setOpacity}
            currentTool={editor.currentTool}
          />
        )}
      </div>

      {/* Saving Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="text-lg font-medium">Saving your PDF...</p>
            <p className="text-sm text-gray-600">This may take a moment</p>
          </div>
        </div>
      )}
    </div>
  );
}
