import * as THREE from 'three';

export interface ShadowCatcherSettings {
  enabled: boolean;
  size: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  material: {
    type: 'shadow' | 'standard';
    color: THREE.Color;
    opacity: number;
    metalness: number;
    roughness: number;
    transparent: boolean;
  };
  shadows: {
    castShadow: boolean;
    receiveShadow: boolean;
  };
  visibility: {
    camera: boolean;
    viewport: boolean;
    render: boolean;
  };
}

/**
 * Enhanced Shadow Catcher with full material controls
 * Similar to professional 3D software like Blender and Cinema 4D
 */
export class EnhancedShadowCatcher {
  private plane!: THREE.Mesh;
  private scene: THREE.Scene;
  private settings: ShadowCatcherSettings;
  private onSettingsChange?: (settings: ShadowCatcherSettings) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Default settings
    this.settings = {
      enabled: true,
      size: 10,
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
      material: {
        type: 'shadow',
        color: new THREE.Color(0x000000),
        opacity: 0.3,
        metalness: 0.0,
        roughness: 1.0,
        transparent: true,
      },
      shadows: {
        castShadow: false,
        receiveShadow: true,
      },
      visibility: {
        camera: true,
        viewport: true,
        render: true,
      },
    };

    this.createShadowCatcher();
    this.updatePosition();
  }

  private createShadowCatcher(): void {
    // Create geometry
    const geometry = new THREE.PlaneGeometry(this.settings.size, this.settings.size);
    
    // Create material based on settings
    const material = this.createMaterial();

    // Create mesh
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.name = 'enhancedShadowCatcher';
    this.plane.position.copy(this.settings.position);
    this.plane.rotation.copy(this.settings.rotation);
    this.plane.castShadow = this.settings.shadows.castShadow;
    this.plane.receiveShadow = this.settings.shadows.receiveShadow;
    this.plane.visible = this.settings.enabled && this.settings.visibility.viewport;

    // Add to scene
    this.scene.add(this.plane);
  }

  private createMaterial(): THREE.Material {
    if (this.settings.material.type === 'shadow') {
      return new THREE.ShadowMaterial({
        color: this.settings.material.color,
        opacity: this.settings.material.opacity,
        transparent: this.settings.material.transparent,
      });
    } else {
      return new THREE.MeshPhysicalMaterial({
        color: this.settings.material.color,
        opacity: this.settings.material.opacity,
        transparent: this.settings.material.transparent,
        metalness: this.settings.material.metalness,
        roughness: this.settings.material.roughness,
      });
    }
  }

  /**
   * Update shadow catcher position based on scene bounds
   */
  public updatePosition(): void {
    if (!this.settings.enabled) return;

    // Calculate scene bounds excluding the shadow catcher itself
    const box = new THREE.Box3();
    const objects: THREE.Object3D[] = [];

    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && 
          child !== this.plane && 
          child.name !== 'enhancedShadowCatcher' &&
          child.visible) {
        objects.push(child);
      }
    });

    if (objects.length === 0) {
      // No objects, position at origin
      this.plane.position.copy(this.settings.position);
      return;
    }

    // Calculate bounding box of all visible meshes
    box.setFromObject(this.scene);
    
    // Position plane slightly below the lowest point
    const offset = 0.01;
    const newY = box.min.y - offset;
    
    // Update position while keeping x and z from settings
    this.plane.position.set(
      this.settings.position.x,
      newY,
      this.settings.position.z
    );

    // Adjust plane size based on scene size if auto-sizing is enabled
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.z);
    const newSize = Math.max(this.settings.size, maxDimension * 1.5);
    
    if (Math.abs(newSize - this.settings.size) > 0.1) {
      this.updateSize(newSize);
    }
  }

  // Settings getters and setters
  public getSettings(): ShadowCatcherSettings {
    return JSON.parse(JSON.stringify(this.settings));
  }

  public updateSettings(updates: Partial<ShadowCatcherSettings>): void {
    // Deep merge settings
    this.settings = {
      ...this.settings,
      ...updates,
      material: { ...this.settings.material, ...updates.material },
      shadows: { ...this.settings.shadows, ...updates.shadows },
      visibility: { ...this.settings.visibility, ...updates.visibility },
    };

    this.applySettings();
    
    if (this.onSettingsChange) {
      this.onSettingsChange(this.settings);
    }
  }

  private applySettings(): void {
    if (!this.plane) return;

    // Update material
    if (this.plane.material instanceof THREE.Material) {
      this.plane.material.dispose();
    }
    this.plane.material = this.createMaterial();

    // Update transform
    this.plane.position.copy(this.settings.position);
    this.plane.rotation.copy(this.settings.rotation);

    // Update size
    this.updateSize(this.settings.size);

    // Update shadow properties
    this.plane.castShadow = this.settings.shadows.castShadow;
    this.plane.receiveShadow = this.settings.shadows.receiveShadow;

    // Update visibility
    this.plane.visible = this.settings.enabled && this.settings.visibility.viewport;
  }

  private updateSize(size: number): void {
    this.settings.size = size;
    
    // Update geometry
    this.plane.geometry.dispose();
    this.plane.geometry = new THREE.PlaneGeometry(size, size);
  }

  // Individual property methods for UI controls
  public setEnabled(enabled: boolean): void {
    this.updateSettings({ enabled });
  }

  public isEnabled(): boolean {
    return this.settings.enabled;
  }

  public setMaterialType(type: 'shadow' | 'standard'): void {
    this.updateSettings({ material: { ...this.settings.material, type } });
  }

  public getMaterialType(): 'shadow' | 'standard' {
    return this.settings.material.type;
  }

  public setColor(color: THREE.ColorRepresentation): void {
    const newColor = new THREE.Color(color);
    this.updateSettings({ material: { ...this.settings.material, color: newColor } });
  }

  public getColor(): THREE.Color {
    return this.settings.material.color.clone();
  }

  public setOpacity(opacity: number): void {
    this.updateSettings({ material: { ...this.settings.material, opacity: Math.max(0, Math.min(1, opacity)) } });
  }

  public getOpacity(): number {
    return this.settings.material.opacity;
  }

  public setMetalness(metalness: number): void {
    this.updateSettings({ material: { ...this.settings.material, metalness: Math.max(0, Math.min(1, metalness)) } });
  }

  public getMetalness(): number {
    return this.settings.material.metalness;
  }

  public setRoughness(roughness: number): void {
    this.updateSettings({ material: { ...this.settings.material, roughness: Math.max(0, Math.min(1, roughness)) } });
  }

  public getRoughness(): number {
    return this.settings.material.roughness;
  }

  public setSize(size: number): void {
    this.updateSettings({ size: Math.max(0.1, size) });
  }

  public getSize(): number {
    return this.settings.size;
  }

  public setCastShadow(castShadow: boolean): void {
    this.updateSettings({ shadows: { ...this.settings.shadows, castShadow } });
  }

  public getCastShadow(): boolean {
    return this.settings.shadows.castShadow;
  }

  public setReceiveShadow(receiveShadow: boolean): void {
    this.updateSettings({ shadows: { ...this.settings.shadows, receiveShadow } });
  }

  public getReceiveShadow(): boolean {
    return this.settings.shadows.receiveShadow;
  }

  public setPosition(position: THREE.Vector3): void {
    this.updateSettings({ position: position.clone() });
  }

  public getPosition(): THREE.Vector3 {
    return this.settings.position.clone();
  }

  public setRotation(rotation: THREE.Euler): void {
    this.updateSettings({ rotation: rotation.clone() });
  }

  public getRotation(): THREE.Euler {
    return this.settings.rotation.clone();
  }

  /**
   * Get the shadow catcher mesh
   */
  public getMesh(): THREE.Mesh {
    return this.plane;
  }

  /**
   * Set callback for settings changes
   */
  public onSettingsChanged(callback: (settings: ShadowCatcherSettings) => void): void {
    this.onSettingsChange = callback;
  }

  /**
   * Dispose of shadow catcher resources
   */
  public dispose(): void {
    if (this.plane) {
      this.scene.remove(this.plane);
      this.plane.geometry.dispose();
      if (this.plane.material instanceof THREE.Material) {
        this.plane.material.dispose();
      }
    }
  }
}
