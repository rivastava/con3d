import * as THREE from 'three';

export interface CameraConfig {
  id: string;
  name: string;
  type: 'perspective' | 'orthographic';
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov?: number; // For perspective cameras
  zoom?: number; // For orthographic cameras
  near: number;
  far: number;
  isActive: boolean;
  previewThumbnail?: string; // Base64 encoded thumbnail
}

/**
 * CameraManager handles multiple cameras in the scene
 * Professional camera system with save/load presets
 */
export class CameraManager {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private cameras: Map<string, THREE.Camera> = new Map();
  private cameraConfigs: Map<string, CameraConfig> = new Map();
  private activeCamera: THREE.Camera;
  private activeCameraId: string = '';
  private onCameraSwitchCallbacks: Array<(camera: THREE.Camera, config: CameraConfig) => void> = [];

  // Default cameras
  private static readonly DEFAULT_CAMERAS = [
    {
      id: 'perspective-main',
      name: 'Main View',
      type: 'perspective' as const,
      position: new THREE.Vector3(5, 5, 5),
      target: new THREE.Vector3(0, 0, 0),
      fov: 75,
      near: 0.1,
      far: 1000,
      isActive: true
    },
    {
      id: 'orthographic-front',
      name: 'Front View',
      type: 'orthographic' as const,
      position: new THREE.Vector3(0, 0, 15),
      target: new THREE.Vector3(0, 0, 0),
      zoom: 0.5,
      near: 0.1,
      far: 1000,
      isActive: false
    },
    {
      id: 'orthographic-top',
      name: 'Top View',
      type: 'orthographic' as const,
      position: new THREE.Vector3(0, 15, 0.01),
      target: new THREE.Vector3(0, 0, 0),
      zoom: 0.5,
      near: 0.1,
      far: 1000,
      isActive: false
    },
    {
      id: 'orthographic-side',
      name: 'Side View',
      type: 'orthographic' as const,
      position: new THREE.Vector3(15, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      zoom: 0.5,
      near: 0.1,
      far: 1000,
      isActive: false
    }
  ];

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, initialCamera?: THREE.Camera) {
    this.scene = scene;
    this.renderer = renderer;

    // Initialize with default cameras
    this.initializeDefaultCameras();

    // Set active camera
    if (initialCamera) {
      this.addCustomCamera('current-camera', 'Current Camera', initialCamera);
      this.setActiveCamera('current-camera');
    } else {
      this.setActiveCamera('perspective-main');
    }

    this.activeCamera = this.cameras.get(this.activeCameraId)!;
  }

  private initializeDefaultCameras(): void {
    console.log('CameraManager: initializing default cameras');
    CameraManager.DEFAULT_CAMERAS.forEach(config => {
      this.addCameraFromConfig(config);
      console.log('CameraManager: added camera', config.name);
    });
  }

  /**
   * Add camera from configuration
   */
  public addCameraFromConfig(config: Omit<CameraConfig, 'previewThumbnail'>): string {
    let camera: THREE.Camera;

    if (config.type === 'perspective') {
      camera = new THREE.PerspectiveCamera(
        config.fov || 75,
        this.renderer.domElement.width / this.renderer.domElement.height,
        config.near,
        config.far
      );
    } else {
      const aspect = this.renderer.domElement.width / this.renderer.domElement.height;
      const frustumSize = 10;
      const orthoCamera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        config.near,
        config.far
      );
      orthoCamera.zoom = config.zoom || 1;
      orthoCamera.updateProjectionMatrix();
      camera = orthoCamera;
    }

    camera.position.copy(config.position);
    camera.lookAt(config.target);
    camera.name = config.name;
    
    // Update projection matrix for all camera types
    if (camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera) {
      camera.updateProjectionMatrix();
    }

    const fullConfig: CameraConfig = {
      ...config,
      previewThumbnail: undefined
    };

    this.cameras.set(config.id, camera);
    this.cameraConfigs.set(config.id, fullConfig);

