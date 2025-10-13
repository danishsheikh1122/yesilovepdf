import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('files');
    
    if (!file) {
      return NextResponse.json({ 
        error: 'No Excel file provided' 
      }, { status: 400 });
    }

    // Check if file is Excel format
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json({ 
        error: 'Please upload a valid Excel file (.xlsx or .xls)' 
      }, { status: 400 });
    }

    console.log('📊 Processing Excel file:', file.name);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Read the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Process each worksheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`📋 Processing sheet: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Get the range of the worksheet to handle full data
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      
      // Convert to 2D array with proper handling of all data
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: '', 
        range: range,
        raw: false // This ensures proper string conversion
      });
      
      if (jsonData.length === 0) {
        console.log(`⚠️ Sheet ${sheetName} is empty, skipping...`);
        continue;
      }
      
      // Calculate page dimensions and table layout
      const pageWidth = 842; // A4 landscape width in points
      const pageHeight = 595; // A4 landscape height in points
      const margin = 40;
      const usableWidth = pageWidth - (2 * margin);
      const usableHeight = pageHeight - (2 * margin);
      
      // Add a new page for each sheet
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Add sheet title
      const titleFontSize = 16;
      page.drawText(sheetName, {
        x: margin,
        y: pageHeight - margin,
        size: titleFontSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Calculate optimal table layout
      const maxCols = Math.max(...jsonData.map(row => row.length));
      const minCellWidth = 80; // Increased minimum column width
      const maxCellWidth = Math.floor(usableWidth / Math.max(maxCols, 1));
      
      // Calculate actual column widths based on content
      const columnWidths = [];
      for (let colIndex = 0; colIndex < maxCols; colIndex++) {
        let maxContentLength = 0;
        
        // Check all rows for this column
        jsonData.forEach(row => {
          const cellValue = String(row[colIndex] || '');
          maxContentLength = Math.max(maxContentLength, cellValue.length);
        });
        
        // Calculate width based on content (6 pixels per character for better spacing)
        const calculatedWidth = Math.max(minCellWidth, Math.min(maxCellWidth, maxContentLength * 6));
        columnWidths.push(calculatedWidth);
      }
      
      // Adjust column widths to fit page if total exceeds usable width
      const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      if (totalWidth > usableWidth) {
        const scaleFactor = usableWidth / totalWidth;
        columnWidths.forEach((width, index) => {
          columnWidths[index] = Math.max(minCellWidth, width * scaleFactor);
        });
      }
      
      const cellHeight = 30; // Increased cell height for better spacing
      const fontSize = 9; // Slightly smaller font for better fit
      let currentY = pageHeight - margin - titleFontSize - 25;
      let currentPage = page;
      
      // Draw table headers and data
      for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
        const row = jsonData[rowIndex];
        
        // Check if we need a new page
        if (currentY - cellHeight < margin) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
          
          // Add continuation title
          currentPage.drawText(`${sheetName} (continued)`, {
            x: margin,
            y: currentY,
            size: 14,
            font: boldFont,
            color: rgb(0, 0, 0),
          });
          currentY -= 30;
        }
        
        let currentX = margin;
        
        // Draw each cell in the row
        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
          const cellValue = String(row[colIndex] || '');
          const cellWidth = columnWidths[colIndex] || minCellWidth;
          
          // Draw cell background and border
          const isHeader = rowIndex === 0;
          currentPage.drawRectangle({
            x: currentX,
            y: currentY - cellHeight,
            width: cellWidth,
            height: cellHeight,
            borderColor: rgb(0.5, 0.5, 0.5),
            borderWidth: 0.5,
            color: isHeader ? rgb(0.95, 0.95, 0.95) : rgb(1, 1, 1),
          });
          
          // Draw cell text (handle text wrapping for long content)
          if (cellValue.length > 0) {
            const maxCharsPerLine = Math.floor((cellWidth - 10) / 5.5); // Better character width calculation
            const lines = [];
            
            if (cellValue.length <= maxCharsPerLine) {
              lines.push(cellValue);
            } else {
              // Split long text into multiple lines
              let remainingText = cellValue;
              while (remainingText.length > 0) {
                if (remainingText.length <= maxCharsPerLine) {
                  lines.push(remainingText);
                  break;
                }
                
                // Find the best break point (space or hyphen)
                let breakPoint = maxCharsPerLine;
                for (let i = maxCharsPerLine - 1; i >= maxCharsPerLine * 0.7; i--) {
                  if (remainingText[i] === ' ' || remainingText[i] === '-') {
                    breakPoint = i + 1;
                    break;
                  }
                }
                
                lines.push(remainingText.substring(0, breakPoint));
                remainingText = remainingText.substring(breakPoint);
                
                // Limit to prevent too many lines
                if (lines.length >= 2) { // Reduced max lines per cell
                  if (remainingText.length > 0) {
                    lines[lines.length - 1] = lines[lines.length - 1].substring(0, lines[lines.length - 1].length - 3) + '...';
                  }
                  break;
                }
              }
            }
            
            // Draw each line of text
            lines.forEach((line, lineIndex) => {
              const textY = currentY - cellHeight + 20 - (lineIndex * 10); // Better line spacing
              if (textY > currentY - cellHeight + 8) { // Make sure text is within cell bounds
                currentPage.drawText(line, {
                  x: currentX + 8, // Increased left padding
                  y: textY,
                  size: fontSize,
                  font: isHeader ? boldFont : font,
                  color: rgb(0, 0, 0),
                });
              }
            });
          }
          
          currentX += cellWidth;
        }
        
        currentY -= cellHeight;
      }
      
      console.log(`✅ Sheet ${sheetName} processed successfully`);
    }
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    console.log('✅ Excel to PDF conversion completed');
    
    // Create filename
    const originalName = file.name.replace(/\.(xlsx|xls)$/i, '');
    const filename = `${originalName}-converted-${Date.now()}.pdf`;
    
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('❌ Excel to PDF conversion error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to convert Excel file to PDF. Please ensure the file is a valid Excel format.' 
    }, { status: 500 });
  }
}

// GET endpoint for supported formats info
export async function GET() {
  return NextResponse.json({
    supportedFormats: ['.xlsx', '.xls'],
    maxFileSize: '10MB',
    description: 'Convert Excel spreadsheets to PDF format'
  });
}