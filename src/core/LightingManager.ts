import * as THREE from 'three';
import { LightConfig, LightParameters } from '@/types';

export class LightingManager {
  private scene: THREE.Scene;
  private lights: Map<string, THREE.Light> = new Map();
  private lightConfigs: Map<string, LightConfig> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Add default lighting setup
   */
  public addDefaultLights(): void {
    // Ambient light
    this.addLight({
      id: 'default-ambient',
      name: 'Ambient Light',
      type: 'hemisphere',
      parameters: {
        color: 0xffffff,
        intensity: 0.4
      },
      visible: true
    });

    // Main directional light
    this.addLight({
      id: 'default-main',
      name: 'Main Light',
      type: 'directional',
      parameters: {
        color: 0xffffff,
        intensity: 1.0,
        position: [10, 10, 5],
        target: [0, 0, 0],
        castShadow: true,
        shadowMapSize: 2048,
        shadowCamera: {
          near: 0.1,
          far: 50,
          left: -10,
          right: 10,
          top: 10,
          bottom: -10
        }
      },
      visible: true
    });

    // Fill light
    this.addLight({
      id: 'default-fill',
      name: 'Fill Light',
      type: 'directional',
      parameters: {
        color: 0xffffff,
        intensity: 0.3,
        position: [-5, 5, 10],
        target: [0, 0, 0]
      },
      visible: true
    });
  }

  /**
   * Add a light to the scene
   */
  public addLight(config: LightConfig): void {
    let light: THREE.Light;

    switch (config.type) {
      case 'directional':
        light = this.createDirectionalLight(config.parameters);
        break;
      case 'point':
        light = this.createPointLight(config.parameters);
        break;
      case 'spot':
        light = this.createSpotLight(config.parameters);
        break;
      case 'hemisphere':
        light = this.createHemisphereLight(config.parameters);
        break;
      case 'area':
        light = this.createAreaLight(config.parameters);
        break;
      default:
        throw new Error(`Unsupported light type: ${config.type}`);
    }

    light.name = config.name;
    light.visible = config.visible !== false;
    light.userData = { id: config.id, config };

    this.lights.set(config.id, light);
    this.lightConfigs.set(config.id, config);
    this.scene.add(light);

    // Add target helper for directional and spot lights
    if (light instanceof THREE.DirectionalLight || light instanceof THREE.SpotLight) {
      this.scene.add(light.target);
    }
  }

  private createDirectionalLight(params: LightParameters): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(
      params.color || 0xffffff,
      params.intensity || 1
    );

    if (params.position) {
      light.position.set(...params.position);
    }

    if (params.target) {
      light.target.position.set(...params.target);
    }

    if (params.castShadow) {
      light.castShadow = true;
      
      if (params.shadowMapSize) {
        light.shadow.mapSize.width = params.shadowMapSize;
        light.shadow.mapSize.height = params.shadowMapSize;
      }

      if (params.shadowCamera) {
        const { near, far, left, right, top, bottom } = params.shadowCamera;
        const shadowCamera = light.shadow.camera as THREE.OrthographicCamera;
        
        if (near !== undefined) shadowCamera.near = near;
        if (far !== undefined) shadowCamera.far = far;
        if (left !== undefined) shadowCamera.left = left;
        if (right !== undefined) shadowCamera.right = right;
        if (top !== undefined) shadowCamera.top = top;
        if (bottom !== undefined) shadowCamera.bottom = bottom;
        
        shadowCamera.updateProjectionMatrix();
      }
    }

