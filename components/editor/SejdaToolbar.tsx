'use client';

import React, { useState } from 'react';
import { usePDFEditorStore } from '@/stores/editorStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Type, 
  Link, 
  Square, 
  Circle, 
  Image, 
  PenTool, 
  Eraser,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  CheckSquare,
  ChevronDown,
  Minus,
  FileText,
  Highlighter,
  MousePointer,
  FormInput,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface SejdaToolbarProps {
  onFileUpload: (file: File) => void;
  onExport: () => void;
  className?: string;
}

const SejdaToolbar: React.FC<SejdaToolbarProps> = ({ 
  onFileUpload, 
  onExport, 
  className 
}) => {
  const {
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    currentPage,
    totalPages,
    setCurrentPage,
    history,
    undo,
    redo,
    mode,
    setMode,
  } = usePDFEditorStore();

  const [showMoreTools, setShowMoreTools] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file);
    }
  };

  const zoomIn = () => setZoom(Math.min(zoom + 0.25, 3.0));
  const zoomOut = () => setZoom(Math.max(zoom - 0.25, 0.25));

  const prevPage = () => setCurrentPage(Math.max(currentPage - 1, 1));
  const nextPage = () => setCurrentPage(Math.min(currentPage + 1, totalPages));

  const toolGroups = {
    basic: [
      { id: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
      { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
      { id: 'link', icon: Link, label: 'Links', shortcut: 'L' },
    ],
    forms: [
      { id: 'textbox', icon: FormInput, label: 'Text Box' },
      { id: 'checkbox', icon: CheckSquare, label: 'Checkbox' },
      { id: 'radio', icon: Circle, label: 'Radio Button' },
      { id: 'dropdown', icon: ChevronDown, label: 'Dropdown' },
    ],
    images: [
      { id: 'image', icon: Image, label: 'Images', shortcut: 'I' },
      { id: 'signature', icon: Edit, label: 'Sign', shortcut: 'S' },
    ],
    annotations: [
      { id: 'highlight', icon: Highlighter, label: 'Highlight' },
      { id: 'pen', icon: PenTool, label: 'Draw' },
      { id: 'whiteout', icon: Eraser, label: 'Whiteout' },
      { id: 'shape', icon: Square, label: 'Shapes' },
    ],
  };

  const ToolButton: React.FC<{
    tool: { id: string; icon: any; label: string; shortcut?: string };
    variant?: 'default' | 'outline' | 'secondary';
  }> = ({ tool, variant = 'outline' }) => {
    const Icon = tool.icon;
    const isActive = activeTool === tool.id;
    
    return (
      <Button
        variant={isActive ? 'default' : variant}
        size="sm"
        onClick={() => {
          setActiveTool(tool.id as any);
          if (mode === 'view') setMode('edit');
        }}
        className={`relative ${isActive ? 'bg-blue-500 text-white' : ''}`}
        title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline ml-1">{tool.label}</span>
      </Button>
    );
  };

  return (
    <div className={`sejda-toolbar bg-white border-b border-gray-200 p-4 ${className || ''}`}>
      {/* Main Toolbar */}
      <div className="flex items-center space-x-2 flex-wrap">
        {/* Basic Tools */}
        <div className="flex items-center space-x-1">
          {toolGroups.basic.map((tool) => (
            <ToolButton key={tool.id} tool={tool} />
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Forms Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
              <FormInput className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Forms</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {toolGroups.forms.map((tool) => {
              const Icon = tool.icon;
              return (
                <DropdownMenuItem
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id as any);
                    if (mode === 'view') setMode('edit');
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tool.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Images & Signatures */}
        <div className="flex items-center space-x-1">
          {toolGroups.images.map((tool) => (
            <ToolButton key={tool.id} tool={tool} />
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Annotations Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
              <PenTool className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Annotate</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {toolGroups.annotations.map((tool) => {
              const Icon = tool.icon;
              return (
                <DropdownMenuItem
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id as any);
                    if (mode === 'view') setMode('edit');
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tool.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={!history.canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={!history.canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* File Operations */}
        <div className="flex items-center space-x-1">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Upload</span>
            </Button>
          </label>
          
          <Button
            variant="default"
            size="sm"
            onClick={onExport}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Apply Changes</span>
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Page Navigation */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={currentPage <= 1}
          >
            ←
          </Button>
          
          <div className="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded text-sm">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
              className="w-12 text-center border-none bg-transparent outline-none"
              min="1"
              max={totalPages}
            />
            <span>/</span>
            <span>{totalPages}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={currentPage >= totalPages}
          >
            →
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600"
            title="Insert page here"
          >
            + Insert page here
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <div className="px-2 py-1 bg-gray-100 rounded text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={zoom >= 3.0}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Secondary Toolbar for Active Tool Options */}
      {activeTool === 'text' && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-blue-900">Text Options:</span>
            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option>Arial</option>
              <option>Times New Roman</option>
              <option>Helvetica</option>
              <option>Courier</option>
            </select>
            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option>12px</option>
              <option>14px</option>
              <option>16px</option>
              <option>18px</option>
              <option>24px</option>
            </select>
            <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm">B</Button>
              <Button variant="outline" size="sm">I</Button>
              <Button variant="outline" size="sm">U</Button>
            </div>
            <input 
              type="color" 
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              defaultValue="#000000"
            />
          </div>
        </div>
      )}

      {activeTool === 'signature' && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-green-900">Signature Options:</span>
            <Button variant="outline" size="sm">Draw</Button>
            <Button variant="outline" size="sm">Upload Image</Button>
            <Button variant="outline" size="sm">Type Text</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SejdaToolbar;