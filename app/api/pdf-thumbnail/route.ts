import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const pageNumber = parseInt(formData.get('pageNumber') as string) || 1

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read the PDF file
    const arrayBuffer = await file.arrayBuffer()
    
    // Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()

    if (pageNumber > pages.length || pageNumber < 1) {
      return createPlaceholderResponse(pageNumber, 'Invalid Page')
    }

    // Create a new PDF with just this page
    const newPdf = await PDFDocument.create()
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNumber - 1])
    newPdf.addPage(copiedPage)

    // Save as bytes
    const pdfBytes = await newPdf.save()

    // Return the single page PDF
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': pdfBytes.length.toString(),
      },
    })

  } catch (error) {
    console.error('PDF thumbnail generation error:', error)
    return NextResponse.json({ error: 'Failed to generate thumbnail' }, { status: 500 })
  }
}

function createPlaceholderResponse(pageNumber: number, status: string) {
  const svg = `
    <svg width="400" height="520" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2" rx="4"/>
      <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="16" fill="#6c757d">
        Page ${pageNumber} - ${status}
      </text>
    </svg>
  `
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache',
    },
  })
}
