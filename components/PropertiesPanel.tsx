"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertiesPanelProps {
  // Text properties
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
  textDecoration: string;
  textColor: string;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (family: string) => void;
  onFontStyleChange: (style: string) => void;
  onTextDecorationChange: (decoration: string) => void;
  onTextColorChange: (color: string) => void;

  // Shape properties
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  onFillColorChange: (color: string) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;

  // Current tool
  currentTool: string;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  fontSize,
  fontFamily,
  fontStyle,
  textDecoration,
  textColor,
  onFontSizeChange,
  onFontFamilyChange,
  onFontStyleChange,
  onTextDecorationChange,
  onTextColorChange,
  fillColor,
  strokeColor,
  strokeWidth,
  opacity,
  onFillColorChange,
  onStrokeColorChange,
  onStrokeWidthChange,
  onOpacityChange,
  currentTool,
}) => {
  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
  ];

  const isBold = fontStyle.includes('bold');
  const isItalic = fontStyle.includes('italic');
  const isUnderline = textDecoration === 'underline';
  const isStrikethrough = textDecoration === 'line-through';

  const toggleBold = () => {
    if (isBold) {
      onFontStyleChange(fontStyle.replace('bold', '').trim() || 'normal');
    } else {
      onFontStyleChange(fontStyle === 'normal' ? 'bold' : `${fontStyle} bold`.trim());
    }
  };

  const toggleItalic = () => {
    if (isItalic) {
      onFontStyleChange(fontStyle.replace('italic', '').trim() || 'normal');
    } else {
      onFontStyleChange(fontStyle === 'normal' ? 'italic' : `${fontStyle} italic`.trim());
    }
  };

  const toggleUnderline = () => {
    onTextDecorationChange(isUnderline ? '' : 'underline');
  };

  const toggleStrikethrough = () => {
    onTextDecorationChange(isStrikethrough ? '' : 'line-through');
  };

  const showTextProperties = currentTool === 'text' || currentTool === 'select';
  const showShapeProperties = ['rect', 'circle', 'line', 'arrow', 'highlight', 'select'].includes(currentTool);

  return (
    <div className="w-80 bg-white border-l border-gray-200 shadow-sm overflow-y-auto">
      <div className="p-4 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Properties</h3>

        {/* Text Properties */}
        {showTextProperties && (
          <div className="space-y-4">
            <div className="pb-3 border-b">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Text</h4>
              
              {/* Font Family */}
              <div className="space-y-2 mb-3">
                <label className="text-xs text-gray-600">Font Family</label>
                <Select value={fontFamily} onValueChange={onFontFamilyChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <label className="text-xs text-gray-600">Font Size</label>
                  <span className="text-xs font-medium">{fontSize}px</span>
                </div>
                <Slider
                  value={[fontSize]}
                  onValueChange={([value]) => onFontSizeChange(value)}
                  min={8}
                  max={72}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Font Style Buttons */}
              <div className="flex gap-1 mb-3">
                <Button
                  variant={isBold ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleBold}
                  title="Bold"
                  className={cn("flex-1", isBold && "bg-blue-500 hover:bg-blue-600")}
                >
                  <Bold size={16} />
                </Button>
                <Button
                  variant={isItalic ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleItalic}
                  title="Italic"
                  className={cn("flex-1", isItalic && "bg-blue-500 hover:bg-blue-600")}
                >
                  <Italic size={16} />
                </Button>
                <Button
                  variant={isUnderline ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleUnderline}
                  title="Underline"
                  className={cn("flex-1", isUnderline && "bg-blue-500 hover:bg-blue-600")}
                >
                  <Underline size={16} />
                </Button>
                <Button
                  variant={isStrikethrough ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleStrikethrough}
                  title="Strikethrough"
                  className={cn("flex-1", isStrikethrough && "bg-blue-500 hover:bg-blue-600")}
                >
                  <Strikethrough size={16} />
                </Button>
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Text Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => onTextColorChange(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => onTextColorChange(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shape Properties */}
        {showShapeProperties && (
          <div className="space-y-4">
            <div className="pb-3 border-b">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Shape</h4>

              {/* Fill Color */}
              <div className="space-y-2 mb-3">
                <label className="text-xs text-gray-600">Fill Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => onFillColorChange(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={fillColor}
                    onChange={(e) => onFillColorChange(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#FF0000"
                  />
                </div>
              </div>

              {/* Stroke Color */}
              <div className="space-y-2 mb-3">
                <label className="text-xs text-gray-600">Stroke Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => onStrokeColorChange(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={strokeColor}
                    onChange={(e) => onStrokeColorChange(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Stroke Width */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <label className="text-xs text-gray-600">Stroke Width</label>
                  <span className="text-xs font-medium">{strokeWidth}px</span>
                </div>
                <Slider
                  value={[strokeWidth]}
                  onValueChange={([value]) => onStrokeWidthChange(value)}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Opacity */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs text-gray-600">Opacity</label>
                  <span className="text-xs font-medium">{Math.round(opacity * 100)}%</span>
                </div>
                <Slider
                  value={[opacity * 100]}
                  onValueChange={([value]) => onOpacityChange(value / 100)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Color Presets */}
        <div className="space-y-2">
          <label className="text-xs text-gray-600">Quick Colors</label>
          <div className="grid grid-cols-8 gap-2">
            {[
              '#000000', '#FFFFFF', '#FF0000', '#00FF00',
              '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
              '#FFA500', '#800080', '#008000', '#000080',
              '#808080', '#C0C0C0', '#800000', '#808000',
            ].map((color) => (
              <button
                key={color}
                onClick={() => {
                  if (currentTool === 'text') {
                    onTextColorChange(color);
                  } else {
                    onFillColorChange(color);
                  }
                }}
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-blue-500 transition-colors"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
