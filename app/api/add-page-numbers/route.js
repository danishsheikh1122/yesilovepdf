import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { uploadToSupabaseIfEligible } from '@/lib/supabaseFileUpload';

export async function POST(request) {
  try {
  const formData = await request.formData();
  // Support single or multiple files under the 'files' key
  const files = formData.getAll ? formData.getAll('files') : [formData.get('files')];
  const file = Array.isArray(files) && files.length > 0 ? files[0] : null;

  // Normalize option names (support different client keys)
  let position = formData.get('position') || 'bottom-right';
  let format = formData.get('format') || formData.get('formatString') || '{page}';
  // legacy option used in some places
  if (format === 'number') format = '{page}';
  const fontSize = parseInt(formData.get('fontSize') || formData.get('size') || '12');
  const fontColor = formData.get('fontColor') || formData.get('color') || '#000000';
  const fontFamily = formData.get('fontFamily') || formData.get('font') || 'Helvetica';
  const startPage = parseInt(formData.get('startPage') || formData.get('startNumber') || '1');
  const marginX = parseInt(formData.get('marginX') || formData.get('margin') || '50');
  const marginY = parseInt(formData.get('marginY') || formData.get('margin') || '50');
  const opacity = parseFloat(formData.get('opacity') || '1');

    console.log('📄 Processing add page numbers request:', {
      position, format, fontSize, fontColor, fontFamily, 
      startPage, marginX, marginY, opacity
    });

    if (!file) {
      return NextResponse.json({ 
        error: 'Please upload a PDF file.' 
      }, { status: 400 });
    }

    if (!file.type || file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'File must be a valid PDF document.' 
      }, { status: 400 });
    }

    // Load the PDF
  const buffer = Buffer.from(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();
    
    console.log(`📄 PDF loaded with ${pages.length} pages`);
    
    // Get font - map font family names to pdf-lib fonts
    const fontMap = {
      'Helvetica': StandardFonts.Helvetica,
      'Times-Roman': StandardFonts.TimesRoman,
      'Courier': StandardFonts.Courier,
      'Arial': StandardFonts.Helvetica, // Fallback to Helvetica
      'Georgia': StandardFonts.TimesRoman // Fallback to Times
    };
    
    const selectedFont = fontMap[fontFamily] || StandardFonts.Helvetica;
    const font = await pdfDoc.embedFont(selectedFont);
    
    // Convert hex color to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 0, g: 0, b: 0 };
    };
    
    const color = hexToRgb(fontColor);
    console.log('🎨 Using color:', color);

    // Add page numbers to each page
    pages.forEach((page, index) => {
      const currentPageNumber = index + startPage;
      const totalPages = pages.length;
      
      // Generate page number text
      let pageText = format
        .replace('{page}', currentPageNumber.toString())
        .replace('{total}', totalPages.toString());
      
      const { width, height } = page.getSize();

      // Determine appropriate font size and measure text
      let useFontSize = fontSize;
      let textWidth = font.widthOfTextAtSize(pageText, useFontSize);
      const textHeight = useFontSize;

      // If text is wider than available space, scale it down to fit with some padding
      const maxTextWidth = Math.max(10, width - 40);
      if (textWidth > maxTextWidth) {
        const scale = maxTextWidth / textWidth;
        useFontSize = Math.max(8, Math.floor(useFontSize * scale));
        textWidth = font.widthOfTextAtSize(pageText, useFontSize);
      }
      
      console.log(`📄 Page ${index + 1}: "${pageText}" at ${width}x${height}`);
      
      // Calculate position with better spacing
      let x, y;
      switch (position) {
        case 'top-left':
          x = marginX;
          y = height - marginY - textHeight;
          break;
        case 'top-center':
          x = (width - textWidth) / 2;
          y = height - marginY - textHeight;
          break;
        case 'top-right':
          x = width - textWidth - marginX;
          y = height - marginY - textHeight;
          break;
        case 'bottom-left':
          x = marginX;
          y = marginY;
          break;
        case 'bottom-center':
          x = (width - textWidth) / 2;
          y = marginY;
          break;
        case 'bottom-right':
        default:
          x = width - textWidth - marginX;
          y = marginY;
          break;
      }
      
      // Ensure text stays within page bounds
      x = Math.max(10, Math.min(x, width - textWidth - 10));
      y = Math.max(10, Math.min(y, height - textHeight - 10));
      
      // Draw the page number (avoid passing unknown options like opacity to drawText)
      try {
        page.drawText(pageText, {
          x,
          y,
          size: useFontSize,
          font,
          color: rgb(color.r, color.g, color.b)
        });
      } catch (drawErr) {
        console.error('Error drawing text on page, retrying with defaults:', drawErr);
        // Fallback: try with default font/size
        try {
          page.drawText(pageText, { x: Math.max(10, x), y: Math.max(10, y), size: 12 });
        } catch (e) {
          console.error('Fallback drawText failed:', e);
        }
      }
      
      console.log(`✅ Added "${pageText}" at (${x.toFixed(1)}, ${y.toFixed(1)})`);
    });

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    console.log(`✅ Successfully added page numbers to ${pages.length} pages`);

    // Generate filename
    const originalName = file.name || 'document.pdf';
    const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
    const newFilename = `${nameWithoutExt}_with_page_numbers.pdf`;

    // Try uploading to Supabase
    const uploadResult = await uploadToSupabaseIfEligible(
      modifiedPdfBytes,
      newFilename,
      originalName
    );

    const response = new Response(modifiedPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${newFilename}"`,
        'Content-Length': modifiedPdfBytes.length.toString(),
      },
    });

    // Add Supabase upload info to response headers if successful
    if (uploadResult.uploaded && uploadResult.publicUrl) {
      response.headers.set('X-Supabase-Url', uploadResult.publicUrl);
      response.headers.set('X-File-Size', uploadResult.fileSize.toString());
    } else if (uploadResult.error) {
      response.headers.set('X-Upload-Warning', uploadResult.error);
    }

    return response;

  } catch (error) {
    console.error('❌ Add page numbers error:', error);
    return NextResponse.json({ 
      error: `Failed to add page numbers: ${error.message}` 
    }, { status: 500 });
  }
}