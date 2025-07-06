import * as THREE from 'three';
import { RGBELoader } from 'three-stdlib';
import { RenderingEngine } from './RenderingEngine';
import { EnvironmentConfig, EnvironmentParameters } from '@/types';

export class EnvironmentManager {
  private renderingEngine: RenderingEngine;
  private currentEnvironment?: EnvironmentConfig;
  private envTextures: Map<string, THREE.Texture> = new Map();
  private rgbeLoader: RGBELoader;
  private pmremGenerator: THREE.PMREMGenerator;
  private environmentMap: THREE.Texture | null = null;
  private backgroundVisible: boolean = true;

  constructor(renderingEngine: RenderingEngine) {
    this.renderingEngine = renderingEngine;
    this.rgbeLoader = new RGBELoader();
    this.pmremGenerator = new THREE.PMREMGenerator(renderingEngine.getRenderer());
  }

  /**
   * Set default environment
   */
  public setDefaultEnvironment(): void {
    const config: EnvironmentConfig = {
      id: 'default',
      name: 'Default Environment',
      type: 'gradient',
      parameters: {
        topColor: 0x87CEEB, // Sky blue
        bottomColor: 0xFFFFFF, // White
        groundColor: 0x444444 // Dark gray
      }
    };

    this.setEnvironment(config);
  }

  /**
   * Set environment from configuration
   */
  public async setEnvironment(config: EnvironmentConfig): Promise<void> {
    // TODO: Use scene for environment setup
    // const scene = this.renderingEngine.getScene();

    switch (config.type) {
      case 'hdri':
        if (config.parameters.hdriUrl) {
          await this.setHDRI(config.parameters.hdriUrl, config.parameters);
        }
        break;

      case 'gradient':
        this.setGradientEnvironment(config.parameters);
        break;

      case 'color':
        this.setColorEnvironment(config.parameters);
        break;
    }

    // Add ground plane if specified
    if (config.parameters.groundColor !== undefined) {
      this.addGroundPlane(config.parameters);
    }

    this.currentEnvironment = config;
  }

  /**
   * Set HDRI environment
   */
  public async setHDRI(url: string, options: Partial<EnvironmentParameters> = {}): Promise<void> {
    try {
      let envTexture: THREE.Texture;

      // Check cache first
      if (this.envTextures.has(url)) {
        envTexture = this.envTextures.get(url)!;
      } else {
        // Load HDRI texture
        envTexture = await new Promise<THREE.Texture>((resolve, reject) => {
          this.rgbeLoader.load(
            url,
            (texture) => {
              // Generate PMREM for environment mapping
              const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
              texture.dispose();
              this.envTextures.set(url, envMap);
              resolve(envMap);
            },
            undefined,
            reject
          );
        });
      }

      const scene = this.renderingEngine.getScene();

      // Apply environment settings
      let finalTexture = envTexture;

      // Apply rotation if specified
      if (options.hdriRotation) {
        finalTexture = this.rotateEnvironmentTexture(envTexture, options.hdriRotation);
      }

      // Apply blur if specified
      if (options.hdriBlur) {
        finalTexture = this.blurEnvironmentTexture(envTexture, options.hdriBlur);
      }

      // Set environment and background
      scene.environment = finalTexture;
      this.environmentMap = finalTexture; // Store for background visibility control
      
      // Set background based on visibility state
      if (this.backgroundVisible) {
        scene.background = finalTexture;
      } else {
        scene.background = null;
      }

      // Apply intensity
      if (options.hdriIntensity !== undefined) {
        this.setEnvironmentIntensity(options.hdriIntensity);
      }

      this.environmentMap = finalTexture; // Store for background visibility control

    } catch (error) {
      console.error('Failed to load HDRI environment:', error);
      throw error;
    }
  }

  /**
   * Set gradient environment
   */
  private setGradientEnvironment(params: EnvironmentParameters): void {
    const scene = this.renderingEngine.getScene();
    
    // Create gradient texture
    const gradientTexture = this.createGradientTexture(
      params.topColor || 0x87CEEB,
      params.bottomColor || 0xFFFFFF
    );

    scene.background = gradientTexture;
    scene.environment = null; // No IBL for gradient
  }

  /**
   * Set solid color environment
   */
  private setColorEnvironment(params: EnvironmentParameters): void {
    const scene = this.renderingEngine.getScene();
    
    if (params.color !== undefined) {
      scene.background = new THREE.Color(params.color);
    }
    
    scene.environment = null; // No IBL for solid color
  }

