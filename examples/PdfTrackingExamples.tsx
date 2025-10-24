// Example: How to integrate PDF usage tracking into your existing components
// This file shows practical examples of adding tracking to various PDF operations

import React, { useState } from 'react';
import { pdfTrackers, logPdfUsage } from '../lib/pdfTracking';

// Example 1: PDF Compression Component with Tracking
export function PdfCompressExample() {
  const [file, setFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);

  const handleCompress = async () => {
    if (!file) return;

    setCompressing(true);
    try {
      // Your existing compression logic here
      // const compressedFile = await compressPdf(file);
      
      // Add tracking - this is the only new line you need!
      await pdfTrackers.compress(file);
      
      console.log('PDF compressed and tracked successfully');
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setCompressing(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">PDF Compressor with Tracking</h3>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />
      <button
        onClick={handleCompress}
        disabled={!file || compressing}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {compressing ? 'Compressing...' : 'Compress PDF'}
      </button>
    </div>
  );
}

// Example 2: PDF Merger Component with Tracking
export function PdfMergeExample() {
  const [files, setFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);

  const handleMerge = async () => {
    if (files.length < 2) return;

    setMerging(true);
    try {
      // Your existing merge logic here
      // const mergedFile = await mergePdfs(files);
      
      // Add tracking
      await pdfTrackers.merge(files);
      
      console.log('PDFs merged and tracked successfully');
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">PDF Merger with Tracking</h3>
      <input
        type="file"
        accept=".pdf"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
        className="mb-4"
      />
      <p className="text-sm text-gray-600 mb-4">
        Selected: {files.length} files
      </p>
      <button
        onClick={handleMerge}
        disabled={files.length < 2 || merging}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        {merging ? 'Merging...' : 'Merge PDFs'}
      </button>
    </div>
  );
}

// Example 3: Advanced tracking with custom data
export function PdfEditorExample() {
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);

  const handleEdit = async (editType: string) => {
    if (!file) return;

    setEditing(true);
    try {
      // Your existing edit logic here
      // const editedFile = await editPdf(file, editType);
      
      // Advanced tracking with custom action type
      await logPdfUsage({
        pdfName: file.name,
        actionType: 'edit',
        fileSize: file.size,
      });
      
      console.log(`PDF edited (${editType}) and tracked successfully`);
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">PDF Editor with Tracking</h3>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />
      <div className="space-x-2">
        <button
          onClick={() => handleEdit('add-text')}
          disabled={!file || editing}
          className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Add Text
        </button>
        <button
          onClick={() => handleEdit('add-image')}
          disabled={!file || editing}
          className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Add Image
        </button>
      </div>
    </div>
  );
}

// Example 4: Bulk operation tracking
export function BulkOperationExample() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleBulkConvert = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    try {
      // Process each file
      for (const file of files) {
        // Your conversion logic here
        // await convertPdfToJpg(file);
        
        // Track each conversion
        await pdfTrackers.convertToJpg(file);
      }
      
      console.log(`${files.length} files converted and tracked`);
    } catch (error) {
      console.error('Bulk conversion failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Bulk PDF to JPG with Tracking</h3>
      <input
        type="file"
        accept=".pdf"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
        className="mb-4"
      />
      <p className="text-sm text-gray-600 mb-4">
        Selected: {files.length} files
      </p>
      <button
        onClick={handleBulkConvert}
        disabled={files.length === 0 || processing}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
      >
        {processing ? 'Converting...' : 'Convert All to JPG'}
      </button>
    </div>
  );
}

// Example 5: Error handling with tracking
export function PdfWithErrorHandling() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcessWithTracking = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    
    try {
      // Your PDF processing logic
      // const result = await processPdf(file);
      
      // Track successful operation
      await pdfTrackers.compress(file);
      
      console.log('PDF processed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Optional: Track failed operations too
      await logPdfUsage({
        pdfName: file.name,
        actionType: 'other', // or create a 'failed-compress' action
        fileSize: file.size,
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">PDF Processing with Error Tracking</h3>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
          Error: {error}
        </div>
      )}
      <button
        onClick={handleProcessWithTracking}
        disabled={!file || processing}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {processing ? 'Processing...' : 'Process PDF'}
      </button>
    </div>
  );
}

// Example 6: Integration with existing component patterns
export function ExistingComponentIntegration() {
  // This shows how to add tracking to components that already exist
  
  const originalHandleUpload = async (file: File) => {
    // Your existing upload logic
    console.log('Uploading file:', file.name);
  };
  
  // Enhanced version with tracking
  const handleUploadWithTracking = async (file: File) => {
    try {
      // Call your original function
      await originalHandleUpload(file);
      
      // Add tracking as a separate step
      await logPdfUsage({
        pdfName: file.name,
        actionType: 'other', // or 'upload' if you add it to the enum
        fileSize: file.size,
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Enhanced Existing Component</h3>
      <p className="text-sm text-gray-600 mb-4">
        Shows how to add tracking to existing functions without major refactoring
      </p>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadWithTracking(file);
        }}
        className="mb-4"
      />
    </div>
  );
}

// Usage in your main app - combine all examples
export default function TrackingExamples() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        PDF Tracking Integration Examples
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PdfCompressExample />
        <PdfMergeExample />
        <PdfEditorExample />
        <BulkOperationExample />
        <PdfWithErrorHandling />
        <ExistingComponentIntegration />
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Quick Integration Tips:
        </h3>
        <ul className="text-blue-700 space-y-1 text-sm">
          <li>• Add tracking after successful operations</li>
          <li>• Use the convenience functions from pdfTrackers for common operations</li>
          <li>• Include file name and size for better analytics</li>
          <li>• Handle tracking errors gracefully - don't let them break your app</li>
          <li>• Consider tracking failed operations for debugging insights</li>
        </ul>
      </div>
    </div>
  );
}