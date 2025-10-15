/**
 * Comprehensive PDF Utility Library using PDF-LIB
 * Supports Next.js (app router) and Node.js environments
 * 
 * Features:
 * - PDF creation with text, shapes, and custom fonts
 * - Existing PDF modification and editing
 * - Image embedding (JPEG/PNG)
 * - Form filling and flattening
 * - PDF merging and page copying
 * - Metadata handling (read/write)
 * - SVG path drawing
 * - Multiple export formats (Buffer, Base64, Uint8Array)
 * 
 * Installation:
 * npm install pdf-lib @pdf-lib/fontkit file-saver
 */

import {
  PDFDocument,
  PDFPage,
  PDFFont,
  PDFImage,
  PDFForm,
  StandardFonts,
  rgb,
  degrees,
  PageSizes,
  RotationTypes,
  BlendMode,
  LineCapStyle,
  LineJoinStyle,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// Utility function to handle different input types (URL, Buffer, Uint8Array)
async function loadPdfInput(input) {
  try {
    if (typeof input === 'string') {
      // Handle URL or file path
      if (input.startsWith('http') || input.startsWith('https')) {
        const response = await fetch(input);
        if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        return await response.arrayBuffer();
      } else {
        // Handle file path (Node.js environment)
        if (typeof window === 'undefined') {
          const fs = await import('fs/promises');
          return await fs.readFile(input);
        }
        throw new Error('File path loading only supported in Node.js environment');
      }
    } else if (input instanceof ArrayBuffer || input instanceof Uint8Array || Buffer.isBuffer(input)) {
      // Handle binary data
      return input;
    } else {
      throw new Error('Invalid input type. Expected URL string, Buffer, or Uint8Array');
    }
  } catch (error) {
    throw new Error(`Failed to load PDF input: ${error.message}`);
  }
}

// Utility function to load image input
async function loadImageInput(input) {
  try {
    if (typeof input === 'string') {
      if (input.startsWith('http') || input.startsWith('https')) {
        const response = await fetch(input);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        return await response.arrayBuffer();
      } else {
        // Handle file path (Node.js environment)
        if (typeof window === 'undefined') {
          const fs = await import('fs/promises');
          return await fs.readFile(input);
        }
        throw new Error('File path loading only supported in Node.js environment');
      }
    }
    return input;
  } catch (error) {
    throw new Error(`Failed to load image input: ${error.message}`);
  }
}

/**
 * 1. CREATE PDF - Creates a new PDF document with text, shapes, and custom fonts
 * @param {Object} options - Configuration options
 * @param {string} options.title - Document title
 * @param {Array} options.pages - Array of page configurations
 * @param {string} options.fontUrl - Optional custom font URL
 * @returns {PDFDocument} - PDF document instance
 */
export async function createPdf(options = {}) {
  try {
    const {
      title = 'New PDF Document',
      pages = [{ text: 'Hello World!', fontSize: 24, color: [0, 0, 0] }],
      fontUrl = null
    } = options;

    // Create new PDF document
    const pdfDoc = PDFDocument.create();
    
    // Register fontkit for custom fonts
    pdfDoc.registerFontkit(fontkit);

    // Load fonts
    let customFont = null;
    if (fontUrl) {
      try {
        const fontBytes = await loadImageInput(fontUrl);
        customFont = await pdfDoc.embedFont(fontBytes);
      } catch (error) {
        console.warn('Failed to load custom font, using standard font:', error.message);
      }
    }
    
    const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Create pages
    for (const pageConfig of pages) {
      const page = pdfDoc.addPage(PageSizes.A4);
      const { width, height } = page.getSize();

      const {
        text = 'Sample Text',
        fontSize = 12,
        color = [0, 0, 0],
        x = 50,
        y = height - 100,
        font = 'standard',
        rotation = 0,
        shapes = [],
        backgroundColor = null
      } = pageConfig;

      // Set background color if specified
      if (backgroundColor) {
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(backgroundColor[0], backgroundColor[1], backgroundColor[2]),
        });
      }

      // Choose font
      let selectedFont;
      switch (font) {
        case 'bold':
          selectedFont = boldFont;
          break;
        case 'custom':
          selectedFont = customFont || standardFont;
          break;
        default:
          selectedFont = standardFont;
      }

      // Draw text
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font: selectedFont,
        color: rgb(color[0], color[1], color[2]),
        rotate: degrees(rotation),
      });

      // Draw shapes
      for (const shape of shapes) {
        const {
          type,
          x: shapeX = 100,
          y: shapeY = 100,
          width: shapeWidth = 100,
          height: shapeHeight = 100,
          color: shapeColor = [0, 0, 1],
          borderColor = null,
          borderWidth = 1,
          radius = 0
        } = shape;

        const fillColor = rgb(shapeColor[0], shapeColor[1], shapeColor[2]);
        const strokeColor = borderColor ? rgb(borderColor[0], borderColor[1], borderColor[2]) : null;

        switch (type) {
          case 'rectangle':
            page.drawRectangle({
              x: shapeX,
              y: shapeY,
              width: shapeWidth,
              height: shapeHeight,
              color: fillColor,
              borderColor: strokeColor,
              borderWidth: strokeColor ? borderWidth : 0,
            });
            break;
          case 'circle':
            page.drawCircle({
              x: shapeX,
              y: shapeY,
              size: radius || shapeWidth / 2,
              color: fillColor,
              borderColor: strokeColor,
              borderWidth: strokeColor ? borderWidth : 0,
            });
            break;
          case 'ellipse':
            page.drawEllipse({
              x: shapeX,
              y: shapeY,
              xScale: shapeWidth / 2,
              yScale: shapeHeight / 2,
              color: fillColor,
              borderColor: strokeColor,
              borderWidth: strokeColor ? borderWidth : 0,
            });
            break;
          case 'line':
            page.drawLine({
              start: { x: shapeX, y: shapeY },
              end: { x: shapeX + shapeWidth, y: shapeY + shapeHeight },
              thickness: borderWidth,
              color: strokeColor || fillColor,
            });
            break;
        }
      }
    }

    // Set document metadata
    pdfDoc.setTitle(title);
    pdfDoc.setCreator('PDF-LIB Utility');
    pdfDoc.setProducer('PDF-LIB Utility');
    pdfDoc.setCreationDate(new Date());

    return pdfDoc;
  } catch (error) {
    throw new Error(`Failed to create PDF: ${error.message}`);
  }
}

