// Core exports
import { Con3DConfigurator } from './core/Con3DConfigurator';
import type { Con3DConfig } from './types';

export { Con3DConfigurator } from './core/Con3DConfigurator';
export { RenderingEngine } from './core/RenderingEngine';
export { MaterialManager } from './core/MaterialManager';
export { LightingManager } from './core/LightingManager';
export { EnvironmentManager } from './core/EnvironmentManager';
export { AssetManager } from './core/AssetManager';
export { EventEmitter } from './core/EventEmitter';
export { PostProcessingManager } from './core/PostProcessingManager';

// Component exports
export { default as Con3DComponent } from './components/Con3DComponent';
export { Toolbar } from './components/Toolbar';

// Store exports
export { store } from './store';
export type { RootState, AppDispatch } from './store';

// Type exports
export type {
  Con3DConfig,
  Con3DOptions,
  Con3DAPI,
  MaterialConfig,
  MaterialParameters,
  LightConfig,
  LightParameters,
  EnvironmentConfig,
  EnvironmentParameters,
  AssetConfig,
  UIPanel,
  PostProcessingConfig,
  EffectConfig,
  ImageExportOptions,
  MaterialChangeEvent,
  EnvironmentChangeEvent,
  Con3DEvent,
  AppState,
  MaterialsState,
  LightingState,
  EnvironmentState,
  SceneState,
  UIState,
  AssetsState,
  PaintingState,
} from './types';

// Default initialization function
export function initializeCon3D(config: Con3DConfig): Con3DConfigurator {
  return new Con3DConfigurator(config);
}

// Version
export const VERSION = '1.0.0';
