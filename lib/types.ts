// Core types for the PDF editor
export interface PDFEditorState {
  file: File | null;
  pdfDoc: any; // PDF.js document
  currentPage: number;
  totalPages: number;
  zoom: number;
  mode: EditorMode;
  activeTool: EditorTool;
  elements: EditorElement[];
  history: HistoryState;
  isLoading: boolean;
  error: string | null;
}

export type EditorMode = 'view' | 'edit';

export type EditorTool = 
  | 'select'
  | 'text' 
  | 'link'
  | 'textbox'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'form'
  | 'image'
  | 'signature'
  | 'whiteout'
  | 'annotation'
  | 'pen'
  | 'highlight'
  | 'shape'
  | 'undo'
  | 'redo';

export interface EditorElement {
  id: string;
  type: ElementType;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  data: ElementData;
  style: ElementStyle;
  created: Date;
  modified: Date;
}

export type ElementType = 
  | 'text'
  | 'link' 
  | 'textbox'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'image'
  | 'signature'
  | 'whiteout'
  | 'annotation'
  | 'pen'
  | 'highlight'
  | 'shape';

export interface TextElementData {
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string;
}

export interface LinkElementData {
  url: string;
  displayText?: string;
}

export interface FormElementData {
  fieldName: string;
  defaultValue?: string;
  options?: string[]; // For dropdown/radio
  required?: boolean;
  placeholder?: string;
}

export interface ImageElementData {
  src: string;
  alt?: string;
  originalWidth: number;
  originalHeight: number;
}

export interface SignatureElementData {
  signatureData: string; // Base64 image data
  signatureType: 'draw' | 'image' | 'text';
}

export interface WhiteoutElementData {
  // No additional data needed
}

export interface AnnotationElementData {
  strokeWidth: number;
  strokeColor: string;
  paths: Point[][];
}

export type ElementData = 
  | TextElementData
  | LinkElementData
  | FormElementData
  | ImageElementData
  | SignatureElementData
  | WhiteoutElementData
  | AnnotationElementData;

export interface ElementStyle {
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  opacity: number;
  visible: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface TextItem {
  id: string;
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  fontSize: number;
  x: number;
  y: number;
  pageIndex: number;
}

export interface HistoryState {
  past: EditorElement[][];
  present: EditorElement[];
  future: EditorElement[][];
  canUndo: boolean;
  canRedo: boolean;
}

export interface PDFPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  scale: number;
  width: number;
  height: number;
  rendered: boolean;
}

export interface ToolConfig {
  name: string;
  icon: string;
  tooltip: string;
  hotkey?: string;
  group: 'edit' | 'form' | 'annotation' | 'navigation';
}

export interface ExportOptions {
  filename: string;
  format: 'pdf';
  quality: 'high' | 'medium' | 'low';
  flattenAnnotations: boolean;
  preserveFormFields: boolean;
}