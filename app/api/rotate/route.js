import { NextResponse } from 'next/server';
import { PDFDocument, degrees } from 'pdf-lib';
import { uploadToSupabaseIfEligible } from '@/lib/supabaseFileUpload';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('files');
    const rotation = parseInt(formData.get('rotation') || '90');
    const pages = formData.get('pages') || 'all';

    if (!file) {
      return NextResponse.json({ 
        error: 'Please upload a PDF file to rotate.' 
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'File must be a valid PDF document.' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();

    try {
      // Determine which pages to rotate
      let pageIndices = [];
      
      if (pages === 'all') {
        pageIndices = Array.from({ length: pageCount }, (_, i) => i);
      } else if (pages === 'odd') {
        pageIndices = Array.from({ length: pageCount }, (_, i) => i).filter(i => (i + 1) % 2 === 1);
      } else if (pages === 'even') {
        pageIndices = Array.from({ length: pageCount }, (_, i) => i).filter(i => (i + 1) % 2 === 0);
      } else {
        // Custom page range (e.g., "1,3,5-8")
        const ranges = pages.split(',').map(range => range.trim());
        for (const range of ranges) {
          if (range.includes('-')) {
            const [start, end] = range.split('-').map(num => parseInt(num.trim()));
            if (start >= 1 && end <= pageCount && start <= end) {
              for (let i = start - 1; i < end; i++) {
                pageIndices.push(i);
              }
            }
          } else {
            const pageNum = parseInt(range);
            if (pageNum >= 1 && pageNum <= pageCount) {
              pageIndices.push(pageNum - 1);
            }
          }
        }
      }

      // Remove duplicates and sort
      pageIndices = [...new Set(pageIndices)].sort((a, b) => a - b);

      if (pageIndices.length === 0) {
        return NextResponse.json({ 
          error: 'No valid pages selected for rotation.' 
        }, { status: 400 });
      }

      // Rotate the specified pages
      const pdfPages = pdfDoc.getPages();
      for (const pageIndex of pageIndices) {
        const page = pdfPages[pageIndex];
        page.setRotation(degrees(rotation));
      }

      const rotatedBytes = await pdfDoc.save();

      // Generate filename
      const originalName = file.name || 'document.pdf';
      const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
      const newFilename = `rotated-${nameWithoutExt}.pdf`;

      // Try uploading to Supabase
      const uploadResult = await uploadToSupabaseIfEligible(
        rotatedBytes,
        newFilename,
        originalName
      );

      const response = new Response(rotatedBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${newFilename}"`,
          'Content-Length': rotatedBytes.length.toString(),
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
    console.error('PDF rotation error:', error);
    
    if (error.message && error.message.includes('Invalid PDF')) {
      return NextResponse.json({ 
        error: 'The uploaded file is corrupted or not a valid PDF document.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to rotate PDF. Please try again.' 
    }, { status: 500 });
  }
}