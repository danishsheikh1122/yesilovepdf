import { NextResponse } from 'next/server';
import { uploadToSupabaseIfEligible } from '@/lib/supabaseFileUpload';

export async function POST(request) {
  try {
    const { url, options = {} } = await request.json();

    if (!url) {
      return NextResponse.json({ 
        error: 'Please provide a URL to convert to PDF.' 
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json({ 
        error: 'Please provide a valid URL (including http:// or https://).' 
      }, { status: 400 });
    }

    let pdfBuffer;
    const conversionType = options.conversionType || 'text';

    try {
      if (conversionType === 'screenshot') {
        // Use Playwright for full website screenshot
        const { generateScreenshotPdf } = await import('./screenshot-generator');
        pdfBuffer = await generateScreenshotPdf(url, options);
      } else {
        // Use text-based extraction (original method)
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const htmlContent = await response.text();
        const { generatePdfFromHtml } = await import('./pdf-generator');
        pdfBuffer = await generatePdfFromHtml(htmlContent, url, options);
      }

      // Get the domain name for filename
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const typePrefix = conversionType === 'screenshot' ? 'screenshot' : 'text';
      const filename = `${domain}-${typePrefix}-${Date.now()}.pdf`;

      // Try uploading to Supabase
      const uploadResult = await uploadToSupabaseIfEligible(
        pdfBuffer,
        filename,
        `webpage-${domain}`
      );

      const response = new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
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
      console.error('Error processing URL:', processingError);
      
      // If screenshot method fails, try fallback to text method
      if (conversionType === 'screenshot') {
        try {
          console.log('Screenshot method failed, falling back to text extraction...');
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (response.ok) {
            const htmlContent = await response.text();
            const { generatePdfFromHtml } = await import('./pdf-generator');
            const fallbackPdfBuffer = await generatePdfFromHtml(htmlContent, url, options);
            
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');
            const filename = `${domain}-fallback-${Date.now()}.pdf`;

            // Try uploading to Supabase
            const uploadResult = await uploadToSupabaseIfEligible(
              fallbackPdfBuffer,
              filename,
              `webpage-${domain}-fallback`
            );
            
            const response = new NextResponse(fallbackPdfBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': fallbackPdfBuffer.length.toString(),
                'X-Fallback-Method': 'text-extraction'
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
          }
        } catch (fallbackError) {
          console.error('Fallback method also failed:', fallbackError);
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to process the webpage. Please check the URL and try again.' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('HTML to PDF conversion error:', error);

    return NextResponse.json({ 
      error: 'Failed to convert webpage to PDF. Please try again.' 
    }, { status: 500 });
  }
}

// GET endpoint for URL preview/validation
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ 
      error: 'URL parameter is required' 
    }, { status: 400 });
  }

  try {
    // Validate URL
    const urlObj = new URL(url);
    
    // Basic validation - try to fetch headers
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    return NextResponse.json({
      valid: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      title: urlObj.hostname
    });

  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: 'Invalid URL or unreachable website'
    });
  }
}