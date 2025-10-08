import { NextResponse } from 'next/server';
import PDFMerger from 'pdf-merger-js';
import { PDFDocument } from 'pdf-lib';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const excludedPages = formData.get('excludedPages'); // Comma-separated list of global page indices to exclude

    if (!files || files.length < 1) {
      return NextResponse.json({ 
        error: 'Please upload at least 1 PDF file to merge.' 
      }, { status: 400 });
    }

    // Validate that all files are PDFs
    for (const file of files) {
      if (!file.type || file.type !== 'application/pdf') {
        return NextResponse.json({ 
          error: 'All files must be valid PDF documents.' 
        }, { status: 400 });
      }
    }

    const tempPaths = [];
    let excludedPagesArray = [];
    
    if (excludedPages) {
      excludedPagesArray = excludedPages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    }

    try {
      // If we have excluded pages, we need to use pdf-lib for more control
      if (excludedPagesArray.length > 0) {
        const finalDoc = await PDFDocument.create();
        let globalPageIndex = 0;

        // Process each file
        for (const file of files) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const pdfDoc = await PDFDocument.load(buffer);
          const pageCount = pdfDoc.getPageCount();

          // Get pages to include from this file
          const pagesToInclude = [];
          for (let i = 0; i < pageCount; i++) {
            if (!excludedPagesArray.includes(globalPageIndex)) {
              pagesToInclude.push(i);
            }
            globalPageIndex++;
          }

          // Copy included pages
          if (pagesToInclude.length > 0) {
            const copiedPages = await finalDoc.copyPages(pdfDoc, pagesToInclude);
            copiedPages.forEach(page => finalDoc.addPage(page));
          }
        }

        const mergedBytes = await finalDoc.save();

        return new Response(mergedBytes, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="merged-document.pdf"',
            'Content-Length': mergedBytes.length.toString(),
          },
        });
      } else {
        // Use the faster pdf-merger-js for simple merging without exclusions
        const merger = new PDFMerger();

        // Save each uploaded file temporarily and add to merger
        for (const file of files) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const tempPath = path.join(os.tmpdir(), `${Date.now()}_${sanitizedFileName}`);
          await writeFile(tempPath, buffer);
          tempPaths.push(tempPath);
          await merger.add(tempPath);
        }

        // Save merged PDF
        const mergedPath = path.join(os.tmpdir(), `merged_${Date.now()}.pdf`);
        await merger.save(mergedPath);

        // Read merged file and return it
        const mergedBuffer = await (await import('fs')).promises.readFile(mergedPath);

        // Clean up temp files
        for (const temp of tempPaths) {
          try {
            await unlink(temp);
          } catch (unlinkError) {
            console.warn('Failed to delete temp file:', temp, unlinkError);
          }
        }
        
        try {
          await unlink(mergedPath);
        } catch (unlinkError) {
          console.warn('Failed to delete merged temp file:', mergedPath, unlinkError);
        }

        return new Response(mergedBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="merged-document.pdf"',
            'Content-Length': mergedBuffer.length.toString(),
          },
        });
      }
    } catch (processingError) {
      // Clean up temp files in case of error
      for (const temp of tempPaths) {
        try {
          await unlink(temp);
        } catch (unlinkError) {
          console.warn('Failed to delete temp file during cleanup:', temp, unlinkError);
        }
      }
      throw processingError;
    }
  } catch (error) {
    console.error('PDF merge error:', error);
    
    if (error.message && error.message.includes('Invalid PDF')) {
      return NextResponse.json({ 
        error: 'One or more files are corrupted or not valid PDF documents.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to merge PDF files. Please try again.' 
    }, { status: 500 });
  }
}