/**
 * 2. MODIFY PDF - Loads and modifies an existing PDF
 * @param {string|Buffer|Uint8Array} pdfInput - PDF input (URL, file path, or binary data)
 * @param {Object} modifications - Modifications to apply
 * @returns {PDFDocument} - Modified PDF document
 */
export async function modifyPdf(pdfInput, modifications = {}) {
  try {
    const pdfBytes = await loadPdfInput(pdfInput);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Register fontkit for custom fonts
    pdfDoc.registerFontkit(fontkit);

    const {
      pageIndex = 0,
      text = 'Modified Text',
      x = 50,
      y = 50,
      fontSize = 12,
      color = [1, 0, 0], // Red by default
      font = StandardFonts.Helvetica,
      rotation = 0,
      images = [],
      shapes = [],
      newPages = []
    } = modifications;

    // Get page to modify
    const pages = pdfDoc.getPages();
    if (pageIndex >= pages.length) {
      throw new Error(`Page index ${pageIndex} out of range. PDF has ${pages.length} pages.`);
    }
    
    const page = pages[pageIndex];
    
    // Load font
    const selectedFont = await pdfDoc.embedFont(font);

    // Add text
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font: selectedFont,
      color: rgb(color[0], color[1], color[2]),
      rotate: degrees(rotation),
    });

    // Add images
    for (const imageConfig of images) {
      const {
        imageInput,
        x: imgX = 100,
        y: imgY = 100,
        width = 100,
        height = 100,
        rotation: imgRotation = 0,
        opacity = 1
      } = imageConfig;

      const imageBytes = await loadImageInput(imageInput);
      let image;
      
      // Determine image type and embed
      const imageType = imageInput.toLowerCase();
      if (imageType.includes('.jpg') || imageType.includes('.jpeg')) {
        image = await pdfDoc.embedJpg(imageBytes);
      } else if (imageType.includes('.png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        // Try PNG first, then JPG
        try {
          image = await pdfDoc.embedPng(imageBytes);
        } catch {
          image = await pdfDoc.embedJpg(imageBytes);
        }
      }

      page.drawImage(image, {
        x: imgX,
        y: imgY,
        width,
        height,
        rotate: degrees(imgRotation),
        opacity,
      });
    }

    // Add shapes (similar to createPdf)
    for (const shape of shapes) {
      const {
        type,
        x: shapeX = 100,
        y: shapeY = 100,
        width: shapeWidth = 100,
        height: shapeHeight = 100,
        color: shapeColor = [0, 0, 1],
        borderColor = null,
        borderWidth = 1
      } = shape;

      const fillColor = rgb(shapeColor[0], shapeColor[1], shapeColor[2]);
      const strokeColor = borderColor ? rgb(borderColor[0], borderColor[1], borderColor[2]) : null;

      switch (type) {
        case 'rectangle':
          page.drawRectangle({
            x: shapeX,
            y: shapeY,
            width: shapeWidth,
            height: shapeHeight,
            color: fillColor,
            borderColor: strokeColor,
            borderWidth: strokeColor ? borderWidth : 0,
          });
          break;
        case 'circle':
          page.drawCircle({
            x: shapeX,
            y: shapeY,
            size: shapeWidth / 2,
            color: fillColor,
            borderColor: strokeColor,
            borderWidth: strokeColor ? borderWidth : 0,
          });
          break;
      }
    }

    // Add new pages
    for (const newPageConfig of newPages) {
      const newPage = pdfDoc.addPage(PageSizes.A4);
      const { width, height } = newPage.getSize();
      
      const {
        text: pageText = 'New Page',
        fontSize: pageFontSize = 24,
        color: pageColor = [0, 0, 0],
        x: pageX = 50,
        y: pageY = height - 100
      } = newPageConfig;

      newPage.drawText(pageText, {
        x: pageX,
        y: pageY,
        size: pageFontSize,
        font: selectedFont,
        color: rgb(pageColor[0], pageColor[1], pageColor[2]),
      });
    }

    return pdfDoc;
  } catch (error) {
    throw new Error(`Failed to modify PDF: ${error.message}`);
  }
}

