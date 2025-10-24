// List of tool IDs that have pages implemented under /app/tools
// Keep this in sync with the toolConfig in `app/tools/[toolId]/page.tsx`
export const availableToolIds = new Set<string>([
  'merge',
  'split',
  'compress',
  'remove-pages',
  'extract-pages',
  'organize',
  'scan-to-pdf',
  'repair',
  'ocr',
  'jpg-to-pdf',
  'word-to-pdf',
  'powerpoint-to-pdf',
  'excel-to-pdf',
  'html-to-pdf',
  'pdf-to-jpg',
  'pdf-to-word',
  'pdf-to-powerpoint',
  'pdf-to-excel',
  'rotate',
  'add-page-numbers',
  'add-watermark',
  'crop',
  'edit'
]);

export default availableToolIds;
