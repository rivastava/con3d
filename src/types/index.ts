import * as THREE from 'three';

// Core Configuration Types
export interface Con3DConfig {
  apiKey: string;
  containerId: string;
  options?: Con3DOptions;
}

export interface Con3DOptions {
  // Rendering options
  renderer?: {
    antialias?: boolean;
    alpha?: boolean;
    toneMapping?: THREE.ToneMapping;
    toneMappingExposure?: number;
    outputColorSpace?: THREE.ColorSpace;
    shadowMapType?: THREE.ShadowMapType;
    physicallyCorrectLights?: boolean;
  };
  
  // Camera options
  camera?: {
    fov?: number;
    near?: number;
    far?: number;
    position?: [number, number, number];
  };
  
  // Controls options
  controls?: {
    enableDamping?: boolean;
    dampingFactor?: number;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    enablePan?: boolean;
    enableZoom?: boolean;
    maxDistance?: number;
    minDistance?: number;
  };
  
  // UI options
  ui?: {
    theme?: 'light' | 'dark' | 'auto';
    panels?: UIPanel[];
    showStats?: boolean;
    showGridHelper?: boolean;
    showAxesHelper?: boolean;
  };
  
  // Performance options
  performance?: {
    pixelRatio?: number;
    maxPixelRatio?: number;
    enableLOD?: boolean;
    enableInstancing?: boolean;
    enableFrustumCulling?: boolean;
  };
  
  // Assets options
  assets?: {
    baseUrl?: string;
    loaderOptions?: {
      dracoDecoderPath?: string;
      ktx2DecoderPath?: string;
    };
  };
}

// UI Panel Types
export interface UIPanel {
  id: string;
  title: string;
  type: 'material' | 'lighting' | 'environment' | 'texture' | 'custom';
  position: 'left' | 'right' | 'bottom';
  collapsed?: boolean;
  visible?: boolean;
}

// Material Types
export interface MaterialConfig {
  id: string;
  name: string;
  type: 'standard' | 'physical' | 'custom';
  parameters: MaterialParameters;
  metadata?: MaterialMetadata;
}

export interface MaterialParameters {
  // Base PBR properties
  baseColor?: THREE.ColorRepresentation;
  baseColorTexture?: string | THREE.Texture;
  metalness?: number;
  metalnessTexture?: string | THREE.Texture;
  roughness?: number;
  roughnessTexture?: string | THREE.Texture;
  normalTexture?: string | THREE.Texture;
  normalScale?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveTexture?: string | THREE.Texture;
  emissiveIntensity?: number;
  aoTexture?: string | THREE.Texture;
  aoIntensity?: number;
  
  // Advanced PBR properties
  clearcoat?: number;
  clearcoatTexture?: string | THREE.Texture;
  clearcoatRoughness?: number;
  clearcoatRoughnessTexture?: string | THREE.Texture;
  clearcoatNormalTexture?: string | THREE.Texture;
  clearcoatNormalScale?: number;
  
  sheen?: number;
  sheenColor?: THREE.ColorRepresentation;
  sheenColorTexture?: string | THREE.Texture;
  sheenRoughness?: number;
  sheenRoughnessTexture?: string | THREE.Texture;
  
  transmission?: number;
  transmissionTexture?: string | THREE.Texture;
  thickness?: number;
  thicknessTexture?: string | THREE.Texture;
  attenuationDistance?: number;
  attenuationColor?: THREE.ColorRepresentation;
  ior?: number; // Main IOR property
  
  iridescence?: number;
  iridescenceTexture?: string | THREE.Texture;
  iridescenceIOR?: number;
  iridescenceThicknessRange?: [number, number];
  iridescenceThicknessTexture?: string | THREE.Texture;
  
  // Specular workflow (alternative to metallic/roughness)
  specularIntensity?: number;
  specularColor?: THREE.ColorRepresentation;
  specularColorTexture?: string | THREE.Texture;
  specularIntensityTexture?: string | THREE.Texture;
  
  // Displacement and height
  displacementTexture?: string | THREE.Texture;
  displacementScale?: number;
  displacementBias?: number;
  
  // Transparency
  opacity?: number;
  alphaTexture?: string | THREE.Texture;
  transparent?: boolean;
  alphaTest?: number;
  
  // Texture transforms
  textureTransform?: TextureTransform;
}

export interface TextureTransform {
  offset?: [number, number];
  repeat?: [number, number];
  rotation?: number;
  center?: [number, number];
}

export interface MaterialMetadata {
  category?: string;
  tags?: string[];
  description?: string;
  author?: string;
  license?: string;
  previewImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Lighting Types
export interface LightConfig {
  id: string;
  name: string;
  type: 'directional' | 'point' | 'spot' | 'hemisphere' | 'area';
  parameters: LightParameters;
  visible?: boolean;
}

export interface LightParameters {
  color?: THREE.ColorRepresentation;
  intensity?: number;
  position?: [number, number, number];
  target?: [number, number, number];
  
  // Shadows
  castShadow?: boolean;
  shadowMapSize?: number;
  shadowCamera?: {
    near?: number;
    far?: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  
  // Spot light specific
  angle?: number;
  penumbra?: number;
  
  // Point light specific
  distance?: number;
  decay?: number;
  
  // Area light specific
  width?: number;
  height?: number;
}

// Environment Types
export interface EnvironmentConfig {
  id: string;
  name: string;
  type: 'hdri' | 'gradient' | 'color';
  parameters: EnvironmentParameters;
  metadata?: EnvironmentMetadata;
}

export interface EnvironmentParameters {
  // HDRI
  hdriUrl?: string;
  hdriIntensity?: number;
  hdriRotation?: number;
  hdriBlur?: number;
  