/**
 * 3. EMBED IMAGES - Embeds JPEG and PNG images into PDF
 * @param {string|Buffer|Uint8Array} pdfInput - PDF input
 * @param {Array} imageConfigs - Array of image configurations
 * @returns {PDFDocument} - PDF with embedded images
 */
export async function embedImages(pdfInput, imageConfigs = []) {
  try {
    const pdfBytes = await loadPdfInput(pdfInput);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const pages = pdfDoc.getPages();
    
    for (const config of imageConfigs) {
      const {
        imageInput,
        pageIndex = 0,
        x = 50,
        y = 50,
        width = 200,
        height = 200,
        rotation = 0,
        opacity = 1,
        scaleToFit = false
      } = config;

      if (pageIndex >= pages.length) {
        console.warn(`Page index ${pageIndex} out of range, skipping image`);
        continue;
      }

      const page = pages[pageIndex];
      const imageBytes = await loadImageInput(imageInput);
      
      let image;
      const imageType = typeof imageInput === 'string' ? imageInput.toLowerCase() : '';
      
      try {
        if (imageType.includes('.jpg') || imageType.includes('.jpeg')) {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (imageType.includes('.png')) {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          // Auto-detect format
          try {
            image = await pdfDoc.embedPng(imageBytes);
          } catch {
            image = await pdfDoc.embedJpg(imageBytes);
          }
        }
      } catch (error) {
        console.error(`Failed to embed image: ${error.message}`);
        continue;
      }

      // Calculate dimensions if scaleToFit is enabled
      let finalWidth = width;
      let finalHeight = height;
      
      if (scaleToFit) {
        const imageDims = image.scale(1);
        const aspectRatio = imageDims.width / imageDims.height;
        
        if (width / height > aspectRatio) {
          finalWidth = height * aspectRatio;
        } else {
          finalHeight = width / aspectRatio;
        }
      }

      page.drawImage(image, {
        x,
        y,
        width: finalWidth,
        height: finalHeight,
        rotate: degrees(rotation),
        opacity,
      });
    }

    return pdfDoc;
  } catch (error) {
    throw new Error(`Failed to embed images: ${error.message}`);
  }
}

/**
 * 4. FILL FORM - Fills PDF form fields
 * @param {string|Buffer|Uint8Array} pdfInput - PDF input with form fields
 * @param {Object} formData - Data to fill in the form
 * @param {boolean} flatten - Whether to flatten the form (make non-editable)
 * @returns {PDFDocument} - PDF with filled form
 */
export async function fillForm(pdfInput, formData = {}, flatten = false) {
  try {
    const pdfBytes = await loadPdfInput(pdfInput);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log('Available form fields:', fields.map(field => ({
      name: field.getName(),
      type: field.constructor.name
    })));

    // Fill form fields
    for (const [fieldName, value] of Object.entries(formData)) {
      try {
        const field = form.getField(fieldName);
        
        if (field.constructor.name === 'PDFTextField') {
          field.setText(String(value));
        } else if (field.constructor.name === 'PDFCheckBox') {
          if (value) {
            field.check();
          } else {
            field.uncheck();
          }
        } else if (field.constructor.name === 'PDFRadioGroup') {
          field.select(String(value));
        } else if (field.constructor.name === 'PDFDropdown') {
          field.select(String(value));
        } else if (field.constructor.name === 'PDFOptionList') {
          if (Array.isArray(value)) {
            field.select(value.map(String));
          } else {
            field.select([String(value)]);
          }
        }
      } catch (error) {
        console.warn(`Failed to fill field '${fieldName}': ${error.message}`);
      }
    }

    // Flatten form if requested
    if (flatten) {
      form.flatten();
    }

    return pdfDoc;
  } catch (error) {
    throw new Error(`Failed to fill form: ${error.message}`);
  }
}

/**
 * 5. COPY AND MERGE PDFS - Merges multiple PDFs into one
 * @param {Array} pdfInputs - Array of PDF inputs to merge
 * @param {Object} options - Merge options
 * @returns {PDFDocument} - Merged PDF document
 */
export async function copyAndMergePdfs(pdfInputs = [], options = {}) {
  try {
    if (pdfInputs.length === 0) {
      throw new Error('No PDF inputs provided for merging');
    }

    const {
      addPageNumbers = false,
      pageNumberStyle = { fontSize: 12, color: [0, 0, 0], position: 'bottom-center' }
    } = options;

    const mergedPdf = PDFDocument.create();
    let totalPages = 0;

    for (const pdfInput of pdfInputs) {
      try {
        const pdfBytes = await loadPdfInput(pdfInput);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        const pageIndices = pdfDoc.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
        
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
          totalPages++;
        });
      } catch (error) {
        console.error(`Failed to merge PDF: ${error.message}`);
      }
    }

    // Add page numbers if requested
    if (addPageNumbers) {
      const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
      const pages = mergedPdf.getPages();
      
      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNumber = `${index + 1}`;
        
        let x, y;
        switch (pageNumberStyle.position) {
          case 'top-left':
            x = 20;
            y = height - 30;
            break;
          case 'top-right':
            x = width - 50;
            y = height - 30;
            break;
          case 'bottom-left':
            x = 20;
            y = 20;
            break;
          case 'bottom-right':
            x = width - 50;
            y = 20;
            break;
          case 'bottom-center':
          default:
            x = width / 2 - 10;
            y = 20;
            break;
        }
        
        page.drawText(pageNumber, {
          x,
          y,
          size: pageNumberStyle.fontSize,
          font,
          color: rgb(
            pageNumberStyle.color[0],
            pageNumberStyle.color[1],
            pageNumberStyle.color[2]
          ),
        });
      });
    }

    return mergedPdf;
  } catch (error) {
    throw new Error(`Failed to merge PDFs: ${error.message}`);
  }
}

