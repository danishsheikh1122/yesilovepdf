import { NextResponse } from 'next/server';
import { PDFDocument, degrees } from 'pdf-lib';
import { uploadToSupabaseIfEligible } from '@/lib/supabaseFileUpload';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('files');
    const pageOperations = formData.get('pageOperations');

    if (!file) {
      return NextResponse.json({ 
        error: 'Please upload a PDF file to organize.' 
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'File must be a valid PDF document.' 
      }, { status: 400 });
    }

    if (!pageOperations) {
      return NextResponse.json({ 
        error: 'Page operations data is required.' 
      }, { status: 400 });
    }

    let operations;
    try {
      operations = JSON.parse(pageOperations);
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid page operations format.' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sourcePdf = await PDFDocument.load(buffer);
    const organizedPdf = await PDFDocument.create();

    // Copy pages in the new order with rotations applied
    for (const operation of operations) {
      const { originalPageIndex, rotation = 0 } = operation;
      
      if (originalPageIndex < 0 || originalPageIndex >= sourcePdf.getPageCount()) {
        continue; // Skip invalid page indices
      }

      // Copy the page from source to organized PDF
      const [copiedPage] = await organizedPdf.copyPages(sourcePdf, [originalPageIndex]);
      
      // Apply rotation if specified
      if (rotation !== 0) {
        copiedPage.setRotation(degrees(rotation));
      }
      
      organizedPdf.addPage(copiedPage);
    }

    const organizedBytes = await organizedPdf.save();

    // Generate filename
    const originalName = file.name || 'document.pdf';
    const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
    const newFilename = `organized-${nameWithoutExt}.pdf`;

    // Try uploading to Supabase
    const uploadResult = await uploadToSupabaseIfEligible(
      organizedBytes,
      newFilename,
      originalName
    );

    const response = new Response(organizedBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${newFilename}"`,
        'Content-Length': organizedBytes.length.toString(),
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
    console.error('Organize API error:', error);
    return NextResponse.json({ 
      error: 'Failed to organize PDF. Please try again with a valid PDF file.' 
    }, { status: 500 });
  }
}