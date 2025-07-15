import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { EffectComposer } from 'postprocessing';
import { Con3DOptions } from '@/types';
import { withSuppressedWarnings } from '../utils/warningSuppress';
import { OutlineManager } from './OutlineManager';
import { ShadowCatcher } from './ShadowCatcher';
import { EnhancedShadowCatcher } from './EnhancedShadowCatcher';
import { BackgroundManager } from './BackgroundManager';
import { CameraManager } from './CameraManager';
import { PrimitiveManager } from './PrimitiveManager';
import { ObjectSettingsManager } from './ObjectSettingsManager';
import { EnhancedRenderingManager } from './EnhancedRenderingManager';
import { SceneTransformControls } from './SceneTransformControls';
import { NonInterferingTransformControls } from './NonInterferingTransformControls';

export class RenderingEngine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  public composer?: EffectComposer;
  
  private container: HTMLElement;
  private animationId?: number;
  private resizeObserver?: ResizeObserver;
  private outlineManager: OutlineManager;
  private shadowCatcher: ShadowCatcher;
  private enhancedShadowCatcher: EnhancedShadowCatcher;
  private backgroundManager: BackgroundManager;
  private cameraManager: CameraManager;
  private primitiveManager: PrimitiveManager;
  private objectSettingsManager: ObjectSettingsManager;
  private enhancedRenderingManager: EnhancedRenderingManager;
  private sceneTransformControls: SceneTransformControls;
  private nonInterferingTransformControls: NonInterferingTransformControls | null = null;

  // Selection system
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedMesh: THREE.Mesh | null = null;
  private selectedLightId: string | null = null;
  private selectionCallbacks: Array<(mesh: THREE.Mesh | null) => void> = [];
  private lightSelectionCallbacks: Array<(lightId: string | null) => void> = [];

  constructor(container: HTMLElement, options: Con3DOptions = {}) {
    try {
      this.container = container;
      
      // Initialize selection system
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      
      // Initialize renderer
      this.renderer = this.createRenderer(options.renderer);
      container.appendChild(this.renderer.domElement);
      
      // Initialize scene
      this.scene = new THREE.Scene();
      
      // Initialize camera manager first to get the proper camera
      this.cameraManager = new CameraManager(this.scene, this.renderer);
      
      // Set up camera switching callback
      this.cameraManager.onCameraSwitch((camera, config) => {
        console.log('🎥 Camera switching callback triggered:', config.name);
        this.camera = camera as THREE.PerspectiveCamera;
        
        // Update controls
        if (this.controls) {
          (this.controls as any).object = camera;
          this.controls.update();
        }
        
        // Update outline manager
        if (this.outlineManager) {
          (this.outlineManager as any).camera = camera;
        }
        
        // Update post-processing if available
        if (this.enhancedRenderingManager) {
          const postProcessing = this.enhancedRenderingManager.getPostProcessingManager();
          if (postProcessing) {
            postProcessing.updateCamera(camera);
          }
        }
        
        console.log('✅ Camera switching complete');
      });
      
      // Use the active camera from camera manager
      this.camera = this.cameraManager.getActiveCamera() as THREE.PerspectiveCamera;
      
      // Initialize controls with the camera manager's active camera
      this.controls = this.createControls(options.controls);
      
      // Initialize outline manager for selection highlighting
      this.outlineManager = new OutlineManager(this.scene, this.camera, this.renderer);
      
      // Initialize shadow catcher
      this.shadowCatcher = new ShadowCatcher(this.scene);
      
      // Initialize enhanced shadow catcher
      this.enhancedShadowCatcher = new EnhancedShadowCatcher(this.scene);
      
      // Initialize background manager
      this.backgroundManager = new BackgroundManager(this.scene);
      
      // Initialize primitive manager
      this.primitiveManager = new PrimitiveManager(this.scene);
      
      // Initialize object settings manager
      this.objectSettingsManager = new ObjectSettingsManager(this.scene);
      
      // Initialize enhanced rendering manager
      this.enhancedRenderingManager = new EnhancedRenderingManager(this.renderer, this.scene);
      
      // Initialize post-processing with camera
      this.enhancedRenderingManager.initializePostProcessing(this.camera);
      
      // Setup resize handling
      this.setupResizeHandling();
      
      // Setup mouse events for selection
      this.setupMouseEvents();
      
      // Initialize transform controls after everything else is set up
      // DISABLED: Old transform controls are causing rendering issues
      // TODO: Remove old transform controls once new ones are fully tested
      console.log('⚠️ Old transform controls temporarily disabled to prevent rendering issues');
      // Create a dummy transform controls to avoid null reference errors
      this.sceneTransformControls = {
        attachToMesh: () => {},
        setEnabled: () => {},
        setMode: () => {},
        dispose: () => {}
      } as any;

      // Initialize new non-interfering transform controls (disabled by default)
      console.log('🎮 Initializing new non-interfering transform controls...');
      try {
        this.nonInterferingTransformControls = new NonInterferingTransformControls(
          this.scene,
          this.camera,
          this.renderer,
          this.controls,
          { enabled: false } // Start disabled to avoid any issues
        );
        console.log('✅ Non-interfering transform controls created (disabled)');
      } catch (error) {
        console.warn('⚠️ Failed to create non-interfering transform controls:', error);
        this.nonInterferingTransformControls = null;
      }
      
      // Start render loop
      this.startRenderLoop();
      
    } catch (error) {
      console.error('RenderingEngine initialization failed:', error);
      throw error;
    }
  }

  private createRenderer(options: Con3DOptions['renderer'] = {}): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? true,
      powerPreference: 'high-performance',
    });

    // Set renderer properties
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    
    // Tone mapping
    renderer.toneMapping = options.toneMapping ?? THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = options.toneMappingExposure ?? 1.0;
    
    // Color space
    renderer.outputColorSpace = options.outputColorSpace ?? THREE.SRGBColorSpace;
    
    // Shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = options.shadowMapType ?? THREE.PCFSoftShadowMap;
    
    // Physically correct lights - removed as not available in current Three.js version
    // renderer.useLegacyLights = !(options.physicallyCorrectLights ?? true);
    
    return renderer;
  }



  private createControls(options: Con3DOptions['controls'] = {}): OrbitControls {
    // Suppress passive event listener warnings during OrbitControls creation
    // These warnings are cosmetic and don't affect functionality
    return withSuppressedWarnings(() => {
      const controls = new OrbitControls(this.camera, this.renderer.domElement);
      
      controls.enableDamping = options.enableDamping ?? true;
      controls.dampingFactor = options.dampingFactor ?? 0.05;
      controls.autoRotate = options.autoRotate ?? false;
      controls.autoRotateSpeed = options.autoRotateSpeed ?? 2.0;
      controls.enablePan = options.enablePan ?? true;
      controls.enableZoom = options.enableZoom ?? true;
      
      // Better distance limits to prevent clipping
      controls.minDistance = options.minDistance ?? 0.1;
      controls.maxDistance = options.maxDistance ?? 100;
      
      return controls;
    });
  }

  private setupResizeHandling(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.handleResize(width, height);
      }
    });
    
    this.resizeObserver.observe(this.container);
  }

  private handleResize(width: number, height: number): void {
    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(width, height);
    
    // Update post-processing composer if it exists
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    
    // Update enhanced rendering manager post-processing
    const postProcessing = this.enhancedRenderingManager.getPostProcessingManager();
    if (postProcessing) {
      postProcessing.setSize(width, height);
    }
  }

  /**
   * Public method to handle resize - can be called externally
   */
  public resize(width: number, height: number): void {
    this.handleResize(width, height);
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // Update controls
      this.controls.update();
      
      // Update outline manager (sync transforms)
      this.outlineManager.update();
      
      // Update shadow catcher position
      this.shadowCatcher.updatePosition();
      
      // Render scene
      const postProcessing = this.enhancedRenderingManager.getPostProcessingManager();
      if (postProcessing && postProcessing.isEnabled()) {
        postProcessing.render();
      } else if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
      
      // Render outlines on top
      this.outlineManager.render();
    };
    
    animate();
  }

  public stopRenderLoop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
  }

  public addObject(object: THREE.Object3D): void {
    this.scene.add(object);
    // Update shadow catcher position after adding new objects
    this.shadowCatcher.updatePosition();
  }

  public removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
    // Update shadow catcher position after removing objects
    this.shadowCatcher.updatePosition();
  }

  public setEnvironment(texture: THREE.Texture): void {
    this.scene.environment = texture;
    this.scene.background = texture;
  }

  public setClearColor(color: THREE.ColorRepresentation, alpha = 1): void {
    this.renderer.setClearColor(color, alpha);
  }

  public exportImage(options: {
    width?: number;
    height?: number;
    format?: 'png' | 'jpeg' | 'webp';
    quality?: number;
  } = {}): string {
    const { width = 1920, height = 1080, format = 'png', quality = 0.95 } = options;
    
    // Store current size
    const currentWidth = this.renderer.domElement.width;
    const currentHeight = this.renderer.domElement.height;
    
    // Set export size
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Render frame
    this.renderer.render(this.scene, this.camera);
    
    // Get image data
    let dataURL: string;
    if (format === 'jpeg') {
      dataURL = this.renderer.domElement.toDataURL('image/jpeg', quality);
    } else if (format === 'webp') {
      dataURL = this.renderer.domElement.toDataURL('image/webp', quality);
    } else {
      dataURL = this.renderer.domElement.toDataURL('image/png');
    }
    
    // Restore original size
    this.renderer.setSize(currentWidth, currentHeight);
    this.camera.aspect = currentWidth / currentHeight;
    this.camera.updateProjectionMatrix();
    
    return dataURL;
  }

  public dispose(): void {
    // Stop render loop
    this.stopRenderLoop();
    
    // Remove event listeners
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    
    // Dispose outline manager
    this.outlineManager.dispose();
    
    // Dispose transform controls (if they exist and have dispose method)
    try {
      if (this.sceneTransformControls && typeof this.sceneTransformControls.dispose === 'function') {
        this.sceneTransformControls.dispose();
      }
    } catch (error) {
      console.warn('Failed to dispose legacy transform controls:', error);
    }

    // Dispose new non-interfering transform controls
    try {
      if (this.nonInterferingTransformControls) {
        this.nonInterferingTransformControls.dispose();
        this.nonInterferingTransformControls = null;
      }
    } catch (error) {
      console.warn('Failed to dispose non-interfering transform controls:', error);
    }
    
    // Dispose controls
    this.controls.dispose();
    
    // Dispose renderer
    this.renderer.dispose();
    
    // Stop resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Dispose composer
    if (this.composer) {
      this.composer.dispose();
    }
    
    // Remove canvas from container
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }

  // Selection methods
  private setupMouseEvents(): void {
    this.container.addEventListener('click', this.onMouseClick.bind(this));
    
    // Add keyboard event handlers for selection navigation (Blender-style)
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Only handle if no input element is focused
    if (document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          this.selectPreviousObject();
        } else {
          this.selectNextObject();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.setSelectedMesh(null);
        break;
    }
  }

  private onMouseClick(event: MouseEvent): void {
    // Calculate mouse position in normalized device coordinates
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Perform raycasting
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Get all selectable objects (like Blender)
    const selectableObjects = this.getSelectableObjects();
    const intersects = this.raycaster.intersectObjects(selectableObjects, true);

    // Find the first selectable object in the intersects
    let newSelectedMesh: THREE.Mesh | null = null;
    let newSelectedLightId: string | null = null;
    
    for (const intersect of intersects) {
      if (this.isObjectSelectable(intersect.object)) {
        // Check if this is a light helper
        if (intersect.object.userData.isLightHelper && intersect.object.userData.lightId) {
          newSelectedLightId = intersect.object.userData.lightId;
          console.log(`🔆 Selected light: ${newSelectedLightId} (${intersect.object.userData.lightType})`);
          break;
        }
        // Check if this is a light selector (legacy support)
        else if (intersect.object.userData.isLightSelector) {
          const parentLight = intersect.object.userData.parentLight;
          if (parentLight) {
            // Fixed: Properly extract light ID for selection
            newSelectedLightId = intersect.object.userData.lightId || parentLight.userData?.id || parentLight.name;
            console.log(`🔆 Selected light via selector: ${newSelectedLightId} (${parentLight.type})`);
            break;
          }
        } else {
          newSelectedMesh = intersect.object as THREE.Mesh;
          console.log(`🎯 Selected: ${newSelectedMesh.name || 'Unnamed'} (${newSelectedMesh.type})`);
          break;
        }
      }
    }

    // Update selections
    if (newSelectedLightId) {
      this.setSelectedLight(newSelectedLightId);
      this.setSelectedMesh(null); // Clear mesh selection when light is selected
    } else {
      this.setSelectedMesh(newSelectedMesh);
      // Clear light selection when mesh is selected (but don't call setSelectedLight to avoid detaching)
      if (this.selectedLightId) {
        console.log(`🎯 Clearing light selection (${this.selectedLightId}) because mesh was selected`);
        this.selectedLightId = null;
        this.lightSelectionCallbacks.forEach(callback => callback(null));
      }
    }
  }

  /**
   * Get all objects that can be selected (Blender-style filtering)
   */
  private getSelectableObjects(): THREE.Object3D[] {
    const selectableObjects: THREE.Object3D[] = [];
    
    this.scene.traverse((object) => {
      if (this.isObjectSelectable(object)) {
        selectableObjects.push(object);
      }
    });
    
    return selectableObjects;
  }

  /**
   * Check if an object can be selected (Blender-style rules)
   */
  private isObjectSelectable(object: THREE.Object3D): boolean {
    // Must be visible (or be a light selector/helper which is intentionally invisible but selectable)
    if (!object.visible && !object.userData.isLightSelector && !object.userData.isLightHelper) {
      return false;
    }

    // Check if parent hierarchy is visible
    let parent = object.parent;
    while (parent && parent !== this.scene) {
      if (!parent.visible) {
        return false;
      }
      parent = parent.parent;
    }

    // Light selectors and helpers are always selectable
    if (object.userData.isLightSelector || object.userData.isLightHelper) {
      return true;
    }

    // Only allow selection of specific object types
    const isSelectableType = 
      object instanceof THREE.Mesh ||
      object instanceof THREE.Light ||
      (object instanceof THREE.Group && this.hasSelectableChildren(object));

    if (!isSelectableType) {
      return false;
    }

    // Exclude helper objects (like Blender)
    const excludedTypes = [
      'GridHelper',
      'AxesHelper',
      'ArrowHelper',
      'BoxHelper',
      'PlaneHelper',
      'PointLightHelper',
      'DirectionalLightHelper',
      'SpotLightHelper',
      'HemisphereLightHelper',
      'CameraHelper'
    ];

    if (excludedTypes.includes(object.type)) {
      return false;
    }

    // Exclude light targets (they're just Object3D positioning helpers)
    if (object.userData.isLightTarget) {
      return false;
    }

    // Exclude unnamed Object3D (usually helpers or targets)
    if (object.type === 'Object3D' && (!object.name || object.name === '')) {
      return false;
    }

    // Exclude objects with specific names or userData flags
    if (object.userData.selectable === false) {
      return false;
    }

    // Exclude transform controls and their children
    if (object.userData.isTransformControls || 
        object.name?.includes('TransformControls') ||
        object.parent?.userData?.isTransformControls) {
      return false;
    }

    // Exclude outline and selection helpers
    if (object.name?.includes('outline') || 
        object.name?.includes('selection') ||
        object.userData.isSelectionHelper) {
      return false;
    }

    return true;
  }

  /**
   * Check if a group has any selectable children
   */
  private hasSelectableChildren(group: THREE.Group): boolean {
    for (const child of group.children) {
      if (this.isObjectSelectable(child)) {
        return true;
      }
    }
    return false;
  }

  public setSelectedMesh(mesh: THREE.Mesh | null): void {
    console.log(`🔍 setSelectedMesh called with:`, mesh?.name || 'null');
    console.log(`🔍 Current selected mesh:`, this.selectedMesh?.name || 'null');
    
    if (mesh === null) {
      console.trace(`🔍 setSelectedMesh(null) called from:`); // Show stack trace for null calls
    }
    
    // Clear previous selection highlight
    if (this.selectedMesh) {
      this.outlineManager.deselectMesh(this.selectedMesh);
    }

    this.selectedMesh = mesh;

    // Add selection highlight with Blender-like outline
    if (this.selectedMesh) {
      this.outlineManager.selectMesh(this.selectedMesh);
      
      // DISABLED: Legacy transform controls to prevent conflicts
      // try {
      //   if (this.sceneTransformControls && typeof this.sceneTransformControls.attachToMesh === 'function') {
      //     this.sceneTransformControls.attachToMesh(this.selectedMesh);
      //     this.sceneTransformControls.setEnabled(true);
      //   }
      // } catch (error) {
      //   console.warn('Failed to attach legacy transform controls:', error);
      // }

      // Auto-enable and attach new non-interfering transform controls
      if (this.nonInterferingTransformControls) {
        console.log(`🎯 Attempting to attach transform controls to: ${this.selectedMesh.name || 'Unnamed mesh'}`);
        this.nonInterferingTransformControls.setEnabled(true);
        this.nonInterferingTransformControls.attachToMesh(this.selectedMesh);
        console.log(`🎯 Transform controls enabled: ${this.nonInterferingTransformControls.isEnabled()}`);
        console.log(`🎯 Transform controls visible: ${this.nonInterferingTransformControls.isVisible()}`);
      } else {
        console.warn('⚠️ NonInterferingTransformControls not available');
      }
    } else {
      // DISABLED: Legacy transform controls to prevent conflicts
      // try {
      //   if (this.sceneTransformControls && typeof this.sceneTransformControls.attachToMesh === 'function') {
      //     this.sceneTransformControls.attachToMesh(null);
      //     this.sceneTransformControls.setEnabled(false);
      //   }
      // } catch (error) {
      //   console.warn('Failed to detach legacy transform controls:', error);
      // }

      // Detach new transform controls
      if (this.nonInterferingTransformControls) {
        this.nonInterferingTransformControls.detach();
      }
    }

    // Notify callbacks
    this.selectionCallbacks.forEach(callback => callback(mesh));
  }

  public onMeshSelected(callback: (mesh: THREE.Mesh | null) => void): void {
    this.selectionCallbacks.push(callback);
  }

  public getSelectedMesh(): THREE.Mesh | null {
    return this.selectedMesh;
  }

  // Tone mapping methods
  public setToneMapping(toneMapping: THREE.ToneMapping): void {
    this.renderer.toneMapping = toneMapping;
  }

  public setExposure(exposure: number): void {
    this.renderer.toneMappingExposure = exposure;
  }

  public getToneMapping(): THREE.ToneMapping {
    return this.renderer.toneMapping;
  }

  public getExposure(): number {
    return this.renderer.toneMappingExposure;
  }

  // Camera clipping adjustment methods
  public adjustCameraClipping(near?: number, far?: number): void {
    if (near !== undefined) {
      this.camera.near = near;
    }
    if (far !== undefined) {
      this.camera.far = far;
    }
    this.camera.updateProjectionMatrix();
  }

  public adjustControlsDistance(minDistance?: number, maxDistance?: number): void {
    if (minDistance !== undefined) {
      this.controls.minDistance = minDistance;
    }
    if (maxDistance !== undefined) {
      this.controls.maxDistance = maxDistance;
    }
  }

  // Auto-adjust clipping based on scene bounds
  public autoAdjustClipping(): void {
    const box = new THREE.Box3().setFromObject(this.scene);
    if (!box.isEmpty()) {
      const size = box.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      
      // Set near clipping to a very small value relative to scene size
      const nearClip = Math.max(0.001, maxDimension * 0.001);
      const farClip = Math.max(1000, maxDimension * 100);
      
      this.adjustCameraClipping(nearClip, farClip);
      this.adjustControlsDistance(maxDimension * 0.01, maxDimension * 10);
      
    }
  }

  // Utility methods
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getControls(): OrbitControls {
    return this.controls;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  // Outline customization methods
  public setOutlineColor(color: THREE.ColorRepresentation): void {
    this.outlineManager.setOutlineColor(color);
  }

  public setOutlineThickness(thickness: number): void {
    this.outlineManager.setOutlineThickness(thickness);
  }

  public setOutlineAlpha(alpha: number): void {
    this.outlineManager.setOutlineAlpha(alpha);
  }

  // Manager getters
  public getShadowCatcher(): ShadowCatcher {
    return this.shadowCatcher;
  }

  public getBackgroundManager(): BackgroundManager {
    return this.backgroundManager;
  }

  public getCameraManager(): CameraManager {
    return this.cameraManager;
  }

  public getEnhancedShadowCatcher(): EnhancedShadowCatcher {
    return this.enhancedShadowCatcher;
  }

  public getPrimitiveManager(): PrimitiveManager {
    return this.primitiveManager;
  }

  public getObjectSettingsManager(): ObjectSettingsManager {
    return this.objectSettingsManager;
  }

  public getEnhancedRenderingManager(): EnhancedRenderingManager {
    return this.enhancedRenderingManager;
  }

  public getSceneTransformControls(): SceneTransformControls {
    return this.sceneTransformControls;
  }

  // Camera switching
  public switchCamera(camera: THREE.Camera): void {
    console.log('🎥 RenderingEngine: switchCamera called for:', camera.name || camera.type);
    
    this.camera = camera as THREE.PerspectiveCamera;
    
    // Update camera aspect ratio for proper rendering
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight;
      camera.updateProjectionMatrix();
    } else if (camera instanceof THREE.OrthographicCamera) {
      const aspect = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight;
      const frustumSize = 10;
      camera.left = frustumSize * aspect / -2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = frustumSize / -2;
      camera.updateProjectionMatrix();
    }
    
    // Update controls object reference
    if (this.controls) {
      (this.controls as any).object = camera;
      this.controls.update();
      
      // For OrbitControls, ensure target is properly maintained
      if ('target' in this.controls && camera.position) {
        // Calculate direction from camera and maintain a reasonable target distance
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const targetDistance = 5; // Default target distance
        (this.controls as any).target.copy(camera.position).add(direction.multiplyScalar(targetDistance));
        this.controls.update();
      }
    }
    
    // Update outline manager camera reference
    if (this.outlineManager) {
      (this.outlineManager as any).camera = camera;
    }
    
    // Update post-processing camera
    if (this.enhancedRenderingManager) {
      const postProcessing = this.enhancedRenderingManager.getPostProcessingManager();
      if (postProcessing) {
        postProcessing.updateCamera(camera);
      }
    }
    
    console.log('✅ RenderingEngine: Camera switched successfully');
  }

  // Non-interfering transform controls methods
  public enableTransformControls(): void {
    if (this.nonInterferingTransformControls) {
      this.nonInterferingTransformControls.setEnabled(true);
      console.log('✅ Transform controls enabled');
    } else {
      console.warn('⚠️ Transform controls not available');
    }
  }

  public disableTransformControls(): void {
    if (this.nonInterferingTransformControls) {
      this.nonInterferingTransformControls.setEnabled(false);
      console.log('⚠️ Transform controls disabled');
    }
  }

  public isTransformControlsEnabled(): boolean {
    return this.nonInterferingTransformControls?.isEnabled() ?? false;
  }

  public attachTransformControls(mesh: THREE.Mesh | null): void {
    if (this.nonInterferingTransformControls) {
      this.nonInterferingTransformControls.attachToMesh(mesh);
    }
  }

  public detachTransformControls(): void {
    if (this.nonInterferingTransformControls) {
      this.nonInterferingTransformControls.detach();
    }
  }

  public setTransformMode(mode: 'translate' | 'rotate' | 'scale'): void {
    if (this.nonInterferingTransformControls) {
      this.nonInterferingTransformControls.setMode(mode);
    }
  }

  public getTransformMode(): 'translate' | 'rotate' | 'scale' {
    return this.nonInterferingTransformControls?.getMode() ?? 'translate';
  }

  public getNonInterferingTransformControls(): NonInterferingTransformControls | null {
    return this.nonInterferingTransformControls;
  }

  /**
   * Set an object as selectable or non-selectable (Blender-style)
   */
  public setObjectSelectable(object: THREE.Object3D, selectable: boolean): void {
    object.userData.selectable = selectable;
    console.log(`🎯 Object "${object.name || 'Unnamed'}" selectability set to: ${selectable}`);
  }

  /**
   * Hide an object from selection and rendering (Blender-style)
   */
  public hideObject(object: THREE.Object3D): void {
    object.visible = false;
    // If this was the selected object, deselect it
    if (this.selectedMesh === object) {
      this.setSelectedMesh(null);
    }
    console.log(`👁️ Object "${object.name || 'Unnamed'}" hidden`);
  }

  /**
   * Show a hidden object (Blender-style)
   */
  public showObject(object: THREE.Object3D): void {
    object.visible = true;
    console.log(`👁️ Object "${object.name || 'Unnamed'}" shown`);
  }

  /**
   * Toggle object visibility (Blender-style)
   */
  public toggleObjectVisibility(object: THREE.Object3D): void {
    if (object.visible) {
      this.hideObject(object);
    } else {
      this.showObject(object);
    }
  }

  /**
   * Get all selectable objects in the scene (public method)
   */
  public getAllSelectableObjects(): THREE.Object3D[] {
    return this.getSelectableObjects();
  }

  /**
   * Select next object in scene (Blender-style Tab navigation)
   */
  public selectNextObject(): void {
    const selectableObjects = this.getSelectableObjects();
    if (selectableObjects.length === 0) return;

    const currentIndex = this.selectedMesh ? selectableObjects.indexOf(this.selectedMesh) : -1;
    const nextIndex = (currentIndex + 1) % selectableObjects.length;
    
    this.setSelectedMesh(selectableObjects[nextIndex] as THREE.Mesh);
  }

  /**
   * Select previous object in scene (Blender-style Shift+Tab navigation)
   */
  public selectPreviousObject(): void {
    const selectableObjects = this.getSelectableObjects();
    if (selectableObjects.length === 0) return;

    const currentIndex = this.selectedMesh ? selectableObjects.indexOf(this.selectedMesh) : -1;
    const prevIndex = currentIndex <= 0 ? selectableObjects.length - 1 : currentIndex - 1;
    
    this.setSelectedMesh(selectableObjects[prevIndex] as THREE.Mesh);
  }

  public setSelectedLight(lightId: string | null): void {
    this.selectedLightId = lightId;
    
    if (lightId) {
      console.log(`🔆 Selected light: ${lightId}`);
      
      // Auto-enable transform controls for the light helper
      if (this.nonInterferingTransformControls) {
        this.nonInterferingTransformControls.setEnabled(true);
        
        // Find the light helper object by lightId
        let lightHelper: THREE.Object3D | null = null;
        this.scene.traverse((object) => {
          if (object.userData.isLightHelper && object.userData.lightId === lightId) {
            lightHelper = object;
          }
        });
        
        if (lightHelper) {
          this.nonInterferingTransformControls.attachToMesh(lightHelper as THREE.Mesh);
          console.log(`🎮 Transform controls attached to light: ${lightId}`);
        }
      }
    } else {
      // Only detach transform controls if they're currently attached to a light
      // Don't detach if they're attached to a mesh
      if (this.nonInterferingTransformControls && 
          this.selectedLightId && 
          !this.selectedMesh) {
        this.nonInterferingTransformControls.detach();
        console.log(`🎮 Transform controls detached from light (no light selected)`);
      }
    }
    
    // Notify callbacks
    this.lightSelectionCallbacks.forEach(callback => callback(lightId));
  }

  public getSelectedLight(): string | null {
    return this.selectedLightId;
  }

  public onLightSelected(callback: (lightId: string | null) => void): void {
    this.lightSelectionCallbacks.push(callback);
  }
}
