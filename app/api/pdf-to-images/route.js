import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Simply return the PDF as data URLs for each page
    // The frontend will handle rendering using PDF.js without canvas server-side issues
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;
    
    // For now, we'll return the PDF data URL and let the frontend handle page extraction
    return NextResponse.json({ 
      pdfDataUrl: dataUrl,
      success: true 
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF', details: error.message },
      { status: 500 }
    );
  }
}