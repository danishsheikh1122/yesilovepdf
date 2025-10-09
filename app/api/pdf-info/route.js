import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();

    // Get page information
    const pages = [];
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      
      pages.push({
        pageNumber: i + 1,
        width,
        height,
        rotation: page.getRotation().angle || 0
      });
    }

    return NextResponse.json({
      pageCount,
      pages,
      fileName: file.name,
      fileSize: file.size
    });

  } catch (error) {
    console.error('PDF info error:', error);
    
    if (error.message && error.message.includes('Invalid PDF')) {
      return NextResponse.json({ 
        error: 'The uploaded file is corrupted or not a valid PDF document.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to read PDF information. Please try again.' 
    }, { status: 500 });
  }
}