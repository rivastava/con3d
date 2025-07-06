import * as THREE from 'three';

export type PrimitiveType = 
  | 'plane' 
  | 'cube' 
  | 'sphere' 
  | 'cylinder' 
  | 'cone' 
  | 'torus' 
  | 'icosphere'
  | 'suzanne'; // Blender monkey head equivalent

export interface PrimitiveConfig {
  type: PrimitiveType;
  name: string;
  // Transform
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  // Geometry parameters
  parameters: {
    [key: string]: number;
  };
  // Material
  material: {
    type: 'physical' | 'standard' | 'basic';
    color: THREE.Color;
    metalness: number;
    roughness: number;
    opacity: number;
    transparent: boolean;
    emissive: THREE.Color;
    emissiveIntensity: number;
  };
  // Shadow and visibility
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
 * PrimitiveManager handles creation and management of basic 3D primitives
 * Inspired by Blender's Add Mesh menu
 */
export class PrimitiveManager {
  private scene: THREE.Scene;
  private primitives: Map<string, THREE.Mesh> = new Map();
  private configs: Map<string, PrimitiveConfig> = new Map();
  private onPrimitiveAddedCallbacks: Array<(mesh: THREE.Mesh, config: PrimitiveConfig) => void> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Create a new primitive
   */
  public createPrimitive(type: PrimitiveType, name?: string): string {
    const id = `primitive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const primiteName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${id.slice(-4)}`;
    
    const config = this.getDefaultConfig(type, primiteName);
    const mesh = this.createMeshFromConfig(config);
    mesh.name = primiteName;
    mesh.userData.id = id;
    mesh.userData.type = 'primitive';
    mesh.userData.primitiveType = type;

    this.primitives.set(id, mesh);
    this.configs.set(id, config);
    this.scene.add(mesh);

    // Notify callbacks
    this.onPrimitiveAddedCallbacks.forEach(callback => callback(mesh, config));

    return id;
  }

