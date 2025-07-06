import * as THREE from 'three';

/**
 * ShadowCatcher manages an invisible plane that catches shadows
 * Automatically positions itself below the lowest point of scene objects
 */
export class ShadowCatcher {
  private plane!: THREE.Mesh; // Initialized in createShadowCatcher
  private scene: THREE.Scene;
  private enabled: boolean = true;
  private color: THREE.Color = new THREE.Color(0x000000);
  private opacity: number = 0.3;
  private size: number = 10;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createShadowCatcher();
    console.log('ShadowCatcher initialized:', { enabled: this.enabled, position: this.plane.position, visible: this.plane.visible });
  }

  private createShadowCatcher(): void {
    // Create geometry - large plane
    const geometry = new THREE.PlaneGeometry(this.size, this.size);
    
    // Create shadow catcher material
    const material = new THREE.ShadowMaterial({
      opacity: this.opacity,
      color: this.color,
      transparent: true
    });

    // Create mesh
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.name = 'shadowCatcher';
    this.plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.plane.receiveShadow = true;
    this.plane.visible = this.enabled;
    
    // Make sure it's positioned correctly initially
    this.plane.position.set(0, -0.01, 0);

    // Add to scene
    this.scene.add(this.plane);
    
    // Initial position update
    this.updatePosition();
  }

  /**
   * Update shadow catcher position based on scene bounds
   */
  public updatePosition(): void {
    if (!this.enabled) return;

    // Calculate scene bounds excluding the shadow catcher itself
    const box = new THREE.Box3();
    const objects: THREE.Object3D[] = [];

    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && 
          child !== this.plane && 
          child.name !== 'shadowCatcher' &&
          child.visible) {
        objects.push(child);
      }
    });

    if (objects.length === 0) {
      // No objects, position at origin
      this.plane.position.y = 0;
      return;
    }

    // Calculate bounding box of all visible meshes
    box.setFromObject(this.scene);
    
    // Position plane slightly below the lowest point
    const offset = 0.01; // Small offset to prevent z-fighting
    this.plane.position.y = box.min.y - offset;

    // Adjust plane size based on scene size
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.z);
    const newSize = Math.max(this.size, maxDimension * 1.5);
    
    if (Math.abs(newSize - this.size) > 0.1) {
      this.setSize(newSize);
    }
  }

  /**
   * Set shadow catcher visibility
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.plane.visible = enabled;
  }

  /**
   * Get shadow catcher visibility
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set shadow color
   */
  public setColor(color: THREE.ColorRepresentation): void {
    this.color.set(color);
    (this.plane.material as THREE.ShadowMaterial).color = this.color;
  }

  /**
   * Get shadow color
   */
  public getColor(): THREE.Color {
    return this.color.clone();
  }

  /**
   * Set shadow opacity
   */
  public setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
    (this.plane.material as THREE.ShadowMaterial).opacity = this.opacity;
  }

  /**
   * Get shadow opacity
   */
  public getOpacity(): number {
    return this.opacity;
  }

  /**
   * Set shadow catcher size
   */
  public setSize(size: number): void {
    this.size = size;
    
    // Update geometry
    this.plane.geometry.dispose();
    this.plane.geometry = new THREE.PlaneGeometry(size, size);
  }

  /**
   * Get shadow catcher size
   */
  public getSize(): number {
    return this.size;
  }

  /**
   * Set material type (shadow or standard)
   */
  public setMaterialType(type: 'shadow' | 'standard'): void {
    const oldMaterial = this.plane.material;
    
    if (type === 'shadow') {
      this.plane.material = new THREE.ShadowMaterial({
        opacity: this.opacity,
        color: this.color,
        transparent: true
      });
    } else {
      this.plane.material = new THREE.MeshLambertMaterial({
        color: this.color,
        opacity: this.opacity,
        transparent: this.opacity < 1
      });
    }

    // Dispose old material
    if (oldMaterial instanceof THREE.Material) {
      oldMaterial.dispose();
    }
  }

  /**
   * Get the shadow catcher mesh
   */
  public getMesh(): THREE.Mesh {
    return this.plane;
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
