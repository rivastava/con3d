import * as THREE from 'three';

export interface ModernLightConfig {
  id: string;
  name: string;
  type: 'ambient' | 'directional' | 'point' | 'spot' | 'area';
  light: THREE.Light;
  helper?: THREE.Object3D;
  emissiveMesh?: THREE.Mesh;
  visible: boolean;
  properties: {
    intensity: number;
    color: string;
    position?: THREE.Vector3;
    rotation?: THREE.Euler;
    distance?: number;
    angle?: number;
    penumbra?: number;
    decay?: number;
    width?: number;
    height?: number;
  };
}

/**
 * Modern, robust lighting system with proper helper management
 * Replaces the buggy light linking system with a clean, predictable approach
 */
export class ModernLightingSystem {
  private scene: THREE.Scene;
  private lights: Map<string, ModernLightConfig> = new Map();
  private lightIdCounter = 1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    console.log('🔥 ModernLightingSystem initialized');
  }

  /**
   * Create a new light with proper helper setup
   */
  public createLight(type: ModernLightConfig['type']): string {
    const id = `light_${type}_${this.lightIdCounter++}`;
    const name = `${type.charAt(0).toUpperCase() + type.slice(1)} Light ${this.lightIdCounter - 1}`;

    let light: THREE.Light;
    let helper: THREE.Object3D | undefined;
    let emissiveMesh: THREE.Mesh | undefined;

    const defaultProperties = this.getDefaultProperties(type);

    // Create the actual light
    switch (type) {
      case 'ambient':
        light = new THREE.AmbientLight(defaultProperties.color, defaultProperties.intensity);
        break;

      case 'directional': {
        const dirProps = defaultProperties as any;
        light = new THREE.DirectionalLight(dirProps.color, dirProps.intensity);
        light.position.copy(dirProps.position || new THREE.Vector3(5, 10, 5));
        light.castShadow = true;
        if (light.shadow) {
          light.shadow.mapSize.setScalar(2048);
          light.shadow.bias = -0.0001;
        }
        
        // Create helper
        helper = new THREE.DirectionalLightHelper(light as THREE.DirectionalLight, 1);
        helper.name = `${name}_helper`;
        break;
      }

      case 'point': {
        const pointProps = defaultProperties as any;
        light = new THREE.PointLight(
          pointProps.color,
          pointProps.intensity,
          pointProps.distance || 10,
          pointProps.decay || 2
        );
        light.position.copy(pointProps.position || new THREE.Vector3(0, 3, 0));
        light.castShadow = true;
        if (light.shadow) {
          light.shadow.mapSize.setScalar(1024);
        }
        
        // Create custom sphere helper
        const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({ 
          color: pointProps.color,
          transparent: true,
          opacity: 0.8
        });
        helper = new THREE.Mesh(sphereGeometry, sphereMaterial);
        helper.position.copy(light.position);
        helper.name = `${name}_helper`;
        break;
      }

      case 'spot': {
        const spotProps = defaultProperties as any;
        light = new THREE.SpotLight(
          spotProps.color,
          spotProps.intensity,
          spotProps.distance || 10,
          spotProps.angle || Math.PI / 6,
          spotProps.penumbra || 0.1,
          spotProps.decay || 2
        );
        light.position.copy(spotProps.position || new THREE.Vector3(0, 5, 0));
        light.castShadow = true;
        if (light.shadow) {
          light.shadow.mapSize.setScalar(1024);
        }
        
        // Create helper
        helper = new THREE.SpotLightHelper(light as THREE.SpotLight);
        helper.name = `${name}_helper`;
        break;
      }

      case 'area': {
        const areaProps = defaultProperties as any;
        light = new THREE.RectAreaLight(
          areaProps.color,
          areaProps.intensity,
          areaProps.width || 2,
          areaProps.height || 2
        );
        light.position.copy(areaProps.position || new THREE.Vector3(0, 3, 0));
        light.lookAt(0, 0, 0);
        
        // Create area light helper (wireframe)
        const areaGeometry = new THREE.PlaneGeometry(
          areaProps.width || 2,
          areaProps.height || 2
        );
        const wireframeMaterial = new THREE.MeshBasicMaterial({ 
          color: areaProps.color,
          wireframe: true,
          transparent: true,
          opacity: 0.6
        });
        helper = new THREE.Mesh(areaGeometry, wireframeMaterial);
        helper.position.copy(light.position);
        helper.rotation.copy(light.rotation);
        helper.name = `${name}_helper`;
        
        // Create emissive mesh for physical light appearance
        const emissiveGeometry = new THREE.PlaneGeometry(
          areaProps.width || 2,
          areaProps.height || 2
        );
        const emissiveMaterial = new THREE.MeshStandardMaterial({
          color: areaProps.color,
          emissive: areaProps.color,
          emissiveIntensity: Math.min(areaProps.intensity * 0.5, 2.0),
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        });
        emissiveMesh = new THREE.Mesh(emissiveGeometry, emissiveMaterial);
        emissiveMesh.position.copy(light.position);
        emissiveMesh.rotation.copy(light.rotation);
        emissiveMesh.name = `${name}_emissive`;
        break;
      }

      default:
        throw new Error(`Unsupported light type: ${type}`);
    }

    light.name = name;

    // Create light config
    const config: ModernLightConfig = {
      id,
      name,
      type,
      light,
      helper,
      emissiveMesh,
      visible: true,
      properties: defaultProperties
    };

    // Add everything to scene
    this.scene.add(light);
    if (helper) {
      this.scene.add(helper);
    }
    if (emissiveMesh) {
      this.scene.add(emissiveMesh);
    }

    // Store config
    this.lights.set(id, config);

    console.log(`✨ Created ${type} light:`, name);
    return id;
  }

  /**
   * Remove a light and all its associated objects
   */
  public removeLight(id: string): boolean {
    const config = this.lights.get(id);
    if (!config) return false;

    // Remove from scene
    this.scene.remove(config.light);
    if (config.helper) {
      this.scene.remove(config.helper);
    }
    if (config.emissiveMesh) {
      this.scene.remove(config.emissiveMesh);
    }

    // Remove from storage
    this.lights.delete(id);

    console.log(`🗑️ Removed light: ${config.name}`);
    return true;
  }

  /**
   * Toggle light visibility
   */
  public toggleLightVisibility(id: string): boolean {
    const config = this.lights.get(id);
    if (!config) return false;

    config.visible = !config.visible;
    config.light.visible = config.visible;
    
    if (config.helper) {
      config.helper.visible = config.visible;
    }
    if (config.emissiveMesh) {
      config.emissiveMesh.visible = config.visible;
    }

    console.log(`👁️ Toggled light visibility: ${config.name} -> ${config.visible}`);
    return true;
  }

  /**
   * Update light property
   */
  public updateLightProperty(id: string, property: string, value: any): boolean {
    const config = this.lights.get(id);
    if (!config) return false;

    const { light, helper, emissiveMesh } = config;

    // Update the property
    switch (property) {
      case 'intensity':
        light.intensity = value;
        config.properties.intensity = value;
        
        // Update emissive intensity for area lights
        if (emissiveMesh && emissiveMesh.material instanceof THREE.MeshStandardMaterial) {
          emissiveMesh.material.emissiveIntensity = Math.min(value * 0.5, 2.0);
        }
        break;

      case 'color':
        light.color.set(value);
        config.properties.color = value;
        
        // Update helper color
        if (helper && helper instanceof THREE.Mesh && helper.material instanceof THREE.MeshBasicMaterial) {
          helper.material.color.set(value);
        }
        
        // Update emissive color
        if (emissiveMesh && emissiveMesh.material instanceof THREE.MeshStandardMaterial) {
          emissiveMesh.material.color.set(value);
          emissiveMesh.material.emissive.set(value);
        }
        break;

      case 'position.x':
      case 'position.y':
      case 'position.z':
        if ('position' in light) {
          const axis = property.split('.')[1] as 'x' | 'y' | 'z';
          light.position[axis] = value;
          config.properties.position = config.properties.position || light.position.clone();
          config.properties.position[axis] = value;
          
          // Update helper position
          if (helper && 'position' in helper) {
            helper.position.copy(light.position);
          }
          
          // Update emissive mesh position
          if (emissiveMesh) {
            emissiveMesh.position.copy(light.position);
          }
        }
        break;

      case 'distance':
        if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
          light.distance = value;
          config.properties.distance = value;
        }
        break;

      case 'angle':
        if (light instanceof THREE.SpotLight) {
          light.angle = value;
          config.properties.angle = value;
          
          // Update spot light helper
          if (helper instanceof THREE.SpotLightHelper) {
            helper.update();
          }
        }
        break;

      case 'penumbra':
        if (light instanceof THREE.SpotLight) {
          light.penumbra = value;
          config.properties.penumbra = value;
        }
        break;

      case 'decay':
        if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
          light.decay = value;
          config.properties.decay = value;
        }
        break;

      default:
        console.warn(`Unknown property: ${property}`);
        return false;
    }

    // Update helpers that need manual updates
    if (helper instanceof THREE.SpotLightHelper || helper instanceof THREE.DirectionalLightHelper) {
      (helper as any).update();
    }

    console.log(`🔧 Updated light property: ${config.name}.${property} = ${value}`);
    return true;
  }

  /**
   * Get all lights
   */
  public getAllLights(): ModernLightConfig[] {
    return Array.from(this.lights.values());
  }

  /**
   * Get light by ID
   */
  public getLight(id: string): ModernLightConfig | undefined {
    return this.lights.get(id);
  }

  /**
   * Clear all lights
   */
  public clearAllLights(): void {
    for (const config of this.lights.values()) {
      this.scene.remove(config.light);
      if (config.helper) {
        this.scene.remove(config.helper);
      }
      if (config.emissiveMesh) {
        this.scene.remove(config.emissiveMesh);
      }
    }
    this.lights.clear();
    console.log('🧹 Cleared all lights');
  }

  /**
   * Get default properties for light type
   */
  private getDefaultProperties(type: ModernLightConfig['type']) {
    const defaults = {
      ambient: {
        intensity: 0.3,
        color: '#404040'
      },
      directional: {
        intensity: 1.0,
        color: '#ffffff',
        position: new THREE.Vector3(5, 10, 5)
      },
      point: {
        intensity: 1.0,
        color: '#ffffff',
        position: new THREE.Vector3(0, 3, 0),
        distance: 10,
        decay: 2
      },
      spot: {
        intensity: 1.0,
        color: '#ffffff',
        position: new THREE.Vector3(0, 5, 0),
        distance: 10,
        angle: Math.PI / 6,
        penumbra: 0.1,
        decay: 2
      },
      area: {
        intensity: 1.0,
        color: '#ffffff',
        position: new THREE.Vector3(0, 3, 0),
        width: 2,
        height: 2
      }
    };

    return defaults[type];
  }
}
