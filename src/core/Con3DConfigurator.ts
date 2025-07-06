import * as THREE from 'three';
import { RenderingEngine } from './RenderingEngine';
import { MaterialManager } from './MaterialManager';
import { LightingManager } from './LightingManager';
import { EnvironmentManager } from './EnvironmentManager';
import { AssetManager } from './AssetManager';
import { EventEmitter } from './EventEmitter';
import { PostProcessingManager } from './PostProcessingManager';
import { 
  Con3DConfig, 
  Con3DOptions, 
  Con3DAPI, 
  MaterialConfig,
  MaterialParameters,
  LightConfig,
  LightParameters,
  EnvironmentConfig,
  EnvironmentParameters,
  ImageExportOptions
} from '@/types';

export class Con3DConfigurator extends EventEmitter implements Con3DAPI {
  private container: HTMLElement;
  private renderingEngine!: RenderingEngine;
  private materialManager!: MaterialManager;
  private lightingManager!: LightingManager;
  private environmentManager!: EnvironmentManager;
  private assetManager!: AssetManager;
  private postProcessingManager!: PostProcessingManager;
  
  public readonly apiKey: string;
  public readonly options: Con3DOptions;

  constructor(config: Con3DConfig) {
    super();
    
    this.apiKey = config.apiKey;
    this.options = config.options || {};
    
    // Get container element
    const container = document.getElementById(config.containerId);
    if (!container) {
      throw new Error(`Container element with id '${config.containerId}' not found`);
    }
    this.container = container;

    // Initialize managers
    this.initializeManagers();
    
    // Setup initial scene
    this.setupInitialScene();
    
    // Emit ready event on next tick to allow event listeners to be set up
    setTimeout(() => {
      this.emit('ready', { configurator: this });
    }, 0);
  }

  private initializeManagers(): void {
    try {
      // Initialize rendering engine
      this.renderingEngine = new RenderingEngine(this.container, this.options);
      
      // Initialize material manager
      this.materialManager = new MaterialManager();
      
      // Initialize lighting manager
      this.lightingManager = new LightingManager(this.renderingEngine.getScene());
      
      // Initialize environment manager
      this.environmentManager = new EnvironmentManager(this.renderingEngine);
      
      // Initialize asset manager
      this.assetManager = new AssetManager(this.options.assets);
      
      // Initialize post-processing manager
      this.postProcessingManager = new PostProcessingManager(
        this.renderingEngine.getRenderer(),
        this.renderingEngine.getScene(),
        this.renderingEngine.getCamera()
      );
      
    } catch (error) {
      console.error('Error initializing managers:', error);
      throw error;
    }
  }

  private setupInitialScene(): void {
    try {
      // Add default lighting
      this.lightingManager.addDefaultLights();
      
      // Set default environment
      this.environmentManager.setDefaultEnvironment();
      
      // Add grid helper if enabled
      if (this.options.ui?.showGridHelper) {
        this.addGridHelper();
      }
      
      // Add axes helper if enabled
      if (this.options.ui?.showAxesHelper) {
        this.addAxesHelper();
      }
      
    } catch (error) {
      console.error('Error setting up initial scene:', error);
      throw error;
    }
  }

  // Material API Implementation
  public material = {
    create: async (config: Partial<MaterialConfig>): Promise<MaterialConfig> => {
      const materialConfig: MaterialConfig = {
        id: config.id || this.generateId(),
        name: config.name || 'Untitled Material',
        type: config.type || 'physical',
        parameters: config.parameters || {},
        metadata: config.metadata
      };

      const material = await this.materialManager.createMaterial(materialConfig);
      
      this.emit('material:created', { 
        materialId: materialConfig.id, 
        config: materialConfig,
        material 
      });
      
      return materialConfig;
    },

    update: async (id: string, parameters: Partial<MaterialParameters>): Promise<void> => {
      const oldMaterial = this.materialManager.getMaterial(id);
      if (!oldMaterial) {
        throw new Error(`Material with id ${id} not found`);
      }

      await this.materialManager.updateMaterial(id, parameters);
      
      this.emit('material:updated', { 
        materialId: id, 
        parameters,
        oldMaterial,
        newMaterial: this.materialManager.getMaterial(id)
      });
    },

    delete: async (id: string): Promise<void> => {
      const material = this.materialManager.getMaterial(id);
      if (!material) {
        throw new Error(`Material with id ${id} not found`);
      }

      this.materialManager.removeMaterial(id);
      
      this.emit('material:deleted', { materialId: id, material });
    },

    get: (id: string): MaterialConfig | null => {
      const material = this.materialManager.getMaterial(id);
      return material?.userData?.config || null;
    },

    getAll: (): MaterialConfig[] => {
      const materials = this.materialManager.getAllMaterials();
      return Array.from(materials.values())
        .map(material => material.userData?.config)
        .filter(Boolean);
    },

    apply: async (meshId: string, materialId: string): Promise<void> => {
      const mesh = this.assetManager.getMesh(meshId);
      if (!mesh) {
        throw new Error(`Mesh with id ${meshId} not found`);
      }

      this.materialManager.applyMaterialToMesh(mesh, materialId);
      
      this.emit('material:applied', { meshId, materialId });
    }
  };

