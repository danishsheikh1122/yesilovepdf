import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePDFEditorStore } from '@/stores/editorStore';
import type { EditorElement } from '@/lib/types';

interface TextToolProps {
  isActive: boolean;
}

export const TextTool: React.FC<TextToolProps> = ({ isActive }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState('#000000');
  
  const { 
    currentPage, 
    addElement, 
    getSelectedElement, 
    updateElement 
  } = usePDFEditorStore();

  const selectedElement = getSelectedElement();
  const isTextElement = selectedElement?.type === 'text';

  const handleAddText = () => {
    if (!textContent.trim()) return;

    const newElement: EditorElement = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      pageNumber: currentPage,
      x: 100, // Default position
      y: 100,
      width: 200,
      height: 30,
      rotation: 0,
      data: {
        content: textContent,
        fontSize: fontSize,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        color: fontColor,
      },
      style: {
        opacity: 1,
        visible: true,
      },
      created: new Date(),
      modified: new Date(),
    };

    addElement(newElement);
    setTextContent('');
    setIsModalOpen(false);
  };

  const handleUpdateText = () => {
    if (!selectedElement || !isTextElement) return;

    updateElement(selectedElement.id, {
      data: {
        ...selectedElement.data,
        content: textContent,
        fontSize: fontSize,
        color: fontColor,
      }
    });
    setIsModalOpen(false);
  };

  // Pre-fill form when editing existing text
  React.useEffect(() => {
    if (isTextElement && selectedElement) {
      const textData = selectedElement.data as any;
      setTextContent(textData.content || '');
      setFontSize(textData.fontSize || 16);
      setFontColor(textData.color || '#000000');
    }
  }, [selectedElement, isTextElement]);

  if (!isActive) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {isTextElement ? 'Edit Text' : 'Add Text'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isTextElement ? 'Edit Text' : 'Add Text'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="text-content">Text Content</Label>
            <Input
              id="text-content"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter your text here..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Input
                id="font-size"
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 16)}
                min="8"
                max="72"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="font-color">Color</Label>
              <Input
                id="font-color"
                type="color"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={isTextElement ? handleUpdateText : handleAddText}>
            {isTextElement ? 'Update' : 'Add'} Text
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TextTool;