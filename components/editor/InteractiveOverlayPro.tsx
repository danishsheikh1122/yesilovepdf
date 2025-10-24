'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { usePDFEditorStore } from '@/stores/editorStore';
import { v4 as uuidv4 } from 'uuid';
import type { EditorElement } from '@/lib/types';

interface InteractiveOverlayProps {
  width: number;
  height: number;
  pageNumber: number;
  scale: number;
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: string | null;
  startX: number;
  startY: number;
  startElementX: number;
  startElementY: number;
  startElementWidth: number;
  startElementHeight: number;
}

export const InteractiveOverlay: React.FC<InteractiveOverlayProps> = ({
  width,
  height,
  pageNumber,
  scale,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentElement, setCurrentElement] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    startX: 0,
    startY: 0,
    startElementX: 0,
    startElementY: 0,
    startElementWidth: 0,
    startElementHeight: 0,
  });

  const {
    activeTool,
    addElement,
    elements,
    updateElement,
    selectedElementId,
    selectElement,
    saveToHistory,
    removeElement,
  } = usePDFEditorStore();

  // Handle mouse down for all tools
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    console.log('Mouse down:', { activeTool, x, y, pageNumber });

    // If select tool is active, don't create new elements
    if (activeTool === 'select') return;

    switch (activeTool) {
      case 'text':
      case 'textbox':
        // Add editable text element
        const textElement: EditorElement = {
          id: uuidv4(),
          type: 'textbox',
          x,
          y,
          width: 200,
          height: 40,
          pageNumber,
          rotation: 0,
          style: {
            opacity: 1,
            visible: true,
          },
          created: new Date(),
          modified: new Date(),
          data: {
            text: 'Type your text here',
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#000000',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
          }
        };
        addElement(textElement);
        selectElement(textElement.id);
        setCurrentElement(textElement.id);
        break;

      case 'checkbox':
        // Add checkbox element
        const checkboxElement: EditorElement = {
          id: uuidv4(),
          type: 'checkbox',
          x,
          y,
          width: 20,
          height: 20,
          pageNumber,
          rotation: 0,
          style: {
            opacity: 1,
            visible: true,
          },
          created: new Date(),
          modified: new Date(),
          data: {
            checked: false,
          }
        };
        addElement(checkboxElement);
        selectElement(checkboxElement.id);
        break;

      case 'radio':
        // Add radio button element
        const radioElement: EditorElement = {
          id: uuidv4(),
          type: 'radio',
          x,
          y,
          width: 20,
          height: 20,
          pageNumber,
          rotation: 0,
          style: {
            opacity: 1,
            visible: true,
          },
          created: new Date(),
          modified: new Date(),
          data: {
            selected: false,
            group: 'default',
          }
        };
        addElement(radioElement);
        selectElement(radioElement.id);
        break;

      case 'whiteout':
      case 'highlight':
      case 'pen':
        // Start drawing
        setIsDrawing(true);
        setStartPoint({ x, y });
        break;

      default:
        break;
    }
  }, [activeTool, addElement, pageNumber, scale, selectElement]);

  // Handle mouse move for drawing tools
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDrawing || !overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    // Update preview for drawing tools
    if (activeTool === 'whiteout' || activeTool === 'highlight' || activeTool === 'pen') {
      // Visual feedback while drawing
      console.log('Drawing:', { from: startPoint, to: { x, y } });
    }
  }, [isDrawing, activeTool, startPoint, scale]);

  // Handle mouse up to complete drawing
  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (!isDrawing || !overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    // Create drawing element
    if (activeTool === 'whiteout' || activeTool === 'highlight' || activeTool === 'pen') {
      const drawingElement: EditorElement = {
        id: uuidv4(),
        type: activeTool as any,
        x: Math.min(startPoint.x, x),
        y: Math.min(startPoint.y, y),
        width: Math.abs(x - startPoint.x) || 20,
        height: Math.abs(y - startPoint.y) || 20,
        pageNumber,
        rotation: 0,
        style: {
          opacity: activeTool === 'highlight' ? 0.5 : 1,
          visible: true,
        },
        created: new Date(),
        modified: new Date(),
        data: {
          color: activeTool === 'highlight' ? '#ffff00' : activeTool === 'pen' ? '#ff0000' : '#ffffff',
          strokeWidth: activeTool === 'pen' ? 2 : 10,
        }
      };
      addElement(drawingElement);
    }

    setIsDrawing(false);
    setStartPoint({ x: 0, y: 0 });
  }, [isDrawing, activeTool, startPoint, pageNumber, scale, addElement]);

  // Handle text changes
  const handleTextChange = useCallback((elementId: string, newText: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    updateElement(elementId, {
      data: {
        ...element.data,
        text: newText,
      },
      modified: new Date(),
    });
  }, [updateElement, elements]);

  // Handle checkbox changes
  const handleCheckboxChange = useCallback((elementId: string, checked: boolean) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    updateElement(elementId, {
      data: {
        ...element.data,
        checked,
      },
      modified: new Date(),
    });
  }, [updateElement, elements]);

  // Handle element drag start
  const handleElementMouseDown = useCallback((event: React.MouseEvent, element: EditorElement, resizeHandle?: string) => {
    event.stopPropagation();
    
    if (!overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    selectElement(element.id);
    setCurrentElement(element.id);

    if (resizeHandle) {
      setDragState({
        isDragging: false,
        isResizing: true,
        resizeHandle,
        startX: x,
        startY: y,
        startElementX: element.x,
        startElementY: element.y,
        startElementWidth: element.width,
        startElementHeight: element.height,
      });
    } else {
      setDragState({
        isDragging: true,
        isResizing: false,
        resizeHandle: null,
        startX: x,
        startY: y,
        startElementX: element.x,
        startElementY: element.y,
        startElementWidth: element.width,
        startElementHeight: element.height,
      });
    }
  }, [scale, selectElement]);

  // Handle element drag/resize move
  const handleElementMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging && !dragState.isResizing) return;
    if (!overlayRef.current || !currentElement) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const deltaX = x - dragState.startX;
    const deltaY = y - dragState.startY;

    const element = elements.find(el => el.id === currentElement);
    if (!element) return;

    if (dragState.isDragging) {
      // Move element
      updateElement(currentElement, {
        x: dragState.startElementX + deltaX,
        y: dragState.startElementY + deltaY,
        modified: new Date(),
      });
    } else if (dragState.isResizing && dragState.resizeHandle) {
      // Resize element
      let newX = element.x;
      let newY = element.y;
      let newWidth = element.width;
      let newHeight = element.height;

      switch (dragState.resizeHandle) {
        case 'nw':
          newX = dragState.startElementX + deltaX;
          newY = dragState.startElementY + deltaY;
          newWidth = dragState.startElementWidth - deltaX;
          newHeight = dragState.startElementHeight - deltaY;
          break;
        case 'ne':
          newY = dragState.startElementY + deltaY;
          newWidth = dragState.startElementWidth + deltaX;
          newHeight = dragState.startElementHeight - deltaY;
          break;
        case 'sw':
          newX = dragState.startElementX + deltaX;
          newWidth = dragState.startElementWidth - deltaX;
          newHeight = dragState.startElementHeight + deltaY;
          break;
        case 'se':
          newWidth = dragState.startElementWidth + deltaX;
          newHeight = dragState.startElementHeight + deltaY;
          break;
      }

      // Minimum size constraints
      newWidth = Math.max(20, newWidth);
      newHeight = Math.max(20, newHeight);

      updateElement(currentElement, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        modified: new Date(),
      });
    }
  }, [dragState, currentElement, elements, scale, updateElement]);

  // Handle element drag/resize end
  const handleElementMouseUp = useCallback(() => {
    // Save to history after drag/resize completes
    if (dragState.isDragging || dragState.isResizing) {
      saveToHistory();
      console.log('History saved after drag/resize');
    }
    
    setDragState({
      isDragging: false,
      isResizing: false,
      resizeHandle: null,
      startX: 0,
      startY: 0,
      startElementX: 0,
      startElementY: 0,
      startElementWidth: 0,
      startElementHeight: 0,
    });
  }, [dragState.isDragging, dragState.isResizing, saveToHistory]);

  // Handle keyboard shortcuts for selected element
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if an element on this page is selected
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (!selectedElement || selectedElement.pageNumber !== pageNumber) return;

      // Delete key
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const target = event.target as HTMLElement;
        // Don't delete if typing in textarea
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
          event.preventDefault();
          if (selectedElementId) {
            removeElement(selectedElementId);
            console.log('Element deleted via keyboard');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements, pageNumber, removeElement]);

  // Filter elements for this page
  const pageElements = elements.filter(el => el.pageNumber === pageNumber);

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0"
      style={{ 
        width, 
        height,
        pointerEvents: 'auto',
        cursor: activeTool === 'select' ? 'default' : activeTool === 'text' || activeTool === 'textbox' ? 'text' : 'crosshair',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleElementMouseMove(e);
      }}
      onMouseUp={(e) => {
        handleMouseUp(e);
        handleElementMouseUp();
      }}
    >
      {/* Invisible canvas for drawing operations */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          opacity: 0,
        }}
      />
      
      {/* Render all elements for this page */}
      {pageElements.map((element) => {
        const isSelected = selectedElementId === element.id || currentElement === element.id;
        const elementData = element.data as any;
        
        return (
        <div
          key={element.id}
          className={`absolute group ${
            element.type === 'textbox' ? 'bg-white' : 
            element.type === 'whiteout' ? 'bg-white' :
            element.type === 'highlight' ? 'bg-yellow-400 bg-opacity-50' :
            element.type === 'pen' ? 'bg-red-500' :
            'bg-white'
          } ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-1 hover:ring-blue-300'}`}
          style={{
            left: element.x * scale,
            top: element.y * scale,
            width: element.width * scale,
            height: element.height * scale,
            transform: `rotate(${element.rotation}deg)`,
            opacity: element.style.opacity,
            display: element.style.visible ? 'block' : 'none',
            zIndex: isSelected ? 200 : element.type === 'textbox' ? 100 : 50,
            cursor: dragState.isDragging || dragState.isResizing ? 'grabbing' : 'move',
            pointerEvents: 'auto',
          }}
          onMouseDown={(e) => handleElementMouseDown(e, element)}
          onClick={(e) => {
            e.stopPropagation();
            selectElement(element.id);
            setCurrentElement(element.id);
          }}
        >
          {/* Text input for textbox elements */}
          {element.type === 'textbox' && (
            <textarea
              value={elementData.text || ''}
              onChange={(e) => handleTextChange(element.id, e.target.value)}
              className="w-full h-full bg-transparent border-none outline-none resize-none p-2 pointer-events-auto"
              style={{
                fontSize: `${(elementData.fontSize || 16) * scale}px`,
                fontFamily: elementData.fontFamily || 'Arial',
                color: elementData.color || '#000000',
                fontWeight: elementData.fontWeight || 'normal',
                fontStyle: elementData.fontStyle || 'normal',
                textDecoration: elementData.textDecoration || 'none',
                lineHeight: '1.4',
                cursor: 'text',
              }}
              placeholder="Type your text here..."
              autoFocus={isSelected}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          )}

          {/* Checkbox input */}
          {element.type === 'checkbox' && (
            <input
              type="checkbox"
              checked={(element.data as any).checked || false}
              onChange={(e) => handleCheckboxChange(element.id, e.target.checked)}
              className="w-full h-full pointer-events-auto cursor-pointer"
              style={{
                transform: `scale(${Math.max(scale, 1)})`,
                transformOrigin: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Radio button input */}
          {element.type === 'radio' && (
            <input
              type="radio"
              checked={(element.data as any).selected || false}
              onChange={(e) => handleCheckboxChange(element.id, e.target.checked)}
              name={`radio-group-${pageNumber}`}
              className="w-full h-full pointer-events-auto cursor-pointer"
              style={{
                transform: `scale(${Math.max(scale, 1)})`,
                transformOrigin: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Signature display */}
          {element.type === 'signature' && (element.data as any).signatureData && (
            <img
              src={(element.data as any).signatureData}
              alt="Signature"
              className="w-full h-full object-contain"
              draggable={false}
            />
          )}

          {/* Element resize handles when selected */}
          {isSelected && element.type === 'textbox' && (
            <>
              <div 
                className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize border-2 border-white shadow"
                onMouseDown={(e) => handleElementMouseDown(e, element, 'nw')}
              />
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize border-2 border-white shadow"
                onMouseDown={(e) => handleElementMouseDown(e, element, 'ne')}
              />
              <div 
                className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize border-2 border-white shadow"
                onMouseDown={(e) => handleElementMouseDown(e, element, 'sw')}
              />
              <div 
                className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize border-2 border-white shadow"
                onMouseDown={(e) => handleElementMouseDown(e, element, 'se')}
              />
            </>
          )}
        </div>
      )})}

      {/* Drawing preview while creating elements */}
      {isDrawing && (activeTool === 'whiteout' || activeTool === 'highlight' || activeTool === 'pen') && (
        <div
          className={`absolute pointer-events-none ${
            activeTool === 'whiteout' ? 'bg-white border border-gray-400' :
            activeTool === 'highlight' ? 'bg-yellow-400 bg-opacity-50 border border-yellow-600' :
            'bg-red-500 border border-red-600'
          }`}
          style={{
            left: startPoint.x * scale,
            top: startPoint.y * scale,
            width: 20 * scale,
            height: 20 * scale,
          }}
        />
      )}
    </div>
  );
};