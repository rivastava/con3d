import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EnvironmentConfig } from '@/types';

interface EnvironmentState {
  current: EnvironmentConfig | null;
  presets: EnvironmentConfig[];
}

const initialState: EnvironmentState = {
  current: null,
  presets: []
};

export const environmentSlice = createSlice({
  name: 'environment',
  initialState,
  reducers: {
    setEnvironment: (state, action: PayloadAction<EnvironmentConfig>) => {
      state.current = action.payload;
    },
    updateEnvironment: (state, action: PayloadAction<Partial<EnvironmentConfig>>) => {
      if (state.current) {
        state.current = { ...state.current, ...action.payload };
      }
    },
    loadPresets: (state, action: PayloadAction<EnvironmentConfig[]>) => {
      state.presets = action.payload;
    },
    clearEnvironment: (state) => {
      state.current = null;
    }
  }
});

export const { setEnvironment, updateEnvironment, loadPresets, clearEnvironment } = environmentSlice.actions;
export type { EnvironmentState };
export default environmentSlice.reducer;
