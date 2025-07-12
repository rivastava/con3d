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
      console.log('🎬 Starting scene setup...');
      
      // Add default lighting
      console.log('💡 Adding default lights...');
      this.lightingManager.addDefaultLights();
      
      // Verify lights were added
      const scene = this.renderingEngine.getScene();
      const lights = scene.children.filter(child => child instanceof THREE.Light);
      console.log(`✅ Added ${lights.length} lights to scene:`, lights.map(l => `${l.name || l.type} (${l.type})`));
      
      // Set default environment
      console.log('🌍 Setting default environment...');
      this.environmentManager.setDefaultEnvironment();
      
      // Add default test objects
      console.log('📦 Adding default test objects...');
      this.addDefaultTestObjects();
      
      // Verify objects were added
      const meshes = scene.children.filter(child => child instanceof THREE.Mesh);
      console.log(`✅ Added ${meshes.length} meshes to scene:`, meshes.map(m => m.name || 'Unnamed'));
      
      // Add grid helper if enabled
      if (this.options.ui?.showGridHelper) {
        console.log('📏 Adding grid helper...');
        this.addGridHelper();
      }
      
      // Add axes helper if enabled
      if (this.options.ui?.showAxesHelper) {
        console.log('🎯 Adding axes helper...');
        this.addAxesHelper();
      }
      
      // Print final scene stats
      console.log(`🎯 Scene setup completed! Total children: ${scene.children.length}`);
      console.log('Scene contents:', scene.children.map(child => ({
        name: child.name || 'Unnamed',
        type: child.type,
        visible: child.visible,
        position: child.position.toArray()
      })));
      
      // Check camera position
      const camera = this.renderingEngine.getCamera();
      console.log('📷 Camera position:', camera.position.toArray());
      console.log('📷 Camera looking at:', camera.getWorldDirection(new THREE.Vector3()).toArray());
      
    } catch (error) {
      console.error('❌ Error setting up initial scene:', error);
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

  public getAdvancedLightingSystem() {
    return this.renderingEngine.getEnhancedRenderingManager().getAdvancedLightingSystem();
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

  // Auto-focus camera on object (especially useful for small objects)
  public focusCameraOnObject(object: THREE.Object3D, distance?: number): void {
    const camera = this.renderingEngine.camera;
    const controls = this.renderingEngine.controls;
    
    if (!camera || !controls) return;
    
    // Get object's bounding box - handle groups properly
    const box = new THREE.Box3();
    
    // For groups, get the combined bounding box of all children
    if (object.type === 'Group' || object.children.length > 0) {
      box.setFromObject(object);
    } else {
      // For individual meshes
      if (object instanceof THREE.Mesh && object.geometry) {
        if (!object.geometry.boundingBox) {
          object.geometry.computeBoundingBox();
        }
        box.copy(object.geometry.boundingBox!);
        box.applyMatrix4(object.matrixWorld);
      } else {
        box.setFromObject(object);
      }
    }
    
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Calculate appropriate distance based on object size
    const maxDimension = Math.max(size.x, size.y, size.z);
    let focusDistance = distance;
    
    if (!focusDistance) {
      // Enhanced distance calculation for different object sizes
      if (maxDimension < 0.01) {
        focusDistance = 0.05; // Very tiny objects - 5cm distance
      } else if (maxDimension < 0.1) {
        focusDistance = maxDimension * 5; // Small objects - 5x object size
      } else if (maxDimension < 1) {
        focusDistance = maxDimension * 3; // Medium objects - 3x object size
      } else if (maxDimension < 10) {
        focusDistance = maxDimension * 1.5; // Large objects - 1.5x object size
      } else {
        focusDistance = maxDimension * 1.2; // Very large objects - 1.2x object size
      }
      
      // Ensure minimum distance
      focusDistance = Math.max(focusDistance, 0.02);
    }
    
    // Calculate optimal camera position
    const currentDirection = camera.position.clone().sub(center);
    if (currentDirection.length() < 0.001) {
      // If camera is at center, use default direction
      currentDirection.set(1, 1, 1);
    }
    currentDirection.normalize();
    
    const newPosition = center.clone().add(currentDirection.multiplyScalar(focusDistance));
    
    // Animate camera movement
    const animate = () => {
      camera.position.copy(newPosition);
      camera.lookAt(center);
      
      // Update controls target
      controls.target.copy(center);
      
      // Adjust clipping planes for object size
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.near = Math.max(0.001, focusDistance * 0.01);
        camera.far = Math.max(camera.near * 2000, focusDistance * 200);
        camera.updateProjectionMatrix();
      }
      
      controls.update();
    };
    
    animate();
    
    console.log(`Camera focused on object: size=${maxDimension.toFixed(3)}, distance=${focusDistance.toFixed(3)}`);
  }

  // Auto-focus camera on the entire scene
  public focusCameraOnScene(): void {
    const scene = this.renderingEngine.scene;
    
    // Get bounding box of all visible meshes in scene
    const box = new THREE.Box3();
    let hasObjects = false;
    
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && 
          object.visible && 
          !object.userData.isHelper &&
          !object.userData.isLightSelector &&
          !object.name.includes('helper')) {
        
        const meshBox = new THREE.Box3().setFromObject(object);
        if (hasObjects) {
          box.union(meshBox);
        } else {
          box.copy(meshBox);
          hasObjects = true;
        }
      }
    });
    
    if (hasObjects) {
      // Create a temporary object at scene bounds for focusing
      const tempObject = new THREE.Object3D();
      tempObject.position.copy(box.getCenter(new THREE.Vector3()));
      
      // Focus on the scene bounds
      this.focusCameraOnObject(tempObject);
    }
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

  // Transform controls methods
  public enableTransformControls(): void {
    this.renderingEngine.enableTransformControls();
  }

  public disableTransformControls(): void {
    this.renderingEngine.disableTransformControls();
  }

  public isTransformControlsEnabled(): boolean {
    return this.renderingEngine.isTransformControlsEnabled();
  }

  public setTransformMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this.renderingEngine.setTransformMode(mode);
  }

  public getTransformMode(): 'translate' | 'rotate' | 'scale' {
    return this.renderingEngine.getTransformMode();
  }

  public getNonInterferingTransformControls() {
    return this.renderingEngine.getNonInterferingTransformControls();
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

  // Object selectability and visibility controls (Blender-style)
  public setObjectSelectable(object: THREE.Object3D, selectable: boolean): void {
    this.renderingEngine.setObjectSelectable(object, selectable);
  }

  public hideObject(object: THREE.Object3D): void {
    this.renderingEngine.hideObject(object);
  }

  public showObject(object: THREE.Object3D): void {
    this.renderingEngine.showObject(object);
  }

  public toggleObjectVisibility(object: THREE.Object3D): void {
    this.renderingEngine.toggleObjectVisibility(object);
  }

  public getAllSelectableObjects(): THREE.Object3D[] {
    return this.renderingEngine.getAllSelectableObjects();
  }

  public selectNextObject(): void {
    this.renderingEngine.selectNextObject();
  }

  public selectPreviousObject(): void {
    this.renderingEngine.selectPreviousObject();
  }

  // Helper methods
  private addGridHelper(): void {
    const gridHelper = new (require('three').GridHelper)(50, 50);
    gridHelper.name = 'GridHelper';
    gridHelper.userData.selectable = false; // Mark as non-selectable
    gridHelper.userData.isHelper = true;
    this.renderingEngine.addObject(gridHelper);
  }

  private addAxesHelper(): void {
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.name = 'AxesHelper';
    axesHelper.userData.selectable = false; // Mark as non-selectable
    axesHelper.userData.isHelper = true;
    this.renderingEngine.addObject(axesHelper);
  }

  private addDefaultTestObjects(): void {
    console.log('🧊 Creating test cube...');
    // Add a default cube for testing
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      roughness: 0.4,
      metalness: 0.0
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 1, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.name = 'TestCube';
    this.renderingEngine.addObject(cube);
    console.log('✅ Added test cube at position:', cube.position.toArray());

    console.log('🟩 Creating ground plane...');
    // Add a plane for shadows
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.8,
      metalness: 0.0
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    plane.name = 'GroundPlane';
    this.renderingEngine.addObject(plane);
    console.log('✅ Added ground plane at position:', plane.position.toArray());

    console.log('🔴 Creating test sphere...');
    // Add a sphere for variety
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      roughness: 0.2,
      metalness: 0.8
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(3, 1, 0);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    sphere.name = 'TestSphere';
    this.renderingEngine.addObject(sphere);
    console.log('✅ Added test sphere at position:', sphere.position.toArray());
  }
}

// Factory function for creating configurator instances
export function createConfigurator(config: Con3DConfig): Con3DConfigurator {
  return new Con3DConfigurator(config);
}

// Default export
export default Con3DConfigurator;
