import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

export async function generateScreenshotPdf(url, options = {}) {
  let browser = null;
  
  try {
    console.log('🚀 Starting SCREENSHOT PDF generation for:', url);
    
    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    console.log('✅ Browser launched');

    const page = await browser.newPage();
    
    // Set viewport size for screenshot
    await page.setViewport({ 
      width: 1200, 
      height: 1600,
      deviceScaleFactor: 2 // Higher quality
    });

    console.log('📄 Navigating to URL...');
    
    // Navigate to the URL
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    console.log('✅ Page loaded');

    // Wait for dynamic content to fully load (5 seconds)
    console.log('⏳ Waiting 5 seconds for dynamic content...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Dynamic content loaded');

    // Get the full page height for full screenshot
    const bodyHandle = await page.$('body');
    const boundingBox = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    console.log('📷 Taking full page SCREENSHOT (as image)...');

    // Take a FULL PAGE SCREENSHOT as PNG image
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: true, // This captures the ENTIRE page
      captureBeyondViewport: true
    });

    console.log('✅ Screenshot captured, size:', screenshotBuffer.length);

    await browser.close();

    // Now convert the screenshot image to PDF
    console.log('📄 Converting screenshot to PDF...');
    
    const pdfDoc = await PDFDocument.create();
    
    // Embed the PNG screenshot
    const pngImage = await pdfDoc.embedPng(screenshotBuffer);
    
    // Get image dimensions
    const pngDims = pngImage.scale(1);
    
    // Calculate page size to fit the screenshot at full width
    // Use the actual screenshot width (no compression)
    const pageWidth = pngDims.width; // Full screenshot width
    const scale = 1; // No scaling, keep original size
    const pageHeight = pngDims.height;
    
    // Add a page with custom dimensions to fit the screenshot
    const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Draw the screenshot image on the page
    page1.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    console.log('✅ Screenshot PDF created, size:', pdfBytes.length);
    
    return Buffer.from(pdfBytes);

  } catch (error) {
    console.error('❌ Screenshot PDF generation error:', error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }
    
    throw new Error(`Failed to generate screenshot PDF: ${error.message}`);
  }
}