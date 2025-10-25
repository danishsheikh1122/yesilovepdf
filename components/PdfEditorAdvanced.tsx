"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Text,
  Rect,
  Circle,
  Line,
  Arrow,
  Transformer,
} from "react-konva";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { pdfTrackers } from "@/lib/pdfTracking";

// Dynamic import for PDF.js to avoid canvas issues
let pdfjsLib: any = null;

const initPdfjs = async () => {
  if (typeof window !== "undefined" && !pdfjsLib) {
    try {
      const { loadPDFJS } = await import("@/lib/pdfjs-cdn");
      pdfjsLib = await loadPDFJS();
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
    } catch (error) {
      console.error("Failed to load PDF.js:", error);
    }
  }
  return pdfjsLib;
};

export interface EditorElement {
  id: string;
  type: "text" | "rect" | "circle" | "line" | "arrow" | "highlight";
  x: number;
  y: number;
  rotation?: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string; // 'normal' | 'bold' | 'italic' | 'bold italic'
  textDecoration?: string; // '' | 'underline' | 'line-through'
  align?: string;
  // Shape properties
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  // Style properties
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  draggable?: boolean;
  pageIndex?: number;
}

export interface PageData {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  elements: EditorElement[];
  width: number;
  height: number;
}

interface PdfEditorAdvancedProps {
  url?: string;
  onSave?: (pages: PageData[]) => void;
}

