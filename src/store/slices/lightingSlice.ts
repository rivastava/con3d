import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LightConfig } from '@/types';

interface LightingState {
  lights: Record<string, LightConfig>;
  selectedLightId: string | null;
  ambientIntensity: number;
}

const initialState: LightingState = {
  lights: {},
  selectedLightId: null,
  ambientIntensity: 0.2
};

export const lightingSlice = createSlice({
  name: 'lighting',
  initialState,
  reducers: {
    addLight: (state, action: PayloadAction<LightConfig>) => {
      state.lights[action.payload.id] = action.payload;
    },
    updateLight: (state, action: PayloadAction<{ id: string; parameters: Partial<LightConfig> }>) => {
      const { id, parameters } = action.payload;
      if (state.lights[id]) {
        state.lights[id] = { ...state.lights[id], ...parameters };
      }
    },
    removeLight: (state, action: PayloadAction<string>) => {
      delete state.lights[action.payload];
      if (state.selectedLightId === action.payload) {
        state.selectedLightId = null;
      }
    },
    selectLight: (state, action: PayloadAction<string | null>) => {
      state.selectedLightId = action.payload;
    },
    setAmbientIntensity: (state, action: PayloadAction<number>) => {
      state.ambientIntensity = action.payload;
    }
  }
});

export const { addLight, updateLight, removeLight, selectLight, setAmbientIntensity } = lightingSlice.actions;
export type { LightingState };
export default lightingSlice.reducer;
