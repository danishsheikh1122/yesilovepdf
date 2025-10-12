import jsPDF from 'jspdf';

export async function generatePdfFromHtml(htmlContent, originalUrl, options = {}) {
  try {
    // Create a new jsPDF instance
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: options.format || 'a4'
    });

    // Extract text content from HTML for basic PDF generation
    const textContent = extractTextFromHtml(htmlContent);
    const urlObj = new URL(originalUrl);
    
    // Add header with URL
    pdf.setFontSize(12);
    pdf.setTextColor(100);
    pdf.text(`Source: ${originalUrl}`, 20, 20);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    
    // Add a line
    pdf.setDrawColor(200);
    pdf.line(20, 35, 190, 35);
    
    // Add main content
    pdf.setFontSize(10);
    pdf.setTextColor(0);
    
    const pageWidth = pdf.internal.pageSize.width - 40; // margins
    const lines = pdf.splitTextToSize(textContent, pageWidth);
    
    let yPosition = 50;
    const lineHeight = 5;
    const pageHeight = pdf.internal.pageSize.height - 40;
    
    for (let i = 0; i < lines.length; i++) {
      if (yPosition > pageHeight) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.text(lines[i], 20, yPosition);
      yPosition += lineHeight;
    }
    
    // Add footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pdf.internal.pageSize.width / 2,
        pdf.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    return Buffer.from(pdf.output('arraybuffer'));
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
}

function extractTextFromHtml(html) {
  try {
    // Remove script and style tags completely
    let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Replace common HTML elements with text equivalents
    cleanHtml = cleanHtml.replace(/<br\s*\/?>/gi, '\n');
    cleanHtml = cleanHtml.replace(/<\/p>/gi, '\n\n');
    cleanHtml = cleanHtml.replace(/<\/div>/gi, '\n');
    cleanHtml = cleanHtml.replace(/<\/h[1-6]>/gi, '\n\n');
    cleanHtml = cleanHtml.replace(/<li>/gi, '• ');
    cleanHtml = cleanHtml.replace(/<\/li>/gi, '\n');
    
    // Remove all remaining HTML tags
    cleanHtml = cleanHtml.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    cleanHtml = cleanHtml.replace(/&nbsp;/g, ' ');
    cleanHtml = cleanHtml.replace(/&amp;/g, '&');
    cleanHtml = cleanHtml.replace(/&lt;/g, '<');
    cleanHtml = cleanHtml.replace(/&gt;/g, '>');
    cleanHtml = cleanHtml.replace(/&quot;/g, '"');
    cleanHtml = cleanHtml.replace(/&#39;/g, "'");
    
    // Clean up whitespace
    cleanHtml = cleanHtml.replace(/\n\s*\n/g, '\n\n');
    cleanHtml = cleanHtml.replace(/^\s+|\s+$/g, '');
    
    return cleanHtml || 'No readable content found on this webpage.';
    
  } catch (error) {
    console.error('HTML parsing error:', error);
    return 'Error parsing webpage content.';
  }
}