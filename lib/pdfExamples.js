/**
 * PDF-LIB Utility Examples
 * Complete usage examples for all PDF manipulation functions
 */

import {
  createPdf,
  modifyPdf,
  embedImages,
  fillForm,
  copyAndMergePdfs,
  setMetadata,
  readMetadata,
  drawSvg,
  exportPdf,
  compressPdf,
  getPdfInfo
} from './pdfUtils.js';

/**
 * Example 1: Create a new PDF with custom content
 */
export async function exampleCreatePdf() {
  try {
    console.log('Creating new PDF...');
    
    const pdfDoc = await createPdf({
      title: 'My Custom PDF',
      pages: [
        {
          text: 'Welcome to PDF-LIB!',
          fontSize: 30,
          color: [0, 0.5, 0.8], // Blue
          x: 50,
          y: 700,
          font: 'bold',
          backgroundColor: [0.95, 0.95, 0.95], // Light gray background
          shapes: [
            {
              type: 'rectangle',
              x: 100,
              y: 500,
              width: 200,
              height: 100,
              color: [1, 0, 0], // Red
              borderColor: [0, 0, 0], // Black border
              borderWidth: 2
            },
            {
              type: 'circle',
              x: 400,
              y: 550,
              radius: 50,
              color: [0, 1, 0], // Green
            },
            {
              type: 'line',
              x: 50,
              y: 400,
              width: 300,
              height: 0,
              borderColor: [0, 0, 1], // Blue line
              borderWidth: 3
            }
          ]
        },
        {
          text: 'Second Page Content',
          fontSize: 24,
          color: [0.2, 0.2, 0.2],
          x: 50,
          y: 600,
          shapes: [
            {
              type: 'ellipse',
              x: 200,
              y: 400,
              width: 150,
              height: 100,
              color: [1, 1, 0], // Yellow
            }
          ]
        }
      ]
    });

    const pdfBytes = await exportPdf(pdfDoc, 'uint8array');
    console.log('✅ Created PDF successfully! Size:', pdfBytes.length, 'bytes');
    
    return pdfDoc;
  } catch (error) {
    console.error('❌ Error creating PDF:', error.message);
    throw error;
  }
}

/**
 * Example 2: Modify an existing PDF
 */
export async function exampleModifyPdf(pdfPath = './sample.pdf') {
  try {
    console.log('Modifying existing PDF...');
    
    const pdfDoc = await modifyPdf(pdfPath, {
      pageIndex: 0,
      text: 'MODIFIED: ' + new Date().toLocaleDateString(),
      x: 50,
      y: 50,
      fontSize: 16,
      color: [1, 0, 0], // Red
      rotation: 15,
      shapes: [
        {
          type: 'rectangle',
          x: 400,
          y: 700,
          width: 100,
          height: 50,
          color: [1, 1, 0, 0.5], // Semi-transparent yellow
          borderColor: [1, 0, 0],
          borderWidth: 2
        }
      ],
      newPages: [
        {
          text: 'This is a new page added during modification',
          fontSize: 20,
          color: [0, 0, 1]
        }
      ]
    });

    console.log('✅ Modified PDF successfully!');
    return pdfDoc;
  } catch (error) {
    console.error('❌ Error modifying PDF:', error.message);
    throw error;
  }
}

/**
 * Example 3: Embed images into PDF
 */
export async function exampleEmbedImages(pdfPath = './sample.pdf') {
  try {
    console.log('Embedding images into PDF...');
    
    const pdfDoc = await embedImages(pdfPath, [
      {
        imageInput: 'https://via.placeholder.com/300x200/FF0000/FFFFFF?text=Sample+JPG',
        pageIndex: 0,
        x: 100,
        y: 400,
        width: 150,
        height: 100,
        scaleToFit: true
      },
      {
        imageInput: 'https://via.placeholder.com/200x200/00FF00/000000?text=PNG+Image',
        pageIndex: 0,
        x: 300,
        y: 400,
        width: 100,
        height: 100,
        rotation: 45,
        opacity: 0.8
      }
    ]);

    console.log('✅ Embedded images successfully!');
    return pdfDoc;
  } catch (error) {
    console.error('❌ Error embedding images:', error.message);
    throw error;
  }
}

