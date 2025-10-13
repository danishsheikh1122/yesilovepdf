# Advanced PDF Editor - Implementation Guide

## Overview

This is a production-grade PDF editor built with Next.js, React, pdf.js, Konva, and pdf-lib. It provides functionality similar to Sejda/iLovePDF for editing PDFs in the browser.

## Architecture

### Technology Stack

1. **Frontend (Client-Side)**
   - **Next.js 15** - React framework
   - **pdf.js** - PDF rendering engine
   - **Konva + react-konva** - Canvas overlay for interactive editing
   - **Tailwind CSS** - Styling

2. **Backend (Server-Side)**
   - **Next.js API Routes** - Server endpoints
   - **pdf-lib** - PDF generation and merging
   - **Sharp** - Image processing (already installed)

### Component Structure

```
components/
├── PdfEditorAdvanced.tsx       # Core editor logic (hook-based)
├── PdfEditorPage.tsx            # Main page component
├── EditorToolbar.tsx            # Toolbar with tools and actions
├── PropertiesPanel.tsx          # Right-side properties editor
├── ThumbnailNavigationPanel.tsx # Left-side page thumbnails
└── ui/                          # Base UI components
```

### API Endpoints

```
app/api/
└── pdf-edit-merge/
    └── route.ts                 # POST/PUT - Merge edited pages into PDF
```

## Features Implemented

### ✅ Core Editing Features

1. **Text Editing**
   - Add text boxes with custom position
   - Double-click inline editing
   - Font family, size, style (bold/italic)
   - Text decoration (underline/strikethrough)
   - Text color picker
   - Drag and resize text

2. **Shapes & Annotations**
   - Rectangle
   - Circle/Ellipse
   - Line
   - Arrow
   - Highlight (semi-transparent rectangles)
   - Customizable fill, stroke, and opacity

3. **Editing Controls**
   - Select tool for moving/resizing elements
   - Transform handles on selected objects
   - Drag & drop elements
   - Delete selected elements (Del key)

4. **History & Navigation**
   - Undo/Redo (Ctrl+Z, Ctrl+Y)
   - Multi-page support
   - Page thumbnails with navigation
   - Zoom in/out controls

5. **Save & Export**
   - Export to PDF preserving edits
   - Server-side page merging
   - Download edited PDF
   - Maintains original page dimensions

### 🎨 User Experience

- **Keyboard Shortcuts**
  - `Ctrl+Z / Cmd+Z` - Undo
  - `Ctrl+Y / Cmd+Shift+Z` - Redo
  - `Del / Backspace` - Delete selected
  - `Ctrl+S / Cmd+S` - Save PDF
  - `P` - Toggle properties panel

- **Visual Feedback**
  - Loading states
  - Active tool highlighting
  - Selected element indicators
  - Transform handles
  - Progress indicators

## Usage

### 1. Access the Editor

Navigate to: `http://localhost:3000/tools/edit-pdf`

### 2. Upload a PDF

Click "Upload PDF" and select your file.

### 3. Edit the PDF

1. **Select a Tool** from the toolbar
   - Mouse Pointer: Select and move elements
   - Text: Add text boxes
   - Rectangle, Circle, Line, Arrow: Draw shapes
   - Highlight: Add transparent highlights

2. **Edit Text**
   - Click the Text tool
   - Click on the page to add text
   - Double-click text to edit inline

3. **Customize Appearance**
   - Use the Properties Panel (right side) to adjust:
     - Font family, size, style
     - Colors (text, fill, stroke)
     - Stroke width
     - Opacity

4. **Navigate Pages**
   - Use thumbnail panel (left side)
   - Or page controls above the canvas

5. **Save Your Work**
   - Click "Save PDF" button
   - Or press Ctrl+S (Cmd+S on Mac)

## Implementation Notes

### How It Works

1. **Rendering**
   - pdf.js renders each PDF page to a canvas
   - Konva Stage overlays on top for editing
   - Elements are drawn in the Konva layer

2. **Inline Text Editing**
   - Double-clicking text creates an HTML textarea
   - Positioned absolutely over the canvas
   - On blur/enter, updates the Konva Text node

