import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { uploadToSupabaseIfEligible } from '@/lib/supabaseFileUpload';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const pageSize = formData.get('pageSize') || 'a4';
    const orientation = formData.get('orientation') || 'portrait';
    const margin = parseInt(formData.get('margin') || '10');
    const rotationsData = formData.get('rotations');

    let rotations = [];
    if (rotationsData) {
      try {
        rotations = JSON.parse(rotationsData);
      } catch (e) {
        // If parsing fails, use no rotations
        rotations = [];
      }
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ 
        error: 'Please upload at least one image file.' 
      }, { status: 400 });
    }

    // Validate that all files are images
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff'];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: 'All files must be valid image files (JPG, PNG, WebP, TIFF).'
        }, { status: 400 });
      }
    }

    const pdfDoc = await PDFDocument.create();

    // Define page sizes (in points, 72 points = 1 inch)
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

    // Convert margin from mm to points (1mm = 2.83465 points)
    const marginPoints = margin * 2.83465;
    const contentWidth = pageWidth - (marginPoints * 2);
    const contentHeight = pageHeight - (marginPoints * 2);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rotation = rotations[i] || 0; // Get rotation for this image
        const imageBuffer = Buffer.from(await file.arrayBuffer());
        
        // Process image with Sharp - apply rotation and ensure compatibility
        let imageProcessor = sharp(imageBuffer);
        
        // Apply rotation if specified
        if (rotation !== 0) {
          imageProcessor = imageProcessor.rotate(rotation);
        }
        
        const processedImageBuffer = await imageProcessor
          .jpeg({ quality: 85 })
          .toBuffer();

        // Get image dimensions after rotation
        const { width: imgWidth, height: imgHeight } = await sharp(processedImageBuffer).metadata();

        // Calculate scaling to fit content area while maintaining aspect ratio
        const scaleX = contentWidth / imgWidth;
        const scaleY = contentHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        // Center the image on the page (within the margin area)
        const x = marginPoints + (contentWidth - scaledWidth) / 2;
        const y = marginPoints + (contentHeight - scaledHeight) / 2;

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

      // Generate filename
      const filename = 'images-to-pdf.pdf';

      // Try uploading to Supabase
      const uploadResult = await uploadToSupabaseIfEligible(
        pdfBytes,
        filename,
        `${files.length}-images-converted`
      );

      const response = new Response(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBytes.length.toString(),
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