  /**
   * Create gradient texture
   */
  private createGradientTexture(topColor: THREE.ColorRepresentation, bottomColor: THREE.ColorRepresentation): THREE.DataTexture {
    const size = 512;
    const data = new Uint8Array(size * size * 4);

    const colorTop = new THREE.Color(topColor);
    const colorBottom = new THREE.Color(bottomColor);

    for (let i = 0; i < size; i++) {
      const t = i / (size - 1);
      const color = colorTop.clone().lerp(colorBottom, t);
      
      for (let j = 0; j < size; j++) {
        const index = (i * size + j) * 4;
        data[index] = color.r * 255;     // R
        data[index + 1] = color.g * 255; // G
        data[index + 2] = color.b * 255; // B
        data[index + 3] = 255;           // A
      }
    }

    const texture = new THREE.DataTexture(data, size, size);
    texture.needsUpdate = true;
    texture.mapping = THREE.EquirectangularReflectionMapping;

    return texture;
  }

  /**
   * Add ground plane
   */
  private addGroundPlane(params: EnvironmentParameters): void {
    const scene = this.renderingEngine.getScene();
    
    // Remove existing ground
    const existingGround = scene.getObjectByName('ground-plane');
    if (existingGround) {
      scene.remove(existingGround);
    }

    if (params.groundColor === undefined) return;

    const geometry = new THREE.PlaneGeometry(
      params.groundSize || 100,
      params.groundSize || 100
    );
    
    const material = new THREE.MeshLambertMaterial({
      color: params.groundColor
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.name = 'ground-plane';
    ground.receiveShadow = params.groundReceiveShadow !== false;

    scene.add(ground);
  }

  /**
   * Rotate environment texture
   */
  private rotateEnvironmentTexture(texture: THREE.Texture, rotation: number): THREE.Texture {
    // Create a copy with rotation applied
    const rotatedTexture = texture.clone();
    rotatedTexture.rotation = rotation;
    return rotatedTexture;
  }

  /**
   * Blur environment texture
   */
  private blurEnvironmentTexture(texture: THREE.Texture, _blurAmount: number): THREE.Texture {
    // For now, return the original texture
    // In a full implementation, you would apply a blur shader
    console.warn('Environment blur not yet implemented');
    return texture;
  }

  /**
   * Set environment intensity
   */
  private setEnvironmentIntensity(intensity: number): void {
    // TODO: Use scene for environment intensity setup
    // const scene = this.renderingEngine.getScene();
    
    // For HDRI environments, we need to modify the intensity
    // This would typically be done through tone mapping or post-processing
    const renderer = this.renderingEngine.getRenderer();
    renderer.toneMappingExposure = intensity;
  }

  /**
   * Get current environment
   */
  public getCurrentEnvironment(): EnvironmentConfig | null {
    return this.currentEnvironment || null;
  }

  /**
   * Get environment presets
   */
  public async getPresets(): Promise<EnvironmentConfig[]> {
    // In a full implementation, this would load from a preset library
    return [
      {
        id: 'studio',
        name: 'Studio',
        type: 'hdri',
        parameters: {
          hdriUrl: '/assets/hdri/studio.hdr',
          hdriIntensity: 1.0
        }
      },
      {
        id: 'outdoor',
        name: 'Outdoor',
        type: 'hdri',
        parameters: {
          hdriUrl: '/assets/hdri/outdoor.hdr',
          hdriIntensity: 1.2
        }
      },
      {
        id: 'sunset',
        name: 'Sunset',
        type: 'gradient',
        parameters: {
          topColor: 0xFF6B35,
          bottomColor: 0xFFE66D
        }
      }
    ];
  }

  /**
   * Clear environment
   */
  public clearEnvironment(): void {
    const scene = this.renderingEngine.getScene();
    scene.background = null;
    scene.environment = null;
    
    // Remove ground plane
    const ground = scene.getObjectByName('ground-plane');
    if (ground) {
      scene.remove(ground);
    }
    
    this.currentEnvironment = undefined;
  }

  /**
   * Dispose environment manager
   */
  public dispose(): void {
    // Dispose cached textures
    for (const texture of this.envTextures.values()) {
      texture.dispose();
    }
    this.envTextures.clear();

    // Dispose PMREM generator
    this.pmremGenerator.dispose();

    this.clearEnvironment();
  }

  /**
   * Show/hide environment background while keeping lighting
   */
  public setBackgroundVisible(visible: boolean): void {
    this.backgroundVisible = visible;
    const scene = this.renderingEngine.getScene();
    
    if (visible && this.environmentMap) {
      scene.background = this.environmentMap;
    } else {
      scene.background = null;
    }
  }

  /**
   * Get current background visibility state
   */
  public isBackgroundVisible(): boolean {
    return this.backgroundVisible;
  }
}