/**
 * 6. SET METADATA - Sets PDF metadata
 * @param {string|Buffer|Uint8Array} pdfInput - PDF input
 * @param {Object} metadata - Metadata to set
 * @returns {PDFDocument} - PDF with updated metadata
 */
export async function setMetadata(pdfInput, metadata = {}) {
  try {
    const pdfBytes = await loadPdfInput(pdfInput);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const {
      title,
      author,
      subject,
      keywords = [],
      creator,
      producer,
      creationDate,
      modificationDate
    } = metadata;

    if (title) pdfDoc.setTitle(title);
    if (author) pdfDoc.setAuthor(author);
    if (subject) pdfDoc.setSubject(subject);
    if (keywords.length > 0) pdfDoc.setKeywords(keywords);
    if (creator) pdfDoc.setCreator(creator);
    if (producer) pdfDoc.setProducer(producer);
    if (creationDate) pdfDoc.setCreationDate(new Date(creationDate));
    if (modificationDate) pdfDoc.setModificationDate(new Date(modificationDate));

    return pdfDoc;
  } catch (error) {
    throw new Error(`Failed to set metadata: ${error.message}`);
  }
}

/**
 * 7. READ METADATA - Reads PDF metadata
 * @param {string|Buffer|Uint8Array} pdfInput - PDF input
 * @returns {Object} - PDF metadata
 */
export async function readMetadata(pdfInput) {
  try {
    const pdfBytes = await loadPdfInput(pdfInput);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    return {
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      keywords: pdfDoc.getKeywords(),
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate()?.toISOString(),
      modificationDate: pdfDoc.getModificationDate()?.toISOString(),
      pageCount: pdfDoc.getPageCount(),
    };
  } catch (error) {
    throw new Error(`Failed to read metadata: ${error.message}`);
  }
}

/**
 * 8. DRAW SVG - Draws SVG paths on PDF
 * @param {string|Buffer|Uint8Array} pdfInput - PDF input
 * @param {string} svgPathData - SVG path data
 * @param {Object} options - Drawing options
 * @returns {PDFDocument} - PDF with SVG paths
 */
export async function drawSvg(pdfInput, svgPathData, options = {}) {
  try {
    const pdfBytes = await loadPdfInput(pdfInput);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const {
      pageIndex = 0,
      x = 0,
      y = 0,
      scale = 1,
      color = [0, 0, 0],
      strokeWidth = 1
    } = options;

    const pages = pdfDoc.getPages();
    if (pageIndex >= pages.length) {
      throw new Error(`Page index ${pageIndex} out of range`);
    }
    
    const page = pages[pageIndex];
    
    // Simple SVG path parser for basic paths
    // Note: This is a simplified implementation
    // For complex SVGs, consider using a dedicated SVG parsing library
    
    const pathColor = rgb(color[0], color[1], color[2]);
    
    // Parse simple commands like M (moveTo), L (lineTo), C (curveTo)
    const commands = svgPathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
    
    let currentX = x;
    let currentY = y;
    
    for (const command of commands) {
      const type = command[0].toUpperCase();
      const coords = command.slice(1).trim().split(/[\s,]+/).map(Number);
      
      switch (type) {
        case 'M': // Move to
          if (coords.length >= 2) {
            currentX = x + (coords[0] * scale);
            currentY = y + (coords[1] * scale);
          }
          break;
        case 'L': // Line to
          if (coords.length >= 2) {
            const targetX = x + (coords[0] * scale);
            const targetY = y + (coords[1] * scale);
            
            page.drawLine({
              start: { x: currentX, y: currentY },
              end: { x: targetX, y: targetY },
              thickness: strokeWidth,
              color: pathColor,
            });
            
            currentX = targetX;
            currentY = targetY;
          }
          break;
        case 'C': // Cubic Bezier curve (simplified as line for now)
          if (coords.length >= 6) {
            const targetX = x + (coords[4] * scale);
            const targetY = y + (coords[5] * scale);
            
            page.drawLine({
              start: { x: currentX, y: currentY },
              end: { x: targetX, y: targetY },
              thickness: strokeWidth,
              color: pathColor,
            });
            
            currentX = targetX;
            currentY = targetY;
          }
          break;
      }
    }

    return pdfDoc;
  } catch (error) {
    throw new Error(`Failed to draw SVG: ${error.message}`);
  }
}

