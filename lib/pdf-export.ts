import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { EditorElement } from '@/lib/types';

export class PDFExporter {
  private originalPdfDoc: PDFDocument | null = null;
  private elements: EditorElement[] = [];

  async initialize(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    this.originalPdfDoc = await PDFDocument.load(arrayBuffer);
  }

  setElements(elements: EditorElement[]) {
    this.elements = elements;
  }

  async exportPDF(): Promise<Uint8Array> {
    if (!this.originalPdfDoc) {
      throw new Error('PDF document not initialized');
    }

    // Create a copy of the original PDF
    const pdfDoc = await PDFDocument.create();
    const pages = await pdfDoc.copyPages(
      this.originalPdfDoc, 
      this.originalPdfDoc.getPageIndices()
    );

    // Add all pages to the new document
    pages.forEach((page) => pdfDoc.addPage(page));

    // Group elements by page
    const elementsByPage = new Map<number, EditorElement[]>();
    this.elements.forEach(element => {
      const pageElements = elementsByPage.get(element.pageNumber) || [];
      pageElements.push(element);
      elementsByPage.set(element.pageNumber, pageElements);
    });

    // Apply elements to each page
    for (const [pageNumber, pageElements] of elementsByPage.entries()) {
      const page = pdfDoc.getPages()[pageNumber - 1];
      if (!page) continue;

      await this.applyElementsToPage(pdfDoc, page, pageElements);
    }

    return await pdfDoc.save();
  }

  private async applyElementsToPage(
    pdfDoc: PDFDocument, 
    page: any, 
    elements: EditorElement[]
  ) {
    const pageHeight = page.getHeight();

    for (const element of elements) {
      switch (element.type) {
        case 'text':
          await this.addTextElement(pdfDoc, page, element, pageHeight);
          break;
        case 'whiteout':
          await this.addWhiteoutElement(page, element, pageHeight);
          break;
        case 'link':
          await this.addLinkElement(page, element, pageHeight);
          break;
        case 'image':
          await this.addImageElement(pdfDoc, page, element, pageHeight);
          break;
        case 'signature':
          await this.addSignatureElement(pdfDoc, page, element, pageHeight);
          break;
        case 'annotation':
          await this.addAnnotationElement(page, element, pageHeight);
          break;
        default:
          console.warn(`Unsupported element type: ${element.type}`);
      }
    }
  }

  private async addTextElement(
    pdfDoc: PDFDocument,
    page: any,
    element: EditorElement,
    pageHeight: number
  ) {
    const textData = element.data as any;
    
    // Convert screen coordinates to PDF coordinates (PDF origin is bottom-left)
    const pdfY = pageHeight - element.y - element.height;

    // Load font
    let font;
    try {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    } catch {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // Parse color
    const color = this.parseColor(textData.color || '#000000');

    page.drawText(textData.content || '', {
      x: element.x,
      y: pdfY,
      size: textData.fontSize || 16,
      font: font,
      color: color,
      maxWidth: element.width,
    });
  }

  private async addWhiteoutElement(
    page: any,
    element: EditorElement,
    pageHeight: number
  ) {
    const pdfY = pageHeight - element.y - element.height;
    
    page.drawRectangle({
      x: element.x,
      y: pdfY,
      width: element.width,
      height: element.height,
      color: rgb(1, 1, 1), // White
      opacity: element.style.opacity || 1,
    });
  }

  private async addLinkElement(
    page: any,
    element: EditorElement,
    pageHeight: number
  ) {
    const linkData = element.data as any;
    const pdfY = pageHeight - element.y - element.height;

    // Add link annotation
    page.node.addAnnot(
      page.doc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [element.x, pdfY, element.x + element.width, pdfY + element.height],
        A: {
          Type: 'Action',
          S: 'URI',
          URI: linkData.url || '',
        },
        Border: [0, 0, 0],
      })
    );
  }

  private async addImageElement(
    pdfDoc: PDFDocument,
    page: any,
    element: EditorElement,
    pageHeight: number
  ) {
    const imageData = element.data as any;
    const pdfY = pageHeight - element.y - element.height;

    try {
      // This would need to handle the actual image data
      // For now, we'll skip image embedding as it requires base64 data
      console.log('Image element export not fully implemented');
    } catch (error) {
      console.error('Failed to embed image:', error);
    }
  }

  private async addSignatureElement(
    pdfDoc: PDFDocument,
    page: any,
    element: EditorElement,
    pageHeight: number
  ) {
    const signatureData = element.data as any;
    const pdfY = pageHeight - element.y - element.height;

    try {
      // This would handle signature image data
      console.log('Signature element export not fully implemented');
    } catch (error) {
      console.error('Failed to embed signature:', error);
    }
  }

  private async addAnnotationElement(
    page: any,
    element: EditorElement,
    pageHeight: number
  ) {
    const annotationData = element.data as any;
    
    // Convert annotation paths to PDF coordinates and draw as paths
    if (annotationData.paths && annotationData.paths.length > 0) {
      const path = annotationData.paths[0];
      if (path.length > 1) {
        const color = this.parseColor(annotationData.strokeColor || '#000000');
        
        // For simplicity, we'll draw lines between points
        for (let i = 0; i < path.length - 1; i++) {
          const start = path[i];
          const end = path[i + 1];
          
          page.drawLine({
            start: { x: start.x, y: pageHeight - start.y },
            end: { x: end.x, y: pageHeight - end.y },
            color: color,
            thickness: annotationData.strokeWidth || 2,
          });
        }
      }
    }
  }

  private parseColor(colorStr: string) {
    // Convert hex color to RGB
    const hex = colorStr.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    return rgb(r, g, b);
  }
}

// Hook for easy usage in components
export const usePDFExport = () => {
  const exportPDF = async (file: File, elements: EditorElement[], filename?: string) => {
    try {
      const exporter = new PDFExporter();
      await exporter.initialize(file);
      exporter.setElements(elements);
      
      const pdfBytes = await exporter.exportPDF();
      
      // Download the file
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'edited-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    }
  };

  return { exportPDF };
};