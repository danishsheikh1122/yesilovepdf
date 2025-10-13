"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  MousePointer,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Highlighter,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  RotateCcw,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToolType = 'select' | 'text' | 'rect' | 'circle' | 'line' | 'arrow' | 'highlight';

interface EditorToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSave: () => void;
  onDelete?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  scale: number;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  currentTool,
  onToolChange,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onSave,
  onDelete,
  canUndo,
  canRedo,
  hasSelection,
  scale,
}) => {
  const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer size={18} />, label: 'Select' },
    { id: 'text', icon: <Type size={18} />, label: 'Text' },
    { id: 'rect', icon: <Square size={18} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={18} />, label: 'Circle' },
    { id: 'line', icon: <Minus size={18} />, label: 'Line' },
    { id: 'arrow', icon: <ArrowRight size={18} />, label: 'Arrow' },
    { id: 'highlight', icon: <Highlighter size={18} />, label: 'Highlight' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 gap-2">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 border-r pr-4">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={currentTool === tool.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToolChange(tool.id)}
              title={tool.label}
              className={cn(
                "h-9 w-9 p-0",
                currentTool === tool.id && "bg-blue-500 text-white hover:bg-blue-600"
              )}
            >
              {tool.icon}
            </Button>
          ))}
        </div>

        {/* History Controls */}
        <div className="flex items-center gap-1 border-r pr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="h-9 w-9 p-0"
          >
            <Undo size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="h-9 w-9 p-0"
          >
            <Redo size={18} />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-r pr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            title="Zoom Out"
            className="h-9 w-9 p-0"
          >
            <ZoomOut size={18} />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            title="Zoom In"
            className="h-9 w-9 p-0"
          >
            <ZoomIn size={18} />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {hasSelection && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              title="Delete (Del)"
              className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={18} />
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            title="Save & Download"
            className="h-9 gap-2 bg-green-600 hover:bg-green-700"
          >
            <Save size={18} />
            <span className="hidden sm:inline">Save PDF</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
