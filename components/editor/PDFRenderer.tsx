import React, { useRef, useEffect, useState } from 'react';
import { usePDFEditorStore } from '@/stores/editorStore';
import type { PDFPage } from '@/lib/types';

interface PDFRendererProps {
  className?: string;
}

export const PDFRenderer: React.FC<PDFRendererProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    pdfDoc,
    currentPage,
    zoom,
    setLoading,
    setError,
  } = usePDFEditorStore();

  const [pages, setPages] = useState<Map<number, PDFPage>>(new Map());
  const [renderTask, setRenderTask] = useState<any>(null);

  // Initialize PDF.js dynamically
  useEffect(() => {
    const initPdfjs = async () => {
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
    };

    initPdfjs();
  }, [setError]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        setLoading(true);
        
        // Cancel any existing render task
        if (renderTask) {
          renderTask.cancel();
        }

        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        // Calculate viewport with zoom
        const viewport = page.getViewport({ scale: zoom });
        
        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Set CSS dimensions for proper scaling
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        setRenderTask(task);
        
        await task.promise;
        
        // Store rendered page info
        const pageData: PDFPage = {
          pageNumber: currentPage,
          canvas,
          scale: zoom,
          width: viewport.width,
          height: viewport.height,
          rendered: true,
        };
        
        setPages(prev => new Map(prev.set(currentPage, pageData)));
        
      } catch (error: any) {
        if (error.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', error);
          setError('Failed to render PDF page');
        }
      } finally {
        setLoading(false);
        setRenderTask(null);
      }
    };

    renderPage();

    // Cleanup function
    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, zoom, setLoading, setError, renderTask]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      // Trigger re-render on container resize
      if (pdfDoc && canvasRef.current) {
        // Re-render current page with updated dimensions
      }
    };

    const container = containerRef.current;
    if (container) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [pdfDoc]);

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
      className={`pdf-renderer ${className || ''}`}
      style={{ 
        position: 'relative',
        overflow: 'auto',
        maxHeight: '100%',
      }}
    >
      <div className="pdf-page-container" style={{ 
        display: 'inline-block',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'white',
        margin: '20px',
      }}>
        <canvas
          ref={canvasRef}
          className="pdf-page-canvas"
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </div>
    </div>
  );
};

export default PDFRenderer;