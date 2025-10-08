import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('files');
    const compressionLevel = formData.get('compressionLevel') || 'basic';

    if (!file) {
      return NextResponse.json({ 
        error: 'Please upload a PDF file to compress.' 
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'File must be a valid PDF document.' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(buffer);

    let compressOptions = {};
    
    // Set compression options based on level
    switch (compressionLevel) {
      case 'basic':
        compressOptions = {
          useObjectStreams: false,
          addDefaultPage: false,
        };
        break;
      case 'strong':
        compressOptions = {
          useObjectStreams: true,
          addDefaultPage: false,
        };
        break;
      case 'extreme':
        compressOptions = {
          useObjectStreams: true,
          addDefaultPage: false,
          updateFieldAppearances: false,
        };
        break;
    }

    try {
      // Save the compressed PDF
      const compressedBytes = await pdfDoc.save(compressOptions);
      
      const originalSize = buffer.length;
      const compressedSize = compressedBytes.length;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

      // If compression didn't reduce size significantly, still return the result
      const finalBytes = compressedSize < originalSize ? compressedBytes : buffer;
      
      return new Response(finalBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="compressed-${file.name}"`,
          'Content-Length': finalBytes.length.toString(),
          'X-Original-Size': originalSize.toString(),
          'X-Compressed-Size': finalBytes.length.toString(),
          'X-Compression-Ratio': compressionRatio,
        },
      });

    } catch (processingError) {
      throw processingError;
    }
  } catch (error) {
    console.error('PDF compression error:', error);
    
    if (error.message && error.message.includes('Invalid PDF')) {
      return NextResponse.json({ 
        error: 'The uploaded file is corrupted or not a valid PDF document.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to compress PDF. Please try again.' 
    }, { status: 500 });
  }
}