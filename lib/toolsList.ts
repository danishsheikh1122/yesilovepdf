import availableToolIds from './availableTools';

// toolConfig copied from app/tools/[toolId]/page.tsx (keep in sync)
const toolConfig: Record<string, { title: string; description: string; keywords?: string[] }> = {
  merge: {
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one document',
    keywords: ['merge', 'combine', 'join', 'merge pdf', 'combine pdfs'],
  },
  split: {
    title: 'Split PDF',
    description: 'Split a PDF into multiple files or extract specific pages',
    keywords: ['split', 'extract', 'split pdf', 'extract pages'],
  },
  compress: {
    title: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality',
    keywords: ['compress', 'reduce', 'shrink', 'compress pdf', 'reduce size'],
  },
  'remove-pages': {
    title: 'Remove Pages',
    description: 'Delete unwanted pages from your PDF documents',
    keywords: ['remove', 'delete', 'remove pages', 'delete pages'],
  },
  'extract-pages': {
    title: 'Extract Pages',
    description: 'Extract specific pages from PDF to create new documents',
    keywords: ['extract', 'extract pages', 'split'],
  },
  organize: {
    title: 'Organize PDF',
    description: 'Reorder, rotate, and manage pages',
    keywords: ['organize', 'reorder', 'rotate', 'manage', 'organize pdf'],
  },
  'scan-to-pdf': {
    title: 'Scan to PDF',
    description: 'Convert scanned images to searchable PDFs',
    keywords: ['scan', 'scan to pdf', 'scanner', 'scanned document'],
  },
  repair: {
    title: 'Repair PDF',
    description: 'Fix corrupted or damaged PDF files',
    keywords: ['repair', 'fix', 'repair pdf', 'recover'],
  },
  ocr: {
    title: 'OCR PDF',
    description: 'Make scanned PDFs searchable',
    keywords: ['ocr', 'searchable', 'ocr pdf', 'recognize text'],
  },
  'jpg-to-pdf': {
    title: 'Image to PDF',
    description: 'Convert images to PDF',
    keywords: ['jpg to pdf', 'png to pdf', 'image to pdf', 'photo to pdf', 'jpeg to pdf', 'convert image', 'picture to pdf'],
  },
  'word-to-pdf': {
    title: 'WORD to PDF',
    description: 'Convert Word documents to PDF',
    keywords: ['word to pdf', 'doc to pdf', 'convert word'],
  },
  'powerpoint-to-pdf': {
    title: 'PowerPoint to PDF',
    description: 'Convert presentations to PDF',
    keywords: ['powerpoint to pdf', 'ppt to pdf', 'presentation to pdf'],
  },
  'excel-to-pdf': {
    title: 'Excel to PDF',
    description: 'Convert spreadsheets to PDF',
    keywords: ['excel to pdf', 'xls to pdf', 'spreadsheet to pdf'],
  },
  'html-to-pdf': {
    title: 'HTML to PDF',
    description: 'Convert web pages to PDF',
    keywords: ['html to pdf', 'webpage to pdf', 'url to pdf'],
  },
  'pdf-to-jpg': {
    title: 'PDF to JPG',
    description: 'Convert PDF pages to images',
    keywords: ['pdf to jpg', 'pdf to image', 'convert to jpg'],
  },
  'pdf-to-word': {
    title: 'PDF to WORD',
    description: 'Convert PDF to editable Word format',
    keywords: ['pdf to word', 'convert to word', 'pdf to doc'],
  },
  'pdf-to-powerpoint': {
    title: 'PDF to PowerPoint',
    description: 'Convert PDF to PowerPoint',
    keywords: ['pdf to powerpoint', 'pdf to ppt', 'convert to powerpoint'],
  },
  'pdf-to-excel': {
    title: 'PDF to Excel',
    description: 'Extract data to Excel format',
    keywords: ['pdf to excel', 'convert to excel', 'extract excel'],
  },
  rotate: {
    title: 'Rotate PDF',
    description: 'Rotate PDF pages',
    keywords: ['rotate', 'rotate pdf', 'turn'],
  },
  'add-page-numbers': {
    title: 'Add Page Numbers',
    description: 'Add page numbers to PDF',
    keywords: ['add page numbers', 'number pages', 'page numbers'],
  },
  'add-watermark': {
    title: 'Add Watermark',
    description: 'Add watermarks to protect documents',
    keywords: ['add watermark', 'watermark', 'protect'],
  },
  crop: {
    title: 'Crop PDF',
    description: 'Crop PDF pages',
    keywords: ['crop', 'crop pdf', 'remove margins'],
  },
  edit: {
    title: 'Edit PDF',
    description: 'Edit PDF content',
    keywords: ['edit', 'edit pdf', 'modify'],
  },
};

export interface ToolListItem {
  name: string;
  keywords: string[];
  link: string;
  description: string;
}

// Generate the tools array dynamically
export const tools: ToolListItem[] = Array.from(availableToolIds).map((toolId) => {
  const config = toolConfig[toolId] || { title: toolId, description: '', keywords: [toolId] };
  return {
    name: config.title,
    keywords: config.keywords || [toolId],
    link: `/tools/${toolId}`,
    description: config.description,
  };
});
