import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import puppeteer from 'puppeteer';

export async function POST(request) {
  let browser = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('files');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.match(/\.(doc|docx)$/i)) {
      return NextResponse.json({ error: 'Please upload a Word document (.doc or .docx)' }, { status: 400 });
    }

    console.log(`📝 Processing Word document: ${file.name}`);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract content with formatting using mammoth
    const result = await mammoth.convertToHtml(buffer, {
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      })
    });

    const htmlContent = result.value;
    console.log('✅ Extracted HTML content from Word document');

    // Create complete HTML document with proper styling
    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: 'Times New Roman', serif;
                font-size: 11pt;
                line-height: 1.2;
                margin: 0;
                padding: 20pt;
                color: #000;
                max-width: 100%;
                word-wrap: break-word;
            }
            p {
                margin: 0 0 6pt 0;
            }
            h1, h2, h3, h4, h5, h6 {
                margin: 12pt 0 6pt 0;
                font-weight: bold;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 6pt 0;
                page-break-inside: avoid;
                font-size: inherit;
            }
            td, th {
                border: 1px solid #000;
                padding: 4pt;
                text-align: left;
            }
            img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 6pt auto;
                page-break-inside: avoid;
            }
            ul, ol {
                margin: 6pt 0;
                padding-left: 36pt;
            }
            li {
                margin: 3pt 0;
            }
        </style>
    </head>
    <body>
        ${htmlContent}
    </body>
    </html>`;

    // Launch puppeteer to convert HTML to PDF
    console.log('🚀 Launching browser for PDF generation...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    // Set viewport for better rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });

    // Generate PDF with improved settings for better ratio and quality
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      },
      printBackground: true,
      preferCSSPageSize: false,
      scale: 1.0,
      displayHeaderFooter: false
    });

    console.log(`✅ PDF generated successfully (${pdfBuffer.length} bytes)`);

    // Generate filename
    const originalName = file.name.replace(/\.(doc|docx)$/i, '');
    const filename = `${originalName}_converted.pdf`;

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Word to PDF conversion error:', error);
    return NextResponse.json({ 
      error: `Conversion failed: ${error.message}` 
    }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}