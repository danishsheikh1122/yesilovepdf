import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { uploadToSupabaseIfEligible } from '@/lib/supabaseFileUpload';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('files');
    const pagesToRemove = formData.get('pagesToRemove') || '';

    if (!file) {
      return NextResponse.json({ 
        error: 'Please upload a PDF file.' 
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'File must be a valid PDF document.' 
      }, { status: 400 });
    }

    if (!pagesToRemove.trim()) {
      return NextResponse.json({ 
        error: 'Please specify which pages to remove.' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 1) {
      return NextResponse.json({ 
        error: 'Cannot remove pages from a single-page PDF.' 
      }, { status: 400 });
    }

    try {
      // Parse pages to remove (e.g., "1,3,5-8")
      let pageIndices = [];
      const ranges = pagesToRemove.split(',').map(range => range.trim());
      
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

      // Remove duplicates and sort in descending order for safe removal
      pageIndices = [...new Set(pageIndices)].sort((a, b) => b - a);

      if (pageIndices.length === 0) {
        return NextResponse.json({ 
          error: 'No valid pages specified for removal.' 
        }, { status: 400 });
      }

      if (pageIndices.length >= pageCount) {
        return NextResponse.json({ 
          error: 'Cannot remove all pages from the PDF.' 
        }, { status: 400 });
      }

      // Create new PDF with remaining pages
      const newPdfDoc = await PDFDocument.create();
      const existingPages = pdfDoc.getPages();
      
      // Add pages that are NOT in the removal list
      for (let i = 0; i < pageCount; i++) {
        if (!pageIndices.includes(i)) {
          const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
          newPdfDoc.addPage(copiedPage);
        }
      }

      const modifiedBytes = await newPdfDoc.save();

      // Generate filename
      const originalName = file.name || 'document.pdf';
      const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
      const newFilename = `removed-pages-${nameWithoutExt}.pdf`;

      // Try uploading to Supabase
      const uploadResult = await uploadToSupabaseIfEligible(
        modifiedBytes,
        newFilename,
        originalName
      );

      const response = new Response(modifiedBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${newFilename}"`,
          'Content-Length': modifiedBytes.length.toString(),
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
    console.error('PDF page removal error:', error);
    
    if (error.message && error.message.includes('Invalid PDF')) {
      return NextResponse.json({ 
        error: 'The uploaded file is corrupted or not a valid PDF document.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to remove pages from PDF. Please try again.' 
    }, { status: 500 });
  }
}