import { NextResponse } from 'next/server';
import { promisify } from 'util';
import { execFile as execFileCb } from 'child_process';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import PPTX from 'pptxgenjs';
import sizeOf from 'image-size';
import fse from 'fs-extra';

const execFile = promisify(execFileCb);

// Ensure this route runs on Node (not edge)
export const runtime = 'nodejs';

export const POST = async (request) => {
  // This handler expects a multipart/form-data upload with field name: files (single file)
  try {
    const formData = await request.formData();
    const file = formData.get('files');

    if (!file) {
      return NextResponse.json({ error: 'Please upload a PDF file to convert.' }, { status: 400 });
    }

    // If file is a File/Blob
    const filename = file.name || `upload-${Date.now()}.pdf`;
    const contentType = file.type || '';

    if (!contentType.includes('pdf') && path.extname(filename).toLowerCase() !== '.pdf') {
      return NextResponse.json({ error: 'File must be a valid PDF document.' }, { status: 400 });
    }

    // Create temp working directory
    const workId = uuidv4();
    const tmpDir = path.join(os.tmpdir(), `pdf2ppt-${workId}`);
    await fse.ensureDir(tmpDir);

    const inPdfPath = path.join(tmpDir, filename);

    // Save uploaded PDF to disk
    const arrayBuffer = await file.arrayBuffer();
    await fsPromises.writeFile(inPdfPath, Buffer.from(arrayBuffer));

    // Use pdftoppm to convert PDF pages to PNGs
    // pdftoppm -png input.pdf outprefix
    const outPrefix = path.join(tmpDir, 'page');
    try {
      // -png ensures PNG output. -r 300 sets resolution (dpi) for better quality.
      await execFile('pdftoppm', ['-png', '-r', '300', inPdfPath, outPrefix]);
    } catch (err) {
      // Clean up and respond with error explaining poppler dependency if binary not found
      await fse.remove(tmpDir);
      const message =
        err.code === 'ENOENT'
          ? 'pdftoppm not found. Please install Poppler (poppler-utils). On Debian/Ubuntu: sudo apt-get install poppler-utils; on macOS: brew install poppler'
          : `Error converting PDF to images: ${err.message || err}`;
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Collect generated images (pdftoppm generates files like page-1.png, page-2.png, ...)
    const files = await fsPromises.readdir(tmpDir);
    const imageFiles = files
      .filter((f) => /\.png$/i.test(f) && f.startsWith('page'))
      .sort((a, b) => {
        // sort numerically by trailing number
        const na = a.match(/(\d+)\.png$/);
        const nb = b.match(/(\d+)\.png$/);
        const ia = na ? parseInt(na[1], 10) : 0;
        const ib = nb ? parseInt(nb[1], 10) : 0;
        return ia - ib;
      })
      .map((f) => path.join(tmpDir, f));

    if (imageFiles.length === 0) {
      await fse.remove(tmpDir);
      return NextResponse.json({ error: 'No images were produced from the PDF. Is the PDF valid?' }, { status: 500 });
    }

    // Create PPTX
    const pptx = new PPTX();
    
    // We'll set the slide size based on the first PDF page dimensions
    let slideWidthInches, slideHeightInches;
    let isFirstPage = true;

    // Add each image as a separate slide
    for (const imgPath of imageFiles) {
      // Read the image file as buffer for sizeOf
      const imageBuffer = await fsPromises.readFile(imgPath);
      const dims = sizeOf(imageBuffer); // { width, height } in pixels
      
      // Convert pixels to inches using the DPI from pdftoppm (300 DPI)
      const dpi = 300;
      const widthInches = dims.width / dpi;
      const heightInches = dims.height / dpi;
      
      // For the first page, set the slide size to match the PDF page size
      if (isFirstPage) {
        slideWidthInches = widthInches;
        slideHeightInches = heightInches;
        
        // Define custom layout with PDF dimensions
        pptx.defineLayout({ 
          name: 'PDF_SIZE', 
          width: slideWidthInches, 
          height: slideHeightInches 
        });
        pptx.layout = 'PDF_SIZE';
        isFirstPage = false;
      }
      
      // Add new slide
      const slide = pptx.addSlide();

      // Since we're matching the PDF dimensions exactly, the image should fill the entire slide
      slide.addImage({
        path: imgPath,
        x: 0,
        y: 0,
        w: slideWidthInches,
        h: slideHeightInches,
      });
    }

    // Write PPTX to a temp file
    const outPptxPath = path.join(tmpDir, `${path.parse(filename).name || 'presentation'}.pptx`);

    // pptxgenjs has writeFile that returns a Promise when running in Node if used with writeFile
    // Note: In some pptxgenjs versions, writeFile is async with callback; this code uses the Promise-returning path.
    await pptx.writeFile({ fileName: outPptxPath });

    // Read PPTX bytes and return as response
    const pptxBuffer = await fsPromises.readFile(outPptxPath);

    // cleanup temp dir asynchronously (but ensure removed even if response sent)
    // We'll remove synchronously after sending response body; but return response with buffer first
    const response = new NextResponse(pptxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${path.basename(outPptxPath)}"`,
        'Content-Length': String(pptxBuffer.length),
      },
    });

    // remove temp files (best-effort)
    fse.remove(tmpDir).catch((err) => {
      console.warn('Failed to remove temp dir', tmpDir, err?.message || err);
    });

    return response;
  } catch (error) {
    console.error('PDF to PowerPoint conversion error:', error);
    return NextResponse.json({ error: 'Failed to process PDF to PowerPoint conversion. Please try again.' }, { status: 500 });
  }
};