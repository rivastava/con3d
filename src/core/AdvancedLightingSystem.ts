import * as THREE from 'three';
import { categorizeObject, ObjectCategory } from '../utils/meshFiltering';

/**
 * Professional Lighting Enhancement System
 * Implements advanced lighting techniques within Three.js capabilities
 */
export class AdvancedLightingSystem {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  
  // Enhanced lighting
  private environmentIntensity: number = 1.0;
  private shadowSoftness: number = 5.0;
  
  // Caustics simulation (fake)
  private causticsTexture?: THREE.Texture;
  
  // Light linking system
  private lightLinks: Map<string, { lightId: string; meshId: string; enabled: boolean; influence: number }> = new Map();
  
  // Light index tracking for shader linking
  private lightIndexMap: Map<string, number> = new Map();
  private userLights: THREE.Light[] = [];
  private static readonly MAX_LIGHTS = 8; // Conservative limit for shader uniforms
  
  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;
    
    this.initializeAdvancedLighting();
    this.updateLightIndices();
  }
  
  private initializeAdvancedLighting(): void {
    // Enable advanced renderer settings for better lighting
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Enable better shadow filtering
    this.setupAdvancedShadows();
    
    // Setup environment lighting
    this.setupEnvironmentLighting();
    
    // Setup caustics simulation
    this.setupCaustics();
  }
  
  private setupAdvancedShadows(): void {
    // Configure all lights in the scene for better shadows
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light && object.shadow) {
        // Improve shadow quality
        object.shadow.mapSize.width = 2048;
        object.shadow.mapSize.height = 2048;
        object.shadow.camera.near = 0.1;
        object.shadow.camera.far = 100;
        object.shadow.radius = this.shadowSoftness;
        object.shadow.blurSamples = 16;
        
        // Reduce shadow acne
        object.shadow.bias = -0.0001;
        object.shadow.normalBias = 0.02;
        
        // For directional lights, optimize the shadow camera
        if (object instanceof THREE.DirectionalLight) {
          const shadowCamera = object.shadow.camera as THREE.OrthographicCamera;
          shadowCamera.left = -20;
          shadowCamera.right = 20;
          shadowCamera.top = 20;
          shadowCamera.bottom = -20;
          shadowCamera.updateProjectionMatrix();
        }
      }
    });
  }
  
  private setupEnvironmentLighting(): void {
    // Add subtle hemisphere light for better ambient lighting
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.3);
    hemiLight.name = 'pro-hemisphere-light';
    this.scene.add(hemiLight);
    
    // Add rim lighting effect
    this.addRimLighting();
  }
  
  private addRimLighting(): void {
    // Create rim light for better object definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(10, 10, -10);
    rimLight.name = 'pro-rim-light';
    this.scene.add(rimLight);
  }
  
  private setupCaustics(): void {
    // Create a simple animated caustics texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Generate caustics pattern
    this.generateCausticsPattern(ctx, canvas.width, canvas.height);
    
    this.causticsTexture = new THREE.CanvasTexture(canvas);
    this.causticsTexture.wrapS = THREE.RepeatWrapping;
    this.causticsTexture.wrapT = THREE.RepeatWrapping;
    this.causticsTexture.repeat.set(2, 2);
    
    // Animate caustics
    this.animateCaustics();
  }
  
  private generateCausticsPattern(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(200, 230, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(100, 150, 200, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some wave patterns
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 50 + 10;
      
      const waveGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      waveGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      waveGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = waveGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  private animateCaustics(): void {
    if (this.causticsTexture) {
      const animateCausticsLoop = () => {
        if (this.causticsTexture) {
          this.causticsTexture.offset.x += 0.001;
          this.causticsTexture.offset.y += 0.0005;
          this.causticsTexture.needsUpdate = true;
        }
        requestAnimationFrame(animateCausticsLoop);
      };
      animateCausticsLoop();
    }
  }
  
  /**
   * Apply caustics effect to a material
   */
  public applyCausticsToMaterial(material: THREE.Material): void {
    if (this.causticsTexture && material instanceof THREE.MeshStandardMaterial) {
      // Simple approach: blend caustics as a lightmap
      material.lightMap = this.causticsTexture;
      material.lightMapIntensity = 0.3;
      material.needsUpdate = true;
    }
  }
  
  /**
   * Enhance material for better PBR rendering
   */
  public enhanceMaterialPBR(material: THREE.Material): void {
    if (material instanceof THREE.MeshStandardMaterial) {
      // Improve material properties for better realism
      material.envMapIntensity = this.environmentIntensity;
      
      // Add subtle normal mapping if not present
      if (!material.normalMap) {
        // Could add a generated normal map here
      }
      
      // Improve sheen for fabric-like materials
      if (material.roughness > 0.7) {
        (material as any).sheen = 0.1;
        (material as any).sheenRoughness = 0.8;
        (material as any).sheenColor = new THREE.Color(0.1, 0.1, 0.1);
      }
      
      material.needsUpdate = true;
    }
  }
  
  /**
   * Add area light approximation using rect lights
   */
  public addAreaLight(width: number = 5, height: number = 5, intensity: number = 1): THREE.RectAreaLight {
    const rectLight = new THREE.RectAreaLight(0xffffff, intensity, width, height);
    rectLight.position.set(0, 10, 0);
    rectLight.lookAt(0, 0, 0);
    rectLight.name = 'pro-area-light';
    
    this.scene.add(rectLight);
    
    return rectLight;
  }
  
  /**
   * Setup improved environment mapping
   */
  public setEnvironmentMap(envMap: THREE.Texture): void {
    this.scene.environment = envMap;
    this.scene.background = envMap;
    
    // Apply to all materials in the scene
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.envMap = envMap;
            material.envMapIntensity = this.environmentIntensity;
            material.needsUpdate = true;
          }
        });
      }
    });
  }
  
  /**
   * Update lighting settings
   */
  public updateSettings(settings: {
    environmentIntensity?: number;
    shadowSoftness?: number;
    toneMappingExposure?: number;
  }): void {
    if (settings.environmentIntensity !== undefined) {
      this.environmentIntensity = settings.environmentIntensity;
    }
    
    if (settings.shadowSoftness !== undefined) {
      this.shadowSoftness = settings.shadowSoftness;
      this.setupAdvancedShadows();
    }
    
    if (settings.toneMappingExposure !== undefined) {
      this.renderer.toneMappingExposure = settings.toneMappingExposure;
    }
  }
  
  /**
   * Get current caustics texture for external use
   */
  public getCausticsTexture(): THREE.Texture | undefined {
    return this.causticsTexture;
  }
  
  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.causticsTexture) {
      this.causticsTexture.dispose();
    }
    
    // Remove professional lights
    const lightsToRemove = this.scene.children.filter(child => 
      child.name?.startsWith('pro-')
    );
    lightsToRemove.forEach(light => this.scene.remove(light));
  }
  
  /**
   * Enable or disable light linking for a specific light-mesh combination
   */
  public setLightLink(lightId: string, meshId: string, enabled: boolean, influence: number = 1.0): void {
    const linkKey = `${lightId}-${meshId}`;
    this.lightLinks.set(linkKey, { lightId, meshId, enabled, influence });
    this.applyLightLinking();
  }

  /**
   * Get light link status for a specific light-mesh combination
   */
  public getLightLink(lightId: string, meshId: string): { enabled: boolean; influence: number } | null {
    const linkKey = `${lightId}-${meshId}`;
    const link = this.lightLinks.get(linkKey);
    return link ? { enabled: link.enabled, influence: link.influence } : null;
  }

  /**
   * Remove light linking for a specific combination
   */
  public removeLightLink(lightId: string, meshId: string): void {
    const linkKey = `${lightId}-${meshId}`;
    this.lightLinks.delete(linkKey);
    this.applyLightLinking();
  }

  /**
   * Enable a light for all meshes
   */
  public enableLightForAllMeshes(lightId: string): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.uuid) {
        this.setLightLink(lightId, object.uuid, true, 1.0);
      }
    });
  }

  /**
   * Disable a light for all meshes
   */
  public disableLightForAllMeshes(lightId: string): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.uuid) {
        this.setLightLink(lightId, object.uuid, false, 0.0);
      }
    });
  }

  /**
   * Enable all lights for a specific mesh
   */
  public enableAllLightsForMesh(meshId: string): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light && object.uuid) {
        this.setLightLink(object.uuid, meshId, true, 1.0);
      }
    });
  }

  /**
   * Disable all lights for a specific mesh
   */
  public disableAllLightsForMesh(meshId: string): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light && object.uuid) {
        this.setLightLink(object.uuid, meshId, false, 0.0);
      }
    });
  }

  /**
   * Apply light linking by modifying mesh materials with custom shader chunks
   */
  private applyLightLinking(): void {
    // Ensure light indices are up to date
    this.updateLightIndices();
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
            this.applyLightLinkingToMaterial(material, object.uuid);
          }
        });
      }
    });
  }

  /**
   * Apply light linking to a specific material by modifying shader chunks
   */
  private applyLightLinkingToMaterial(material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial, meshId: string): void {
    const excludedLights: string[] = [];
    const lightInfluences: { [lightId: string]: number } = {};

    // Collect disabled lights and influences for this mesh
    for (const [, link] of this.lightLinks) {
      if (link.meshId === meshId) {
        if (!link.enabled) {
          excludedLights.push(link.lightId);
        }
        lightInfluences[link.lightId] = link.influence;
      }
    }

    // Store light linking data on the material for custom shader processing
    (material as any).userData = {
      ...((material as any).userData || {}),
      excludedLights,
      lightInfluences,
      hasLightLinking: excludedLights.length > 0 || Object.keys(lightInfluences).some(id => lightInfluences[id] !== 1.0)
    };

    // If we have light linking, we need to use custom shader chunks
    if ((material as any).userData.hasLightLinking) {
      this.applyCustomLightingShader(material, excludedLights, lightInfluences);
    } else {
      // Remove custom shader if no light linking
      this.removeCustomLightingShader(material);
    }

    material.needsUpdate = true;
  }

  /**
   * Apply custom lighting shader chunks for light linking
   */
  private applyCustomLightingShader(
    material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
    excludedLights: string[],
    lightInfluences: { [lightId: string]: number }
  ): void {
    // Build light influence array for shader
    const influences = new Float32Array(AdvancedLightingSystem.MAX_LIGHTS);
    influences.fill(1.0); // Default full influence
    
    // Apply specific influences and exclusions
    for (let i = 0; i < this.userLights.length && i < AdvancedLightingSystem.MAX_LIGHTS; i++) {
      const light = this.userLights[i];
      const lightId = light.uuid;
      
      if (excludedLights.includes(lightId)) {
        influences[i] = 0.0; // Completely exclude
      } else if (lightInfluences[lightId] !== undefined) {
        influences[i] = lightInfluences[lightId]; // Custom influence
      }
    }

    // Store the original onBeforeCompile if it exists
    const originalOnBeforeCompile = material.onBeforeCompile;

    material.onBeforeCompile = (shader, renderer) => {
      // Call original onBeforeCompile if it exists
      if (originalOnBeforeCompile) {
        originalOnBeforeCompile(shader, renderer);
      }

      // Add uniforms for light linking
      shader.uniforms.lightInfluences = { value: influences };
      shader.uniforms.userLightCount = { value: Math.min(this.userLights.length, AdvancedLightingSystem.MAX_LIGHTS) };

      // Add helper function to get light influence
      const lightLinkingPreamble = `
        uniform float lightInfluences[${AdvancedLightingSystem.MAX_LIGHTS}];
        uniform int userLightCount;
        
        float getLightInfluence(int lightIndex) {
          if (lightIndex >= userLightCount || lightIndex < 0) return 1.0;
          return lightInfluences[lightIndex];
        }
      `;

      // Insert uniforms and helper function before lighting calculations
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        ${lightLinkingPreamble}
        `
      );

      // Patch directional light contributions
      shader.fragmentShader = shader.fragmentShader.replace(
        /directLight\.irradiance = ( \*= )?( )?directionalLights\[ i \]\.color( \* )?;?/g,
        `directLight.irradiance = directionalLights[ i ].color * getLightInfluence(i);`
      );

      // Patch point light contributions - target the distance attenuation line
      shader.fragmentShader = shader.fragmentShader.replace(
        /directLight\.irradiance = punctualLightIntensityToIrradiance\( punctualLightIntensity, distanceToLight, pointLights\[ i \]\.distance, pointLights\[ i \]\.decay \);?/g,
        `directLight.irradiance = punctualLightIntensityToIrradiance( punctualLightIntensity, distanceToLight, pointLights[ i ].distance, pointLights[ i ].decay ) * getLightInfluence(i + NUM_DIR_LIGHTS);`
      );

      // Patch spot light contributions
      shader.fragmentShader = shader.fragmentShader.replace(
        /directLight\.irradiance = punctualLightIntensityToIrradiance\( punctualLightIntensity, distanceToLight, spotLights\[ i \]\.distance, spotLights\[ i \]\.decay \);?/g,
        `directLight.irradiance = punctualLightIntensityToIrradiance( punctualLightIntensity, distanceToLight, spotLights[ i ].distance, spotLights[ i ].decay ) * getLightInfluence(i + NUM_DIR_LIGHTS + NUM_POINT_LIGHTS);`
      );

      // Alternative fallback: patch the final light accumulation if specific patches don't work
      shader.fragmentShader = shader.fragmentShader.replace(
        'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );',
        `
        reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
        `
      );

      // Store shader reference for potential updates
      (material as any).userData.customShader = shader;
      (material as any).userData.lightInfluenceArray = influences;
      
      console.log('🔗 Applied light linking shader to material:', material.name || material.uuid);
    };
  }

  /**
   * Remove custom lighting shader
   */
  private removeCustomLightingShader(material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial): void {
    (material as any).onBeforeCompile = undefined;
    delete (material as any).userData.customShader;
    delete (material as any).userData.lightInfluenceArray;
    delete (material as any).userData.hasLightLinking;
    material.needsUpdate = true;
  }

  /**
   * Get all lights in the scene
   */
  public getLights(): { id: string; name: string; type: string; light: THREE.Light }[] {
    const lights: { id: string; name: string; type: string; light: THREE.Light }[] = [];
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light && categorizeObject(object) === ObjectCategory.USER_LIGHT) {
        lights.push({
          id: object.uuid,
          name: object.name || `${object.type} ${object.uuid.slice(0, 8)}`,
          type: object.type,
          light: object
        });
      }
    });
    
    return lights;
  }

  /**
   * Get all meshes in the scene
   */
  public getMeshes(): { id: string; name: string; mesh: THREE.Mesh }[] {
    const meshes: { id: string; name: string; mesh: THREE.Mesh }[] = [];
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && categorizeObject(object) === ObjectCategory.USER_MESH) {
        meshes.push({
          id: object.uuid,
          name: object.name || `Mesh ${object.uuid.slice(0, 8)}`,
          mesh: object
        });
      }
    });
    
    return meshes;
  }

  /**
   * Get all light links
   */
  public getAllLightLinks(): { lightId: string; meshId: string; enabled: boolean; influence: number }[] {
    return Array.from(this.lightLinks.values());
  }

  /**
   * Clear all light links
   */
  public clearAllLightLinks(): void {
    this.lightLinks.clear();
    this.applyLightLinking();
  }

  /**
   * Update light indices for shader linking
   */
  private updateLightIndices(): void {
    this.userLights = [];
    this.lightIndexMap.clear();
    
    // Collect all user lights (excluding system lights)
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light && categorizeObject(object) === ObjectCategory.USER_LIGHT) {
        this.userLights.push(object);
      }
    });
    
    // Assign indices (limit to MAX_LIGHTS for shader compatibility)
    const maxLights = Math.min(this.userLights.length, AdvancedLightingSystem.MAX_LIGHTS);
    for (let i = 0; i < maxLights; i++) {
      const light = this.userLights[i];
      this.lightIndexMap.set(light.uuid, i);
    }
    
    console.log(`🔗 Light linking: Updated ${maxLights} light indices`);
  }
  
  /**
   * Update light linking when lights are added/removed
   */
  public refreshLightIndices(): void {
    this.updateLightIndices();
    // Re-apply linking to all materials with updated indices
    this.applyLightLinking();
  }

  /**
   * Update material uniforms for light linking without full shader recompilation
   */
  public updateMaterialLighting(material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial, meshId: string): void {
    if (!material.userData.customShader || !material.userData.lightInfluenceArray) {
      return; // No custom shader applied
    }
    
    // Get current light links for this mesh
    const excludedLights: string[] = [];
    const lightInfluences: { [lightId: string]: number } = {};
    
    this.lightLinks.forEach((link) => {
      if (link.meshId === meshId) {
        if (!link.enabled) {
          excludedLights.push(link.lightId);
        } else if (link.influence !== 1.0) {
          lightInfluences[link.lightId] = link.influence;
        }
      }
    });
    
    // Update the influence array
    const influences = material.userData.lightInfluenceArray as Float32Array;
    influences.fill(1.0); // Reset to default
    
    for (let i = 0; i < this.userLights.length && i < AdvancedLightingSystem.MAX_LIGHTS; i++) {
      const light = this.userLights[i];
      const lightId = light.uuid;
      
      if (excludedLights.includes(lightId)) {
        influences[i] = 0.0;
      } else if (lightInfluences[lightId] !== undefined) {
        influences[i] = lightInfluences[lightId];
      }
    }
    
    // Update the uniform if shader is available
    const shader = material.userData.customShader;
    if (shader && shader.uniforms.lightInfluences) {
      shader.uniforms.lightInfluences.value = influences;
    }
  }
  
  /**
   * Get light influence for a specific light and mesh (for debugging)
   */
  public getLightInfluence(lightId: string, meshId: string): number {
    const linkKey = `${lightId}_${meshId}`;
    const link = this.lightLinks.get(linkKey);
    return link ? (link.enabled ? link.influence : 0.0) : 1.0;
  }

  /**
   * Debug method to test light linking functionality
   */
  public debugLightLinking(): void {
    console.log('🔗 Light Linking Debug Information:');
    console.log(`- User lights tracked: ${this.userLights.length}`);
    console.log(`- Light links stored: ${this.lightLinks.size}`);
    console.log(`- Light index map:`, Array.from(this.lightIndexMap.entries()));
    
    // Test linking by excluding the first light from all meshes
    if (this.userLights.length > 0) {
      const firstLight = this.userLights[0];
      console.log(`- Testing: Excluding light "${firstLight.name}" from all meshes`);
      this.disableLightForAllMeshes(firstLight.uuid);
      
      // Re-enable after 3 seconds
      setTimeout(() => {
        console.log(`- Re-enabling light "${firstLight.name}" for all meshes`);
        this.enableLightForAllMeshes(firstLight.uuid);
      }, 3000);
    }
  }
  
  /**
   * Get debug information about current light linking state
   */
  public getLightLinkingDebugInfo(): {
    userLights: number;
    lightLinks: number;
    materialsWithLinking: number;
  } {
    let materialsWithLinking = 0;
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if ((material as any).userData?.hasLightLinking) {
            materialsWithLinking++;
          }
        });
      }
    });
    
    return {
      userLights: this.userLights.length,
      lightLinks: this.lightLinks.size,
      materialsWithLinking
    };
  }
}
