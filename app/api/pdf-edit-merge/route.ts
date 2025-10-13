import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * API endpoint to merge edited PDF pages
 * Receives an array of page images (base64 data URLs) and creates a PDF
 */
export async function POST(request: NextRequest) {
  try {
    const { pages } = await request.json();

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { error: 'No pages provided' },
        { status: 400 }
      );
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    for (const pageDataUrl of pages) {
      try {
        // Extract base64 data from data URL
        const base64Data = pageDataUrl.split(',')[1];
        if (!base64Data) {
          console.error('Invalid page data URL format');
          continue;
        }

        const imageBytes = Buffer.from(base64Data, 'base64');

        // Determine image type from data URL
        let image;
        if (pageDataUrl.startsWith('data:image/png')) {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (pageDataUrl.startsWith('data:image/jpeg') || pageDataUrl.startsWith('data:image/jpg')) {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          // Default to PNG
          image = await pdfDoc.embedPng(imageBytes);
        }

        // Add a page with the same dimensions as the image
        const page = pdfDoc.addPage([image.width, image.height]);
        
        // Draw the image to fill the entire page
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      } catch (error) {
        console.error('Error processing page:', error);
        // Continue with other pages even if one fails
      }
    }

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();

    // Return the PDF as a response
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="edited-document.pdf"',
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error merging PDF pages:', error);
    return NextResponse.json(
      { error: 'Failed to merge PDF pages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Alternative endpoint for direct page data submission
 * Handles both data URLs and raw base64 strings
 */
export async function PUT(request: NextRequest) {
  try {
    const { pages, metadata } = await request.json();

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { error: 'No pages provided' },
        { status: 400 }
      );
    }

    const pdfDoc = await PDFDocument.create();

    // Set PDF metadata if provided
    if (metadata) {
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
      if (metadata.creator) pdfDoc.setCreator(metadata.creator);
      if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords);
    }

    for (const pageData of pages) {
      try {
        let imageBytes: Buffer;
        let imageType = 'png'; // default

        // Handle different input formats
        if (typeof pageData === 'string') {
          // Data URL or base64 string
          if (pageData.startsWith('data:')) {
            const matches = pageData.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
            if (matches) {
              imageType = matches[1];
              imageBytes = Buffer.from(matches[2], 'base64');
            } else {
              throw new Error('Invalid data URL format');
            }
          } else {
            // Plain base64 string
            imageBytes = Buffer.from(pageData, 'base64');
          }
        } else if (pageData.data && pageData.type) {
          // Object with data and type
          imageBytes = Buffer.from(pageData.data, 'base64');
          imageType = pageData.type;
        } else {
          throw new Error('Invalid page data format');
        }

        // Embed image
        let image;
        if (imageType === 'jpeg' || imageType === 'jpg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          image = await pdfDoc.embedPng(imageBytes);
        }

        // Add page
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      } catch (error) {
        console.error('Error processing page in PUT:', error);
      }
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${metadata?.filename || 'edited-document.pdf'}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error in PUT endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to create PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