const PdfEditorAdvanced = ({ url, onSave }: PdfEditorAdvancedProps) => {
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const stageRefs = useRef<Map<number, Konva.Stage>>(new Map());
  const transformerRef = useRef<Konva.Transformer>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 800, height: 1100 });
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(false);

  // Editor state
  const [elements, setElements] = useState<Map<number, EditorElement[]>>(
    new Map()
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<
    "select" | "text" | "rect" | "circle" | "line" | "arrow" | "highlight"
  >("select");

  // Style state
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontStyle, setFontStyle] = useState("normal");
  const [textDecoration, setTextDecoration] = useState("");
  const [fillColor, setFillColor] = useState("#FF0000");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);

  // History for undo/redo
  const [history, setHistory] = useState<Map<number, EditorElement[]>[]>([]);
  const [historyStep, setHistoryStep] = useState(0);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );

  // Load PDF document
  useEffect(() => {
    if (!url) return;

    setLoading(true);
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);

        // Initialize elements map for all pages
        const initialElements = new Map<number, EditorElement[]>();
        for (let i = 1; i <= pdf.numPages; i++) {
          initialElements.set(i, []);
        }
        setElements(initialElements);
        setHistory([initialElements]);
        setHistoryStep(0);
      } catch (error) {
        console.error("Error loading PDF:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [url]);

  // Render PDF page
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext("2d");
        if (!context) return;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        canvasRefs.current.set(pageNum, canvas);
        setPageSize({ width: viewport.width, height: viewport.height });
      } catch (error) {
        console.error(`Error rendering page ${pageNum}:`, error);
      }
    },
    [pdfDoc, scale]
  );

  // Render current page when it changes
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, renderPage]);

  // Save to history
  const saveToHistory = useCallback(
    (newElements: Map<number, EditorElement[]>) => {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(new Map(newElements));
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    },
    [history, historyStep]
  );

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setElements(new Map(history[historyStep - 1]));
    }
  }, [history, historyStep]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setElements(new Map(history[historyStep + 1]));
    }
  }, [history, historyStep]);

  // Add element to current page
  const addElement = useCallback(
    (element: EditorElement) => {
      const newElements = new Map(elements);
      const pageElements = newElements.get(currentPage) || [];
      pageElements.push({ ...element, pageIndex: currentPage });
      newElements.set(currentPage, pageElements);
      setElements(newElements);
      saveToHistory(newElements);
    },
    [elements, currentPage, saveToHistory]
  );

  // Update element
  const updateElement = useCallback(
    (id: string, updates: Partial<EditorElement>) => {
      const newElements = new Map(elements);
      const pageElements = newElements.get(currentPage) || [];
      const elementIndex = pageElements.findIndex((el) => el.id === id);

      if (elementIndex !== -1) {
        pageElements[elementIndex] = {
          ...pageElements[elementIndex],
          ...updates,
        };
        newElements.set(currentPage, pageElements);
        setElements(newElements);
        saveToHistory(newElements);
      }
    },
    [elements, currentPage, saveToHistory]
  );

  // Delete element
  const deleteElement = useCallback(
    (id: string) => {
      const newElements = new Map(elements);
      const pageElements = newElements.get(currentPage) || [];
      const filtered = pageElements.filter((el) => el.id !== id);
      newElements.set(currentPage, filtered);
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedId(null);
    },
    [elements, currentPage, saveToHistory]
  );

  // Handle stage mouse down
  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (currentTool === "select") {
        // Check if clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
          setSelectedId(null);
        }
        return;
      }

      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      setIsDrawing(true);
      setDrawStart(pos);

      if (currentTool === "text") {
        // Add text element immediately
        const id = `text-${Date.now()}`;
        addElement({
          id,
          type: "text",
          x: pos.x,
          y: pos.y,
          text: "Double-click to edit",
          fontSize,
          fontFamily,
          fontStyle,
          textDecoration,
          fill: textColor,
          draggable: true,
          opacity,
        });
        setSelectedId(id);
        setCurrentTool("select");
      }
    },
    [
      currentTool,
      fontSize,
      fontFamily,
      fontStyle,
      textDecoration,
      textColor,
      opacity,
      addElement,
    ]
  );

  // Handle stage mouse move
  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (
        !isDrawing ||
        !drawStart ||
        currentTool === "select" ||
        currentTool === "text"
      )
        return;

      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Preview drawing (not adding to elements yet)
      // This would require additional state for preview element
    },
    [isDrawing, drawStart, currentTool]
  );

  // Handle stage mouse up
  const handleMouseUp = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!isDrawing || !drawStart) {
        setIsDrawing(false);
        return;
      }

      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const id = `${currentTool}-${Date.now()}`;

      switch (currentTool) {
        case "rect":
          addElement({
            id,
            type: "rect",
            x: Math.min(drawStart.x, pos.x),
            y: Math.min(drawStart.y, pos.y),
            width: Math.abs(pos.x - drawStart.x),
            height: Math.abs(pos.y - drawStart.y),
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
            draggable: true,
            opacity,
          });
          break;

        case "circle":
          const radius = Math.sqrt(
            Math.pow(pos.x - drawStart.x, 2) + Math.pow(pos.y - drawStart.y, 2)
          );
          addElement({
            id,
            type: "circle",
            x: drawStart.x,
            y: drawStart.y,
            radius,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
            draggable: true,
            opacity,
          });
          break;

        case "line":
          addElement({
            id,
            type: "line",
            x: 0,
            y: 0,
            points: [drawStart.x, drawStart.y, pos.x, pos.y],
            stroke: strokeColor,
            strokeWidth,
            draggable: true,
            opacity,
          });
          break;

        case "arrow":
          addElement({
            id,
            type: "arrow",
            x: 0,
            y: 0,
            points: [drawStart.x, drawStart.y, pos.x, pos.y],
            stroke: strokeColor,
            strokeWidth,
            draggable: true,
            opacity,
          });
          break;

        case "highlight":
          addElement({
            id,
            type: "highlight",
            x: Math.min(drawStart.x, pos.x),
            y: Math.min(drawStart.y, pos.y),
            width: Math.abs(pos.x - drawStart.x),
            height: Math.abs(pos.y - drawStart.y),
            fill: fillColor,
            opacity: 0.3,
            draggable: true,
          });
          break;
      }

      setIsDrawing(false);
      setDrawStart(null);
      setCurrentTool("select");
    },
    [
      isDrawing,
      drawStart,
      currentTool,
      fillColor,
      strokeColor,
      strokeWidth,
      fontSize,
      textColor,
      opacity,
      addElement,
    ]
  );

  // Handle text double-click for inline editing
  const handleTextDblClick = useCallback(
    (element: EditorElement) => {
      const textNode = stageRefs.current
        .get(currentPage)
        ?.findOne(`#${element.id}`);
      if (!textNode) return;

      const stage = textNode.getStage();
      if (!stage) return;

      const absPos = textNode.getAbsolutePosition();
      const stageBox = stage.container().getBoundingClientRect();

      // Create textarea
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      textarea.value = element.text || "";
      textarea.style.position = "absolute";
      textarea.style.top = `${stageBox.top + absPos.y}px`;
      textarea.style.left = `${stageBox.left + absPos.x}px`;
      textarea.style.width = `${textNode.width()}px`;
      textarea.style.fontSize = `${element.fontSize || 18}px`;
      textarea.style.fontFamily = element.fontFamily || "Arial";
      textarea.style.fontWeight = element.fontStyle?.includes("bold")
        ? "bold"
        : "normal";
      textarea.style.fontStyle = element.fontStyle?.includes("italic")
        ? "italic"
        : "normal";
      textarea.style.textDecoration = element.textDecoration || "none";
      textarea.style.color = element.fill || "#000000";
      textarea.style.border = "2px solid #4A90E2";
      textarea.style.padding = "4px";
      textarea.style.margin = "0";
      textarea.style.overflow = "hidden";
      textarea.style.background = "white";
      textarea.style.outline = "none";
      textarea.style.resize = "none";
      textarea.style.lineHeight = "1.2";
      textarea.style.transformOrigin = "left top";
      textarea.style.zIndex = "1000";

      textarea.focus();
      textarea.select();

      // Hide text node
      textNode.hide();

      const removeTextarea = () => {
        if (textarea.parentNode) {
          textarea.parentNode.removeChild(textarea);
        }
        textNode.show();
        stage.draw();
      };

      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          removeTextarea();
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          updateElement(element.id, { text: textarea.value });
          removeTextarea();
        }
      });

      textarea.addEventListener("blur", () => {
        updateElement(element.id, { text: textarea.value });
        removeTextarea();
      });
    },
    [currentPage, updateElement]
  );

  // Render element based on type
  const renderElement = (element: EditorElement) => {
    const isSelected = element.id === selectedId;
    const commonProps = {
      id: element.id,
      draggable: element.draggable !== false,
      onClick: () => setSelectedId(element.id),
      onTap: () => setSelectedId(element.id),
      onDragEnd: (e: KonvaEventObject<DragEvent>) => {
        updateElement(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      },
      onTransformEnd: (e: KonvaEventObject<Event>) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        updateElement(element.id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(
            5,
            (node.height && typeof node.height === "function"
              ? node.height()
              : 0) * scaleY
          ),
        });
      },
    };

    switch (element.type) {
      case "text":
        return (
          <Text
            key={element.id}
            {...commonProps}
            x={element.x}
            y={element.y}
            text={element.text}
            fontSize={element.fontSize}
            fontFamily={element.fontFamily}
            fontStyle={element.fontStyle}
            textDecoration={element.textDecoration}
            fill={element.fill}
            rotation={element.rotation}
            opacity={element.opacity}
            onDblClick={() => handleTextDblClick(element)}
            onDblTap={() => handleTextDblClick(element)}
          />
        );

      case "rect":
      case "highlight":
        return (
          <Rect
            key={element.id}
            {...commonProps}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            rotation={element.rotation}
            opacity={element.opacity}
          />
        );

      case "circle":
        return (
          <Circle
            key={element.id}
            {...commonProps}
            x={element.x}
            y={element.y}
            radius={element.radius}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            rotation={element.rotation}
            opacity={element.opacity}
          />
        );

      case "line":
        return (
          <Line
            key={element.id}
            {...commonProps}
            points={element.points || []}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            rotation={element.rotation}
            opacity={element.opacity}
          />
        );

      case "arrow":
        return (
          <Arrow
            key={element.id}
            {...commonProps}
            points={element.points || []}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            pointerLength={10}
            pointerWidth={10}
            rotation={element.rotation}
            opacity={element.opacity}
          />
        );

      default:
        return null;
    }
  };

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRefs.current.get(currentPage);

    if (!transformer || !stage) return;

    if (selectedId) {
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
      } else {
        transformer.nodes([]);
      }
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [selectedId, currentPage, elements]);

  // Export all pages as images with overlays
  const exportPagesAsImages = useCallback(async (): Promise<PageData[]> => {
    const pagesData: PageData[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      // Ensure page is rendered
      await renderPage(pageNum);

      const baseCanvas = canvasRefs.current.get(pageNum);
      const stage = stageRefs.current.get(pageNum);

      if (!baseCanvas || !stage) continue;

      // Create combined canvas
      const combinedCanvas = document.createElement("canvas");
      combinedCanvas.width = baseCanvas.width;
      combinedCanvas.height = baseCanvas.height;
      const ctx = combinedCanvas.getContext("2d");

      if (!ctx) continue;

      // Draw base PDF page
      ctx.drawImage(baseCanvas, 0, 0);

      // Draw Konva overlay
      const overlayDataUrl = stage.toDataURL({ pixelRatio: 2 });
      const overlayImg = new Image();
      await new Promise<void>((resolve) => {
        overlayImg.onload = () => {
          ctx.drawImage(overlayImg, 0, 0);
          resolve();
        };
        overlayImg.src = overlayDataUrl;
      });

      pagesData.push({
        pageNumber: pageNum,
        canvas: combinedCanvas,
        elements: elements.get(pageNum) || [],
        width: baseCanvas.width,
        height: baseCanvas.height,
      });
    }

    return pagesData;
  }, [totalPages, elements, renderPage]);

  // Handle save
  const handleSave = useCallback(async () => {
    const pagesData = await exportPagesAsImages();
    if (onSave) {
      onSave(pagesData);
    }

    // Track the edit action
    await pdfTrackers.edit(url);
  }, [exportPagesAsImages, onSave, url]);

  const currentPageElements = elements.get(currentPage) || [];
  const canvas = canvasRefs.current.get(currentPage);

  return {
    // State
    loading,
    currentPage,
    totalPages,
    pageSize,
    scale,
    currentTool,
    selectedId,
    elements: currentPageElements,
    canUndo: historyStep > 0,
    canRedo: historyStep < history.length - 1,

    // Style state
    textColor,
    fontSize,
    fontFamily,
    fontStyle,
    textDecoration,
    fillColor,
    strokeColor,
    strokeWidth,
    opacity,

    // Methods
    setCurrentPage,
    setScale,
    setCurrentTool,
    setTextColor,
    setFontSize,
    setFontFamily,
    setFontStyle,
    setTextDecoration,
    setFillColor,
    setStrokeColor,
    setStrokeWidth,
    setOpacity,
    deleteElement,
    undo,
    redo,
    handleSave,
    exportPagesAsImages,

    // Render function
    renderViewer: () => (
      <div
        style={{
          position: "relative",
          width: pageSize.width,
          height: pageSize.height,
        }}
      >
        {canvas && (
          <canvas
            style={{ position: "absolute", left: 0, top: 0 }}
            width={canvas.width}
            height={canvas.height}
            ref={(el) => {
              if (el) {
                const ctx = el.getContext("2d");
                if (ctx && canvas) {
                  ctx.drawImage(canvas, 0, 0);
                }
              }
            }}
          />
        )}
        <Stage
          width={pageSize.width}
          height={pageSize.height}
          style={{ position: "absolute", left: 0, top: 0 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          ref={(ref) => {
            if (ref) stageRefs.current.set(currentPage, ref);
          }}
        >
          <Layer>
            {currentPageElements.map(renderElement)}
            <Transformer ref={transformerRef} />
          </Layer>
        </Stage>
      </div>
    ),
  };
};

export default PdfEditorAdvanced;
