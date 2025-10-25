'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePDFEditorStore } from '@/stores/editorStore';
import type { PDFPage, EditorElement } from '@/lib/types';

interface AdvancedPDFRendererProps {
  className?: string;
  onTextClick?: (textItem: TextItem, pageNumber: number) => void;
  pageNumber?: number; // Optional specific page to render
}

interface TextItem {
  id: string;
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  fontSize: number;
  x: number;
  y: number;
  pageIndex: number;
}

export const AdvancedPDFRenderer: React.FC<AdvancedPDFRendererProps> = ({ 
  className,
  onTextClick,
  pageNumber: specificPageNumber 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    pdfDoc,
    currentPage,
    zoom,
    setLoading,
    setError,
    activeTool,
    elements,
    updateElement,
    addElement,
  } = usePDFEditorStore();

  // Use specific page number if provided, otherwise use current page
  const pageToRender = specificPageNumber || currentPage;

  const [pages, setPages] = useState<Map<number, PDFPage>>(new Map());
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Initialize PDF.js
  const initPdfjs = useCallback(async () => {
    if (typeof window !== 'undefined') {
      try {
        const { loadPDFJS } = await import('@/lib/pdfjs-cdn');
        const pdfjsLib = await loadPDFJS();
        return pdfjsLib;
      } catch (error) {
        console.error('Failed to load PDF.js:', error);
        setError('Failed to initialize PDF renderer');
        return null;
      }
    }
    return null;
  }, [setError]);

  // Extract text layer from PDF
  const extractTextLayer = useCallback(async (page: any, pageNumber: number) => {
    try {
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: zoom });
      
      const extractedTextItems: TextItem[] = textContent.items.map((item: any, index: number) => {
        const transform = item.transform;
        const x = transform[4];
        const y = viewport.height - transform[5]; // Flip Y coordinate
        
        return {
          id: `text-${pageNumber}-${index}`,
          str: item.str,
          dir: item.dir,
          width: item.width,
          height: item.height,
          transform: transform,
          fontName: item.fontName,
          fontSize: transform[0], // Scale factor represents font size
          x,
          y,
          pageIndex: pageNumber,
        };
      });

      setTextItems(prev => [
        ...prev.filter(item => item.pageIndex !== pageNumber),
        ...extractedTextItems
      ]);

      return extractedTextItems;
    } catch (error) {
      console.error('Error extracting text layer:', error);
      return [];
    }
  }, [zoom]);

  // Handle text click for direct editing
  const handleTextClick = useCallback((textItem: TextItem, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (activeTool === 'text' || activeTool === 'select') {
      setIsEditingText(true);
      setEditingTextId(textItem.id);
      
      if (onTextClick) {
        onTextClick(textItem, pageToRender);
      }

      // Create or update text element for editing
      const existingElement = elements.find(el => 
        el.type === 'text' && 
        el.x === textItem.x && 
        el.y === textItem.y &&
        el.pageNumber === currentPage
      );

      if (!existingElement) {
        const newElement: EditorElement = {
          id: `editable-${textItem.id}`,
          type: 'text',
          pageNumber: currentPage,
          x: textItem.x,
          y: textItem.y,
          width: textItem.width,
          height: textItem.height,
          rotation: 0,
          data: {
            content: textItem.str,
            fontSize: textItem.fontSize,
            fontFamily: 'Arial', // Default, could be extracted from PDF
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            color: '#000000',
          },
          style: {
            opacity: 1,
            visible: true,
          },
          created: new Date(),
          modified: new Date(),
        };
        
        addElement(newElement);
      }
    }
  }, [activeTool, onTextClick, currentPage, elements, addElement]);

  // Handle text input change
  const handleTextChange = useCallback((textId: string, newContent: string) => {
    const element = elements.find(el => el.id === textId);
    if (element) {
      updateElement(textId, {
        data: {
          ...element.data,
          content: newContent,
        }
      });
    }
  }, [elements, updateElement]);

  // Render effect
  useEffect(() => {
    let mounted = true;
    let currentRenderTask: any = null;

    const render = async () => {
      if (!mounted || !pdfDoc || !canvasRef.current || isRendering) return;

      try {
        setIsRendering(true);
        setLoading(true);
        
        // Cancel any existing render task
        if (currentRenderTask) {
          try {
            currentRenderTask.cancel();
          } catch (e) {
            // Ignore cancellation errors
          }
        }

        const pdfjsLib = await initPdfjs();
        if (!pdfjsLib || !mounted) return;

        const page = await pdfDoc.getPage(pageToRender);
        const canvas = canvasRef.current;
        if (!canvas || !mounted) return;
        
        const context = canvas.getContext('2d');
        if (!context || !mounted) return;

        // Calculate viewport with zoom
        const viewport = page.getViewport({ scale: zoom });
        
        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Set CSS dimensions for proper display scaling
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Clear previous content
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        currentRenderTask = page.render(renderContext);
        
        await currentRenderTask.promise;

        if (!mounted) return;

        // Extract text layer for direct editing
        await extractTextLayer(page, pageToRender);
        
        // Store rendered page info
        const pageData: PDFPage = {
          pageNumber: pageToRender,
          canvas,
          scale: zoom,
          width: viewport.width,
          height: viewport.height,
          rendered: true,
        };
        
        if (mounted) {
          setPages(prev => new Map(prev.set(pageToRender, pageData)));
        }
        
      } catch (error: any) {
        if (error.name !== 'RenderingCancelledException' && mounted) {
          console.error('Error rendering PDF page:', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setIsRendering(false);
        }
        currentRenderTask = null;
      }
    };

    // Add a small delay based on page number to stagger renders
    const delay = (pageToRender - 1) * 50; // 50ms delay between pages
    const timer = setTimeout(render, delay);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (currentRenderTask) {
        try {
          currentRenderTask.cancel();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [pdfDoc, pageToRender, zoom, initPdfjs, extractTextLayer]);

  // Get current page text items
  const currentPageTextItems = textItems.filter(item => item.pageIndex === currentPage);

  if (!pdfDoc) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-lg">No PDF loaded</div>
          <div className="text-gray-500 text-sm mt-2">
            Upload a PDF file to start editing
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`advanced-pdf-renderer relative ${className || ''}`}
      style={{ 
        overflow: 'visible',
        maxHeight: '100%',
      }}
    >
      <div className="pdf-page-container relative inline-block" style={{ 
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'white',
      }}>
        {/* PDF Canvas */}
        <canvas
          ref={canvasRef}
          className="pdf-page-canvas"
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            pointerEvents: 'none', // Let the overlay handle all interactions
          }}
        />
        
        {/* Loading indicator */}
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-70">
            <div className="text-gray-500 text-sm">Rendering...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedPDFRenderer;