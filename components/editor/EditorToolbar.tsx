import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Type, 
  Link2, 
  FileText, 
  Image, 
  PenTool, 
  Square, 
  Edit3,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Plus,
  Download,
  MousePointer,
  FormInput,
  CheckSquare,
  Circle,
  ChevronDown
} from 'lucide-react';
import { usePDFEditorStore } from '@/stores/editorStore';
import { usePDFExport } from '@/lib/pdf-export';
import type { EditorTool } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const toolConfig = {
  select: { icon: MousePointer, label: 'Texto', tooltip: 'Select and move elements' },
  text: { icon: Type, label: 'Texto', tooltip: 'Add text' },
  link: { icon: Link2, label: 'Enlaces', tooltip: 'Add links' },
  form: { icon: FileText, label: 'Formularios', tooltip: 'Add form elements' },
  image: { icon: Image, label: 'Imágenes', tooltip: 'Add images' },
  signature: { icon: Edit3, label: 'Firmar', tooltip: 'Add signature' },
  whiteout: { icon: Square, label: 'Whiteout', tooltip: 'Cover content' },
  annotation: { icon: PenTool, label: 'Anotar', tooltip: 'Freehand drawing' },
};

interface EditorToolbarProps {
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ className }) => {
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
    file,
    elements,
  } = usePDFEditorStore();

  const { exportPDF } = usePDFExport();

  const handleExport = async () => {
    if (!file) return;
    
    try {
      await exportPDF(file, elements, 'edited-document.pdf');
    } catch (error) {
      console.error('Export failed:', error);
      // Could show an error toast here
    }
  };

  const handleToolSelect = (tool: EditorTool) => {
    setActiveTool(tool);
    if (mode === 'view') {
      setMode('edit');
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 3.0));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.25));
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className={`bg-gray-50 border-b border-gray-200 px-4 py-3 ${className || ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Main editing tools */}
        <div className="flex items-center gap-2">
          {/* Text Tool */}
          <Button
            variant={activeTool === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolSelect('text')}
            className="flex items-center gap-2"
          >
            <Type className="w-4 h-4" />
            Texto
            <ChevronDown className="w-3 h-3" />
          </Button>

          {/* Links */}
          <Button
            variant={activeTool === 'link' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolSelect('link')}
            className="flex items-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            Enlaces
          </Button>

          {/* Forms Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={activeTool === 'form' ? 'default' : 'outline'}
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Formularios
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleToolSelect('form')}>
                <FormInput className="w-4 h-4 mr-2" />
                Text Field
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolSelect('form')}>
                <CheckSquare className="w-4 h-4 mr-2" />
                Checkbox
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolSelect('form')}>
                <Circle className="w-4 h-4 mr-2" />
                Radio Button
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Images */}
          <Button
            variant={activeTool === 'image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolSelect('image')}
            className="flex items-center gap-2"
          >
            <Image className="w-4 h-4" />
            Imágenes
            <ChevronDown className="w-3 h-3" />
          </Button>

          {/* Signature */}
          <Button
            variant={activeTool === 'signature' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolSelect('signature')}
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Firmar
            <ChevronDown className="w-3 h-3" />
          </Button>

          {/* Whiteout */}
          <Button
            variant={activeTool === 'whiteout' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolSelect('whiteout')}
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Whiteout
          </Button>

          {/* Annotations */}
          <Button
            variant={activeTool === 'annotation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolSelect('annotation')}
            className="flex items-center gap-2"
          >
            <PenTool className="w-4 h-4" />
            Anotar
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>

        {/* Page navigation and controls */}
        <div className="flex items-center gap-4">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!history.canUndo}
              className="p-2"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!history.canRedo}
              className="p-2"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="p-2"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[4rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="p-2"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('prev')}
              disabled={currentPage <= 1}
              className="p-2"
            >
              ←
            </Button>
            
            <div className="flex items-center gap-1 text-sm">
              <span className="font-medium">{currentPage}</span>
              <span className="text-gray-500">of {totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('next')}
              disabled={currentPage >= totalPages}
              className="p-2"
            >
              →
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Insertar página aquí
            </Button>
          </div>

          {/* Export */}
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            disabled={!file}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;