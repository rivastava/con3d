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
        helper.userData = {
          isLightHelper: true,
          lightId: id,
          lightType: 'directional',
          selectable: true
        };
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
        
        // Create enhanced point light helper with professional appearance
        const helperGroup = new THREE.Group();
        helperGroup.name = `${name}_helper`;
        helperGroup.userData = {
          isLightHelper: true,
          lightId: id,
          lightType: 'point',
          selectable: true
        };
        
        // Inner bright sphere (light source) - more prominent
        const innerGeometry = new THREE.SphereGeometry(0.08, 20, 10);
        const innerMaterial = new THREE.MeshBasicMaterial({ 
          color: pointProps.color,
          transparent: true,
          opacity: 0.9
        });
        const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
        innerSphere.userData = {
          isLightHelper: true,
          lightId: id,
          lightType: 'point',
          selectable: true
        };
        helperGroup.add(innerSphere);
        
        // Outer wireframe sphere (light range) - improved visibility
        const outerGeometry = new THREE.SphereGeometry(pointProps.distance || 10, 24, 12);
        const outerMaterial = new THREE.MeshBasicMaterial({ 
          color: pointProps.color,
          wireframe: true,
          transparent: true,
          opacity: 0.3
        });
        const outerSphere = new THREE.Mesh(outerGeometry, outerMaterial);
        outerSphere.userData = {
          isLightHelper: true,
          lightId: id,
          lightType: 'point',
          selectable: true
        };
        helperGroup.add(outerSphere);
        
        // Glow halo effect - larger and more subtle
        const glowGeometry = new THREE.SphereGeometry(0.15, 16, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
          color: pointProps.color,
          transparent: true,
          opacity: 0.4
        });
        const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
        glowSphere.userData = {
          isLightHelper: true,
          lightId: id,
          lightType: 'point',
          selectable: true
        };
        helperGroup.add(glowSphere);
        
        // Add cross-hair indicator for precise positioning
        const crossGeometry = new THREE.BufferGeometry();
        const crossVertices = new Float32Array([
          -0.2, 0, 0,  0.2, 0, 0,  // X axis
          0, -0.2, 0,  0, 0.2, 0,  // Y axis  
          0, 0, -0.2,  0, 0, 0.2   // Z axis
        ]);
        crossGeometry.setAttribute('position', new THREE.BufferAttribute(crossVertices, 3));
        const crossMaterial = new THREE.LineBasicMaterial({ 
          color: pointProps.color,
          transparent: true,
          opacity: 0.7
        });
        const crossLines = new THREE.LineSegments(crossGeometry, crossMaterial);
        helperGroup.add(crossLines);
        
        helper = helperGroup;
        helper.position.copy(light.position);
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
        
        // Create enhanced spot light helper with better visual feedback
        const helperGroup = new THREE.Group();
        helperGroup.name = `${name}_helper`;
        helperGroup.userData = {
          isLightHelper: true,
          lightId: id,
          lightType: 'spot',
          selectable: true
        };
        
        // Standard Three.js spot light helper for cone visualization
        const spotHelper = new THREE.SpotLightHelper(light as THREE.SpotLight);
        // Configure helper appearance if cone material is accessible
        if ((spotHelper as any).cone && (spotHelper as any).cone.material) {
          (spotHelper as any).cone.material.opacity = 0.6;
          (spotHelper as any).cone.material.transparent = true;
        }
        helperGroup.add(spotHelper);
        
        // Enhanced light source indicator with glow
        const sourceGeometry = new THREE.SphereGeometry(0.08, 16, 8);
        const sourceMaterial = new THREE.MeshBasicMaterial({ 
          color: spotProps.color,
          transparent: true,
          opacity: 0.9
        });
        const sourceSphere = new THREE.Mesh(sourceGeometry, sourceMaterial);
        sourceSphere.position.copy(light.position);
        sourceSphere.userData = {
          isLightHelper: true,
          lightId: id,
          lightType: 'spot',
          selectable: true
        };
        helperGroup.add(sourceSphere);
        
        // Glow halo around source
        const glowGeometry = new THREE.SphereGeometry(0.15, 12, 6);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
          color: spotProps.color,
          transparent: true,
          opacity: 0.4
        });
        const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
        glowSphere.position.copy(light.position);
        helperGroup.add(glowSphere);
        
        // Direction indicator line
        const lineGeometry = new THREE.BufferGeometry();
        const lineVertices = new Float32Array([
          0, 0, 0,  // Start at light position
          0, 0, -1  // Point in spotlight direction  
        ]);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(lineVertices, 3));
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: spotProps.color,
          transparent: true,
          opacity: 0.8
        });
        const directionLine = new THREE.Line(lineGeometry, lineMaterial);
        directionLine.position.copy(light.position);
        helperGroup.add(directionLine);
        
        helper = helperGroup;
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
        
        // Create enhanced area light helper group with professional appearance
        const helperGroup = new THREE.Group();
        helperGroup.name = `${name}_helper`;
        helperGroup.userData = {
          isLightHelper: true,
          lightId: id,
          lightType: 'area',
          selectable: true
        };
        
        // Main area plane with better visibility
        const areaGeometry = new THREE.PlaneGeometry(
          areaProps.width || 2,
          areaProps.height || 2
        );
        const planeMaterial = new THREE.MeshBasicMaterial({ 
          color: areaProps.color,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        const areaPlane = new THREE.Mesh(areaGeometry, planeMaterial);
        areaPlane.userData = {
          isLightHelper: true,
          lightId: id,
          lightType: 'area',
          selectable: true
        };
        helperGroup.add(areaPlane);
        
        // Enhanced border lines for better definition
        const borderGeometry = new THREE.EdgesGeometry(areaGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({ 
          color: areaProps.color,
          linewidth: 3,
          transparent: true,
          opacity: 0.9
        });
        const borderLines = new THREE.LineSegments(borderGeometry, borderMaterial);
        helperGroup.add(borderLines);
        
        // Corner indicators for easier manipulation
        const cornerSize = 0.1;
        const corners = [
          [-(areaProps.width || 2)/2, -(areaProps.height || 2)/2, 0],
          [(areaProps.width || 2)/2, -(areaProps.height || 2)/2, 0],
          [(areaProps.width || 2)/2, (areaProps.height || 2)/2, 0],
          [-(areaProps.width || 2)/2, (areaProps.height || 2)/2, 0]
        ];
        
        corners.forEach(([x, y, z]) => {
          const cornerGeometry = new THREE.SphereGeometry(cornerSize, 8, 6);
          const cornerMaterial = new THREE.MeshBasicMaterial({ 
            color: areaProps.color,
            transparent: true,
            opacity: 0.8
          });
          const cornerSphere = new THREE.Mesh(cornerGeometry, cornerMaterial);
          cornerSphere.position.set(x, y, z);
          helperGroup.add(cornerSphere);
        });
        
        // Direction indicator (normal vector)
        const arrowGeometry = new THREE.ConeGeometry(0.05, 0.3, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ 
          color: areaProps.color,
          transparent: true,
          opacity: 0.7
        });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.z = 0.2;
        helperGroup.add(arrow);
        helperGroup.add(borderLines);
        
        helper = helperGroup;
        helper.position.copy(light.position);
        helper.rotation.copy(light.rotation);
        
        // Create enhanced emissive mesh for physical light appearance
        const emissiveGeometry = new THREE.PlaneGeometry(
          areaProps.width || 2,
          areaProps.height || 2
        );
        const emissiveMaterial = new THREE.MeshStandardMaterial({
          color: areaProps.color,
          emissive: areaProps.color,
          emissiveIntensity: Math.min(areaProps.intensity * 0.3, 1.5),
          transparent: true,
          opacity: 0.9,
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
          emissiveMesh.material.emissiveIntensity = Math.min(value * 0.3, 1.5);
        }
        
        // Update helper visual feedback for intensity
        if (helper) {
          this.updateHelperIntensity(helper, config.type, value);
        }
        break;

      case 'color':
        light.color.set(value);
        config.properties.color = value;
        
        // Update helper colors
        if (helper) {
          this.updateHelperColor(helper, config.type, value);
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
          
          // For spot lights, update the source sphere position in the helper group
          if (config.type === 'spot' && helper instanceof THREE.Group) {
            const sourceSphere = helper.children.find(child => child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry);
            if (sourceSphere) {
              sourceSphere.position.copy(light.position);
            }
          }
        }
        break;

      case 'distance':
        if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
          light.distance = value;
          config.properties.distance = value;
          
          // Update point light outer sphere radius
          if (config.type === 'point' && helper instanceof THREE.Group) {
            const outerSphere = helper.children.find(child => 
              child instanceof THREE.Mesh && 
              child.material instanceof THREE.MeshBasicMaterial && 
              child.material.wireframe
            ) as THREE.Mesh;
            if (outerSphere) {
              helper.remove(outerSphere);
              const newOuterGeometry = new THREE.SphereGeometry(value, 16, 8);
              const newOuterSphere = new THREE.Mesh(newOuterGeometry, outerSphere.material);
              helper.add(newOuterSphere);
            }
          }
        }
        break;

      case 'angle':
        if (light instanceof THREE.SpotLight) {
          light.angle = value;
          config.properties.angle = value;
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
    if (helper instanceof THREE.Group) {
      const spotHelper = helper.children.find(child => child instanceof THREE.SpotLightHelper);
      if (spotHelper) {
        (spotHelper as THREE.SpotLightHelper).update();
      }
    } else if (helper instanceof THREE.SpotLightHelper || helper instanceof THREE.DirectionalLightHelper) {
      (helper as any).update();
    }

    console.log(`🔧 Updated light property: ${config.name}.${property} = ${value}`);
    return true;
  }

  /**
   * Update helper intensity visual feedback
   */
  private updateHelperIntensity(helper: THREE.Object3D, _lightType: string, intensity: number): void {
    const intensityScale = Math.max(0.3, Math.min(intensity * 0.5, 2.0));
    
    if (helper instanceof THREE.Group) {
      helper.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          // Update opacity based on intensity for visual feedback
          if (child.material.wireframe) {
            // Wireframe elements - subtle opacity change
            child.material.opacity = Math.max(0.2, Math.min(intensity * 0.3, 0.8));
          } else {
            // Solid elements - more pronounced opacity change  
            child.material.opacity = Math.max(0.4, Math.min(intensity * 0.6, 1.0));
            
            // Scale core light source elements
            if (child.geometry instanceof THREE.SphereGeometry && 
                child.geometry.parameters.radius < 0.5) {
              child.scale.setScalar(intensityScale);
            }
          }
        } else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
          // Update line opacity for wireframe helpers
          child.material.opacity = Math.max(0.3, Math.min(intensity * 0.5, 0.9));
        }
      });
    } else if (helper instanceof THREE.Mesh && helper.material instanceof THREE.MeshBasicMaterial) {
      // Single mesh helper
      helper.material.opacity = Math.max(0.4, Math.min(intensity * 0.6, 1.0));
      helper.scale.setScalar(intensityScale);
    }
  }

  /**
   * Update helper color
   */
  private updateHelperColor(helper: THREE.Object3D, _lightType: string, color: string): void {
    if (helper instanceof THREE.Group) {
      // Update all materials in the group
      helper.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.color.set(color);
        } else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
          child.material.color.set(color);
        }
      });
    } else if (helper instanceof THREE.Mesh && helper.material instanceof THREE.MeshBasicMaterial) {
      helper.material.color.set(color);
    }
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
