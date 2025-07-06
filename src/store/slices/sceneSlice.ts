import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SceneState {
  modelUrl: string | null;
  isLoading: boolean;
  error: string | null;
  meshes: Record<string, any>; // Will be typed more specifically later
  selectedMeshId: string | null;
}

const initialState: SceneState = {
  modelUrl: null,
  isLoading: false,
  error: null,
  meshes: {},
  selectedMeshId: null
};

export const sceneSlice = createSlice({
  name: 'scene',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setModelUrl: (state, action: PayloadAction<string | null>) => {
      state.modelUrl = action.payload;
    },
    addMesh: (state, action: PayloadAction<{ id: string; mesh: any }>) => {
      state.meshes[action.payload.id] = action.payload.mesh;
    },
    removeMesh: (state, action: PayloadAction<string>) => {
      delete state.meshes[action.payload];
      if (state.selectedMeshId === action.payload) {
        state.selectedMeshId = null;
      }
    },
    selectMesh: (state, action: PayloadAction<string | null>) => {
      state.selectedMeshId = action.payload;
    },
    clearScene: (state) => {
      state.modelUrl = null;
      state.meshes = {};
      state.selectedMeshId = null;
      state.error = null;
    }
  }
});

export const { setLoading, setError, setModelUrl, addMesh, removeMesh, selectMesh, clearScene } = sceneSlice.actions;
export type { SceneState };
export default sceneSlice.reducer;
