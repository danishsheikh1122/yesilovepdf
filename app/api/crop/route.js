import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { uploadToSupabaseIfEligible } from '@/lib/supabaseFileUpload';

export async function POST(request) {
  // Helper function to calculate crop coordinates with different scaling
  function scaleCropCoordinates(cropCoords, originalSize, targetSize) {
    const scaleX = targetSize.width / originalSize.width;
    const scaleY = targetSize.height / originalSize.height;
    
    return {
      x: cropCoords.x * scaleX,
      y: cropCoords.y * scaleY,
      width: cropCoords.width * scaleX,
      height: cropCoords.height * scaleY
    };
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const cropData = JSON.parse(formData.get('cropData'));
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    const { 
      x, 
      y, 
      width, 
      height, 
      pageSelection, 
      selectedPages = [] 
    } = cropData;

    // Get pages to crop based on selection
    const pages = pdfDoc.getPages();
    const pagesToCrop = pageSelection === 'all' ? 
      pages.map((_, index) => index) : 
      selectedPages;

    // Apply cropping to selected pages
    for (const pageIndex of pagesToCrop) {
      if (pageIndex < pages.length) {
        const page = pages[pageIndex];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        // Convert crop coordinates from preview scale to actual PDF coordinates
        // PDF coordinates start from bottom-left, browser coordinates from top-left
        const cropBox = {
          x: x,
          y: pageHeight - y - height, // Flip Y coordinate for PDF
          width: width,
          height: height
        };
        
        // Set the crop box (media box) for the page
        page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      }
    }

    // Generate the cropped PDF
    const pdfBytes = await pdfDoc.save();
    
    // Generate filename
    const originalName = file.name || 'document.pdf';
    const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
    const newFilename = `${nameWithoutExt}_cropped.pdf`;

    // Try uploading to Supabase
    const uploadResult = await uploadToSupabaseIfEligible(
      pdfBytes,
      newFilename,
      originalName
    );
    
    // Create response with the cropped PDF
    const response = new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${newFilename}"`,
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

  } catch (error) {
    console.error('Error cropping PDF:', error);
    return NextResponse.json(
      { error: 'Failed to crop PDF', details: error.message },
      { status: 500 }
    );
  }
}``