  // Gradient
  topColor?: THREE.ColorRepresentation;
  bottomColor?: THREE.ColorRepresentation;
  
  // Solid color
  color?: THREE.ColorRepresentation;
  
  // Ground
  groundColor?: THREE.ColorRepresentation;
  groundSize?: number;
  groundReceiveShadow?: boolean;
}

export interface EnvironmentMetadata {
  resolution?: string;
  format?: string;
  fileSize?: number;
  tags?: string[];
  description?: string;
  location?: string;
  timeOfDay?: string;
  weather?: string;
}

// Texture Painting Types
export interface PaintBrush {
  id: string;
  name: string;
  type: 'round' | 'square' | 'texture';
  size: number;
  opacity: number;
  flow: number;
  hardness: number;
  spacing: number;
  textureUrl?: string;
}

export interface PaintLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  canvas: HTMLCanvasElement;
}

export type BlendMode = 
  | 'normal' 
  | 'multiply' 
  | 'screen' 
  | 'overlay' 
  | 'soft-light' 
  | 'hard-light' 
  | 'color-dodge' 
  | 'color-burn' 
  | 'darken' 
  | 'lighten' 
  | 'difference' 
  | 'exclusion';

// UV Mapping Types
export interface UVIsland {
  id: string;
  vertices: number[];
  faces: number[];
  bounds: {
    min: [number, number];
    max: [number, number];
  };
}

export interface UVTransform {
  translation: [number, number];
  rotation: number;
  scale: [number, number];
}

// Asset Types
export interface AssetConfig {
  id: string;
  name: string;
  type: 'model' | 'texture' | 'hdri' | 'material';
  url: string;
  metadata: AssetMetadata;
}

export interface AssetMetadata {
  fileSize: number;
  format: string;
  dimensions?: {
    width: number;
    height: number;
    depth?: number;
  };
  tags?: string[];
  description?: string;
  license?: string;
  previewUrl?: string;
}

// Post-processing Types
export interface PostProcessingConfig {
  enabled: boolean;
  effects: EffectConfig[];
}

export interface EffectConfig {
  id: string;
  type: 'bloom' | 'ssao' | 'fxaa' | 'smaa' | 'ssr' | 'tone-mapping' | 'vignette' | 'lens-flare';
  enabled: boolean;
  parameters: Record<string, any>;
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
}

// Event Types
export interface Con3DEvent<T = any> {
  type: string;
  data: T;
  timestamp: number;
}

export interface MaterialChangeEvent {
  materialId: string;
  property: string;
  oldValue: any;
  newValue: any;
}

export interface EnvironmentChangeEvent {
  environmentId: string;
  property: string;
  oldValue: any;
  newValue: any;
}

// Plugin Types
export interface Plugin {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  initialize: (api: Con3DAPI) => void;
  dispose: () => void;
}

export interface Con3DAPI {
  // Material API
  material: {
    create: (config: Partial<MaterialConfig>) => Promise<MaterialConfig>;
    update: (id: string, parameters: Partial<MaterialParameters>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    get: (id: string) => MaterialConfig | null;
    getAll: () => MaterialConfig[];
    apply: (meshId: string, materialId: string) => Promise<void>;
  };
  
  // Environment API
  environment: {
    set: (config: EnvironmentConfig) => Promise<void>;
    setHDRI: (url: string, options?: Partial<EnvironmentParameters>) => Promise<void>;
    get: () => EnvironmentConfig | null;
    list: () => Promise<EnvironmentConfig[]>;
  };
  
  // Lighting API
  lighting: {
    add: (config: LightConfig) => Promise<void>;
    update: (id: string, parameters: Partial<LightParameters>) => Promise<void>;
    remove: (id: string) => Promise<void>;
    get: (id: string) => LightConfig | null;
    getAll: () => LightConfig[];
  };
  
  // Scene API
  scene: {
    load: (url: string) => Promise<void>;
    clear: () => void;
    exportGLTF: () => Promise<ArrayBuffer>;
    exportImage: (options?: ImageExportOptions) => Promise<string>;
  };
  
  // Events API
  events: {
    on: <T>(event: string, callback: (data: T) => void) => void;
    off: (event: string, callback?: Function) => void;
    emit: <T>(event: string, data: T) => void;
  };
}

export interface ImageExportOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
}

// State Management Types
export interface AppState {
  scene: SceneState;
  materials: MaterialsState;
  lighting: LightingState;
  environment: EnvironmentState;
  ui: UIState;
  assets: AssetsState;
  painting: PaintingState;
}

export interface SceneState {
  loaded: boolean;
  loading: boolean;
  error?: string;
  modelUrl?: string;
  meshes: MeshInfo[];
}

export interface MeshInfo {
  id: string;
  name: string;
  materialId?: string;
  visible: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface MaterialsState {
  items: Record<string, MaterialConfig>;
  active?: string;
  presets: Record<string, MaterialConfig>;
  loading: boolean;
}

export interface LightingState {
  lights: Record<string, LightConfig>;
  ambientIntensity: number;
  shadowsEnabled: boolean;
}

export interface EnvironmentState {
  current?: EnvironmentConfig;
  presets: Record<string, EnvironmentConfig>;
  loading: boolean;
}

export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  panels: Record<string, UIPanel>;
  activePanel?: string;
  sidebarCollapsed: boolean;
  showStats: boolean;
  showGridHelper: boolean;
  showAxesHelper: boolean;
}

export interface AssetsState {
  items: Record<string, AssetConfig>;
  loading: Record<string, boolean>;
  cache: Record<string, any>;
}

export interface PaintingState {
  active: boolean;
  brush: PaintBrush;
  layers: PaintLayer[];
  activeLayer?: string;
  uvChannel: number;
  canvas?: HTMLCanvasElement;
}
