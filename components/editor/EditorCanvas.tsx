import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Circle, Line, Image as KonvaImage, Transformer } from 'react-konva';
import { usePDFEditorStore } from '@/stores/editorStore';
import type { EditorElement } from '@/lib/types';
import Konva from 'konva';

interface EditorCanvasProps {
  width: number;
  height: number;
  scale: number;
  className?: string;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ 
  width, 
  height, 
  scale, 
  className 
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  
  const {
    currentPage,
    activeTool,
    elements,
    selectedElementId,
    selectElement,
    updateElement,
    addElement,
    removeElement,
  } = usePDFEditorStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);

  // Get elements for current page
  const pageElements = elements.filter(el => el.pageNumber === currentPage);

  // Handle element selection
  useEffect(() => {
    setSelectedId(selectedElementId);
  }, [selectedElementId]);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current) {
      const stage = stageRef.current;
      if (selectedId && stage) {
        const selectedNode = stage.findOne(`#${selectedId}`);
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
          transformerRef.current.getLayer()?.batchDraw();
        }
      } else {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const clickedOnEmpty = e.target === stage;
    
    if (clickedOnEmpty) {
      setSelectedId(null);
      selectElement(null);
      
      // Handle tool-specific actions on empty canvas click
      if (activeTool === 'text') {
        handleAddText(e);
      } else if (activeTool === 'whiteout') {
        handleAddWhiteout(e);
      }
    }
  };

  const handleElementClick = (elementId: string) => {
    if (activeTool === 'select') {
      setSelectedId(elementId);
      selectElement(elementId);
    }
  };

  const handleAddText = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const newElement: EditorElement = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      pageNumber: currentPage,
      x: pos.x / scale,
      y: pos.y / scale,
      width: 200,
      height: 30,
      rotation: 0,
      data: {
        content: 'Type your text',
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        color: '#000000',
      },
      style: {
        opacity: 1,
        visible: true,
      },
      created: new Date(),
      modified: new Date(),
    };

    addElement(newElement);
    setSelectedId(newElement.id);
    selectElement(newElement.id);
  };

  const handleAddWhiteout = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const newElement: EditorElement = {
      id: `whiteout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'whiteout',
      pageNumber: currentPage,
      x: pos.x / scale,
      y: pos.y / scale,
      width: 100,
      height: 30,
      rotation: 0,
      data: {},
      style: {
        backgroundColor: '#FFFFFF',
        opacity: 1,
        visible: true,
      },
      created: new Date(),
      modified: new Date(),
    };

    addElement(newElement);
    setSelectedId(newElement.id);
    selectElement(newElement.id);
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'annotation') {
      setIsDrawing(true);
      const stage = e.target.getStage();
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          setCurrentPath([pos.x, pos.y]);
        }
      }
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || activeTool !== 'annotation') return;

    const stage = e.target.getStage();
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        setCurrentPath(prev => [...prev, pos.x, pos.y]);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && activeTool === 'annotation' && currentPath.length > 0) {
      const newElement: EditorElement = {
        id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'annotation',
        pageNumber: currentPage,
        x: 0,
        y: 0,
        width: width,
        height: height,
        rotation: 0,
        data: {
          strokeWidth: 2,
          strokeColor: '#000000',
          paths: [currentPath.map((coord, index) => ({
            x: index % 2 === 0 ? coord / scale : 0,
            y: index % 2 === 1 ? coord / scale : 0,
          })).filter((_, index) => index % 2 === 0)],
        },
        style: {
          opacity: 1,
          visible: true,
        },
        created: new Date(),
        modified: new Date(),
      };

      addElement(newElement);
    }
    
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const handleElementDragEnd = (elementId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    updateElement(elementId, {
      x: node.x() / scale,
      y: node.y() / scale,
    });
  };

  const handleElementTransform = (elementId: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    updateElement(elementId, {
      x: node.x() / scale,
      y: node.y() / scale,
      width: node.width() * node.scaleX() / scale,
      height: node.height() * node.scaleY() / scale,
      rotation: node.rotation(),
    });
  };

  const renderElement = (element: EditorElement) => {
    const commonProps = {
      id: element.id,
      x: element.x * scale,
      y: element.y * scale,
      draggable: activeTool === 'select',
      onClick: () => handleElementClick(element.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleElementDragEnd(element.id, e),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleElementTransform(element.id, e),
    };

    switch (element.type) {
      case 'text':
        const textData = element.data as any;
        return (
          <Text
            key={element.id}
            {...commonProps}
            text={textData.content}
            fontSize={textData.fontSize * scale}
            fontFamily={textData.fontFamily}
            fontStyle={textData.fontWeight === 'bold' ? 'bold' : 'normal'}
            fill={textData.color}
            width={element.width * scale}
            height={element.height * scale}
            align={textData.textAlign}
          />
        );

      case 'whiteout':
        return (
          <Rect
            key={element.id}
            {...commonProps}
            width={element.width * scale}
            height={element.height * scale}
            fill={element.style.backgroundColor || '#FFFFFF'}
            stroke="#CCCCCC"
            strokeWidth={1}
          />
        );

      case 'annotation':
        const annotationData = element.data as any;
        return (
          <Line
            key={element.id}
            {...commonProps}
            points={annotationData.paths?.[0]?.flatMap((p: any) => [p.x * scale, p.y * scale]) || []}
            stroke={annotationData.strokeColor}
            strokeWidth={annotationData.strokeWidth}
            lineCap="round"
            lineJoin="round"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`editor-canvas ${className || ''}`}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Layer>
          {pageElements.map(renderElement)}
          
          {/* Current drawing path for annotations */}
          {isDrawing && currentPath.length > 0 && (
            <Line
              points={currentPath}
              stroke="#000000"
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </Layer>
        
        {/* Transformer for selected elements */}
        <Layer>
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit minimum size
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default EditorCanvas;