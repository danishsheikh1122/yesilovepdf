import { NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import { promisify } from 'util';

// Convert execFile to promise-based
const execFileAsync = promisify(execFile);

// Ensure this route runs on Node (not edge)
export const runtime = 'nodejs';

/**
 * Analyzes file size to determine if content might be small/simple
 * and need higher quality conversion
 */
function shouldUseHighQuality(fileSize, pdfSize) {
  // If the original file is small (< 2MB) or the resulting PDF is small (< 500KB)
  // it might contain small images or simple content that benefits from higher resolution
  return fileSize < 2000000 || pdfSize < 500000;
}

/**
 * Gets optimized LibreOffice export parameters based on content characteristics
 */
function getExportParameters(isHighQuality = false) {
  const baseParams = [
    'EmbedStandardFonts=true',
    'UseTaggedPDF=false',
    'ExportFormFields=true',
    'FormsType=0',
    'AllowDuplicateFieldNames=false'
  ];

  if (isHighQuality) {
    return [
      ...baseParams,
      'MaxImageResolution=600', // Higher resolution for small content
      'Quality=95',
      'ReduceImageResolution=false',
      'CompressMode=1' // Lossless compression when possible
    ].join(':');
  } else {
    return [
      ...baseParams,
      'MaxImageResolution=300',
      'Quality=90', 
      'ReduceImageResolution=false'
    ].join(':');
  }
}

export async function POST(request) {
  let tempDir = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('files');

    if (!file) {
      return NextResponse.json({ 
        error: 'Please upload a PowerPoint file to convert.' 
      }, { status: 400 });
    }

    // Validate file type
    const filename = file.name || 'presentation';
    const fileExtension = path.extname(filename).toLowerCase();
    
    if (!['.ppt', '.pptx'].includes(fileExtension)) {
      return NextResponse.json({ 
        error: 'File must be a valid PowerPoint file (.ppt or .pptx).' 
      }, { status: 400 });
    }

    // Create temporary directory
    const workId = uuidv4();
    tempDir = path.join(os.tmpdir(), `ppt2pdf-${workId}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Save uploaded file
    const inputPath = path.join(tempDir, filename);
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    await fs.writeFile(inputPath, fileBuffer);

    // Store original file size for analysis
    const originalFileSize = fileBuffer.length;

    // Define output paths
    const outputDir = tempDir;
    const outputPath = path.join(outputDir, `${path.parse(filename).name}.pdf`);

    try {
      // First attempt: Enhanced conversion with high quality settings
      let pdfBuffer;
      let conversionSuccessful = false;

      try {
        // Use LibreOffice command line with enhanced export options for better image quality
        const exportFilterData = getExportParameters(false);

        await execFileAsync('soffice', [
          '--headless',
          '--invisible',
          '--nodefault',
          '--nolockcheck',
          '--nologo',
          '--norestore',
          '--convert-to',
          `pdf:writer_pdf_Export:{"FilterData":{"${exportFilterData}"}}`,
          '--outdir',
          outputDir,
          inputPath
        ]);
        
        // Check if PDF was created successfully with enhanced settings
        await fs.access(outputPath);
        pdfBuffer = await fs.readFile(outputPath);
        conversionSuccessful = true;
        
      } catch (enhancedError) {
        console.log('Enhanced conversion failed, trying fallback method:', enhancedError.message);
        
        // Fallback: Use simpler conversion if enhanced method fails
        try {
          await execFileAsync('soffice', [
            '--headless',
            '--invisible',
            '--nodefault',
            '--nolockcheck',
            '--nologo',
            '--norestore',
            '--convert-to',
            'pdf',
            '--outdir',
            outputDir,
            inputPath
          ]);
          
          await fs.access(outputPath);
          pdfBuffer = await fs.readFile(outputPath);
          conversionSuccessful = true;
          
        } catch (fallbackError) {
          throw fallbackError; // Re-throw to be caught by outer catch
        }
      }

      // If content appears to be small or simple, try higher quality conversion
      if (conversionSuccessful && shouldUseHighQuality(originalFileSize, pdfBuffer.length)) {
        try {
          // Try conversion with even higher quality settings for small files
          const highQualityPath = path.join(outputDir, `${path.parse(filename).name}_hq.pdf`);
          const highQualityFilterData = getExportParameters(true);

          await execFileAsync('soffice', [
            '--headless',
            '--invisible',
            '--nodefault',
            '--nolockcheck',
            '--nologo',
            '--norestore',
            '--convert-to',
            `pdf:writer_pdf_Export:{"FilterData":{"${highQualityFilterData}"}}`,
            '--outdir',
            outputDir,
            inputPath
          ]);

          // Use high quality version if it was created successfully and provides better quality
          try {
            const hqBuffer = await fs.readFile(highQualityPath);
            if (hqBuffer.length > pdfBuffer.length * 0.8) { // Use HQ version if it's substantially different
              pdfBuffer = hqBuffer;
              outputPath = highQualityPath;
              console.log('Using high-quality conversion for better image scaling');
            }
          } catch (hqError) {
            // Ignore errors, use original conversion
            console.log('High quality conversion attempt failed, using standard version');
          }
        } catch (hqConversionError) {
          // Ignore errors from high quality attempt, use original
          console.log('High quality conversion failed, using standard conversion');
        }
      }
      
      // Final validation - ensure we have a valid PDF
      if (!conversionSuccessful || !pdfBuffer) {
        throw new Error('PDF file was not created successfully');
      }
      
      // Generate output filename
      const baseName = path.parse(filename).name;
      const outputFilename = `${baseName}.pdf`;

      // Clean up temporary files
      await fs.rm(tempDir, { recursive: true, force: true });

      // Return PDF file
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${outputFilename}"`,
          'Content-Length': String(pdfBuffer.length),
        },
      });

    } catch (conversionError) {
      console.error('LibreOffice conversion error:', conversionError);
      
      // Clean up on error
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }

      // Check if it's a LibreOffice installation issue
      if (conversionError.message?.includes('soffice') || 
          conversionError.message?.includes('libreoffice') || 
          conversionError.message?.includes('spawn') || 
          conversionError.code === 'ENOENT') {
        return NextResponse.json({ 
          error: 'LibreOffice is required for PowerPoint to PDF conversion. Please install LibreOffice on your system. Make sure soffice command is available in PATH.' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        error: 'Failed to convert PowerPoint to PDF. Please ensure the file is not corrupted and try again.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('PowerPoint to PDF conversion error:', error);
    
    // Clean up on error
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }

    return NextResponse.json({ 
      error: 'An unexpected error occurred during conversion. Please try again.' 
    }, { status: 500 });
  }
}