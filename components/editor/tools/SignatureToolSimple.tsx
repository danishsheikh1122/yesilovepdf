'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Pen, Type, Trash2, Check } from 'lucide-react';
import { usePDFEditorStore } from '@/stores/editorStore';
import type { EditorElement } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface SignatureToolProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  pageNumber: number;
}

const SignatureTool: React.FC<SignatureToolProps> = ({ 
  isOpen, 
  onClose, 
  position, 
  pageNumber 
}) => {
  const { addElement } = usePDFEditorStore();
  
  // Signature states
  const [textSignature, setTextSignature] = useState('');
  const [fontFamily, setFontFamily] = useState('Dancing Script');
  const [fontSize, setFontSize] = useState(24);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedSignature(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const applySignature = useCallback((signatureData: string, type: 'text' | 'image') => {
    const element: EditorElement = {
      id: uuidv4(),
      type: 'signature',
      x: position.x,
      y: position.y,
      width: type === 'text' ? textSignature.length * (fontSize * 0.6) : 150,
      height: type === 'text' ? fontSize + 10 : 50,
      pageNumber,
      rotation: 0,
      style: {
        opacity: 1,
        visible: true,
      },
      created: new Date(),
      modified: new Date(),
      data: {
        signatureData,
        signatureType: type,
        text: type === 'text' ? textSignature : undefined,
        fontFamily: type === 'text' ? fontFamily : undefined,
        fontSize: type === 'text' ? fontSize : undefined,
      }
    };

    addElement(element);
    onClose();
  }, [position, pageNumber, textSignature, fontFamily, fontSize, addElement, onClose]);

  const handleTextSignature = useCallback(() => {
    if (!textSignature.trim()) return;
    
    // Generate a simple text signature as a data URL
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = textSignature.length * (fontSize * 0.6);
    canvas.height = fontSize + 20;
    
    ctx.font = `${fontSize}px ${fontFamily}, cursive`;
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    ctx.fillText(textSignature, 10, 10);
    
    const dataURL = canvas.toDataURL();
    applySignature(dataURL, 'text');
  }, [textSignature, fontSize, fontFamily, applySignature]);

  const handleImageSignature = useCallback(() => {
    if (uploadedSignature) {
      applySignature(uploadedSignature, 'image');
    }
  }, [uploadedSignature, applySignature]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pen className="w-5 h-5" />
            Add Signature
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="type" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="type" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Type
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="type" className="space-y-4">
            <div>
              <Label htmlFor="signature-text">Your Signature</Label>
              <Input
                id="signature-text"
                value={textSignature}
                onChange={(e) => setTextSignature(e.target.value)}
                placeholder="Type your name..."
                className="mt-1"
                style={{
                  fontFamily: fontFamily,
                  fontSize: `${fontSize}px`,
                }}
              />
            </div>

            <div>
              <Label htmlFor="font-family">Font Style</Label>
              <select
                id="font-family"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Dancing Script">Dancing Script</option>
                <option value="Brush Script MT">Brush Script</option>
                <option value="Lucida Handwriting">Lucida Handwriting</option>
                <option value="Courier New">Courier New</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>

            <div>
              <Label htmlFor="font-size">Size: {fontSize}px</Label>
              <input
                id="font-size"
                type="range"
                min={16}
                max={48}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleTextSignature}
                disabled={!textSignature.trim()}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Add Signature
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div>
              <Label htmlFor="signature-upload">Upload Signature Image</Label>
              <input
                id="signature-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {uploadedSignature && (
              <div className="text-center">
                <img
                  src={uploadedSignature}
                  alt="Signature preview"
                  className="max-w-full max-h-32 mx-auto border border-gray-200 rounded"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleImageSignature}
                disabled={!uploadedSignature}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Add Signature
              </Button>
              {uploadedSignature && (
                <Button
                  variant="outline"
                  onClick={() => setUploadedSignature(null)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureTool;