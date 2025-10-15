'use client';

import React, { useRef, useCallback, useState } from 'react';
import { usePDFEditorStore } from '@/stores/editorStore';
import { v4 as uuidv4 } from 'uuid';
import type { EditorElement } from '@/lib/types';

interface InteractiveOverlayProps {
  width: number;
  height: number;
  pageNumber: number;
  scale: number;
}

export const InteractiveOverlay: React.FC<InteractiveOverlayProps> = ({
  width,
  height,
  pageNumber,
  scale,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });

  const {
    activeTool,
    addElement,
    elements,
  } = usePDFEditorStore();

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    if (activeTool === 'textbox') {
      // Add a text box
      const element: EditorElement = {
        id: uuidv4(),
        type: 'textbox',
        x,
        y,
        width: 200,
        height: 30,
        pageNumber,
        rotation: 0,
        style: {
          opacity: 1,
          visible: true,
        },
        created: new Date(),
        modified: new Date(),
        data: {
          text: 'Click to edit text',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#000000',
        }
      };
      addElement(element);
    } else if (activeTool === 'whiteout') {
      // Start drawing whiteout
      setIsDrawing(true);
      setLastPoint({ x, y });
    }
  }, [activeTool, addElement, pageNumber, scale]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current || activeTool !== 'whiteout') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(Math.min(lastPoint.x, x), Math.min(lastPoint.y, y), 
                Math.abs(x - lastPoint.x), Math.abs(y - lastPoint.y));
  }, [isDrawing, activeTool, lastPoint, scale]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (!isDrawing || activeTool !== 'whiteout') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    // Add whiteout element
    const element: EditorElement = {
      id: uuidv4(),
      type: 'whiteout',
      x: Math.min(lastPoint.x, x),
      y: Math.min(lastPoint.y, y),
      width: Math.abs(x - lastPoint.x),
      height: Math.abs(y - lastPoint.y),
      pageNumber,
      rotation: 0,
      style: {
        opacity: 1,
        visible: true,
      },
      created: new Date(),
      modified: new Date(),
      data: {}
    };

    addElement(element);
    setIsDrawing(false);
  }, [isDrawing, activeTool, lastPoint, pageNumber, scale, addElement]);

  // Render elements for this page
  const pageElements = elements.filter(el => el.pageNumber === pageNumber);

  return (
    <div className="absolute inset-0 pointer-events-auto">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      
      {/* Render elements */}
      {pageElements.map((element) => (
        <div
          key={element.id}
          className="absolute border border-blue-400 bg-blue-50 bg-opacity-50"
          style={{
            left: element.x * scale,
            top: element.y * scale,
            width: element.width * scale,
            height: element.height * scale,
            transform: `rotate(${element.rotation}deg)`,
            opacity: element.style.opacity,
            display: element.style.visible ? 'block' : 'none',
          }}
        >
          {element.type === 'textbox' && (
            <input
              type="text"
              defaultValue={(element.data as any).text}
              className="w-full h-full bg-transparent border-none outline-none"
              style={{
                fontSize: ((element.data as any).fontSize || 14) * scale,
                fontFamily: (element.data as any).fontFamily || 'Arial',
                color: (element.data as any).color || '#000000',
              }}
            />
          )}
          {element.type === 'signature' && (element.data as any).signatureData && (
            <img
              src={(element.data as any).signatureData}
              alt="Signature"
              className="w-full h-full object-contain"
            />
          )}
        </div>
      ))}
    </div>
  );
};