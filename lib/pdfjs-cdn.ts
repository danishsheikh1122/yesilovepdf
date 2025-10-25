// PDF.js CDN types and utilities
// This file provides types and utilities for using PDF.js via CDN instead of npm package

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNum: number): Promise<PDFPageProxy>;
}

export interface PDFPageProxy {
  getViewport(options: { scale: number }): PDFPageViewport;
  render(options: { canvasContext: CanvasRenderingContext2D; viewport: PDFPageViewport }): PDFRenderTask;
}

export interface PDFPageViewport {
  width: number;
  height: number;
  transform: number[];
}

export interface PDFRenderTask {
  promise: Promise<void>;
}

// Load PDF.js from CDN if not already loaded
export const loadPDFJS = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be loaded in browser environment');
  }

  // Return existing instance if already loaded
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    // Create script element to load PDF.js
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    
    script.onload = () => {
      // Configure worker
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js failed to load'));
      }
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load PDF.js from CDN'));
    };
    
    document.head.appendChild(script);
  });
};

// Utility function to get document from file
export const getPDFDocument = async (file: File): Promise<PDFDocumentProxy> => {
  const pdfjsLib = await loadPDFJS();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        resolve(pdf);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export default { loadPDFJS, getPDFDocument };