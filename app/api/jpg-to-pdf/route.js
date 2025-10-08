import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const pageSize = formData.get('pageSize') || 'a4';
    const orientation = formData.get('orientation') || 'portrait';

    if (!files || files.length === 0) {
      return NextResponse.json({ 
        error: 'Please upload at least one image file.' 
      }, { status: 400 });
    }

    // Validate that all files are images
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: 'All files must be valid image files (JPG, PNG, WebP).' 
        }, { status: 400 });
      }
    }

    const pdfDoc = await PDFDocument.create();

    // Define page sizes
    const pageSizes = {
      a4: { width: 595, height: 842 },
      letter: { width: 612, height: 792 },
      legal: { width: 612, height: 1008 },
    };

    const pageSize_dimensions = pageSizes[pageSize] || pageSizes.a4;
    let { width: pageWidth, height: pageHeight } = pageSize_dimensions;

    // Swap dimensions for landscape
    if (orientation === 'landscape') {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }

    try {
      for (const file of files) {
        const imageBuffer = Buffer.from(await file.arrayBuffer());
        
        // Process image with Sharp to ensure compatibility and optimal size
        const processedImageBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 85 })
          .toBuffer();

        // Get image dimensions
        const { width: imgWidth, height: imgHeight } = await sharp(processedImageBuffer).metadata();

        // Calculate scaling to fit page while maintaining aspect ratio
        const scaleX = pageWidth / imgWidth;
        const scaleY = pageHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        // Center the image on the page
        const x = (pageWidth - scaledWidth) / 2;
        const y = (pageHeight - scaledHeight) / 2;

        // Embed image in PDF
        const image = await pdfDoc.embedJpg(processedImageBuffer);
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        
        page.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();

      return new Response(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="images-to-pdf.pdf"',
          'Content-Length': pdfBytes.length.toString(),
        },
      });

    } catch (processingError) {
      throw processingError;
    }
  } catch (error) {
    console.error('Image to PDF conversion error:', error);
    
    if (error.message && error.message.includes('Invalid image')) {
      return NextResponse.json({ 
        error: 'One or more files are corrupted or not valid image files.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to convert images to PDF. Please try again.' 
    }, { status: 500 });
  }
}