  // Environment API Implementation
  public environment = {
    set: async (config: EnvironmentConfig): Promise<void> => {
      await this.environmentManager.setEnvironment(config);
      
      this.emit('environment:changed', { config });
    },

    setHDRI: async (url: string, options: Partial<EnvironmentParameters> = {}): Promise<void> => {
      await this.environmentManager.setHDRI(url, options);
      
      this.emit('environment:hdri-changed', { url, options });
    },

    get: (): EnvironmentConfig | null => {
      return this.environmentManager.getCurrentEnvironment();
    },

    list: async (): Promise<EnvironmentConfig[]> => {
      return this.environmentManager.getPresets();
    },

    setBackgroundVisible: (visible: boolean): void => {
      this.environmentManager.setBackgroundVisible(visible);
      this.emit('environment:background-visibility-changed', { visible });
    },

    isBackgroundVisible: (): boolean => {
      return this.environmentManager.isBackgroundVisible();
    }
  };

  // Lighting API Implementation
  public lighting = {
    add: async (config: LightConfig): Promise<void> => {
      const lightConfig: LightConfig = {
        id: config.id || this.generateId(),
        name: config.name || 'Untitled Light',
        type: config.type,
        parameters: config.parameters,
        visible: config.visible !== false
      };

      this.lightingManager.addLight(lightConfig);
      
      this.emit('light:added', { config: lightConfig });
    },

    update: async (id: string, parameters: Partial<LightParameters>): Promise<void> => {
      this.lightingManager.updateLight(id, parameters);
      
      this.emit('light:updated', { lightId: id, parameters });
    },

    remove: async (id: string): Promise<void> => {
      this.lightingManager.removeLight(id);
      
      this.emit('light:removed', { lightId: id });
    },

    get: (id: string): LightConfig | null => {
      return this.lightingManager.getLight(id);
    },

    getAll: (): LightConfig[] => {
      return this.lightingManager.getAllLights();
    }
  };

  // Scene API Implementation
  public scene = {
    load: async (url: string): Promise<void> => {
      this.emit('scene:loading', { url });
      
      try {
        const model = await this.assetManager.loadModel(url);
        
        // Clear existing models from scene
        this.scene.clear();
        
        // Add the new model to the scene
        this.renderingEngine.addObject(model);
        
        // Center the camera on the model
        this.centerCameraOnModel(model);
        
        this.emit('scene:loaded', { url });
      } catch (error) {
        this.emit('scene:error', { url, error });
        throw error;
      }
    },

    clear: (): void => {
      // Clear all meshes from the rendering engine scene
      const scene = this.renderingEngine.getScene();
      const objectsToRemove = scene.children.filter(child => 
        child instanceof THREE.Group || child instanceof THREE.Mesh
      );
      
      objectsToRemove.forEach(obj => {
        scene.remove(obj);
      });
      
      this.assetManager.clearScene();
      this.emit('scene:cleared');
    },

    exportGLTF: async (): Promise<ArrayBuffer> => {
      return this.assetManager.exportGLTF();
    },

    exportImage: async (options: ImageExportOptions = {}): Promise<string> => {
      return this.renderingEngine.exportImage(options);
    }
  };

  // Events API Implementation (override the private events property from EventEmitter)
  public get events() {
    return {
      on: <T>(event: string, callback: (data: T) => void): void => {
        this.on(event, callback);
      },

      off: (event: string, callback?: Function): void => {
        this.off(event, callback as any);
      },

      emit: <T>(event: string, data: T): void => {
        this.emit(event, data);
      }
    };
  }

