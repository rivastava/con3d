import * as THREE from 'three';

export interface ObjectSettings {
  // Basic info
  id: string;
  name: string;
  type: 'mesh' | 'light' | 'camera' | 'primitive' | 'imported';
  
  // Transform
  transform: {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    locked: {
      position: boolean;
      rotation: boolean;
      scale: boolean;
    };
  };
  
  // Visibility and rendering
  visibility: {
    camera: boolean;      // Visible to camera
    viewport: boolean;    // Visible in viewport
    render: boolean;      // Appears in final render
    wireframe: boolean;   // Show as wireframe
  };
  
  // Shadow properties
  shadows: {
    castShadow: boolean;
    receiveShadow: boolean;
    shadowBias: number;
    shadowNormalBias: number;
    shadowRadius: number;
    shadowMapSize: number;
  };
  
  // Material override
  materialOverride: {
    enabled: boolean;
    color: THREE.Color;
    opacity: number;
    metalness: number;
    roughness: number;
    emissive: THREE.Color;
    emissiveIntensity: number;
    transparent: boolean;
  };
  
  // Animation and physics
  animation: {
    enabled: boolean;
    autoRotate: boolean;
    rotationSpeed: THREE.Vector3;
  };
  
  // Selection and interaction
  selection: {
    selectable: boolean;
    highlighted: boolean;
    outlineColor: THREE.Color;
    outlineThickness: number;
  };
  
  // Custom properties (for extensions)
  customProperties: { [key: string]: any };
}

/**
 * ObjectSettingsManager handles per-object settings similar to Blender's Properties panel
 */
export class ObjectSettingsManager {
  private scene: THREE.Scene;
  private objectSettings: Map<string, ObjectSettings> = new Map();
  private onSettingsChangeCallbacks: Array<(id: string, settings: ObjectSettings) => void> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Register an object for settings management
   */
  public registerObject(object: THREE.Object3D, type: ObjectSettings['type'] = 'mesh'): string {
    const id = object.userData.id || this.generateId();
    object.userData.id = id;
    
    if (!this.objectSettings.has(id)) {
      const settings = this.createDefaultSettings(id, object.name || `Object_${id}`, type);
      this.objectSettings.set(id, settings);
      this.applySettingsToObject(object, settings);
    }
    
    return id;
  }

  private generateId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createDefaultSettings(id: string, name: string, type: ObjectSettings['type']): ObjectSettings {
    return {
      id,
      name,
      type,
      transform: {
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        locked: {
          position: false,
          rotation: false,
          scale: false,
        },
      },
      visibility: {
        camera: true,
        viewport: true,
        render: true,
        wireframe: false,
      },
      shadows: {
        castShadow: true,
        receiveShadow: true,
        shadowBias: 0,
        shadowNormalBias: 0,
        shadowRadius: 1,
        shadowMapSize: 512,
      },
      materialOverride: {
        enabled: false,
        color: new THREE.Color(0xffffff),
        opacity: 1.0,
        metalness: 0.0,
        roughness: 0.5,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0.0,
        transparent: false,
      },
      animation: {
        enabled: false,
        autoRotate: false,
        rotationSpeed: new THREE.Vector3(0, 0.01, 0),
      },
      selection: {
        selectable: true,
        highlighted: false,
        outlineColor: new THREE.Color(0xff6600),
        outlineThickness: 0.02,
      },
      customProperties: {},
    };
  }

  /**
   * Update object settings
   */
  public updateSettings(id: string, updates: Partial<ObjectSettings>): boolean {
    const settings = this.objectSettings.get(id);
    if (!settings) return false;

    // Deep merge updates
    const newSettings: ObjectSettings = {
      ...settings,
      ...updates,
      transform: { ...settings.transform, ...updates.transform },
      visibility: { ...settings.visibility, ...updates.visibility },
      shadows: { ...settings.shadows, ...updates.shadows },
      materialOverride: { ...settings.materialOverride, ...updates.materialOverride },
      animation: { ...settings.animation, ...updates.animation },
      selection: { ...settings.selection, ...updates.selection },
      customProperties: { ...settings.customProperties, ...updates.customProperties },
    };

    this.objectSettings.set(id, newSettings);

    // Apply to object
    const object = this.findObjectById(id);
    if (object) {
      this.applySettingsToObject(object, newSettings);
    }

    // Notify callbacks
    this.onSettingsChangeCallbacks.forEach(callback => callback(id, newSettings));

    return true;
  }

  private findObjectById(id: string): THREE.Object3D | null {
    let foundObject: THREE.Object3D | null = null;
    
    this.scene.traverse((object) => {
      if (object.userData.id === id) {
        foundObject = object;
      }
    });

    return foundObject;
  }

  private applySettingsToObject(object: THREE.Object3D, settings: ObjectSettings): void {
    // Apply transform (if not locked)
    if (!settings.transform.locked.position) {
      object.position.copy(settings.transform.position);
    }
    if (!settings.transform.locked.rotation) {
      object.rotation.copy(settings.transform.rotation);
    }
    if (!settings.transform.locked.scale) {
      object.scale.copy(settings.transform.scale);
    }

    // Apply visibility
    object.visible = settings.visibility.viewport;

    // Apply shadow settings (if it's a mesh)
    if (object instanceof THREE.Mesh) {
      object.castShadow = settings.shadows.castShadow;
      object.receiveShadow = settings.shadows.receiveShadow;

      // Apply wireframe
      if (object.material instanceof THREE.Material) {
        (object.material as any).wireframe = settings.visibility.wireframe;
      }

      // Apply material override if enabled
      if (settings.materialOverride.enabled) {
        this.applyMaterialOverride(object, settings.materialOverride);
      }
    }

    // Apply selection properties
    object.userData.selectable = settings.selection.selectable;
  }

