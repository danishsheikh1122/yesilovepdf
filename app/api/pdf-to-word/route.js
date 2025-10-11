import { NextResponse } from 'next/server';
import { promisify } from 'util';
import { execFile as execFileCb } from 'child_process';
import fsPromises from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Document, Packer, Paragraph, ImageRun } from 'docx';
import fse from 'fs-extra';

const execFile = promisify(execFileCb);

// Ensure this route runs on Node (not edge)
export const runtime = 'nodejs';

export const POST = async (request) => {
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
    const tmpDir = path.join(os.tmpdir(), `pdf2word-${workId}`);
    await fse.ensureDir(tmpDir);

    const inPdfPath = path.join(tmpDir, filename);

    // Save uploaded PDF to disk
    const arrayBuffer = await file.arrayBuffer();
    await fsPromises.writeFile(inPdfPath, Buffer.from(arrayBuffer));

    // Use pdftoppm to convert PDF pages to PNGs
    const outPrefix = path.join(tmpDir, 'page');
    try {
      // -png ensures PNG output. -r 150 sets resolution for good quality but smaller file size
      await execFile('pdftoppm', ['-png', '-r', '150', inPdfPath, outPrefix]);
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

    // Create Word document
    const doc = new Document({
      sections: []
    });

    // Add each image as a page in the Word document
    for (let i = 0; i < imageFiles.length; i++) {
      const imgPath = imageFiles[i];
      const imageBuffer = await fsPromises.readFile(imgPath);
      
      // Create a section for each page
      const section = {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch in twips (1440 twips = 1 inch)
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 468,  // 6.5 inches in points (72 points = 1 inch) - fits in Letter size with margins
                  height: 648, // 9 inches in points - adjust based on aspect ratio
                },
              }),
            ],
          }),
        ],
      };

      // Add page break between pages (except for the last page)
      if (i < imageFiles.length - 1) {
        section.children.push(
          new Paragraph({
            children: [],
            pageBreakBefore: true,
          })
        );
      }

      doc.addSection(section);
    }

    // Write Word document to a temp file
    const outDocxPath = path.join(tmpDir, `${path.parse(filename).name || 'document'}.docx`);
    const buffer = await Packer.toBuffer(doc);
    await fsPromises.writeFile(outDocxPath, buffer);

    // Read Word document bytes and return as response
    const docxBuffer = await fsPromises.readFile(outDocxPath);

    const response = new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${path.basename(outDocxPath)}"`,
        'Content-Length': String(docxBuffer.length),
      },
    });

    // remove temp files (best-effort)
    fse.remove(tmpDir).catch((err) => {
      console.warn('Failed to remove temp dir', tmpDir, err?.message || err);
    });

    return response;
  } catch (error) {
    console.error('PDF to Word conversion error:', error);
    return NextResponse.json({ error: 'Failed to process PDF to Word conversion. Please try again.' }, { status: 500 });
  }
};