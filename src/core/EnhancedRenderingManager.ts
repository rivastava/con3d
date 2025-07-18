import * as THREE from 'three';
import { AdvancedLightingSystem } from './AdvancedLightingSystem';
import { PostProcessingManager, PostProcessingSettings } from './PostProcessingManager';

export interface RenderQualitySettings {
  // Shadow Quality
  shadows: {
    enabled: boolean;
    type: 'basic' | 'pcf' | 'pcfSoft' | 'vsm';
    mapSize: 512 | 1024 | 2048 | 4096;
    radius: number;
    bias: number;
    normalBias: number;
    cameraNear: number;
    cameraFar: number;
  };
  
  // Anti-aliasing
  antialiasing: {
    enabled: boolean;
    type: 'msaa' | 'fxaa' | 'smaa' | 'taa';
    samples: 2 | 4 | 8 | 16;
  };
  
  // Tone Mapping and Color
  toneMappingAndColor: {
    toneMapping: THREE.ToneMapping;
    exposure: number;
    contrast: number;
    brightness: number;
    saturation: number;
    gamma: number;
  };
  
  // Ambient and Global Illumination
  globalIllumination: {
    ambientIntensity: number;
    ambientColor: THREE.Color;
    enableSSAO: boolean;
    ssaoRadius: number;
    ssaoIntensity: number;
    enableGI: boolean; // Simplified GI approximation
    enableEnvironmentLighting: boolean;
    environmentIntensity: number;
    enableIndirectLighting: boolean;
    indirectLightingIntensity: number;
  };
  
  // Reflections and Refractions
  reflections: {
    enableScreenSpaceReflections: boolean;
    reflectionQuality: 'low' | 'medium' | 'high';
    maxReflectionDistance: number;
    enablePlanarReflections: boolean;
  };
  
  // Post-processing effects
  postProcessing: {
    enableBloom: boolean;
    bloomStrength: number;
    bloomRadius: number;
    bloomThreshold: number;
    enableDepthOfField: boolean;
    dofFocus: number;
    dofAperture: number;
    enableMotionBlur: boolean;
    enableVignette: boolean;
    vignetteStrength: number;
    enableSSAO: boolean;
  };
  
  // Performance settings
  performance: {
    pixelRatio: number;
    maxLights: number;
    frustumCulling: boolean;
    levelOfDetail: boolean;
    enableInstancing: boolean;
  };
}

/**
 * Enhanced Rendering Manager for professional quality rendering
 * Implements advanced rendering techniques available in Three.js
 */