  private getDefaultConfig(type: PrimitiveType, name: string): PrimitiveConfig {
    const baseConfig: PrimitiveConfig = {
      type,
      name,
      position: new THREE.Vector3(0, 1, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      parameters: {},
      material: {
        type: 'physical',
        color: new THREE.Color(0x888888),
        metalness: 0.0,
        roughness: 0.5,
        opacity: 1.0,
        transparent: false,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0.0,
      },
      shadows: {
        castShadow: true,
        receiveShadow: true,
      },
      visibility: {
        camera: true,
        viewport: true,
        render: true,
      },
    };

    // Set type-specific parameters
    switch (type) {
      case 'plane':
        baseConfig.parameters = { width: 2, height: 2, widthSegments: 1, heightSegments: 1 };
        baseConfig.rotation.x = -Math.PI / 2; // Horizontal by default
        break;
      case 'cube':
        baseConfig.parameters = { width: 2, height: 2, depth: 2, widthSegments: 1, heightSegments: 1, depthSegments: 1 };
        break;
      case 'sphere':
        baseConfig.parameters = { radius: 1, widthSegments: 32, heightSegments: 16 };
        break;
      case 'cylinder':
        baseConfig.parameters = { radiusTop: 1, radiusBottom: 1, height: 2, radialSegments: 32, heightSegments: 1 };
        break;
      case 'cone':
        baseConfig.parameters = { radius: 1, height: 2, radialSegments: 32, heightSegments: 1 };
        break;
      case 'torus':
        baseConfig.parameters = { radius: 1, tube: 0.4, radialSegments: 16, tubularSegments: 100 };
        break;
      case 'icosphere':
        baseConfig.parameters = { radius: 1, detail: 2 };
        break;
      case 'suzanne':
        baseConfig.parameters = { scale: 1 }; // Monkey head doesn't have standard parameters
        break;
    }

    return baseConfig;
  }

  private createMeshFromConfig(config: PrimitiveConfig): THREE.Mesh {
    let geometry: THREE.BufferGeometry;

    switch (config.type) {
      case 'plane':
        geometry = new THREE.PlaneGeometry(
          config.parameters.width,
          config.parameters.height,
          config.parameters.widthSegments,
          config.parameters.heightSegments
        );
        break;
      case 'cube':
        geometry = new THREE.BoxGeometry(
          config.parameters.width,
          config.parameters.height,
          config.parameters.depth,
          config.parameters.widthSegments,
          config.parameters.heightSegments,
          config.parameters.depthSegments
        );
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(
          config.parameters.radius,
          config.parameters.widthSegments,
          config.parameters.heightSegments
        );
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          config.parameters.radiusTop,
          config.parameters.radiusBottom,
          config.parameters.height,
          config.parameters.radialSegments,
          config.parameters.heightSegments
        );
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(
          config.parameters.radius,
          config.parameters.height,
          config.parameters.radialSegments,
          config.parameters.heightSegments
        );
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(
          config.parameters.radius,
          config.parameters.tube,
          config.parameters.radialSegments,
          config.parameters.tubularSegments
        );
        break;
      case 'icosphere':
        geometry = new THREE.IcosahedronGeometry(
          config.parameters.radius,
          config.parameters.detail
        );
        break;
      case 'suzanne':
        // For now, use a more complex sphere as a placeholder for Suzanne
        geometry = new THREE.SphereGeometry(1, 16, 8);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const material = this.createMaterialFromConfig(config.material);
    const mesh = new THREE.Mesh(geometry, material);

    // Apply transform
    mesh.position.copy(config.position);
    mesh.rotation.copy(config.rotation);
    mesh.scale.copy(config.scale);

    // Apply shadow settings
    mesh.castShadow = config.shadows.castShadow;
    mesh.receiveShadow = config.shadows.receiveShadow;
    mesh.visible = config.visibility.viewport;

    return mesh;
  }

  private createMaterialFromConfig(materialConfig: PrimitiveConfig['material']): THREE.Material {
    switch (materialConfig.type) {
      case 'physical':
        return new THREE.MeshPhysicalMaterial({
          color: materialConfig.color,
          metalness: materialConfig.metalness,
          roughness: materialConfig.roughness,
          opacity: materialConfig.opacity,
          transparent: materialConfig.transparent,
          emissive: materialConfig.emissive,
          emissiveIntensity: materialConfig.emissiveIntensity,
        });
      case 'standard':
        return new THREE.MeshStandardMaterial({
          color: materialConfig.color,
          metalness: materialConfig.metalness,
          roughness: materialConfig.roughness,
          opacity: materialConfig.opacity,
          transparent: materialConfig.transparent,
          emissive: materialConfig.emissive,
          emissiveIntensity: materialConfig.emissiveIntensity,
        });
      case 'basic':
        return new THREE.MeshBasicMaterial({
          color: materialConfig.color,
          opacity: materialConfig.opacity,
          transparent: materialConfig.transparent,
        });
      default:
        return new THREE.MeshPhysicalMaterial({ color: materialConfig.color });
    }
  }

  /**
   * Update primitive configuration
   */
  public updatePrimitive(id: string, updates: Partial<PrimitiveConfig>): boolean {
    const mesh = this.primitives.get(id);
    const config = this.configs.get(id);
    
    if (!mesh || !config) return false;

    // Update config
    const newConfig = {
      ...config,
      ...updates,
      parameters: { ...config.parameters, ...updates.parameters },
      material: { ...config.material, ...updates.material },
      shadows: { ...config.shadows, ...updates.shadows },
      visibility: { ...config.visibility, ...updates.visibility },
    };

    this.configs.set(id, newConfig);

    // Update mesh
    this.updateMeshFromConfig(mesh, newConfig);

    return true;
  }

  private updateMeshFromConfig(mesh: THREE.Mesh, config: PrimitiveConfig): void {
    // Update geometry if parameters changed
    mesh.geometry.dispose();
    mesh.geometry = this.createGeometryFromConfig(config);

    // Update material
    if (mesh.material instanceof THREE.Material) {
      mesh.material.dispose();
    }
    mesh.material = this.createMaterialFromConfig(config.material);

    // Update transform
    mesh.position.copy(config.position);
    mesh.rotation.copy(config.rotation);
    mesh.scale.copy(config.scale);

    // Update shadow settings
    mesh.castShadow = config.shadows.castShadow;
    mesh.receiveShadow = config.shadows.receiveShadow;
    mesh.visible = config.visibility.viewport;
  }

  private createGeometryFromConfig(config: PrimitiveConfig): THREE.BufferGeometry {
    // Same logic as createMeshFromConfig but just return geometry
    switch (config.type) {
      case 'plane':
        return new THREE.PlaneGeometry(
          config.parameters.width,
          config.parameters.height,
          config.parameters.widthSegments,
          config.parameters.heightSegments
        );
      case 'cube':
        return new THREE.BoxGeometry(
          config.parameters.width,
          config.parameters.height,
          config.parameters.depth,
          config.parameters.widthSegments,
          config.parameters.heightSegments,
          config.parameters.depthSegments
        );
      case 'sphere':
        return new THREE.SphereGeometry(
          config.parameters.radius,
          config.parameters.widthSegments,
          config.parameters.heightSegments
        );
      case 'cylinder':
        return new THREE.CylinderGeometry(
          config.parameters.radiusTop,
          config.parameters.radiusBottom,
          config.parameters.height,
          config.parameters.radialSegments,
          config.parameters.heightSegments
        );
      case 'cone':
        return new THREE.ConeGeometry(
          config.parameters.radius,
          config.parameters.height,
          config.parameters.radialSegments,
          config.parameters.heightSegments
        );
      case 'torus':
        return new THREE.TorusGeometry(
          config.parameters.radius,
          config.parameters.tube,
          config.parameters.radialSegments,
          config.parameters.tubularSegments
        );
      case 'icosphere':
        return new THREE.IcosahedronGeometry(
          config.parameters.radius,
          config.parameters.detail
        );
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  /**
   * Delete primitive
   */
  public deletePrimitive(id: string): boolean {
    const mesh = this.primitives.get(id);
    if (!mesh) return false;

    this.scene.remove(mesh);
    mesh.geometry.dispose();
    if (mesh.material instanceof THREE.Material) {
      mesh.material.dispose();
    }

    this.primitives.delete(id);
    this.configs.delete(id);

    return true;
  }

  /**
   * Get primitive mesh by ID
   */
  public getPrimitive(id: string): THREE.Mesh | undefined {
    return this.primitives.get(id);
  }

  /**
   * Get primitive config by ID
   */
  public getPrimitiveConfig(id: string): PrimitiveConfig | undefined {
    return this.configs.get(id);
  }

  /**
   * Get all primitives
   */
  public getAllPrimitives(): { id: string; mesh: THREE.Mesh; config: PrimitiveConfig }[] {
    const result: { id: string; mesh: THREE.Mesh; config: PrimitiveConfig }[] = [];
    
    this.primitives.forEach((mesh, id) => {
      const config = this.configs.get(id);
      if (config) {
        result.push({ id, mesh, config });
      }
    });

    return result;
  }

  /**
   * Get available primitive types
   */
  public getAvailableTypes(): PrimitiveType[] {
    return ['plane', 'cube', 'sphere', 'cylinder', 'cone', 'torus', 'icosphere'];
  }

  /**
   * Register callback for when primitive is added
   */
  public onPrimitiveAdded(callback: (mesh: THREE.Mesh, config: PrimitiveConfig) => void): void {
    this.onPrimitiveAddedCallbacks.push(callback);
  }

  /**
   * Dispose all primitives
   */
  public dispose(): void {
    this.primitives.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });

    this.primitives.clear();
    this.configs.clear();
    this.onPrimitiveAddedCallbacks.length = 0;
  }
}
