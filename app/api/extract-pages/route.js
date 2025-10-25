import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { uploadToSupabaseIfEligible } from '@/lib/supabaseFileUpload';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('files');
    const pagesToExtract = formData.get('pagesToExtract') || '';

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

    if (!pagesToExtract.trim()) {
      return NextResponse.json({ 
        error: 'Please specify which pages to extract.' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();

    try {
      // Parse pages to extract (e.g., "1,3,5-8")
      let pageIndices = [];
      const ranges = pagesToExtract.split(',').map(range => range.trim());
      
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

      // Remove duplicates and sort
      pageIndices = [...new Set(pageIndices)].sort((a, b) => a - b);

      if (pageIndices.length === 0) {
        return NextResponse.json({ 
          error: 'No valid pages specified for extraction.' 
        }, { status: 400 });
      }

      // Create new PDF with extracted pages
      const newPdfDoc = await PDFDocument.create();
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
      
      copiedPages.forEach(page => newPdfDoc.addPage(page));

      const extractedBytes = await newPdfDoc.save();

      // Generate filename
      const originalName = file.name || 'document.pdf';
      const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
      const newFilename = `extracted-pages-${nameWithoutExt}.pdf`;

      // Try uploading to Supabase
      const uploadResult = await uploadToSupabaseIfEligible(
        extractedBytes,
        newFilename,
        originalName
      );

      const response = new Response(extractedBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${newFilename}"`,
          'Content-Length': extractedBytes.length.toString(),
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
    console.error('PDF page extraction error:', error);
    
    if (error.message && error.message.includes('Invalid PDF')) {
      return NextResponse.json({ 
        error: 'The uploaded file is corrupted or not a valid PDF document.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to extract pages from PDF. Please try again.' 
    }, { status: 500 });
  }
}