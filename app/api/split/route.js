import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';
import { createReadStream } from 'fs';
import archiver from 'archiver';
import { uploadToSupabaseIfEligible } from '@/lib/supabaseFileUpload';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('files');
    const splitOption = formData.get('splitOption') || 'all-pages';
    const pageRange = formData.get('pageRange') || '';

    if (!file) {
      return NextResponse.json({ 
        error: 'Please upload a PDF file to split.' 
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

    if (pageCount === 1) {
      return NextResponse.json({ 
        error: 'PDF has only one page. Nothing to split.' 
      }, { status: 400 });
    }

    const tempPaths = [];
    const zipPath = path.join(os.tmpdir(), `split_${Date.now()}.zip`);

    try {
      if (splitOption === 'all-pages') {
        // Split into individual pages
        for (let i = 0; i < pageCount; i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);
          
          const pdfBytes = await newPdf.save();
          const tempPath = path.join(os.tmpdir(), `page_${i + 1}.pdf`);
          await writeFile(tempPath, pdfBytes);
          tempPaths.push(tempPath);
        }
      } else if (splitOption === 'custom-range' && pageRange) {
        // Parse page range (e.g., "1-5,7,9-12")
        const ranges = pageRange.split(',').map(range => range.trim());
        let outputIndex = 1;

        for (const range of ranges) {
          if (range.includes('-')) {
            const [start, end] = range.split('-').map(num => parseInt(num.trim()));
            if (start >= 1 && end <= pageCount && start <= end) {
              const newPdf = await PDFDocument.create();
              const pageIndices = [];
              for (let i = start - 1; i < end; i++) {
                pageIndices.push(i);
              }
              const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
              copiedPages.forEach(page => newPdf.addPage(page));
              
              const pdfBytes = await newPdf.save();
              const tempPath = path.join(os.tmpdir(), `pages_${start}-${end}.pdf`);
              await writeFile(tempPath, pdfBytes);
              tempPaths.push(tempPath);
            }
          } else {
            const pageNum = parseInt(range);
            if (pageNum >= 1 && pageNum <= pageCount) {
              const newPdf = await PDFDocument.create();
              const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
              newPdf.addPage(copiedPage);
              
              const pdfBytes = await newPdf.save();
              const tempPath = path.join(os.tmpdir(), `page_${pageNum}.pdf`);
              await writeFile(tempPath, pdfBytes);
              tempPaths.push(tempPath);
            }
          }
        }
      }

      if (tempPaths.length === 0) {
        return NextResponse.json({ 
          error: 'No valid pages to split. Check your page range.' 
        }, { status: 400 });
      }

      // Create ZIP file
      const output = require('fs').createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);

      for (const tempPath of tempPaths) {
        archive.file(tempPath, { name: path.basename(tempPath) });
      }

      await archive.finalize();

      // Wait for ZIP creation to complete
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
      });

      // Read ZIP file and return it
      const zipBuffer = await (await import('fs')).promises.readFile(zipPath);

      // Try uploading to Supabase (but with special content type for ZIP)
      const uploadResult = await uploadToSupabaseIfEligible(
        zipBuffer,
        'split-pages.zip',
        file.name
      );

      // Clean up temp files
      for (const temp of tempPaths) {
        try {
          await unlink(temp);
        } catch (unlinkError) {
          console.warn('Failed to delete temp file:', temp, unlinkError);
        }
      }
      
      try {
        await unlink(zipPath);
      } catch (unlinkError) {
        console.warn('Failed to delete zip file:', zipPath, unlinkError);
      }

      const response = new Response(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="split-pages.zip"',
          'Content-Length': zipBuffer.length.toString(),
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
      // Clean up temp files in case of error
      for (const temp of tempPaths) {
        try {
          await unlink(temp);
        } catch (unlinkError) {
          console.warn('Failed to delete temp file during cleanup:', temp, unlinkError);
        }
      }
      try {
        await unlink(zipPath);
      } catch (unlinkError) {
        console.warn('Failed to delete zip file during cleanup:', zipPath, unlinkError);
      }
      throw processingError;
    }
  } catch (error) {
    console.error('PDF split error:', error);
    
    if (error.message && error.message.includes('Invalid PDF')) {
      return NextResponse.json({ 
        error: 'The uploaded file is corrupted or not a valid PDF document.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to split PDF. Please try again.' 
    }, { status: 500 });
  }
}