3. **Saving Process**
   ```
   Client:
   1. Export each page as combined canvas (PDF + overlay)
   2. Convert to PNG data URLs
   3. Send to API endpoint
   
   Server:
   4. Receive page images
   5. Use pdf-lib to create new PDF
   6. Embed each page as an image
   7. Return PDF bytes
   ```

### ⚠️ Important Caveats

**This implementation uses a rasterization approach:**

- **Pros:**
  - Works with any PDF
  - Full control over elements
  - No font-matching issues
  - Predictable output

- **Cons:**
  - **Text becomes image** (not searchable/selectable in output)
  - Larger file sizes
  - Quality depends on resolution

### Alternative: Commercial SDKs (for Production)

For **true WYSIWYG editing** (preserve searchable text, fonts, reflow):

1. **Apryse WebViewer** (formerly PDFTron)
   - https://www.pdftron.com/
   - Full content editing
   - Font matching
   - Requires license

2. **PSPDFKit / Nutrient**
   - https://pspdfkit.com/
   - Real PDF content editing
   - Requires license

3. **Sejda/iLovePDF APIs**
   - Use their APIs directly
   - Pay per document/feature

## Extending the Editor

### Add New Tools

1. Add tool to `EditorToolbar.tsx`:
```typescript
{ id: 'myTool', icon: <MyIcon />, label: 'My Tool' }
```

2. Add element type to `PdfEditorAdvanced.tsx`:
```typescript
type: 'text' | 'rect' | ... | 'myTool'
```

3. Implement rendering in `renderElement()`:
```typescript
case 'myTool':
  return <MyKonvaShape ... />
```

### Improve Export Quality

Increase canvas resolution when exporting:
```typescript
const overlayDataUrl = stage.toDataURL({ pixelRatio: 2 }); // or 3, 4
```

### Add Server-Side Text Replacement

For searchable text (advanced):

1. Use PyMuPDF (MuPDF) server-side
2. Identify text positions
3. Replace text in PDF structure
4. Handle font embedding

**Note:** This is complex and error-prone for arbitrary PDFs.

## Testing

### Manual Testing Checklist

- [ ] Upload various PDFs (text, images, forms)
- [ ] Add text with different fonts/sizes
- [ ] Draw shapes and move them
- [ ] Edit existing text inline
- [ ] Undo/redo multiple times
- [ ] Navigate between pages
- [ ] Zoom in/out
- [ ] Save and verify output PDF
- [ ] Test keyboard shortcuts
- [ ] Test on mobile (touch events)

### Known Limitations

1. Touch events partially supported (removed some handlers for TS compatibility)
2. Large PDFs (>50 pages) may be slow
3. Very high-resolution pages may cause memory issues
4. No collaborative editing
5. No cloud storage integration (yet)

## Performance Optimization

### Current Optimizations

- Lazy page rendering (only current page)
- Thumbnail generation in background
- Debounced history updates
- Canvas reuse

### Future Improvements

- [ ] Web Workers for page rendering
- [ ] Virtual scrolling for thumbnails
- [ ] Canvas pooling
- [ ] Incremental saves (autosave)
- [ ] IndexedDB caching

## Deployment

### Environment Variables

None required for basic functionality.

Optional:
- `NEXT_PUBLIC_MAX_FILE_SIZE` - Max upload size
- `PDF_WORKER_PATH` - Custom worker path

### Build & Deploy

```bash
pnpm build
pnpm start
```

### Vercel/Netlify Deployment

Works out of the box. Ensure:
- PDF worker file is in `public/`
- API routes support (Vercel/Netlify Functions)

## Troubleshooting

### PDF.js Worker Not Found

Ensure `pdf.worker.min.js` is in `/public/`:
```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
```

### Konva Performance Issues

- Reduce number of elements per page
- Use `listening: false` for static elements
- Implement layer caching

### Save Fails

- Check API route logs
- Verify pdf-lib can embed images
- Check file size limits

### Text Editing Doesn't Work

- Ensure textarea z-index is high enough
- Check for event handler conflicts
- Verify stage position calculation

## Credits & References

- [pdf.js Documentation](https://mozilla.github.io/pdf.js/)
- [Konva.js Documentation](https://konvajs.org/)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [Sejda Edit PDF](https://www.sejda.com/pdf-editor) - UX inspiration
- [iLovePDF](https://www.ilovepdf.com/) - Feature reference

## License

Part of the yesilovepdf project.
