'use client';

import React from 'react';
import { usePDFEditorStore } from '@/stores/editorStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff
} from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const {
    selectedElementId,
    elements,
    updateElement,
    removeElement,
    duplicateElement,
    getSelectedElement,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  } = usePDFEditorStore();

  const selectedElement = getSelectedElement();

  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p className="text-sm">No element selected</p>
          <p className="text-xs mt-2">Click on an element to edit its properties</p>
        </div>
      </div>
    );
  }

  const elementData = selectedElement.data as any;

  const handleStyleUpdate = (property: string, value: any) => {
    updateElement(selectedElement.id, {
      data: {
        ...elementData,
        [property]: value,
      },
    });
  };

  const toggleBold = () => {
    const currentWeight = elementData.fontWeight || 'normal';
    handleStyleUpdate('fontWeight', currentWeight === 'bold' ? 'normal' : 'bold');
  };

  const toggleItalic = () => {
    const currentStyle = elementData.fontStyle || 'normal';
    handleStyleUpdate('fontStyle', currentStyle === 'italic' ? 'normal' : 'italic');
  };

  const toggleUnderline = () => {
    const currentDecoration = elementData.textDecoration || 'none';
    handleStyleUpdate('textDecoration', currentDecoration === 'underline' ? 'none' : 'underline');
  };

  const handleDelete = () => {
    if (selectedElement) {
      removeElement(selectedElement.id);
      console.log('Element deleted:', selectedElement.id);
    }
  };

  const handleDuplicate = () => {
    duplicateElement(selectedElement.id);
  };

  const toggleVisibility = () => {
    updateElement(selectedElement.id, {
      style: {
        ...selectedElement.style,
        visible: !selectedElement.style.visible,
      },
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Properties</h3>
        <p className="text-xs text-gray-500 mt-1">
          {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)}
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Text Properties */}
        {selectedElement.type === 'textbox' && (
          <>
            {/* Font Family */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Font Family</Label>
              <Select
                value={elementData.fontFamily || 'Arial'}
                onValueChange={(value) => handleStyleUpdate('fontFamily', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">
                Font Size: {elementData.fontSize || 16}px
              </Label>
              <Slider
                value={[elementData.fontSize || 16]}
                onValueChange={([value]) => handleStyleUpdate('fontSize', value)}
                min={8}
                max={72}
                step={1}
                className="w-full"
              />
              <div className="flex gap-2">
                {[12, 16, 20, 24, 32].map((size) => (
                  <Button
                    key={size}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleStyleUpdate('fontSize', size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Text Style Buttons */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Text Style</Label>
              <div className="flex gap-2">
                <Button
                  variant={elementData.fontWeight === 'bold' ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleBold}
                  className="flex-1"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant={elementData.fontStyle === 'italic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleItalic}
                  className="flex-1"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant={elementData.textDecoration === 'underline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleUnderline}
                  className="flex-1"
                >
                  <Underline className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Text Color */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Text Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={elementData.color || '#000000'}
                  onChange={(e) => handleStyleUpdate('color', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={elementData.color || '#000000'}
                  onChange={(e) => handleStyleUpdate('color', e.target.value)}
                  className="flex-1 font-mono text-xs"
                  placeholder="#000000"
                />
              </div>
              {/* Color Presets */}
              <div className="grid grid-cols-8 gap-1">
                {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                  '#800000', '#808080', '#008000', '#000080', '#FFA500', '#800080', '#FFC0CB', '#A52A2A'].map((color) => (
                  <button
                    key={color}
                    className="w-7 h-7 rounded border-2 border-gray-300 hover:border-blue-500 cursor-pointer"
                    style={{ backgroundColor: color }}
                    onClick={() => handleStyleUpdate('color', color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Position & Size */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-gray-700">Position & Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-600">X</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Y</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Width</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Height</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">
            Opacity: {Math.round((selectedElement.style.opacity || 1) * 100)}%
          </Label>
          <Slider
            value={[(selectedElement.style.opacity || 1) * 100]}
            onValueChange={([value]) => updateElement(selectedElement.id, {
              style: { ...selectedElement.style, opacity: value / 100 }
            })}
            min={0}
            max={100}
            step={5}
          />
        </div>

        <Separator />

        {/* Layer Order */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Layer Order</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bringForward(selectedElement.id)}
              className="w-full"
            >
              <MoveUp className="w-4 h-4 mr-2" />
              Forward
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendBackward(selectedElement.id)}
              className="w-full"
            >
              <MoveDown className="w-4 h-4 mr-2" />
              Backward
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bringToFront(selectedElement.id)}
              className="w-full text-xs"
            >
              To Front
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendToBack(selectedElement.id)}
              className="w-full text-xs"
            >
              To Back
            </Button>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Actions</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVisibility}
              className="w-full"
            >
              {selectedElement.style.visible ? (
                <><Eye className="w-4 h-4 mr-2" />Visible</>
              ) : (
                <><EyeOff className="w-4 h-4 mr-2" />Hidden</>
              )}
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Element
          </Button>
        </div>
      </div>
    </div>
  );
};
