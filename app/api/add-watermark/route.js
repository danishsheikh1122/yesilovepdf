import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export async function POST(request) {
  try {
    const formData = await request.formData();
    // Support single or multiple files under the 'files' key
    const files = formData.getAll ? formData.getAll('files') : [formData.get('files')];
    const file = Array.isArray(files) && files.length > 0 ? files[0] : null;

    // Get watermark options
    const text = formData.get('text') || 'WATERMARK';
    const fontSize = parseInt(formData.get('fontSize') || '48');
    const fontColor = formData.get('fontColor') || '#666666';
    const fontFamily = formData.get('fontFamily') || 'Helvetica';
    const opacity = parseFloat(formData.get('opacity') || '0.15');
    const watermarkType = formData.get('watermarkType') || 'tilted';

    console.log('📝 Processing add text watermark request:', {
      text, fontSize, fontColor, fontFamily, opacity, watermarkType
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

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Please provide watermark text.' 
      }, { status: 400 });
    }

    // Load the PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();
    
    console.log(`📝 PDF loaded with ${pages.length} pages`);
    
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

    // Add watermark to each page using an improved approach
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      
      console.log(`📝 Page ${index + 1}: "${text}" at ${width}x${height} (tilted watermark)`);
      
      // Calculate text dimensions
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = fontSize;
      
      // Improved tilted watermark pattern
      try {
        // Calculate optimal spacing based on text size and page dimensions
        const spacingX = Math.max(textWidth * 1.8, 180);
        const spacingY = Math.max(textHeight * 3, 120);
        
        // Calculate how many watermarks fit across and down
        const numCols = Math.ceil((width + spacingX) / spacingX) + 1;
        const numRows = Math.ceil((height + spacingY) / spacingY) + 1;
        
        // Starting offset to center the pattern
        const startX = -spacingX / 2;
        const startY = -spacingY / 2;
        
        // Apply proper color with opacity - use RGB directly with opacity
        const finalColor = rgb(
          color.r * opacity + (1 - opacity), 
          color.g * opacity + (1 - opacity), 
          color.b * opacity + (1 - opacity)
        );
        
        // Create diagonal repeating pattern
        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numCols; col++) {
            // Calculate position
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;
            
            // Stagger alternate rows for better coverage
            const offsetX = (row % 2) * (spacingX / 2);
            
            const finalX = x + offsetX;
            const finalY = y;
            
            // Only draw if position is within reasonable bounds
            if (finalX > -textWidth && finalX < width + textWidth && 
                finalY > -textHeight && finalY < height + textHeight) {
              
              page.drawText(text, {
                x: finalX,
                y: finalY,
                size: fontSize,
                font: font,
                color: finalColor,
                rotate: degrees(-45),
                opacity: opacity
              });
            }
          }
        }
        
        console.log(`✅ Successfully added tilted watermark "${text}" to page ${index + 1} with ${Math.round(opacity * 100)}% opacity`);
        
      } catch (error) {
        console.error(`Error adding watermark to page ${index + 1}:`, error);
        
        // Simple fallback: single center watermark
        try {
          const x = (width - textWidth) / 2;
          const y = height / 2;
          
          const fallbackColor = rgb(
            color.r * opacity + (1 - opacity), 
            color.g * opacity + (1 - opacity), 
            color.b * opacity + (1 - opacity)
          );
          
          page.drawText(text, {
            x: x,
            y: y,
            size: fontSize,
            font: font,
            color: fallbackColor,
            rotate: degrees(-45)
          });
          
          console.log(`✅ Added fallback center watermark to page ${index + 1}`);
        } catch (fallbackError) {
          console.error(`Error adding fallback watermark to page ${index + 1}:`, fallbackError);
        }
      }
    });

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    console.log(`✅ Successfully added text watermarks to ${pages.length} pages`);

    // Generate filename
    const originalName = file.name || 'document.pdf';
    const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
    const newFilename = `${nameWithoutExt}_watermarked.pdf`;

    return new Response(modifiedPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${newFilename}"`,
        'Content-Length': modifiedPdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Add text watermark error:', error);
    return NextResponse.json({ 
      error: `Failed to add text watermark: ${error.message}` 
    }, { status: 500 });
  }
}