  // Public methods
  public getRenderer() {
    return this.renderingEngine.getRenderer();
  }

  public getScene() {
    return this.renderingEngine.getScene();
  }

  public getCamera() {
    return this.renderingEngine.getCamera();
  }

  public getControls() {
    return this.renderingEngine.getControls();
  }

  public getSelectedMesh() {
    return this.renderingEngine.getSelectedMesh();
  }

  // Camera and clipping controls
  public adjustCameraClipping(near?: number, far?: number) {
    this.renderingEngine.adjustCameraClipping(near, far);
  }

  public adjustControlsDistance(minDistance?: number, maxDistance?: number) {
    this.renderingEngine.adjustControlsDistance(minDistance, maxDistance);
  }

  public autoAdjustClipping() {
    this.renderingEngine.autoAdjustClipping();
  }

  public getCanvas() {
    return this.renderingEngine.getCanvas();
  }

  // Manager getters
  public getShadowCatcher() {
    return this.renderingEngine.getShadowCatcher();
  }

  public getEnhancedShadowCatcher() {
    return this.renderingEngine.getEnhancedShadowCatcher();
  }

  public getBackgroundManager() {
    return this.renderingEngine.getBackgroundManager();
  }

  public getCameraManager() {
    return this.renderingEngine.getCameraManager();
  }

  public getPrimitiveManager() {
    return this.renderingEngine.getPrimitiveManager();
  }

  public getObjectSettingsManager() {
    return this.renderingEngine.getObjectSettingsManager();
  }

  public getEnhancedRenderingManager() {
    return this.renderingEngine.getEnhancedRenderingManager();
  }

  // Camera switching
  public switchCamera(camera: THREE.Camera): void {
    this.renderingEngine.switchCamera(camera);
  }

  public enablePostProcessing(effects: string[] = ['fxaa', 'bloom']): void {
    this.postProcessingManager.enable(effects);
  }

  public disablePostProcessing(): void {
    this.postProcessingManager.disable();
  }

  public takeScreenshot(options: ImageExportOptions = {}): string {
    return this.renderingEngine.exportImage(options);
  }

  public resize(): void {
    // The rendering engine handles resize automatically via ResizeObserver
    // This method is kept for manual resize triggers if needed
    const rect = this.container.getBoundingClientRect();
    this.renderingEngine.resize(rect.width, rect.height);
  }

  public dispose(): void {
    // Dispose all managers
    this.renderingEngine.dispose();
    this.materialManager.dispose();
    this.lightingManager.dispose();
    this.environmentManager.dispose();
    this.assetManager.dispose();
    this.postProcessingManager.dispose();
    
    // Clear event listeners
    this.removeAllListeners();
    
    this.emit('disposed');
  }

  public onMeshSelected(callback: (mesh: THREE.Mesh | null) => void) {
    this.renderingEngine.onMeshSelected(callback);
  }

  public getRenderingEngine(): RenderingEngine {
    return this.renderingEngine;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private centerCameraOnModel(model: THREE.Group): void {
    // Calculate bounding box of the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Get the maximum dimension
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Calculate camera distance based on FOV and model size
    const camera = this.renderingEngine.getCamera();
    const distance = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    
    // Position camera at a good viewing angle
    const cameraPosition = new THREE.Vector3(
      center.x + distance * 0.8,
      center.y + distance * 0.5,
      center.z + distance * 0.8
    );
    
    camera.position.copy(cameraPosition);
    camera.lookAt(center);
    
    // Update controls target to the model center
    const controls = this.renderingEngine.getControls();
    controls.target.copy(center);
    controls.update();
  }

  // Helper methods
  private addGridHelper(): void {
    const gridHelper = new (require('three').GridHelper)(50, 50);
    this.renderingEngine.addObject(gridHelper);
  }

  private addAxesHelper(): void {
    const axesHelper = new (require('three').AxesHelper)(5);
    this.renderingEngine.addObject(axesHelper);
  }
}

// Factory function for creating configurator instances
export function createConfigurator(config: Con3DConfig): Con3DConfigurator {
  return new Con3DConfigurator(config);
}

// Default export
export default Con3DConfigurator;
