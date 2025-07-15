import * as THREE from 'three';
import { TransformControls as ThreeTransformControls } from 'three-stdlib';

export interface TransformControlsConfig {
  enabled?: boolean;
  mode?: 'translate' | 'rotate' | 'scale';
  space?: 'world' | 'local';
  size?: number;
  showX?: boolean;
  showY?: boolean;
  showZ?: boolean;
}

export class NonInterferingTransformControls {
  private transformControls: ThreeTransformControls | null = null;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private orbitControls: any;
  private selectedMesh: THREE.Mesh | null = null;
  private enabled: boolean = false;
  private config: TransformControlsConfig = {};
  
  // Event handlers
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;
  private keyUpHandler: ((event: KeyboardEvent) => void) | null = null;
  private onTransformCallback: ((mesh: THREE.Mesh) => void) | null = null;
  
  // State tracking
  private isDragging: boolean = false;
  private isDisposed: boolean = false;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    orbitControls: any,
    config: TransformControlsConfig = {}
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.orbitControls = orbitControls;
    this.config = {
      enabled: config.enabled ?? false,
      mode: config.mode ?? 'translate',
      space: config.space ?? 'world',
      size: config.size ?? 1.0,
      showX: config.showX ?? true,
      showY: config.showY ?? true,
      showZ: config.showZ ?? true,
      ...config
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  public initialize(): void {
    if (this.isDisposed || this.transformControls) {
      return; // Already initialized or disposed
    }

    try {
      console.log('🎮 Initializing non-interfering transform controls...');
      
      // Create transform controls
      this.transformControls = new ThreeTransformControls(this.camera, this.renderer.domElement);
      
      // Mark transform controls as non-selectable
      this.transformControls.userData = this.transformControls.userData || {};
      this.transformControls.userData.isTransformControls = true;
      this.transformControls.userData.selectable = false;
      this.transformControls.name = 'TransformControls';
      
      // Configure transform controls
      this.configureTransformControls();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Setup keyboard controls
      this.setupKeyboardControls();
      
      // Add to scene (but don't attach to any object yet)
      this.scene.add(this.transformControls);
      
      // Initially set to invisible until attached to a mesh
      this.transformControls.visible = false;
      
      this.enabled = true;
      console.log('✅ Transform controls initialized successfully');
      console.log(`🎯 Transform controls in scene: ${this.scene.children.includes(this.transformControls)}`);
      console.log(`🎯 Transform controls visible: ${this.transformControls.visible}`);
      console.log(`🎯 Transform controls enabled: ${this.enabled}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize transform controls:', error);
      this.cleanup();
    }
  }

  private configureTransformControls(): void {
    if (!this.transformControls) return;

    // Set basic properties
    this.transformControls.setMode(this.config.mode || 'translate');
    this.transformControls.setSize(this.config.size || 1.0);
    this.transformControls.setSpace(this.config.space || 'world');
    
    // Configure axis visibility using the correct API
    if (this.config.showX !== undefined) {
      (this.transformControls as any).showX = this.config.showX;
    }
    if (this.config.showY !== undefined) {
      (this.transformControls as any).showY = this.config.showY;
    }
    if (this.config.showZ !== undefined) {
      (this.transformControls as any).showZ = this.config.showZ;
    }
    
    // Set snap settings using any to bypass TypeScript restrictions
    (this.transformControls as any).translationSnap = null;
    (this.transformControls as any).rotationSnap = null;
    (this.transformControls as any).scaleSnap = null;
  }

  private setupEventListeners(): void {
    if (!this.transformControls) return;

    // Handle dragging state changes using any to bypass TypeScript restrictions
    (this.transformControls as any).addEventListener('dragging-changed', (event: any) => {
      this.isDragging = event.value;
      
      // Disable orbit controls during transformation
      if (this.orbitControls) {
        this.orbitControls.enabled = !event.value;
      }
    });

    // Handle object transformation using any to bypass TypeScript restrictions
    (this.transformControls as any).addEventListener('objectChange', () => {
      if (this.selectedMesh && this.onTransformCallback) {
        this.onTransformCallback(this.selectedMesh);
      }
    });
  }

  private setupKeyboardControls(): void {
    // Remove existing handlers if any
    this.removeKeyboardHandlers();

    // Keyboard handler for transform mode switching
    this.keyboardHandler = (event: KeyboardEvent) => {
      if (!this.enabled || !this.transformControls || this.isDragging) return;

      // Only handle if no input element is focused
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'w':
          event.preventDefault();
          this.setMode('translate');
          break;
        case 'e':
          event.preventDefault();
          this.setMode('rotate');
          break;
        case 'r':
          event.preventDefault();
          this.setMode('scale');
          break;
        case 'x':
          event.preventDefault();
          this.toggleSpace();
          break;
        case 'escape':
          event.preventDefault();
          this.detach();
          break;
      }
    };

    document.addEventListener('keydown', this.keyboardHandler);
  }

  private removeKeyboardHandlers(): void {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
    if (this.keyUpHandler) {
      document.removeEventListener('keyup', this.keyUpHandler);
      this.keyUpHandler = null;
    }
  }

  public setEnabled(enabled: boolean): void {
    if (this.isDisposed) return;

    if (enabled && !this.transformControls) {
      this.initialize();
    } else if (!enabled && this.transformControls) {
      this.setVisible(false);
      this.detach();
    }
    
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled && !this.isDisposed;
  }

  public attachToMesh(mesh: THREE.Mesh | null): void {
    if (this.isDisposed) return;

    try {
      this.selectedMesh = mesh;
      
      if (mesh) {
        // Ensure transform controls are initialized and enabled
        if (!this.transformControls) {
          this.initialize();
        }
        
        if (!this.enabled) {
          this.setEnabled(true);
        }
        
        if (this.transformControls) {
          this.transformControls.attach(mesh);
          this.setVisible(true);
          
          // Force update the transform controls to ensure they appear
          this.transformControls.updateMatrixWorld();
          
          console.log(`🎯 Transform controls attached to: ${mesh.name || 'Unnamed mesh'}`);
          console.log(`🎯 Transform controls visible: ${this.transformControls.visible}`);
          console.log(`🎯 Transform controls enabled: ${this.enabled}`);
        } else {
          console.warn('⚠️ Transform controls not initialized after attach attempt');
        }
      } else {
        this.detach();
      }
    } catch (error) {
      console.warn('⚠️ Failed to attach transform controls:', error);
    }
  }

  public detach(): void {
    if (this.transformControls) {
      console.log(`🎯 Transform controls detached`);
      console.trace(`🔍 Detach called from:`); // This will show the call stack
      this.transformControls.detach();
      this.setVisible(false);
    }
    this.selectedMesh = null;
  }

  public setMode(mode: 'translate' | 'rotate' | 'scale'): void {
    if (this.transformControls && this.enabled) {
      this.transformControls.setMode(mode);
      this.config.mode = mode;
      console.log(`🔧 Transform mode set to: ${mode}`);
    }
  }

  public getMode(): 'translate' | 'rotate' | 'scale' {
    return this.config.mode || 'translate';
  }

  public setSpace(space: 'world' | 'local'): void {
    if (this.transformControls && this.enabled) {
      this.transformControls.setSpace(space);
      this.config.space = space;
    }
  }

  public toggleSpace(): void {
    const currentSpace = this.config.space || 'world';
    const newSpace = currentSpace === 'world' ? 'local' : 'world';
    this.setSpace(newSpace);
    console.log(`🌐 Transform space toggled to: ${newSpace}`);
  }

  public setSize(size: number): void {
    if (this.transformControls && this.enabled) {
      this.transformControls.setSize(size);
      this.config.size = size;
    }
  }

  public setVisible(visible: boolean): void {
    if (this.transformControls) {
      this.transformControls.visible = visible;
      console.log(`🎯 Transform controls visibility set to: ${visible}`);
      console.log(`🎯 Transform controls actual visibility: ${this.transformControls.visible}`);
      console.log(`🎯 Transform controls attached object:`, (this.transformControls as any).object?.name || 'none');
    } else {
      console.warn('⚠️ Trying to set visibility but transform controls not initialized');
    }
  }

  public isVisible(): boolean {
    return this.transformControls?.visible ?? false;
  }

  public onTransform(callback: (mesh: THREE.Mesh) => void): void {
    this.onTransformCallback = callback;
  }

  public getSelectedMesh(): THREE.Mesh | null {
    return this.selectedMesh;
  }

  public updateConfig(config: Partial<TransformControlsConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.transformControls) {
      this.configureTransformControls();
    }
  }

  /**
   * Update controls after geometry has been modified (e.g., after applying transforms)
   */
  public updateAfterGeometryChange(): void {
    if (this.selectedMesh && this.transformControls) {
      // Force recalculation of mesh bounds
      if (this.selectedMesh.geometry) {
        this.selectedMesh.geometry.computeBoundingBox();
        this.selectedMesh.geometry.computeBoundingSphere();
      }
      
      // Update world matrix
      this.selectedMesh.updateMatrixWorld(true);
      
      // Refresh the gizmo position to match the updated geometry
      this.transformControls.updateMatrixWorld();
      
      console.log(`✓ Transform controls updated after geometry change for "${this.selectedMesh.name}"`);
      console.log(`🎯 Object position after apply: ${this.selectedMesh.position.x.toFixed(2)}, ${this.selectedMesh.position.y.toFixed(2)}, ${this.selectedMesh.position.z.toFixed(2)}`);
    }
  }

  private cleanup(): void {
    this.removeKeyboardHandlers();
    
    if (this.transformControls) {
      this.transformControls.detach();
      this.scene.remove(this.transformControls);
      this.transformControls.dispose();
      this.transformControls = null;
    }
    
    this.selectedMesh = null;
    this.enabled = false;
  }

  public dispose(): void {
    if (this.isDisposed) return;
    
    console.log('🗑️ Disposing transform controls...');
    this.cleanup();
    this.isDisposed = true;
  }
}
