import { NextResponse } from 'next/server';
import pdf from 'pdf-poppler';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import archiver from 'archiver';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('files');
    const format = formData.get('format') || 'jpeg';
    const quality = parseInt(formData.get('quality') || '85');

    if (!file) {
      return NextResponse.json({ 
        error: 'Please upload a PDF file to convert.' 
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'File must be a valid PDF document.' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPdfPath = path.join(os.tmpdir(), `pdf_${Date.now()}.pdf`);
    const outputDir = path.join(os.tmpdir(), `images_${Date.now()}`);
    
    try {
      // Save PDF temporarily
      await writeFile(tempPdfPath, buffer);

      // Convert PDF to images
      const options = {
        format: format, // jpeg, png
        out_dir: outputDir,
        out_prefix: 'page',
        page: null, // convert all pages
        quality: quality,
      };

      const imageFiles = await pdf.convert(tempPdfPath, options);
      
      if (!imageFiles || imageFiles.length === 0) {
        throw new Error('No images were generated from the PDF');
      }

      // If only one image, return it directly
      if (imageFiles.length === 1) {
        const imagePath = path.join(outputDir, imageFiles[0]);
        const imageBuffer = await readFile(imagePath);
        
        // Clean up
        await unlink(tempPdfPath);
        await unlink(imagePath);

        return new Response(imageBuffer, {
          headers: {
            'Content-Type': `image/${format}`,
            'Content-Disposition': `attachment; filename="page-1.${format}"`,
            'Content-Length': imageBuffer.length.toString(),
          },
        });
      }

      // Multiple images - create ZIP
      const zipPath = path.join(os.tmpdir(), `pdf-images_${Date.now()}.zip`);
      const output = require('fs').createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);

      for (const imageFile of imageFiles) {
        const imagePath = path.join(outputDir, imageFile);
        archive.file(imagePath, { name: imageFile });
      }

      await archive.finalize();

      // Wait for ZIP creation to complete
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
      });

      // Read ZIP file and return it
      const zipBuffer = await readFile(zipPath);

      // Clean up temp files
      await unlink(tempPdfPath);
      for (const imageFile of imageFiles) {
        const imagePath = path.join(outputDir, imageFile);
        try {
          await unlink(imagePath);
        } catch (unlinkError) {
          console.warn('Failed to delete image file:', imagePath, unlinkError);
        }
      }
      try {
        await unlink(zipPath);
      } catch (unlinkError) {
        console.warn('Failed to delete zip file:', zipPath, unlinkError);
      }

      return new Response(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="pdf-images.zip"',
          'Content-Length': zipBuffer.length.toString(),
        },
      });

    } catch (processingError) {
      // Clean up temp files in case of error
      try {
        await unlink(tempPdfPath);
      } catch (unlinkError) {
        console.warn('Failed to delete temp PDF during cleanup:', tempPdfPath, unlinkError);
      }
      throw processingError;
    }
  } catch (error) {
    console.error('PDF to image conversion error:', error);
    
    if (error.message && error.message.includes('Invalid PDF')) {
      return NextResponse.json({ 
        error: 'The uploaded file is corrupted or not a valid PDF document.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to convert PDF to images. Please try again.' 
    }, { status: 500 });
  }
}