import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { 
  PDFEditorState, 
  EditorElement, 
  EditorTool, 
  EditorMode,
  HistoryState 
} from '@/lib/types';

interface PDFEditorStore extends PDFEditorState {
  selectedElementId: string | null;
  
  // Actions
  setFile: (file: File | null) => void;
  setPdfDoc: (doc: any) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setMode: (mode: EditorMode) => void;
  setActiveTool: (tool: EditorTool) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Element management
  addElement: (element: EditorElement) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  duplicateElement: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  
  // History management
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  clearHistory: () => void;
  
  // Utility actions
  resetEditor: () => void;
  getElementById: (id: string) => EditorElement | undefined;
  getElementsByPage: (pageNumber: number) => EditorElement[];
  getSelectedElement: () => EditorElement | undefined;
}

const initialHistoryState: HistoryState = {
  past: [],
  present: [],
  future: [],
  canUndo: false,
  canRedo: false,
};

export const usePDFEditorStore = create<PDFEditorStore>()(
  immer((set, get) => ({
    // Initial state
    file: null,
    pdfDoc: null,
    currentPage: 1,
    totalPages: 0,
    zoom: 1.0,
    mode: 'view',
    activeTool: 'select',
    elements: [],
    history: initialHistoryState,
    isLoading: false,
    error: null,
    selectedElementId: null,

    // Basic setters
    setFile: (file) => set((state) => {
      state.file = file;
    }),

    setPdfDoc: (doc) => set((state) => {
      state.pdfDoc = doc;
      state.totalPages = doc ? doc.numPages : 0;
    }),

    setCurrentPage: (page) => set((state) => {
      state.currentPage = Math.max(1, Math.min(page, state.totalPages));
    }),

    setZoom: (zoom) => set((state) => {
      state.zoom = Math.max(0.25, Math.min(3.0, zoom));
    }),

    setMode: (mode) => set((state) => {
      state.mode = mode;
      if (mode === 'view') {
        state.activeTool = 'select';
        state.selectedElementId = null;
      }
    }),

    setActiveTool: (tool) => set((state) => {
      state.activeTool = tool;
      if (tool !== 'select') {
        state.selectedElementId = null;
      }
    }),

    setLoading: (loading) => set((state) => {
      state.isLoading = loading;
    }),

    setError: (error) => set((state) => {
      state.error = error;
    }),

    // Element management
    addElement: (element) => set((state) => {
      state.elements.push(element);
      get().saveToHistory();
    }),

    updateElement: (id, updates) => set((state) => {
      const elementIndex = state.elements.findIndex(el => el.id === id);
      if (elementIndex !== -1) {
        const element = state.elements[elementIndex];
        state.elements[elementIndex] = {
          ...element,
          ...updates,
          modified: new Date(),
        };
      }
      // Don't save to history on every update (too many saves during drag)
      // History will be saved on mouse up or significant changes
    }),

    removeElement: (id) => set((state) => {
      state.elements = state.elements.filter(el => el.id !== id);
      if (state.selectedElementId === id) {
        state.selectedElementId = null;
      }
      get().saveToHistory();
    }),

    selectElement: (id) => set((state) => {
      state.selectedElementId = id;
    }),

    duplicateElement: (id) => set((state) => {
      const element = state.elements.find(el => el.id === id);
      if (element) {
        const duplicated: EditorElement = {
          ...element,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: element.x + 10,
          y: element.y + 10,
          created: new Date(),
          modified: new Date(),
        };
        state.elements.push(duplicated);
        state.selectedElementId = duplicated.id;
        get().saveToHistory();
      }
    }),

    bringToFront: (id) => set((state) => {
      const elementIndex = state.elements.findIndex(el => el.id === id);
      if (elementIndex !== -1) {
        const [element] = state.elements.splice(elementIndex, 1);
        state.elements.push(element);
      }
    }),

    sendToBack: (id) => set((state) => {
      const elementIndex = state.elements.findIndex(el => el.id === id);
      if (elementIndex !== -1) {
        const [element] = state.elements.splice(elementIndex, 1);
        state.elements.unshift(element);
      }
    }),

    bringForward: (id) => set((state) => {
      const elementIndex = state.elements.findIndex(el => el.id === id);
      if (elementIndex !== -1 && elementIndex < state.elements.length - 1) {
        const temp = state.elements[elementIndex];
        state.elements[elementIndex] = state.elements[elementIndex + 1];
        state.elements[elementIndex + 1] = temp;
      }
    }),

    sendBackward: (id) => set((state) => {
      const elementIndex = state.elements.findIndex(el => el.id === id);
      if (elementIndex > 0) {
        const temp = state.elements[elementIndex];
        state.elements[elementIndex] = state.elements[elementIndex - 1];
        state.elements[elementIndex - 1] = temp;
      }
    }),

    // History management
    saveToHistory: () => set((state) => {
      if (state.history.present.length > 0 || state.elements.length > 0) {
        state.history.past.push([...state.history.present]);
        state.history.present = [...state.elements];
        state.history.future = [];
        
        // Limit history size to prevent memory issues
        if (state.history.past.length > 50) {
          state.history.past.shift();
        }
        
        state.history.canUndo = state.history.past.length > 0;
        state.history.canRedo = false;
      }
    }),

    undo: () => set((state) => {
      if (state.history.past.length > 0) {
        const previous = state.history.past.pop()!;
        state.history.future.unshift([...state.history.present]);
        state.history.present = previous;
        state.elements = [...previous];
        
        state.history.canUndo = state.history.past.length > 0;
        state.history.canRedo = true;
        state.selectedElementId = null;
      }
    }),

    redo: () => set((state) => {
      if (state.history.future.length > 0) {
        const next = state.history.future.shift()!;
        state.history.past.push([...state.history.present]);
        state.history.present = next;
        state.elements = [...next];
        
        state.history.canUndo = true;
        state.history.canRedo = state.history.future.length > 0;
        state.selectedElementId = null;
      }
    }),

    clearHistory: () => set((state) => {
      state.history = { ...initialHistoryState };
    }),

    // Utility functions
    resetEditor: () => set((state) => {
      state.file = null;
      state.pdfDoc = null;
      state.currentPage = 1;
      state.totalPages = 0;
      state.zoom = 1.0;
      state.mode = 'view';
      state.activeTool = 'select';
      state.elements = [];
      state.history = { ...initialHistoryState };
      state.selectedElementId = null;
      state.isLoading = false;
      state.error = null;
    }),

    getElementById: (id) => {
      return get().elements.find(el => el.id === id);
    },

    getElementsByPage: (pageNumber) => {
      return get().elements.filter(el => el.pageNumber === pageNumber);
    },

    getSelectedElement: () => {
      const { selectedElementId, elements } = get();
      return selectedElementId ? elements.find(el => el.id === selectedElementId) : undefined;
    },
  }))
);