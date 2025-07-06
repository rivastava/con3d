import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PaintingState {
  isActive: boolean;
  brushSize: number;
  brushOpacity: number;
  selectedTexture: string | null;
  paintingMode: 'paint' | 'erase' | 'blur';
  history: any[]; // Will be typed more specifically later
  historyIndex: number;
}

const initialState: PaintingState = {
  isActive: false,
  brushSize: 50,
  brushOpacity: 1.0,
  selectedTexture: null,
  paintingMode: 'paint',
  history: [],
  historyIndex: -1
};

export const paintingSlice = createSlice({
  name: 'painting',
  initialState,
  reducers: {
    togglePainting: (state) => {
      state.isActive = !state.isActive;
    },
    setBrushSize: (state, action: PayloadAction<number>) => {
      state.brushSize = action.payload;
    },
    setBrushOpacity: (state, action: PayloadAction<number>) => {
      state.brushOpacity = action.payload;
    },
    setSelectedTexture: (state, action: PayloadAction<string | null>) => {
      state.selectedTexture = action.payload;
    },
    setPaintingMode: (state, action: PayloadAction<'paint' | 'erase' | 'blur'>) => {
      state.paintingMode = action.payload;
    },
    addToHistory: (state, action: PayloadAction<any>) => {
      // Remove any history items after current index
      state.history = state.history.slice(0, state.historyIndex + 1);
      // Add new history item
      state.history.push(action.payload);
      state.historyIndex = state.history.length - 1;
    },
    undo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex -= 1;
      }
    },
    redo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex += 1;
      }
    },
    clearHistory: (state) => {
      state.history = [];
      state.historyIndex = -1;
    }
  }
});

export const { 
  togglePainting, 
  setBrushSize, 
  setBrushOpacity, 
  setSelectedTexture, 
  setPaintingMode,
  addToHistory,
  undo,
  redo,
  clearHistory
} = paintingSlice.actions;
export type { PaintingState };
export default paintingSlice.reducer;
