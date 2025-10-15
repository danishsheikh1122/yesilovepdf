"use client";

import dynamic from 'next/dynamic';

// Use PdfEditorNew - it has proper PDF.js integration with overlay canvas
const PdfEditor = dynamic(
  () => import('@/components/PdfEditorNew'),
  { ssr: false }
);

export default function EditPdfTool() {
  return (
    <div className="min-h-screen">
      <PdfEditor />
    </div>
  );
}
