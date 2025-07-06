import { configureStore } from '@reduxjs/toolkit';
import { materialSlice } from './slices/materialSlice';
import { lightingSlice } from './slices/lightingSlice';
import { environmentSlice } from './slices/environmentSlice';
import { sceneSlice } from './slices/sceneSlice';
import { uiSlice } from './slices/uiSlice';
import { assetsSlice } from './slices/assetsSlice';
import { paintingSlice } from './slices/paintingSlice';

export const store = configureStore({
  reducer: {
    materials: materialSlice.reducer,
    lighting: lightingSlice.reducer,
    environment: environmentSlice.reducer,
    scene: sceneSlice.reducer,
    ui: uiSlice.reducer,
    assets: assetsSlice.reducer,
    painting: paintingSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'materials/addMaterial',
          'scene/loadModel',
          'assets/cacheAsset'
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.material', 'payload.texture', 'payload.mesh'],
        // Ignore these paths in the state
        ignoredPaths: [
          'materials.items',
          'scene.meshes',
          'assets.cache'
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
