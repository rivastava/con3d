import * as THREE from 'three';
import { TransformControls as ThreeTransformControls } from 'three-stdlib';

export class SceneTransformControls {
  private transformControls: ThreeTransformControls;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private orbitControls: any;
  private selectedMesh: THREE.Mesh | null = null;
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;
  private keyUpHandler: ((event: KeyboardEvent) => void) | null = null;
  private onTransformCallback: ((mesh: THREE.Mesh) => void) | null = null;
  private currentMode: 'translate' | 'rotate' | 'scale' = 'translate';
  private currentSpace: 'world' | 'local' = 'world';
  private currentSize: number = 1.0;
  private isDragging: boolean = false;
  private transformStartPosition?: THREE.Vector3;
  private transformStartRotation?: THREE.Euler;
  private transformStartScale?: THREE.Vector3;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    orbitControls: any
  ) {
    this.scene = scene;
    this.camera = camera;
    this.orbitControls = orbitControls;

    // Create transform controls with improved settings
    this.transformControls = new ThreeTransformControls(camera, renderer.domElement);
    this.setupTransformControls();
    this.setupKeyboardControls();
    this.scene.add(this.transformControls);
  }

  private setupTransformControls(): void {
    // Configure transform controls with professional-grade settings
    this.transformControls.setMode(this.currentMode);
    this.transformControls.setSize(this.currentSize);
    this.transformControls.setSpace(this.currentSpace);
    
    // Disable orbit controls when using transform controls
    (this.transformControls as any).addEventListener('dragging-changed', (event: any) => {
      this.isDragging = event.value;
      if (this.orbitControls) {
        this.orbitControls.enabled = !event.value;
      }
      
      // Store initial transform state when starting drag
      if (event.value && this.selectedMesh) {
        this.transformStartPosition = this.selectedMesh.position.clone();
        this.transformStartRotation = this.selectedMesh.rotation.clone();
        this.transformStartScale = this.selectedMesh.scale.clone();
      }
    });

    // Improved transform handling with better performance
    let lastUpdateTime = 0;
    (this.transformControls as any).addEventListener('change', () => {
      if (this.selectedMesh && this.onTransformCallback) {
        const now = performance.now();
        // Throttle updates to 60fps for smooth performance
        if (now - lastUpdateTime > 16) {
          this.onTransformCallback(this.selectedMesh);
          lastUpdateTime = now;
        }
      }
    });

    // Handle mouse events for professional feedback
    (this.transformControls as any).addEventListener('mouseDown', () => {
      if (this.selectedMesh) {
        this.addTransformFeedback();
      }
    });

    (this.transformControls as any).addEventListener('mouseUp', () => {
      if (this.selectedMesh) {
        this.removeTransformFeedback();
        // Final callback after transform is complete
        if (this.onTransformCallback) {
          this.onTransformCallback(this.selectedMesh);
        }
      }
    });

    // Initially hide the controls
    this.transformControls.visible = false;
  }

  private setupKeyboardControls(): void {
    // Clean up existing handlers first
    this.cleanupKeyboardControls();
    
    this.keyboardHandler = (event: KeyboardEvent) => {
      // Only handle keys when transform controls are active and visible
      if (!this.transformControls.visible || !this.selectedMesh) return;
      
      // Prevent handling if user is typing in an input
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Professional keyboard shortcuts (Blender/Maya style)
      switch (event.code) {
        case 'KeyG': // G for Grab/Translate
          event.preventDefault();
          this.setMode('translate');
          this.focusOnGizmo();
          break;
        case 'KeyR': // R for Rotate
          event.preventDefault();
          this.setMode('rotate');
          this.focusOnGizmo();
          break;
        case 'KeyS': // S for Scale
          event.preventDefault();
          this.setMode('scale');
          this.focusOnGizmo();
          break;
        case 'KeyX': // X for constraint to X-axis
          event.preventDefault();
          if (event.shiftKey) {
            this.constrainToAxes(['y', 'z']); // Shift+X constrains to YZ plane
          } else {
            this.constrainToAxis('x');
          }
          break;
        case 'KeyY': // Y for constraint to Y-axis
          event.preventDefault();
          if (event.shiftKey) {
            this.constrainToAxes(['x', 'z']); // Shift+Y constrains to XZ plane
          } else {
            this.constrainToAxis('y');
          }
          break;
        case 'KeyZ': // Z for constraint to Z-axis
          event.preventDefault();
          if (event.shiftKey) {
            this.constrainToAxes(['x', 'y']); // Shift+Z constrains to XY plane
          } else {
            this.constrainToAxis('z');
          }
          break;
        case 'Tab': // Tab to toggle between world and local space
          event.preventDefault();
          this.toggleSpace();
          break;
        case 'Escape': // Escape to deselect or cancel operation
          event.preventDefault();
          if (this.isDragging) {
            this.cancelTransform();
          } else {
            this.attachToMesh(null);
          }
          break;
        case 'Enter': // Enter to confirm transform
        case 'Space':
          if (this.isDragging) {
            event.preventDefault();
            this.confirmTransform();
          }
          break;
      }
    };

    this.keyUpHandler = (event: KeyboardEvent) => {
      // Handle key releases for axis constraints
      if (!this.transformControls.visible || !this.selectedMesh) return;
      
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      
      // Reset constraints when releasing axis keys
      if (['KeyX', 'KeyY', 'KeyZ'].includes(event.code) && !event.shiftKey) {
        this.removeAxisConstraints();
      }
    };

    // Add event listeners with proper options
    document.addEventListener('keydown', this.keyboardHandler, { passive: false });
    document.addEventListener('keyup', this.keyUpHandler, { passive: false });
  }

  private focusOnGizmo(): void {
    // Provide visual feedback that gizmo is active
    if (this.selectedMesh) {
      this.addTransformFeedback();
      // Auto-remove feedback after a short time if not dragging
      setTimeout(() => {
        if (!this.isDragging) {
          this.removeTransformFeedback();
        }
      }, 2000);
    }
  }

  private constrainToAxis(axis: 'x' | 'y' | 'z'): void {
    // Use the internal gizmo to show only the specified axis
    const gizmo = (this.transformControls as any).gizmo;
    if (gizmo) {
      // Hide all axes first
      this.hideAllAxes(gizmo);
      // Show only the specified axis
      this.showAxis(gizmo, axis);
    }
    this.addAxisConstraintFeedback(axis);
  }

  private constrainToAxes(axes: ('x' | 'y' | 'z')[]): void {
    // Use the internal gizmo to show only the specified axes (plane constraint)
    const gizmo = (this.transformControls as any).gizmo;
    if (gizmo) {
      // Hide all axes first
      this.hideAllAxes(gizmo);
      // Show only the specified axes
      axes.forEach(axis => this.showAxis(gizmo, axis));
    }
    this.addPlaneConstraintFeedback(axes);
  }

  private removeAxisConstraints(): void {
    // Show all axes again
    const gizmo = (this.transformControls as any).gizmo;
    if (gizmo) {
      this.showAxis(gizmo, 'x');
      this.showAxis(gizmo, 'y');
      this.showAxis(gizmo, 'z');
    }
    this.removeConstraintFeedback();
  }

  private hideAllAxes(gizmo: any): void {
    // Helper method to hide all gizmo axes
    if (gizmo.helper) {
      ['x', 'y', 'z'].forEach(axis => {
        if (gizmo.helper[axis]) {
          gizmo.helper[axis].visible = false;
        }
      });
    }
    if (gizmo.picker) {
      ['x', 'y', 'z'].forEach(axis => {
        if (gizmo.picker[axis]) {
          gizmo.picker[axis].visible = false;
        }
      });
    }
  }

  private showAxis(gizmo: any, axis: 'x' | 'y' | 'z'): void {
    // Helper method to show a specific gizmo axis
    if (gizmo.helper && gizmo.helper[axis]) {
      gizmo.helper[axis].visible = true;
    }
    if (gizmo.picker && gizmo.picker[axis]) {
      gizmo.picker[axis].visible = true;
    }
  }

  private toggleSpace(): void {
    const newSpace = this.currentSpace === 'world' ? 'local' : 'world';
    this.setSpace(newSpace);
    this.addSpaceFeedback(newSpace);
  }

  private cancelTransform(): void {
    // Restore original transform
    if (this.selectedMesh && this.transformStartPosition && this.transformStartRotation && this.transformStartScale) {
      this.selectedMesh.position.copy(this.transformStartPosition);
      this.selectedMesh.rotation.copy(this.transformStartRotation);
      this.selectedMesh.scale.copy(this.transformStartScale);
      
      if (this.onTransformCallback) {
        this.onTransformCallback(this.selectedMesh);
      }
    }
    this.removeTransformFeedback();
  }

  private confirmTransform(): void {
    // Transform is already applied, just clean up
    this.removeTransformFeedback();
  }

  private addAxisConstraintFeedback(axis: 'x' | 'y' | 'z'): void {
    const axisName = axis.toUpperCase();
    console.log(`Constrained to ${axisName}-axis`);
    // Could add on-screen text here
  }

  private addPlaneConstraintFeedback(axes: ('x' | 'y' | 'z')[]): void {
    const planeName = axes.join('').toUpperCase();
    console.log(`Constrained to ${planeName}-plane`);
    // Could add on-screen text here
  }

  private addSpaceFeedback(space: 'world' | 'local'): void {
    console.log(`Transform space: ${space}`);
    // Could add on-screen indicator here
  }

  private removeConstraintFeedback(): void {
    // Remove any constraint feedback UI elements
  }

  private cleanupKeyboardControls(): void {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
    if (this.keyUpHandler) {
      document.removeEventListener('keyup', this.keyUpHandler);
      this.keyUpHandler = null;
    }
  }

  private addTransformFeedback(): void {
    if (!this.selectedMesh) return;
    
    // Remove any existing feedback
    this.removeTransformFeedback();
    
    try {
      // Create professional-style outline feedback
      const edges = new THREE.EdgesGeometry(this.selectedMesh.geometry);
      const material = new THREE.LineBasicMaterial({ 
        color: 0xffff00, // Yellow highlight like Blender
        transparent: true,
        opacity: 0.8,
        linewidth: 2,
        depthTest: false, // Always render on top
        depthWrite: false
      });
      const wireframe = new THREE.LineSegments(edges, material);
      wireframe.name = 'transform-feedback';
      wireframe.renderOrder = 1000; // Render on top
      
      // Add pulsing animation for active feedback
      const startTime = Date.now();
      const animate = () => {
        if (this.selectedMesh?.getObjectByName('transform-feedback')) {
          const elapsed = (Date.now() - startTime) / 1000;
          const opacity = 0.5 + 0.3 * Math.sin(elapsed * 4); // Pulsing effect
          material.opacity = opacity;
          
          if (this.isDragging) {
            requestAnimationFrame(animate);
          }
        }
      };
      animate();
      
      this.selectedMesh.add(wireframe);
    } catch (error) {
      console.warn('Could not create transform feedback:', error);
    }
  }

  private removeTransformFeedback(): void {
    if (!this.selectedMesh) return;
    
    const feedback = this.selectedMesh.getObjectByName('transform-feedback');
    if (feedback) {
      this.selectedMesh.remove(feedback);
      // Dispose of geometry and material to prevent memory leaks
      if ((feedback as any).geometry) {
        (feedback as any).geometry.dispose();
      }
      if ((feedback as any).material) {
        (feedback as any).material.dispose();
      }
    }
  }

  public attachToMesh(mesh: THREE.Mesh | null): void {
    // Clean up previous selection
    if (this.selectedMesh) {
      this.removeTransformFeedback();
      this.transformControls.detach();
    }
    
    this.selectedMesh = mesh;
    
    if (mesh) {
      try {
        this.transformControls.attach(mesh);
        this.transformControls.visible = true;
        
        // Smart size calculation based on camera distance and object size
        const box = new THREE.Box3().setFromObject(mesh);
        if (!box.isEmpty()) {
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          // Calculate distance from camera to object
          const cameraDistance = this.camera.position.distanceTo(center);
          const maxDimension = Math.max(size.x, size.y, size.z);
          
          // Professional scaling: smaller gizmos for large objects, larger for small objects
          // Based on screen-space size rather than world-space size
          let scaleFactor = 1.0;
          if (maxDimension > 0 && cameraDistance > 0) {
            // Scale based on angular size (how big the object appears on screen)
            const angularSize = maxDimension / cameraDistance;
            scaleFactor = Math.max(0.5, Math.min(2.0, 1.0 / angularSize * 0.1));
          }
          
          this.currentSize = scaleFactor;
          this.transformControls.setSize(scaleFactor);
        }
        
        // Reset any axis constraints when attaching to new mesh
        this.removeAxisConstraints();
        
      } catch (error) {
        console.warn('Failed to attach transform controls:', error);
        this.selectedMesh = null;
        this.transformControls.visible = false;
      }
    } else {
      this.transformControls.detach();
      this.transformControls.visible = false;
      this.removeAxisConstraints();
    }
  }

  public setMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this.currentMode = mode;
    this.transformControls.setMode(mode);
    
    // Reset axis constraints when changing modes
    this.removeAxisConstraints();
    
    // Professional feedback
    console.log(`Transform mode: ${mode}`);
  }

  public setSpace(space: 'world' | 'local'): void {
    this.currentSpace = space;
    this.transformControls.setSpace(space);
  }

  public setSize(size: number): void {
    this.currentSize = size;
    this.transformControls.setSize(size);
  }

  public setEnabled(enabled: boolean): void {
    if (enabled && this.selectedMesh) {
      this.transformControls.visible = true;
      (this.transformControls as any).enabled = true;
    } else {
      this.transformControls.visible = false;
      (this.transformControls as any).enabled = false;
      if (!enabled) {
        this.transformControls.detach();
        this.removeTransformFeedback();
      }
    }
  }

  public onTransform(callback: (mesh: THREE.Mesh) => void): void {
    this.onTransformCallback = callback;
  }

  public dispose(): void {
    // Clean up keyboard listeners
    this.cleanupKeyboardControls();
    
    // Clean up transform feedback
    if (this.selectedMesh) {
      this.removeTransformFeedback();
    }
    
    // Detach from any object
    this.transformControls.detach();
    
    // Remove from scene
    this.scene.remove(this.transformControls);
    
    // Dispose transform controls
    this.transformControls.dispose();
    
    // Clear references
    this.selectedMesh = null;
    this.onTransformCallback = null;
  }

  public getControls(): ThreeTransformControls {
    return this.transformControls;
  }

  // Get current transform state for UI synchronization
  public getTransformState(): { mode: string; space: string; size: number; isDragging: boolean } {
    return {
      mode: this.currentMode,
      space: this.currentSpace,
      size: this.currentSize,
      isDragging: this.isDragging
    };
  }
}