/**
 * Example 4: Fill PDF form
 */
export async function exampleFillForm(formPdfPath = './form.pdf') {
  try {
    console.log('Filling PDF form...');
    
    const pdfDoc = await fillForm(formPdfPath, {
      'firstName': 'Danish',
      'lastName': 'Sheikh',
      'email': 'danish@example.com',
      'age': '25',
      'subscribe': true,
      'gender': 'male',
      'country': 'Pakistan',
      'interests': ['technology', 'programming']
    }, false); // Don't flatten form (keep editable)

    console.log('✅ Filled form successfully!');
    return pdfDoc;
  } catch (error) {
    console.error('❌ Error filling form:', error.message);
    throw error;
  }
}

/**
 * Example 5: Merge multiple PDFs
 */
export async function exampleMergePdfs(pdfPaths = ['./doc1.pdf', './doc2.pdf', './doc3.pdf']) {
  try {
    console.log('Merging PDFs...');
    
    const mergedPdf = await copyAndMergePdfs(pdfPaths, {
      addPageNumbers: true,
      pageNumberStyle: {
        fontSize: 10,
        color: [0.5, 0.5, 0.5],
        position: 'bottom-right'
      }
    });

    console.log('✅ Merged PDFs successfully!');
    return mergedPdf;
  } catch (error) {
    console.error('❌ Error merging PDFs:', error.message);
    throw error;
  }
}

/**
 * Example 6: Set and read metadata
 */
export async function exampleMetadata(pdfPath = './sample.pdf') {
  try {
    console.log('Working with PDF metadata...');
    
    // Set metadata
    const pdfWithMetadata = await setMetadata(pdfPath, {
      title: 'My Document Title',
      author: 'Danish Sheikh',
      subject: 'PDF-LIB Example Document',
      keywords: ['pdf', 'javascript', 'pdf-lib', 'tutorial'],
      creator: 'PDF-LIB Example App',
      producer: 'PDF-LIB Utility v1.0',
      creationDate: new Date().toISOString(),
      modificationDate: new Date().toISOString()
    });

    // Read metadata
    const metadata = await readMetadata(pdfPath);
    console.log('📄 PDF Metadata:', metadata);

    console.log('✅ Metadata operations completed!');
    return pdfWithMetadata;
  } catch (error) {
    console.error('❌ Error with metadata:', error.message);
    throw error;
  }
}

/**
 * Example 7: Draw SVG paths
 */
export async function exampleDrawSvg(pdfPath = './sample.pdf') {
  try {
    console.log('Drawing SVG paths...');
    
    const pdfDoc = await drawSvg(
      pdfPath,
      'M 10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80',
      {
        pageIndex: 0,
        x: 100,
        y: 300,
        scale: 2,
        color: [0.8, 0.2, 0.8], // Purple
        strokeWidth: 3
      }
    );

    console.log('✅ Drew SVG paths successfully!');
    return pdfDoc;
  } catch (error) {
    console.error('❌ Error drawing SVG:', error.message);
    throw error;
  }
}

/**
 * Example 8: Get PDF information
 */
export async function exampleGetPdfInfo(pdfPath = './sample.pdf') {
  try {
    console.log('Getting PDF information...');
    
    const info = await getPdfInfo(pdfPath);
    console.log('📊 PDF Info:', info);

    console.log('✅ Retrieved PDF info successfully!');
    return info;
  } catch (error) {
    console.error('❌ Error getting PDF info:', error.message);
    throw error;
  }
}

/**
 * Example 9: Complete workflow - Create, modify, and export
 */
