import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

export async function generateScreenshotPdf(url, options = {}) {
  let browser = null;
  
  try {
    console.log('🚀 Starting SCREENSHOT PDF generation for:', url);
    
    // Try to find Chrome executable paths for different OS
    const findChrome = () => {
      const { platform } = process;
      
      if (platform === 'win32') {
        // Windows paths
        return [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        ];
      } else if (platform === 'darwin') {
        // macOS paths
        return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
      } else {
        // Linux paths
        return [
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
        ];
      }
    };

    let launchOptions = {
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
    };

    // Try to launch with default puppeteer Chrome
    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (defaultError) {
      console.log('⚠️ Default Chrome not found, trying system Chrome...');
      
      // Try to find system Chrome
      const chromePaths = findChrome();
      let foundChrome = false;
      
      for (const chromePath of chromePaths) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(chromePath)) {
            console.log(`✅ Found Chrome at: ${chromePath}`);
            launchOptions.executablePath = chromePath;
            browser = await puppeteer.launch(launchOptions);
            foundChrome = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!foundChrome) {
        throw new Error('Chrome browser not found. Screenshot feature requires Chrome to be installed. Please install Google Chrome or use the text extraction method instead.');
      }
    }

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