  private applyMaterialOverride(mesh: THREE.Mesh, override: ObjectSettings['materialOverride']): void {
    if (!override.enabled) return;

    // Create or update override material
    let overrideMaterial: THREE.Material;

    if (mesh.userData.originalMaterial) {
      overrideMaterial = mesh.userData.overrideMaterial;
    } else {
      // Store original material
      mesh.userData.originalMaterial = mesh.material;
      
      // Create override material
      overrideMaterial = new THREE.MeshPhysicalMaterial({
        color: override.color,
        opacity: override.opacity,
        metalness: override.metalness,
        roughness: override.roughness,
        emissive: override.emissive,
        emissiveIntensity: override.emissiveIntensity,
        transparent: override.transparent,
      });
      
      mesh.userData.overrideMaterial = overrideMaterial;
    }

    // Update override material properties
    if (overrideMaterial instanceof THREE.MeshPhysicalMaterial) {
      overrideMaterial.color = override.color;
      overrideMaterial.opacity = override.opacity;
      overrideMaterial.metalness = override.metalness;
      overrideMaterial.roughness = override.roughness;
      overrideMaterial.emissive = override.emissive;
      overrideMaterial.emissiveIntensity = override.emissiveIntensity;
      overrideMaterial.transparent = override.transparent;
    }

    mesh.material = overrideMaterial;
  }

  /**
   * Remove material override and restore original
   */
  public removeMaterialOverride(id: string): boolean {
    const object = this.findObjectById(id);
    if (!object || !(object instanceof THREE.Mesh)) return false;

    if (object.userData.originalMaterial) {
      // Dispose override material
      if (object.userData.overrideMaterial instanceof THREE.Material) {
        object.userData.overrideMaterial.dispose();
      }

      // Restore original
      object.material = object.userData.originalMaterial;
      delete object.userData.originalMaterial;
      delete object.userData.overrideMaterial;

      // Update settings
      this.updateSettings(id, {
        materialOverride: { ...this.getSettings(id)?.materialOverride!, enabled: false }
      });
    }

    return true;
  }

  /**
   * Get object settings
   */
  public getSettings(id: string): ObjectSettings | undefined {
    return this.objectSettings.get(id);
  }

  /**
   * Get all registered objects
   */
  public getAllObjects(): { id: string; settings: ObjectSettings; object: THREE.Object3D | null }[] {
    const result: { id: string; settings: ObjectSettings; object: THREE.Object3D | null }[] = [];

    this.objectSettings.forEach((settings, id) => {
      const object = this.findObjectById(id);
      result.push({ id, settings, object });
    });

    return result;
  }

  /**
   * Remove object from management
   */
  public unregisterObject(id: string): boolean {
    const settings = this.objectSettings.get(id);
    if (!settings) return false;

    // Clean up override materials
    this.removeMaterialOverride(id);

    this.objectSettings.delete(id);
    return true;
  }

  /**
   * Update object from its current state (sync settings with object)
   */
  public syncFromObject(id: string): boolean {
    const object = this.findObjectById(id);
    const settings = this.objectSettings.get(id);
    
    if (!object || !settings) return false;

    // Update transform in settings
    settings.transform.position.copy(object.position);
    settings.transform.rotation.copy(object.rotation);
    settings.transform.scale.copy(object.scale);

    // Update visibility
    settings.visibility.viewport = object.visible;

    // Update shadow settings for meshes
    if (object instanceof THREE.Mesh) {
      settings.shadows.castShadow = object.castShadow;
      settings.shadows.receiveShadow = object.receiveShadow;
    }

    this.objectSettings.set(id, settings);
    return true;
  }

  /**
   * Animation update loop
   */
  public update(deltaTime: number): void {
    this.objectSettings.forEach((settings, id) => {
      if (settings.animation.enabled && settings.animation.autoRotate) {
        const object = this.findObjectById(id);
        if (object && !settings.transform.locked.rotation) {
          object.rotation.x += settings.animation.rotationSpeed.x * deltaTime;
          object.rotation.y += settings.animation.rotationSpeed.y * deltaTime;
          object.rotation.z += settings.animation.rotationSpeed.z * deltaTime;
          
          // Sync back to settings
          settings.transform.rotation.copy(object.rotation);
        }
      }
    });
  }

  /**
   * Register callback for settings changes
   */
  public onSettingsChange(callback: (id: string, settings: ObjectSettings) => void): void {
    this.onSettingsChangeCallbacks.push(callback);
  }

  /**
   * Get objects by type
   */
  public getObjectsByType(type: ObjectSettings['type']): { id: string; settings: ObjectSettings; object: THREE.Object3D | null }[] {
    return this.getAllObjects().filter(item => item.settings.type === type);
  }

  /**
   * Dispose all managed objects
   */
  public dispose(): void {
    // Clean up override materials
    this.objectSettings.forEach((_, id) => {
      this.removeMaterialOverride(id);
    });

    this.objectSettings.clear();
    this.onSettingsChangeCallbacks.length = 0;
  }
}
