import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Asset {
  id: string;
  name: string;
  type: 'model' | 'texture' | 'hdri';
  url: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

interface AssetsState {
  items: Record<string, Asset>;
  isLoading: boolean;
  error: string | null;
}

const initialState: AssetsState = {
  items: {},
  isLoading: false,
  error: null
};

export const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addAsset: (state, action: PayloadAction<Asset>) => {
      state.items[action.payload.id] = action.payload;
    },
    removeAsset: (state, action: PayloadAction<string>) => {
      delete state.items[action.payload];
    },
    updateAsset: (state, action: PayloadAction<{ id: string; updates: Partial<Asset> }>) => {
      const { id, updates } = action.payload;
      if (state.items[id]) {
        state.items[id] = { ...state.items[id], ...updates };
      }
    },
    clearAssets: (state) => {
      state.items = {};
    }
  }
});

export const { setLoading, setError, addAsset, removeAsset, updateAsset, clearAssets } = assetsSlice.actions;
export type { AssetsState };
export default assetsSlice.reducer;