    return config.id;
  }

  /**
   * Add custom camera
   */
  public addCustomCamera(id: string, name: string, camera: THREE.Camera): string {
    camera.name = name;
    
    const config: CameraConfig = {
      id,
      name,
      type: camera instanceof THREE.PerspectiveCamera ? 'perspective' : 'orthographic',
      position: camera.position.clone(),
      target: new THREE.Vector3(0, 0, 0), // Calculate from lookAt
      fov: camera instanceof THREE.PerspectiveCamera ? camera.fov : undefined,
      zoom: camera instanceof THREE.OrthographicCamera ? camera.zoom : undefined,
      near: (camera as THREE.PerspectiveCamera | THREE.OrthographicCamera).near,
      far: (camera as THREE.PerspectiveCamera | THREE.OrthographicCamera).far,
      isActive: false
    };

    this.cameras.set(id, camera);
    this.cameraConfigs.set(id, config);

    return id;
  }

  /**
   * Create new camera at current position
   */
  public createCameraAtCurrentPosition(name: string, type: 'perspective' | 'orthographic' = 'perspective'): string {
    const id = `camera-${Date.now()}`;
    const position = this.activeCamera.position.clone();
    
    // Calculate target based on camera direction
    const direction = new THREE.Vector3();
    this.activeCamera.getWorldDirection(direction);
    const target = position.clone().add(direction.multiplyScalar(5));

    const config = {
      id,
      name,
      type,
      position,
      target,
      fov: type === 'perspective' ? 75 : undefined,
      zoom: type === 'orthographic' ? 1 : undefined,
      near: 0.1,
      far: 1000,
      isActive: false
    };

    return this.addCameraFromConfig(config);
  }

  /**
   * Set active camera
   */
  public setActiveCamera(id: string): boolean {
    const camera = this.cameras.get(id);
    const config = this.cameraConfigs.get(id);
    
    if (!camera || !config) {
      return false;
    }

    // Update previous active camera config
    if (this.activeCameraId) {
      const prevConfig = this.cameraConfigs.get(this.activeCameraId);
      if (prevConfig) {
        prevConfig.isActive = false;
      }
    }

    this.activeCamera = camera;
    this.activeCameraId = id;
    config.isActive = true;

    // Update renderer aspect ratio
    this.updateCameraAspect(camera);

    // Notify callbacks
    this.onCameraSwitchCallbacks.forEach(callback => {
      callback(camera, config);
    });

    return true;
  }

  /**
   * Get active camera
   */
  public getActiveCamera(): THREE.Camera {
    return this.activeCamera;
  }

  /**
   * Get active camera config
   */
  public getActiveCameraConfig(): CameraConfig | undefined {
    return this.cameraConfigs.get(this.activeCameraId);
  }

  /**
   * Get active camera ID
   */
  public getActiveCameraId(): string {
    return this.activeCameraId;
  }

  /**
   * Get specific camera by ID
   */
  public getCamera(id: string): THREE.Camera | undefined {
    return this.cameras.get(id);
  }

  /**
   * Get camera config by ID
   */
  public getCameraConfig(id: string): CameraConfig | undefined {
    return this.cameraConfigs.get(id);
  }

  /**
   * Get all cameras
   */
  public getAllCameras(): { camera: THREE.Camera; config: CameraConfig }[] {
    const result: { camera: THREE.Camera; config: CameraConfig }[] = [];
    
    console.log('CameraManager: getAllCameras called, cameras count:', this.cameras.size);
    
    this.cameras.forEach((camera, id) => {
      const config = this.cameraConfigs.get(id);
      if (config) {
        result.push({ camera, config });
      }
    });

    console.log('CameraManager: returning', result.length, 'cameras');
    return result;
  }

  /**
   * Update camera configuration
   */
  public updateCameraConfig(id: string, updates: Partial<CameraConfig>): boolean {
    const camera = this.cameras.get(id);
    const config = this.cameraConfigs.get(id);
    
    if (!camera || !config) {
      return false;
    }

    // Update config
    Object.assign(config, updates);

    // Update camera properties
    if (updates.position) {
      camera.position.copy(updates.position);
    }
    
    if (updates.target) {
      camera.lookAt(updates.target);
    }

    if (camera instanceof THREE.PerspectiveCamera && updates.fov) {
      camera.fov = updates.fov;
      camera.updateProjectionMatrix();
    }

    if (camera instanceof THREE.OrthographicCamera && updates.zoom !== undefined) {
      camera.zoom = updates.zoom;
      camera.updateProjectionMatrix();
    }

    if (updates.near !== undefined) {
      (camera as THREE.PerspectiveCamera | THREE.OrthographicCamera).near = updates.near;
      if (camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera) {
        camera.updateProjectionMatrix();
      }
    }

    if (updates.far !== undefined) {
      (camera as THREE.PerspectiveCamera | THREE.OrthographicCamera).far = updates.far;
      if (camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera) {
        camera.updateProjectionMatrix();
      }
    }

    if (updates.name) {
      camera.name = updates.name;
    }

    return true;
  }

  /**
   * Delete camera
   */
  public deleteCamera(id: string): boolean {
    if (id === this.activeCameraId) {
      return false; // Cannot delete active camera
    }

    const camera = this.cameras.get(id);
    if (camera) {
      this.cameras.delete(id);
      this.cameraConfigs.delete(id);
      return true;
    }

    return false;
  }

  /**
   * Generate thumbnail for camera
   */
  public generateThumbnail(id: string, width: number = 128, height: number = 96): string | null {
    const camera = this.cameras.get(id);
    const config = this.cameraConfigs.get(id);
    
    if (!camera || !config) {
      return null;
    }

    // Store current state
    const currentCamera = this.activeCamera;
    const originalSize = this.renderer.getSize(new THREE.Vector2());

    try {
      // Set temporary camera and size
      this.renderer.setSize(width, height, false);
      this.updateCameraAspect(camera);

      // Render to canvas
      this.renderer.render(this.scene, camera);

      // Get image data
      const canvas = this.renderer.domElement;
      const thumbnail = canvas.toDataURL('image/png');

      // Update config with thumbnail
      config.previewThumbnail = thumbnail;

      return thumbnail;
    } catch (error) {
      console.warn('Failed to generate camera thumbnail:', error);
      return null;
    } finally {
      // Restore original state
      this.renderer.setSize(originalSize.x, originalSize.y, false);
      this.updateCameraAspect(currentCamera);
    }
  }

  /**
   * Generate preview thumbnail for camera
   */
  public async generatePreview(cameraId: string, width: number = 120, height: number = 90): Promise<string> {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      return '';
    }

    // Create temporary render target
    const tempTarget = new THREE.WebGLRenderTarget(width, height);
    
    // Save current state
    const originalTarget = this.renderer.getRenderTarget();
    const originalSize = this.renderer.getSize(new THREE.Vector2());
    
    try {
      // Render to temp target
      this.renderer.setRenderTarget(tempTarget);
      this.renderer.setSize(width, height);
      this.renderer.render(this.scene, camera);
      
      // Read pixels
      const pixels = new Uint8Array(width * height * 4);
      this.renderer.readRenderTargetPixels(tempTarget, 0, 0, width, height, pixels);
      
      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      
      const imageData = ctx.createImageData(width, height);
      
      // Flip Y coordinate (WebGL renders upside down)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIndex = ((height - y - 1) * width + x) * 4;
          const dstIndex = (y * width + x) * 4;
          imageData.data[dstIndex] = pixels[srcIndex];
          imageData.data[dstIndex + 1] = pixels[srcIndex + 1];
          imageData.data[dstIndex + 2] = pixels[srcIndex + 2];
          imageData.data[dstIndex + 3] = pixels[srcIndex + 3];
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Return as data URL
      return canvas.toDataURL('image/png');
      
    } finally {
      // Restore state
      this.renderer.setRenderTarget(originalTarget);
      this.renderer.setSize(originalSize.x, originalSize.y);
      tempTarget.dispose();
    }
  }

  /**
   * Update camera aspect ratio
   */
  private updateCameraAspect(camera: THREE.Camera): void {
    const size = this.renderer.getSize(new THREE.Vector2());
    const aspect = size.x / size.y;

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    } else if (camera instanceof THREE.OrthographicCamera) {
      const frustumSize = 10;
      camera.left = frustumSize * aspect / -2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = frustumSize / -2;
      camera.updateProjectionMatrix();
    }
  }

  /**
   * Handle window resize
   */
  public handleResize(): void {
    this.updateCameraAspect(this.activeCamera);
  }

  /**
   * Add camera switch callback
   */
  public onCameraSwitch(callback: (camera: THREE.Camera, config: CameraConfig) => void): void {
    this.onCameraSwitchCallbacks.push(callback);
  }

  /**
   * Frame object in current camera
   */
  public frameObject(object: THREE.Object3D, offset: number = 1.5): void {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDimension = Math.max(size.x, size.y, size.z);
    const distance = maxDimension * offset;

    if (this.activeCamera instanceof THREE.PerspectiveCamera) {
      const fov = this.activeCamera.fov * (Math.PI / 180);
      const cameraDistance = distance / (2 * Math.tan(fov / 2));
      
      this.activeCamera.position.copy(center);
      this.activeCamera.position.z += cameraDistance;
      this.activeCamera.lookAt(center);
    } else if (this.activeCamera instanceof THREE.OrthographicCamera) {
      this.activeCamera.zoom = 10 / maxDimension;
      this.activeCamera.position.copy(center);
      this.activeCamera.position.z += distance;
      this.activeCamera.lookAt(center);
      this.activeCamera.updateProjectionMatrix();
    }

    // Update config
    const config = this.cameraConfigs.get(this.activeCameraId);
    if (config) {
      config.position = this.activeCamera.position.clone();
      config.target = center.clone();
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.cameras.clear();
    this.cameraConfigs.clear();
    this.onCameraSwitchCallbacks = [];
  }
}
