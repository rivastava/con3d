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

  // Selection system
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedMesh: THREE.Mesh | null = null;
  private selectionCallbacks: Array<(mesh: THREE.Mesh | null) => void> = [];

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
    
    // Dispose outline manager
    this.outlineManager.dispose();
    
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
  }

  private onMouseClick(event: MouseEvent): void {
    // Calculate mouse position in normalized device coordinates
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Perform raycasting
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    // Find the first mesh in the intersects
    let newSelectedMesh: THREE.Mesh | null = null;
    for (const intersect of intersects) {
      if (intersect.object instanceof THREE.Mesh) {
        newSelectedMesh = intersect.object;
        break;
      }
    }

    // Update selection
    this.setSelectedMesh(newSelectedMesh);
  }

  public setSelectedMesh(mesh: THREE.Mesh | null): void {
    // Clear previous selection highlight
    if (this.selectedMesh) {
      this.outlineManager.deselectMesh(this.selectedMesh);
    }

    this.selectedMesh = mesh;

    // Add selection highlight with Blender-like outline
    if (this.selectedMesh) {
      this.outlineManager.selectMesh(this.selectedMesh);
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

  // Camera switching
  public switchCamera(camera: THREE.Camera): void {
    this.camera = camera as THREE.PerspectiveCamera;
    
    // Update controls
    (this.controls as any).object = camera;
    this.controls.update();
    
    // Update outline manager camera reference
    (this.outlineManager as any).camera = camera;
  }
}
