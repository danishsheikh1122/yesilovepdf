'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  Upload, 
  Merge, 
  Edit, 
  Image, 
  Settings,
  Code,
  Eye,
  Info
} from 'lucide-react';

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
  getPdfInfo
} from '@/lib/pdfUtils.js';

export default function PdfUtilsDemo() {
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: 'My PDF Document',
    author: 'PDF-LIB Demo',
    text: 'Hello from PDF-LIB!',
    fontSize: '24',
    x: '50',
    y: '700'
  });

  const log = (message: string) => {
    setOutput(prev => prev + '\n' + message);
  };

  const clearOutput = () => {
    setOutput('');
    setPdfPreview(null);
  };

  const handleCreatePdf = async () => {
    setLoading(true);
    try {
      log('🚀 Creating new PDF...');
      
      const pdfDoc = await createPdf({
        title: formData.title,
        pages: [
          {
            text: formData.text,
            fontSize: parseInt(formData.fontSize),
            color: [0, 0.5, 0.8],
            x: parseInt(formData.x),
            y: parseInt(formData.y),
            font: 'bold',
            shapes: [
              {
                type: 'rectangle',
                x: 100,
                y: 500,
                width: 200,
                height: 100,
                color: [1, 0, 0],
                borderColor: [0, 0, 0],
                borderWidth: 2
              },
              {
                type: 'circle',
                x: 400,
                y: 550,
                radius: 50,
                color: [0, 1, 0]
              }
            ]
          }
        ]
      });

      const dataUrl = await exportPdf(pdfDoc, 'dataurl') as string;
      setPdfPreview(dataUrl);
      
      // Also trigger download
      await exportPdf(pdfDoc, 'download', 'created-pdf.pdf');
      
      log('✅ PDF created successfully!');
      log('📁 Download initiated and preview ready');
    } catch (error) {
      log('❌ Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, action: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      log(`🔄 Processing file: ${file.name}`);
      
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let result: any;

      switch (action) {
        case 'info':
          result = await getPdfInfo(uint8Array);
          log('📊 PDF Information:');
          log(`  Pages: ${result.pageCount}`);
          log(`  File Size: ${result.fileSize} bytes`);
          log(`  Title: ${result.metadata?.title || 'Not set'}`);
          log(`  Author: ${result.metadata?.author || 'Not set'}`);
          break;

        case 'metadata':
          result = await readMetadata(uint8Array);
          log('📄 PDF Metadata:');
          Object.entries(result).forEach(([key, value]) => {
            if (value) log(`  ${key}: ${value}`);
          });
          break;

        case 'modify':
          result = await modifyPdf(uint8Array, {
            pageIndex: 0,
            text: 'MODIFIED: ' + new Date().toLocaleString(),
            x: 50,
            y: 50,
            fontSize: 16,
            color: [1, 0, 0],
            shapes: [
              {
                type: 'rectangle',
                x: 400,
                y: 700,
                width: 150,
                height: 50,
                color: [1, 1, 0],
                borderColor: [1, 0, 0],
                borderWidth: 2
              }
            ]
          });
          
          const modifiedDataUrl = await exportPdf(result, 'dataurl') as string;
          setPdfPreview(modifiedDataUrl);
          await exportPdf(result, 'download', 'modified-pdf.pdf');
          log('✅ PDF modified and download initiated');
          break;

        case 'addMetadata':
          result = await setMetadata(uint8Array, {
            title: formData.title,
            author: formData.author,
            subject: 'PDF-LIB Demo Document',
            keywords: ['pdf', 'javascript', 'demo'],
            creator: 'PDF-LIB Demo App'
          });
          
          const metaDataUrl = await exportPdf(result, 'dataurl') as string;
          setPdfPreview(metaDataUrl);
          await exportPdf(result, 'download', 'with-metadata.pdf');
          log('✅ Metadata added and download initiated');
          break;
      }
    } catch (error) {
      log('❌ Error: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const handleMergeFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length < 2) {
      log('❌ Please select at least 2 PDF files to merge');
      return;
    }

    setLoading(true);
    try {
      log(`🔄 Merging ${files.length} PDF files...`);
      
      const fileBuffers = await Promise.all(
        files.map((file: File) => file.arrayBuffer().then(ab => new Uint8Array(ab)))
      );

      const mergedPdf = await copyAndMergePdfs(fileBuffers, {
        addPageNumbers: true,
        pageNumberStyle: {
          fontSize: 10,
          color: [0.5, 0.5, 0.5],
          position: 'bottom-center'
        }
      });

      const mergedDataUrl = await exportPdf(mergedPdf, 'dataurl') as string;
      setPdfPreview(mergedDataUrl);
      await exportPdf(mergedPdf, 'download', 'merged-pdf.pdf');
      
      log('✅ PDFs merged successfully!');
      log('📄 Added page numbers at bottom center');
    } catch (error) {
      log('❌ Error: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const handleDrawSvg = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      log('🎨 Drawing SVG path on PDF...');
      
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const svgPath = 'M 10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80';
      
      const result = await drawSvg(uint8Array, svgPath, {
        pageIndex: 0,
        x: 100,
        y: 300,
        scale: 2,
        color: [0.8, 0.2, 0.8],
        strokeWidth: 3
      });

      const svgDataUrl = await exportPdf(result, 'dataurl') as string;
      setPdfPreview(svgDataUrl);
      await exportPdf(result, 'download', 'with-svg.pdf');
      
      log('✅ SVG path drawn successfully!');
      log('🎨 Purple curved path added to page');
    } catch (error) {
      log('❌ Error: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const demoFunctions = [
    {
      title: 'Create New PDF',
      description: 'Create a PDF with custom text, shapes, and styling',
      icon: <FileText className="h-5 w-5" />,
      action: handleCreatePdf,
      color: 'bg-blue-500',
      fileInput: false
    },
    {
      title: 'Get PDF Info',
      description: 'Extract basic information from uploaded PDF',
      icon: <Info className="h-5 w-5" />,
      fileInput: true,
      fileAction: (e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, 'info'),
      color: 'bg-green-500'
    },
    {
      title: 'Read Metadata',
      description: 'Read metadata from uploaded PDF',
      icon: <Settings className="h-5 w-5" />,
      fileInput: true,
      fileAction: (e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, 'metadata'),
      color: 'bg-purple-500'
    },
    {
      title: 'Modify PDF',
      description: 'Add text and shapes to existing PDF',
      icon: <Edit className="h-5 w-5" />,
      fileInput: true,
      fileAction: (e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, 'modify'),
      color: 'bg-orange-500'
    },
    {
      title: 'Add Metadata',
      description: 'Add title, author, and other metadata',
      icon: <Settings className="h-5 w-5" />,
      fileInput: true,
      fileAction: (e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, 'addMetadata'),
      color: 'bg-indigo-500'
    },
    {
      title: 'Merge PDFs',
      description: 'Combine multiple PDFs with page numbers',
      icon: <Merge className="h-5 w-5" />,
      fileInput: true,
      multiple: true,
      fileAction: handleMergeFiles,
      color: 'bg-red-500'
    },
    {
      title: 'Draw SVG Path',
      description: 'Add SVG vector graphics to PDF',
      icon: <Code className="h-5 w-5" />,
      fileInput: true,
      fileAction: handleDrawSvg,
      color: 'bg-pink-500'
    }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">PDF-LIB Utility Demo</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete PDF manipulation system using PDF-LIB. Create, modify, merge, and export PDFs with advanced features.
          </p>
        </div>

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="PDF Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Author</label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Author Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Text</label>
                <Input
                  value={formData.text}
                  onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Text to add"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Font Size</label>
                <Input
                  type="number"
                  value={formData.fontSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, fontSize: e.target.value }))}
                  placeholder="24"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Functions Panel */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">PDF Functions</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {demoFunctions.map((func, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${func.color} text-white`}>
                        {func.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{func.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{func.description}</p>
                        
                        {func.fileInput ? (
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="application/pdf"
                              multiple={'multiple' in func ? func.multiple : false}
                              onChange={'fileAction' in func ? func.fileAction : undefined}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              disabled={loading}
                            />
                          </div>
                        ) : (
                          <Button
                            onClick={'action' in func ? func.action : undefined}
                            disabled={loading}
                            className="w-full"
                          >
                            {loading ? 'Processing...' : func.title}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={clearOutput}
              variant="outline"
              className="w-full"
            >
              Clear Output
            </Button>
          </div>

          {/* Output Panel */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Output</h2>
            
            {/* Console Output */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Console Output
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={output}
                  readOnly
                  className="font-mono text-sm min-h-[200px] bg-gray-50"
                  placeholder="Output will appear here..."
                />
              </CardContent>
            </Card>

            {/* PDF Preview */}
            {pdfPreview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    PDF Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <iframe
                    src={pdfPreview}
                    className="w-full h-96 border border-gray-300 rounded"
                    title="PDF Preview"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Installation Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Installation & Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Install Dependencies:</h3>
                <code className="block bg-gray-100 p-3 rounded text-sm">
                  npm install pdf-lib @pdf-lib/fontkit file-saver
                </code>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Import Functions:</h3>
                <code className="block bg-gray-100 p-3 rounded text-sm">
                  {`import { createPdf, modifyPdf, exportPdf } from './lib/pdfUtils.js';`}
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Basic Usage:</h3>
                <code className="block bg-gray-100 p-3 rounded text-sm">
                  {`const pdfDoc = await createPdf({ title: 'My PDF' });
const pdfBytes = await exportPdf(pdfDoc, 'uint8array');`}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}