export class EnhancedRenderingManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private settings: RenderQualitySettings;
  
  // Post-processing manager
  private postProcessingManager?: PostProcessingManager;
  
  // Advanced lighting
  private ambientLight?: THREE.AmbientLight;
  private hemisphereLight?: THREE.HemisphereLight;
  private environmentMap?: THREE.Texture;
  private lightProbes: THREE.LightProbe[] = [];
  private advancedLightingSystem: AdvancedLightingSystem;
  
  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    this.renderer = renderer;
    this.scene = scene;
    // Camera reference not stored as it's passed in methods when needed
    
    // Initialize default settings
    this.settings = this.getDefaultSettings();
    
    // Initialize advanced lighting system
    this.advancedLightingSystem = new AdvancedLightingSystem(this.scene, this.renderer);
    
    // Setup renderer capabilities
    this.initializeRenderer();
    this.applySettings();
  }
  
  private getDefaultSettings(): RenderQualitySettings {
    return {
      shadows: {
        enabled: true,
        type: 'pcfSoft',
        mapSize: 2048,
        radius: 4,
        bias: -0.0001,
        normalBias: 0.02,
        cameraNear: 0.1,
        cameraFar: 500,
      },
      antialiasing: {
        enabled: true,
        type: 'smaa',
        samples: 4,
      },
      toneMappingAndColor: {
        toneMapping: THREE.ACESFilmicToneMapping,
        exposure: 1.0,
        contrast: 1.0,
        brightness: 0.0,
        saturation: 1.0,
        gamma: 2.2,
      },
      globalIllumination: {
        ambientIntensity: 0.3,
        ambientColor: new THREE.Color(0x404040),
        enableSSAO: true,
        ssaoRadius: 0.1,
        ssaoIntensity: 0.5,
        enableGI: true,
        enableEnvironmentLighting: true,
        environmentIntensity: 1.0,
        enableIndirectLighting: true,
        indirectLightingIntensity: 0.5,
      },
      reflections: {
        enableScreenSpaceReflections: false, // Performance intensive
        reflectionQuality: 'medium',
        maxReflectionDistance: 100,
        enablePlanarReflections: false,
      },
      postProcessing: {
        enableBloom: true,
        bloomStrength: 0.3,
        bloomRadius: 0.8,
        bloomThreshold: 0.8,
        enableDepthOfField: false,
        dofFocus: 10,
        dofAperture: 0.02,
        enableMotionBlur: false,
        enableVignette: true,
        vignetteStrength: 0.3,
        enableSSAO: true,
      },
      performance: {
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        maxLights: 8,
        frustumCulling: true,
        levelOfDetail: false,
        enableInstancing: true,
      },
    };
  }
  
  private initializeRenderer(): void {
    // Enable advanced renderer features
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // Enable physically correct lights
    // Enable physically based lighting (deprecated in newer Three.js versions)
    // this.renderer.physicallyCorrectLights = true; // Removed in Three.js r150+
    
    // Set pixel ratio for high DPI displays
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Note: Antialiasing is set during renderer creation, cannot be changed dynamically
    // Advanced antialiasing handled through post-processing
  }
  
  /**
   * Initialize advanced lighting setup
   */
  public initializeAdvancedLighting(): void {
    // Remove existing ambient lighting
    const existingAmbient = this.scene.children.find(child => child instanceof THREE.AmbientLight);
    if (existingAmbient) {
      this.scene.remove(existingAmbient);
    }
    
    // Add enhanced ambient lighting
    this.ambientLight = new THREE.AmbientLight(
      this.settings.globalIllumination.ambientColor,
      this.settings.globalIllumination.ambientIntensity
    );
    this.scene.add(this.ambientLight);
    
    // Add hemisphere lighting for better global illumination
    this.hemisphereLight = new THREE.HemisphereLight(
      0x87ceeb, // Sky color (light blue)
      0x443333, // Ground color (brownish)
      0.2
    );
    this.hemisphereLight.position.set(0, 50, 0);
    this.scene.add(this.hemisphereLight);
    
    // Initialize environment lighting if enabled
    this.setupEnvironmentLighting();
    
    // Setup light probes for indirect lighting
    this.setupLightProbes();
  }
  
  /**
   * Setup environment lighting for Image-Based Lighting (IBL)
   */
  private setupEnvironmentLighting(): void {
    if (!this.settings.globalIllumination.enableEnvironmentLighting) return;
    
    // Create a simple procedural environment map if none exists
    if (!this.scene.environment) {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();
      
      // Create a simple gradient environment
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d')!;
      
      // Create gradient from blue sky to brownish ground
      const gradient = context.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, '#87ceeb'); // Sky blue
      gradient.addColorStop(1, '#443333'); // Ground brown
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      
      this.environmentMap = pmremGenerator.fromEquirectangular(texture).texture;
      this.scene.environment = this.environmentMap;
      texture.dispose();
      pmremGenerator.dispose();
    }
  }
  
  /**
   * Setup light probes for indirect lighting
   */
  private setupLightProbes(): void {
    if (!this.settings.globalIllumination.enableIndirectLighting) return;
    
    // Clear existing light probes
    this.lightProbes.forEach(probe => this.scene.remove(probe));
    this.lightProbes = [];
    
    // Create a simple light probe setup
    const probeIntensity = this.settings.globalIllumination.indirectLightingIntensity;
    
    // Central light probe
    const centralProbe = new THREE.LightProbe();
    centralProbe.sh.fromArray([
      // Red
      probeIntensity * 0.5, 0, 0, 0, 0, 0, 0, 0, 0,
      // Green  
      0, probeIntensity * 0.5, 0, 0, 0, 0, 0, 0, 0,
      // Blue
      0, 0, probeIntensity * 0.5, 0, 0, 0, 0, 0, 0
    ]);
    
    this.scene.add(centralProbe);
    this.lightProbes.push(centralProbe);
  }
  
  /**
   * Setup enhanced shadows for all lights
   */
  public setupEnhancedShadows(): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light && object.castShadow) {
        this.configureLightShadow(object);
      }
    });
  }
  
  private configureLightShadow(light: THREE.Light): void {
    if (!light.shadow) return;
    
    const settings = this.settings.shadows;
    
    // Configure shadow map
    light.shadow.mapSize.width = settings.mapSize;
    light.shadow.mapSize.height = settings.mapSize;
    light.shadow.bias = settings.bias;
    light.shadow.normalBias = settings.normalBias;
    light.shadow.radius = settings.radius;
    
    // Configure shadow camera
    if (light.shadow.camera) {
      if (light.shadow.camera instanceof THREE.PerspectiveCamera || light.shadow.camera instanceof THREE.OrthographicCamera) {
        (light.shadow.camera as any).near = settings.cameraNear;
        (light.shadow.camera as any).far = settings.cameraFar;
      }
      
      // For directional lights, set appropriate camera bounds
      if (light instanceof THREE.DirectionalLight) {
        const camera = light.shadow.camera as THREE.OrthographicCamera;
        camera.left = -20;
        camera.right = 20;
        camera.top = 20;
        camera.bottom = -20;
      }
      
      if ('updateProjectionMatrix' in light.shadow.camera) {
        (light.shadow.camera as any).updateProjectionMatrix();
      }
    }
  }
  
  /**
   * Apply current settings to renderer and scene
   */
  public applySettings(): void {
    this.applyShadowSettings();
    this.applyToneMappingSettings();
    this.applyPerformanceSettings();
    this.applyGlobalIlluminationSettings();
    this.initializeAdvancedLighting();
  }
  
  private applyShadowSettings(): void {
    const settings = this.settings.shadows;
    
    this.renderer.shadowMap.enabled = settings.enabled;
    
    switch (settings.type) {
      case 'basic':
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        break;
      case 'pcf':
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        break;
      case 'pcfSoft':
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
      case 'vsm':
        this.renderer.shadowMap.type = THREE.VSMShadowMap;
        break;
    }
    
    if (settings.enabled) {
      this.setupEnhancedShadows();
    }
  }
  
  private applyToneMappingSettings(): void {
    const settings = this.settings.toneMappingAndColor;
    
    // Only apply if tone mapping hasn't been externally set
    // Check if current renderer settings differ from our defaults
    if (this.renderer.toneMapping === THREE.ACESFilmicToneMapping && 
        Math.abs(this.renderer.toneMappingExposure - 1.0) < 0.01) {
      // Apply our settings since they appear to be defaults
      this.renderer.toneMapping = settings.toneMapping;
      this.renderer.toneMappingExposure = settings.exposure;
    }
    // Otherwise, respect external tone mapping settings
  }
  
  /**
   * Update tone mapping settings (for external control)
   */
  public setToneMapping(toneMapping: THREE.ToneMapping, exposure?: number): void {
    this.settings.toneMappingAndColor.toneMapping = toneMapping;
    if (exposure !== undefined) {
      this.settings.toneMappingAndColor.exposure = exposure;
    }
    this.renderer.toneMapping = toneMapping;
    if (exposure !== undefined) {
      this.renderer.toneMappingExposure = exposure;
    }
  }
  
  /**
   * Get current tone mapping settings
   */
  public getToneMapping(): { toneMapping: THREE.ToneMapping; exposure: number } {
    return {
      toneMapping: this.renderer.toneMapping,
      exposure: this.renderer.toneMappingExposure
    };
  }
  
  private applyPerformanceSettings(): void {
    const settings = this.settings.performance;
    
    this.renderer.setPixelRatio(settings.pixelRatio);
    
    // Set max lights (requires updating materials)
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material instanceof THREE.Material) {
        (object.material as any).lights = true;
      }
    });
  }

  private applyGlobalIlluminationSettings(): void {
    const settings = this.settings.globalIllumination;
    
    // Update ambient light
    if (this.ambientLight) {
      this.ambientLight.color = settings.ambientColor;
      this.ambientLight.intensity = settings.ambientIntensity;
      this.ambientLight.visible = settings.enableGI;
    }
    
    // Update hemisphere light
    if (this.hemisphereLight) {
      this.hemisphereLight.intensity = settings.enableGI ? 0.2 : 0;
      this.hemisphereLight.visible = settings.enableGI;
    }
    
    // Enable/disable SSAO if available
    if (this.postProcessingManager && settings.enableSSAO !== undefined) {
      this.postProcessingManager.updateSettings({
        enableSSAO: settings.enableSSAO,
        ssaoIntensity: settings.ssaoIntensity,
        ssaoRadius: settings.ssaoRadius
      });
    }
    
    // Update environment lighting
    if (settings.enableEnvironmentLighting && this.scene.environment) {
      // Apply environment intensity
      this.scene.environmentIntensity = settings.environmentIntensity;
      this.scene.environment.mapping = THREE.EquirectangularReflectionMapping;
    } else if (!settings.enableEnvironmentLighting) {
      this.scene.environmentIntensity = 0;
    }
    
    // Update light probes
    this.lightProbes.forEach(probe => {
      probe.visible = settings.enableIndirectLighting && settings.enableGI;
      if (probe.visible) {
        const intensity = settings.indirectLightingIntensity;
        probe.sh.fromArray([
          // Red
          intensity * 0.5, 0, 0, 0, 0, 0, 0, 0, 0,
          // Green  
          0, intensity * 0.5, 0, 0, 0, 0, 0, 0, 0,
          // Blue
          0, 0, intensity * 0.5, 0, 0, 0, 0, 0, 0
        ]);
      }
    });
    
    // Update all materials to use enhanced lighting when GI is enabled
    if (settings.enableGI) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          
          materials.forEach(material => {
            if (material instanceof THREE.MeshStandardMaterial || 
                material instanceof THREE.MeshPhysicalMaterial) {
              // Enable better material properties for GI
              material.needsUpdate = true;
              material.envMapIntensity = settings.enableEnvironmentLighting ? settings.environmentIntensity : 1.0;
              
              // Improve material response to indirect lighting
              if (material instanceof THREE.MeshPhysicalMaterial) {
                material.clearcoat = Math.min(material.clearcoat + 0.1, 1.0);
                material.transmission = Math.max(material.transmission - 0.05, 0.0);
              }
            }
          });
        }
      });
    }
  }
  
  /**
   * Create enhanced materials with better visual quality
   */
  public createEnhancedMaterial(type: 'standard' | 'physical' = 'physical', options: any = {}): THREE.Material {
    const baseOptions = {
      // Enhanced material properties
      envMapIntensity: 1.0,
      roughness: options.roughness || 0.3,
      metalness: options.metalness || 0.0,
      
      // Better normal mapping
      normalScale: new THREE.Vector2(1, 1),
      
      // Enhanced color and opacity
      transparent: options.transparent || false,
      opacity: options.opacity || 1.0,
      
      // Advanced material features
      clearcoat: options.clearcoat || 0.0,
      clearcoatRoughness: options.clearcoatRoughness || 0.1,
      
      ...options
    };
    
    if (type === 'physical') {
      return new THREE.MeshPhysicalMaterial(baseOptions);
    } else {
      return new THREE.MeshStandardMaterial(baseOptions);
    }
  }
  
  /**
   * Enhanced lighting setup for better realism
   */
  public addEnhancedDirectionalLight(options: {
    position: THREE.Vector3;
    intensity?: number;
    color?: THREE.ColorRepresentation;
    castShadow?: boolean;
  }): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(
      options.color || 0xffffff,
      options.intensity || 1.0
    );
    
    light.position.copy(options.position);
    light.castShadow = options.castShadow !== false;
    
    if (light.castShadow) {
      this.configureLightShadow(light);
    }
    
    this.scene.add(light);
    return light;
  }
  
  /**
   * Initialize post-processing with camera
   */
  public initializePostProcessing(camera: THREE.Camera): void {
    if (this.postProcessingManager) {
      this.postProcessingManager.dispose();
    }
    
    this.postProcessingManager = new PostProcessingManager(this.renderer, this.scene, camera);
    this.postProcessingManager.enable(['fxaa', 'bloom']);
  }

  /**
   * Get post-processing manager
   */
  public getPostProcessingManager(): PostProcessingManager | undefined {
    return this.postProcessingManager;
  }

  /**
   * Update post-processing settings
   */
  public updatePostProcessingSettings(settings: Partial<PostProcessingSettings>): void {
    if (this.postProcessingManager) {
      this.postProcessingManager.updateSettings(settings);
    }
  }

  /**
   * Get the advanced lighting system for professional lighting features
   */
  public getAdvancedLightingSystem(): AdvancedLightingSystem {
    return this.advancedLightingSystem;
  }
  
  /**
   * Apply enhanced PBR to all materials in the scene
   */
  public enhanceAllMaterials(): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => {
          this.advancedLightingSystem.enhanceMaterialPBR(material);
        });
      }
    });
  }
  
  /**
   * Apply caustics effect to a specific mesh
   */
  public applyCausticsToMesh(mesh: THREE.Mesh): void {
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(material => {
        this.advancedLightingSystem.applyCausticsToMaterial(material);
      });
    }
  }
  
  /**
   * Update advanced lighting settings
   */
  public updateAdvancedLighting(settings: {
    environmentIntensity?: number;
    shadowSoftness?: number;
    toneMappingExposure?: number;
  }): void {
    this.advancedLightingSystem.updateSettings(settings);
  }
  
  /**
   * Update settings
   */
  public updateSettings(updates: Partial<RenderQualitySettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
      shadows: { ...this.settings.shadows, ...updates.shadows },
      antialiasing: { ...this.settings.antialiasing, ...updates.antialiasing },
      toneMappingAndColor: { ...this.settings.toneMappingAndColor, ...updates.toneMappingAndColor },
      globalIllumination: { ...this.settings.globalIllumination, ...updates.globalIllumination },
      reflections: { ...this.settings.reflections, ...updates.reflections },
      postProcessing: { ...this.settings.postProcessing, ...updates.postProcessing },
      performance: { ...this.settings.performance, ...updates.performance },
    };
    
    this.applySettings();
  }
  
  /**
   * Get current settings
   */
  public getSettings(): RenderQualitySettings {
    return JSON.parse(JSON.stringify(this.settings));
  }
  
  /**
   * Preset configurations for different quality levels
   */
  public applyQualityPreset(preset: 'low' | 'medium' | 'high' | 'ultra'): void {
    switch (preset) {
      case 'low':
        this.updateSettings({
          shadows: { ...this.settings.shadows, enabled: true, type: 'basic', mapSize: 512 },
          antialiasing: { ...this.settings.antialiasing, enabled: false },
          postProcessing: { 
            ...this.settings.postProcessing, 
            enableBloom: false, 
            enableSSAO: false 
          },
          performance: { ...this.settings.performance, pixelRatio: 1 }
        });
        break;
        
      case 'medium':
        this.updateSettings({
          shadows: { ...this.settings.shadows, enabled: true, type: 'pcf', mapSize: 1024 },
          antialiasing: { ...this.settings.antialiasing, enabled: true, type: 'fxaa' },
          postProcessing: { 
            ...this.settings.postProcessing, 
            enableBloom: true, 
            enableSSAO: false 
          },
          performance: { ...this.settings.performance, pixelRatio: Math.min(window.devicePixelRatio, 1.5) }
        });
        break;
        
      case 'high':
        this.updateSettings({
          shadows: { ...this.settings.shadows, enabled: true, type: 'pcfSoft', mapSize: 2048 },
          antialiasing: { ...this.settings.antialiasing, enabled: true, type: 'smaa' },
          postProcessing: { 
            ...this.settings.postProcessing, 
            enableBloom: true, 
            enableSSAO: true 
          },
          performance: { ...this.settings.performance, pixelRatio: Math.min(window.devicePixelRatio, 2) }
        });
        break;
        
      case 'ultra':
        this.updateSettings({
          shadows: { ...this.settings.shadows, enabled: true, type: 'pcfSoft', mapSize: 4096 },
          antialiasing: { ...this.settings.antialiasing, enabled: true, type: 'smaa', samples: 8 },
          postProcessing: { 
            ...this.settings.postProcessing, 
            enableBloom: true, 
            enableSSAO: true,
            enableDepthOfField: true,
            enableVignette: true
          },
          performance: { ...this.settings.performance, pixelRatio: window.devicePixelRatio }
        });
        break;
    }
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.postProcessingManager) {
      this.postProcessingManager.dispose();
    }
    
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
    }
    
    if (this.hemisphereLight) {
      this.scene.remove(this.hemisphereLight);
    }
  }
}