/**
 * 9. EXPORT PDF - Exports PDF in different formats
 * @param {PDFDocument} pdfDoc - PDF document to export
 * @param {string} type - Export type ('buffer', 'uint8array', 'base64', 'download')
 * @param {string} filename - Filename for download (optional)
 * @returns {Buffer|Uint8Array|string|void} - Exported PDF data
 */
export async function exportPdf(pdfDoc, type = 'uint8array', filename = 'document.pdf') {
  try {
    const pdfBytes = await pdfDoc.save();
    
    switch (type.toLowerCase()) {
      case 'buffer':
        // Node.js Buffer
        if (typeof Buffer !== 'undefined') {
          return Buffer.from(pdfBytes);
        } else {
          throw new Error('Buffer not available in browser environment');
        }
        
      case 'uint8array':
        // Uint8Array (works in both Node.js and browser)
        return pdfBytes;
        
      case 'base64':
        // Base64 string
        if (typeof Buffer !== 'undefined') {
          return Buffer.from(pdfBytes).toString('base64');
        } else {
          // Browser environment
          return btoa(String.fromCharCode(...pdfBytes));
        }
        
      case 'download':
        // Browser download
        if (typeof window !== 'undefined') {
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        } else {
          throw new Error('Download only available in browser environment');
        }
        
      case 'dataurl':
        // Data URL for iframe/preview
        const base64 = typeof Buffer !== 'undefined' 
          ? Buffer.from(pdfBytes).toString('base64')
          : btoa(String.fromCharCode(...pdfBytes));
        return `data:application/pdf;base64,${base64}`;
        
      default:
        throw new Error(`Unknown export type: ${type}`);
    }
  } catch (error) {
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
}

/**
 * BONUS: COMPRESS PDF - Basic PDF compression (structure optimization)
 * @param {string|Buffer|Uint8Array} pdfInput - PDF input
 * @param {Object} options - Compression options
 * @returns {PDFDocument} - Compressed PDF
 */
export async function compressPdf(pdfInput, options = {}) {
  try {
    const pdfBytes = await loadPdfInput(pdfInput);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const {
      removeMetadata = false,
      removeAnnotations = false,
      optimize = true
    } = options;

    // Remove metadata if requested
    if (removeMetadata) {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setCreator('');
      pdfDoc.setProducer('');
    }

    // Note: pdf-lib doesn't have built-in image compression
    // For advanced compression, you'd need to integrate with external tools
    // like Ghostscript or other PDF optimization libraries

    return pdfDoc;
  } catch (error) {
    throw new Error(`Failed to compress PDF: ${error.message}`);
  }
}

/**
 * UTILITY: Get PDF Info - Gets basic PDF information
 * @param {string|Buffer|Uint8Array} pdfInput - PDF input
 * @returns {Object} - PDF information
 */
export async function getPdfInfo(pdfInput) {
  try {
    const pdfBytes = await loadPdfInput(pdfInput);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const pages = pdfDoc.getPages();
    const pageInfo = pages.map((page, index) => {
      const { width, height } = page.getSize();
      return { pageNumber: index + 1, width, height };
    });

    return {
      pageCount: pdfDoc.getPageCount(),
      pages: pageInfo,
      metadata: {
        title: pdfDoc.getTitle(),
        author: pdfDoc.getAuthor(),
        subject: pdfDoc.getSubject(),
        creator: pdfDoc.getCreator(),
        producer: pdfDoc.getProducer(),
      },
      fileSize: pdfBytes.length,
    };
  } catch (error) {
    throw new Error(`Failed to get PDF info: ${error.message}`);
  }
}

// Export all functions as default object for easier importing
export default {
  createPdf,
  modifyPdf,
  embedImages,
  fillForm,
  copyAndMergePdfs,
  setMetadata,
  readMetadata,
  drawSvg,
  exportPdf,
  compressPdf,
  getPdfInfo,
};