    return light;
  }

  private createPointLight(params: LightParameters): THREE.PointLight {
    const light = new THREE.PointLight(
      params.color || 0xffffff,
      params.intensity || 1,
      params.distance || 0,
      params.decay || 2
    );

    if (params.position) {
      light.position.set(...params.position);
    }

    if (params.castShadow) {
      light.castShadow = true;
      
      if (params.shadowMapSize) {
        light.shadow.mapSize.width = params.shadowMapSize;
        light.shadow.mapSize.height = params.shadowMapSize;
      }
    }

    return light;
  }

  private createSpotLight(params: LightParameters): THREE.SpotLight {
    const light = new THREE.SpotLight(
      params.color || 0xffffff,
      params.intensity || 1,
      params.distance || 0,
      params.angle || Math.PI / 3,
      params.penumbra || 0,
      params.decay || 2
    );

    if (params.position) {
      light.position.set(...params.position);
    }

    if (params.target) {
      light.target.position.set(...params.target);
    }

    if (params.castShadow) {
      light.castShadow = true;
      
      if (params.shadowMapSize) {
        light.shadow.mapSize.width = params.shadowMapSize;
        light.shadow.mapSize.height = params.shadowMapSize;
      }
    }

    return light;
  }

  private createHemisphereLight(params: LightParameters): THREE.HemisphereLight {
    const light = new THREE.HemisphereLight(
      params.color || 0xffffff,
      0x444444, // Ground color
      params.intensity || 1
    );

    if (params.position) {
      light.position.set(...params.position);
    }

    return light;
  }

  private createAreaLight(params: LightParameters): THREE.RectAreaLight {
    const light = new THREE.RectAreaLight(
      params.color || 0xffffff,
      params.intensity || 1,
      params.width || 10,
      params.height || 10
    );

    if (params.position) {
      light.position.set(...params.position);
    }

    if (params.target) {
      light.lookAt(...params.target);
    }

    return light;
  }

  /**
   * Update light parameters
   */
  public updateLight(id: string, params: Partial<LightParameters>): void {
    const light = this.lights.get(id);
    const config = this.lightConfigs.get(id);
    
    if (!light || !config) {
      throw new Error(`Light with id ${id} not found`);
    }

    // Update the config
    Object.assign(config.parameters, params);

    // Update light properties
    if (params.color !== undefined) {
      light.color.set(params.color);
    }

    if (params.intensity !== undefined) {
      light.intensity = params.intensity;
    }

    if (params.position && 'position' in light) {
      light.position.set(...params.position);
    }

    // Type-specific updates
    if (light instanceof THREE.DirectionalLight || light instanceof THREE.SpotLight) {
      if (params.target) {
        light.target.position.set(...params.target);
      }
    }

    if (light instanceof THREE.PointLight) {
      if (params.distance !== undefined) {
        light.distance = params.distance;
      }
      if (params.decay !== undefined) {
        light.decay = params.decay;
      }
    }

    if (light instanceof THREE.SpotLight) {
      if (params.angle !== undefined) {
        light.angle = params.angle;
      }
      if (params.penumbra !== undefined) {
        light.penumbra = params.penumbra;
      }
      if (params.distance !== undefined) {
        light.distance = params.distance;
      }
      if (params.decay !== undefined) {
        light.decay = params.decay;
      }
    }

    if (light instanceof THREE.RectAreaLight) {
      if (params.width !== undefined) {
        light.width = params.width;
      }
      if (params.height !== undefined) {
        light.height = params.height;
      }
    }

    // Update shadow properties
    if (params.castShadow !== undefined && 'castShadow' in light) {
      light.castShadow = params.castShadow;
    }

    if (params.shadowMapSize && light.shadow) {
      light.shadow.mapSize.width = params.shadowMapSize;
      light.shadow.mapSize.height = params.shadowMapSize;
    }
  }

  /**
   * Remove light from scene
   */
  public removeLight(id: string): void {
    const light = this.lights.get(id);
    if (!light) {
      throw new Error(`Light with id ${id} not found`);
    }

    this.scene.remove(light);
    
    // Remove target if it exists
    if (light instanceof THREE.DirectionalLight || light instanceof THREE.SpotLight) {
      this.scene.remove(light.target);
    }

    // Dispose shadow map
    if (light.shadow) {
      light.shadow.dispose();
    }

    this.lights.delete(id);
    this.lightConfigs.delete(id);
  }

  /**
   * Get light by ID
   */
  public getLight(id: string): LightConfig | null {
    return this.lightConfigs.get(id) || null;
  }

  /**
   * Get all lights
   */
  public getAllLights(): LightConfig[] {
    return Array.from(this.lightConfigs.values());
  }

  /**
   * Get Three.js light object by ID
   */
  public getLightObject(id: string): THREE.Light | undefined {
    return this.lights.get(id);
  }

  /**
   * Set light visibility
   */
  public setLightVisibility(id: string, visible: boolean): void {
    const light = this.lights.get(id);
    if (light) {
      light.visible = visible;
    }
  }

  /**
   * Toggle shadows for all lights
   */
  public setShadowsEnabled(enabled: boolean): void {
    for (const light of this.lights.values()) {
      if ('castShadow' in light) {
        light.castShadow = enabled;
      }
    }
  }

  /**
   * Dispose all lights
   */
  public dispose(): void {
    for (const [id] of this.lights) {
      this.removeLight(id);
    }
  }
}
