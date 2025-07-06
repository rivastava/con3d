import * as THREE from 'three';
import { 
  EffectComposer, 
  RenderPass, 
  BloomEffect, 
  DepthOfFieldEffect,
  SSAOEffect, 
  FXAAEffect, 
  SMAAEffect,
  ToneMappingEffect,
  VignetteEffect,
  EffectPass,
  BlendFunction
} from 'postprocessing';

export interface PostProcessingSettings {
  enableBloom: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  enableDepthOfField: boolean;
  dofFocus: number;
  dofAperture: number;
  dofBokehScale: number;
  enableSSAO: boolean;
  ssaoIntensity: number;
  ssaoRadius: number;
  enableVignette: boolean;
  vignetteStrength: number;
  enableAntialiasing: boolean;
  antialiasingType: 'fxaa' | 'smaa';
  enableToneMapping: boolean;
  toneMappingMode: number;
}

/**
 * Advanced Post-Processing Manager for Three.js
 * Implements professional-grade post-processing effects using the postprocessing library
 */
export class PostProcessingManager {
  private composer: EffectComposer;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  
  // Effect instances
  private bloomEffect?: BloomEffect;
  private dofEffect?: DepthOfFieldEffect;
  private ssaoEffect?: SSAOEffect;
  private vignetteEffect?: VignetteEffect;
  private toneMappingEffect?: ToneMappingEffect;
  private smaaEffect?: SMAAEffect;
  private fxaaEffect?: FXAAEffect;
  
  // Effect passes
  private effectPass?: EffectPass;
  private antialiasingPass?: EffectPass;
  
  private settings: PostProcessingSettings;
  private enabled: boolean = false;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    
    // Initialize composer
    this.composer = new EffectComposer(renderer);
    
    // Initialize default settings
    this.settings = this.getDefaultSettings();
    