export async function exampleCompleteWorkflow() {
  try {
    console.log('🚀 Starting complete PDF workflow...');
    
    // Step 1: Create a new PDF
    const newPdf = await createPdf({
      title: 'Workflow Demo',
      pages: [
        {
          text: 'Step 1: Created PDF',
          fontSize: 24,
          color: [0, 0.7, 0],
          x: 50,
          y: 700
        }
      ]
    });

    // Step 2: Add metadata
    const withMetadata = await setMetadata(newPdf, {
      title: 'Complete Workflow Demo',
      author: 'PDF-LIB Example',
      subject: 'Demonstrating all features'
    });

    // Step 3: Modify the PDF
    const modified = await modifyPdf(withMetadata, {
      pageIndex: 0,
      text: 'Step 2: Modified PDF',
      x: 50,
      y: 650,
      fontSize: 18,
      color: [0, 0, 0.8],
      shapes: [
        {
          type: 'rectangle',
          x: 50,
          y: 500,
          width: 300,
          height: 100,
          color: [0.9, 0.9, 0.9],
          borderColor: [0, 0, 0],
          borderWidth: 1
        }
      ]
    });

    // Step 4: Export in different formats
    const uint8Array = await exportPdf(modified, 'uint8array');
    const base64 = await exportPdf(modified, 'base64');
    const dataUrl = await exportPdf(modified, 'dataurl');

    console.log('✅ Complete workflow finished!');
    console.log('📏 Final PDF size:', uint8Array.length, 'bytes');
    console.log('📝 Base64 length:', base64.length, 'characters');
    console.log('🔗 Data URL ready for iframe preview');

    return {
      pdfDocument: modified,
      uint8Array,
      base64,
      dataUrl
    };
  } catch (error) {
    console.error('❌ Error in complete workflow:', error.message);
    throw error;
  }
}

/**
 * Node.js Usage Example
 */
export async function nodeJsExample() {
  if (typeof window !== 'undefined') {
    console.log('⚠️ This example is for Node.js environment only');
    return;
  }

  try {
    console.log('📦 Node.js Example...');
    
    // Create PDF
    const pdfDoc = await createPdf({
      title: 'Node.js Generated PDF',
      pages: [
        {
          text: 'Generated in Node.js!',
          fontSize: 24,
          x: 50,
          y: 700
        }
      ]
    });

    // Export as Buffer
    const buffer = await exportPdf(pdfDoc, 'buffer');
    
    // Save to file (Node.js only)
    const fs = await import('fs/promises');
    await fs.writeFile('./output.pdf', buffer);
    
    console.log('✅ PDF saved to ./output.pdf');
    return buffer;
  } catch (error) {
    console.error('❌ Error in Node.js example:', error.message);
    throw error;
  }
}

/**
 * Browser Usage Example
 */
export async function browserExample() {
  if (typeof window === 'undefined') {
    console.log('⚠️ This example is for browser environment only');
    return;
  }

  try {
    console.log('🌐 Browser Example...');
    
    // Create PDF
    const pdfDoc = await createPdf({
      title: 'Browser Generated PDF',
      pages: [
        {
          text: 'Generated in Browser!',
          fontSize: 24,
          x: 50,
          y: 700,
          color: [0.8, 0.2, 0.2]
        }
      ]
    });

    // Get data URL for preview
    const dataUrl = await exportPdf(pdfDoc, 'dataurl');
    
    // Create preview iframe
    const iframe = document.createElement('iframe');
    iframe.src = dataUrl;
    iframe.style.width = '100%';
    iframe.style.height = '500px';
    iframe.style.border = '1px solid #ccc';
    
    // Append to body (or specific container)
    document.body.appendChild(iframe);
    
    // Also provide download
    await exportPdf(pdfDoc, 'download', 'browser-generated.pdf');
    
    console.log('✅ PDF preview created and download initiated');
    return dataUrl;
  } catch (error) {
    console.error('❌ Error in browser example:', error.message);
    throw error;
  }
}

// Export all examples
export default {
  exampleCreatePdf,
  exampleModifyPdf,
  exampleEmbedImages,
  exampleFillForm,
  exampleMergePdfs,
  exampleMetadata,
  exampleDrawSvg,
  exampleGetPdfInfo,
  exampleCompleteWorkflow,
  nodeJsExample,
  browserExample
};