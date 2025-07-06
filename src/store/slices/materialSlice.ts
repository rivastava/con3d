import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Simplified material state that avoids complex Three.js types in Redux
interface SimpleMaterialConfig {
  id: string;
  name: string;
  type: 'standard' | 'physical' | 'basic' | 'lambert' | 'phong';
  parameters: Record<string, any>; // Use any to avoid Three.js type issues
}

interface MaterialsState {
  items: Record<string, SimpleMaterialConfig>;
  active: string | undefined;
  presets: Record<string, SimpleMaterialConfig>;
  loading: boolean;
}

const initialState: MaterialsState = {
  items: {},
  active: undefined,
  presets: {},
  loading: false,
};

export const materialSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    // Add a new material
    addMaterial: (state, action: PayloadAction<SimpleMaterialConfig>) => {
      state.items[action.payload.id] = action.payload;
    },

    // Update material parameters
    updateMaterial: (
      state,
      action: PayloadAction<{ id: string; parameters: Record<string, any> }>
    ) => {
      const { id, parameters } = action.payload;
      if (state.items[id]) {
        state.items[id].parameters = {
          ...state.items[id].parameters,
          ...parameters,
        };
      }
    },

    // Remove a material
    removeMaterial: (state, action: PayloadAction<string>) => {
      delete state.items[action.payload];
      if (state.active === action.payload) {
        state.active = undefined;
      }
    },

    // Set active material
    setActiveMaterial: (state, action: PayloadAction<string | undefined>) => {
      state.active = action.payload;
    },

    // Load material presets
    loadPresets: (state, action: PayloadAction<Record<string, SimpleMaterialConfig>>) => {
      state.presets = action.payload;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Clear all materials
    clearMaterials: (state) => {
      state.items = {};
      state.active = undefined;
    },

    // Duplicate material
    duplicateMaterial: (state, action: PayloadAction<{ sourceId: string; newId: string; newName: string }>) => {
      const { sourceId, newId, newName } = action.payload;
      const sourceMaterial = state.items[sourceId];
      
      if (sourceMaterial) {
        state.items[newId] = {
          ...sourceMaterial,
          id: newId,
          name: newName,
        };
      }
    },

    // Import material from preset
    importPreset: (state, action: PayloadAction<{ presetId: string; newId: string }>) => {
      const { presetId, newId } = action.payload;
      const preset = state.presets[presetId];
      
      if (preset) {
        state.items[newId] = {
          ...preset,
          id: newId,
        };
      }
    },
  },
});

export const {
  addMaterial,
  updateMaterial,
  removeMaterial,
  setActiveMaterial,
  loadPresets,
  setLoading,
  clearMaterials,
  duplicateMaterial,
  importPreset,
} = materialSlice.actions;

// Selectors
export const selectMaterials = (state: { materials: MaterialsState }) => state.materials.items;
export const selectActiveMaterial = (state: { materials: MaterialsState }) => 
  state.materials.active ? state.materials.items[state.materials.active] : undefined;
export const selectMaterialPresets = (state: { materials: MaterialsState }) => state.materials.presets;
export const selectMaterialsLoading = (state: { materials: MaterialsState }) => state.materials.loading;

export type { MaterialsState };
export default materialSlice.reducer;