    this.initialize();
  }

  private getDefaultSettings(): PostProcessingSettings {
    return {
      enableBloom: true,
      bloomStrength: 0.3,
      bloomRadius: 0.8,
      bloomThreshold: 0.8,
      enableDepthOfField: false,
      dofFocus: 10.0,
      dofAperture: 0.02,
      dofBokehScale: 2.0,
      enableSSAO: true,
      ssaoIntensity: 0.5,
      ssaoRadius: 0.1,
      enableVignette: true,
      vignetteStrength: 0.3,
      enableAntialiasing: true,
      antialiasingType: 'smaa',
      enableToneMapping: true,
      toneMappingMode: THREE.ACESFilmicToneMapping
    };
  }

  private initialize(): void {
    // Clear existing passes
    this.composer.removeAllPasses();
    
    // Add render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    this.createEffects();
    this.createPasses();
  }

  private createEffects(): void {
    try {
      // Bloom effect
      this.bloomEffect = new BloomEffect({
        intensity: this.settings.bloomStrength,
        radius: this.settings.bloomRadius,
        luminanceThreshold: this.settings.bloomThreshold,
        luminanceSmoothing: 0.025,
        blendFunction: BlendFunction.ADD
      });

      // Depth of Field effect
      this.dofEffect = new DepthOfFieldEffect(this.camera, {
        focusDistance: this.settings.dofFocus,
        focalLength: this.settings.dofAperture,
        bokehScale: this.settings.dofBokehScale,
        height: 480
      });

      // SSAO effect
      this.ssaoEffect = new SSAOEffect(this.camera, undefined, {
        intensity: this.settings.ssaoIntensity,
        radius: this.settings.ssaoRadius
      });

      // Vignette effect
      this.vignetteEffect = new VignetteEffect({
        darkness: this.settings.vignetteStrength,
        offset: 0.35
      });

      // Tone mapping effect
      this.toneMappingEffect = new ToneMappingEffect({
        mode: this.settings.toneMappingMode,
        resolution: 256,
        whitePoint: 4.0,
        middleGrey: 0.6,
        minLuminance: 0.01,
        averageLuminance: 1.0,
        adaptationRate: 1.0
      });

      // Anti-aliasing effects
      this.smaaEffect = new SMAAEffect();
      this.fxaaEffect = new FXAAEffect();
    } catch (error) {
      console.warn('Error creating post-processing effects:', error);
    }
  }

  private createPasses(): void {
    // Create main effect pass with enabled effects
    const effects: any[] = [];
    
    if (this.settings.enableBloom && this.bloomEffect) {
      effects.push(this.bloomEffect);
    }
    
    if (this.settings.enableDepthOfField && this.dofEffect) {
      effects.push(this.dofEffect);
    }
    
    if (this.settings.enableSSAO && this.ssaoEffect) {
      effects.push(this.ssaoEffect);
    }
    
    if (this.settings.enableVignette && this.vignetteEffect) {
      effects.push(this.vignetteEffect);
    }
    
    if (this.settings.enableToneMapping && this.toneMappingEffect) {
      effects.push(this.toneMappingEffect);
    }

    if (effects.length > 0) {
      this.effectPass = new EffectPass(this.camera, ...effects);
      this.composer.addPass(this.effectPass);
    }

    // Add anti-aliasing pass
    if (this.settings.enableAntialiasing) {
      const aaEffect = this.settings.antialiasingType === 'smaa' ? this.smaaEffect : this.fxaaEffect;
      if (aaEffect) {
        this.antialiasingPass = new EffectPass(this.camera, aaEffect);
        this.composer.addPass(this.antialiasingPass);
      }
    }
  }

  /**
   * Update post-processing settings
   */
  public updateSettings(newSettings: Partial<PostProcessingSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Update individual effects
    if (this.bloomEffect && newSettings.bloomStrength !== undefined) {
      this.bloomEffect.intensity = this.settings.bloomStrength;
    }
    if (this.bloomEffect && newSettings.bloomThreshold !== undefined) {
      (this.bloomEffect as any).luminanceThreshold = this.settings.bloomThreshold;
    }
    
    if (this.dofEffect) {
      if (newSettings.dofFocus !== undefined) {
        (this.dofEffect as any).focusDistance = this.settings.dofFocus;
      }
      if (newSettings.dofAperture !== undefined) {
        (this.dofEffect as any).focalLength = this.settings.dofAperture;
      }
      if (newSettings.dofBokehScale !== undefined) {
        (this.dofEffect as any).bokehScale = this.settings.dofBokehScale;
      }
    }
    
    if (this.ssaoEffect && newSettings.ssaoIntensity !== undefined) {
      this.ssaoEffect.intensity = this.settings.ssaoIntensity;
    }
    
    if (this.vignetteEffect && newSettings.vignetteStrength !== undefined) {
      this.vignetteEffect.darkness = this.settings.vignetteStrength;
    }
    
    // Recreate passes if effect enablement changed
    const recreatePasses = [
      'enableBloom', 'enableDepthOfField', 'enableSSAO', 
      'enableVignette', 'enableToneMapping', 'enableAntialiasing'
    ].some(key => newSettings.hasOwnProperty(key));
    
    if (recreatePasses) {
      this.initialize();
    }
  }

  /**
   * Update camera for DOF effect
   */
  public updateCamera(camera: THREE.Camera): void {
    this.camera = camera;
    
    // Update effects that depend on camera
    if (this.dofEffect) {
      (this.dofEffect as any).camera = camera;
    }
    
    if (this.ssaoEffect) {
      (this.ssaoEffect as any).camera = camera;
    }
    
    // Recreate passes with new camera
    this.initialize();
  }

  /**
   * Set focus distance for depth of field
   */
  public setFocusDistance(distance: number): void {
    this.settings.dofFocus = distance;
    if (this.settings.enableDepthOfField) {
      this.recreateDOFEffect();
    }
  }

  /**
   * Set aperture (focal length) for depth of field
   */
  public setAperture(aperture: number): void {
    this.settings.dofAperture = aperture;
    if (this.settings.enableDepthOfField) {
      this.recreateDOFEffect();
    }
  }

  /**
   * Set bokeh scale for depth of field
   */
  public setBokehScale(scale: number): void {
    this.settings.dofBokehScale = scale;
    if (this.settings.enableDepthOfField) {
      this.recreateDOFEffect();
    }
  }

  /**
   * Enable post-processing with specific effects
   */
  public enable(effects: string[] = ['fxaa', 'bloom']): void {
    this.enabled = true;
    
    // Enable specific effects based on the effects array
    if (effects.includes('bloom')) {
      this.updateSettings({ enableBloom: true });
    }
    if (effects.includes('dof') || effects.includes('depthOfField')) {
      this.updateSettings({ enableDepthOfField: true });
    }
    if (effects.includes('ssao')) {
      this.updateSettings({ enableSSAO: true });
    }
    if (effects.includes('vignette')) {
      this.updateSettings({ enableVignette: true });
    }
    
    // Anti-aliasing settings
    if (effects.includes('fxaa') || effects.includes('smaa')) {
      this.updateSettings({ 
        enableAntialiasing: true,
        antialiasingType: effects.includes('smaa') ? 'smaa' : 'fxaa'
      });
    }
    
    this.initialize();
  }

  /**
   * Disable post-processing
   */
  public disable(): void {
    this.enabled = false;
    
    // Disable all effects
    this.updateSettings({
      enableBloom: false,
      enableDepthOfField: false,
      enableSSAO: false,
      enableVignette: false,
      enableAntialiasing: false
    });
    
    this.initialize();
  }

  /**
   * Check if post-processing is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current settings
   */
  public getSettings(): PostProcessingSettings {
    return { ...this.settings };
  }

  /**
   * Render frame with post-processing
   */
  public render(deltaTime?: number): void {
    if (this.enabled) {
      this.composer.render(deltaTime);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Handle window resize
   */
  public setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  /**
   * Get the composer for direct access
   */
  public getComposer(): EffectComposer {
    return this.composer;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.composer.dispose();
    
    // Dispose individual effects
    this.bloomEffect?.dispose();
    this.dofEffect?.dispose();
    this.ssaoEffect?.dispose();
    this.vignetteEffect?.dispose();
    this.toneMappingEffect?.dispose();
    this.smaaEffect?.dispose();
    this.fxaaEffect?.dispose();
  }

  /**
   * Recreate DOF effect with current settings
   */
  private recreateDOFEffect(): void {
    if (!this.enabled) return;

    // Create new DOF effect with current settings
    this.dofEffect = new DepthOfFieldEffect(this.camera, {
      focusDistance: this.settings.dofFocus,
      focalLength: this.settings.dofAperture,
      bokehScale: this.settings.dofBokehScale,
      height: 480
    });

    // Reinitialize the effect composer
    this.initialize();
  }
}
