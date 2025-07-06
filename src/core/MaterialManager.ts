import * as THREE from 'three';
import { MaterialConfig, MaterialParameters, TextureTransform } from '@/types';

export class MaterialManager {
  private materials: Map<string, THREE.Material> = new Map();
  private textures: Map<string, THREE.Texture> = new Map();
  private textureLoader: THREE.TextureLoader;
  
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Create a new material from configuration
   */
  public async createMaterial(config: MaterialConfig): Promise<THREE.Material> {
    let material: THREE.Material;

    switch (config.type) {
      case 'physical':
        material = await this.createPhysicalMaterial(config.parameters);
        break;
      case 'standard':
        material = await this.createStandardMaterial(config.parameters);
        break;
      default:
        material = await this.createPhysicalMaterial(config.parameters);
    }

    material.name = config.name;
    material.userData = { id: config.id, config };
    
    this.materials.set(config.id, material);
    return material;
  }

  /**
   * Create a MeshPhysicalMaterial with advanced PBR features
   */
  private async createPhysicalMaterial(params: MaterialParameters): Promise<THREE.MeshPhysicalMaterial> {
    const material = new THREE.MeshPhysicalMaterial();

    // Base color
    if (params.baseColor !== undefined) {
      material.color = new THREE.Color(params.baseColor);
    }
    if (params.baseColorTexture) {
      material.map = await this.loadTexture(params.baseColorTexture, params.textureTransform);
    }

    // Metalness
    if (params.metalness !== undefined) {
      material.metalness = params.metalness;
    }
    if (params.metalnessTexture) {
      material.metalnessMap = await this.loadTexture(params.metalnessTexture, params.textureTransform);
    }

    // Roughness
    if (params.roughness !== undefined) {
      material.roughness = params.roughness;
    }
    if (params.roughnessTexture) {
      material.roughnessMap = await this.loadTexture(params.roughnessTexture, params.textureTransform);
    }

    // Normal mapping
    if (params.normalTexture) {
      material.normalMap = await this.loadTexture(params.normalTexture, params.textureTransform);
      if (params.normalScale !== undefined) {
        material.normalScale = new THREE.Vector2(params.normalScale, params.normalScale);
      }
    }

    // Emissive
    if (params.emissive !== undefined) {
      material.emissive = new THREE.Color(params.emissive);
    }
    if (params.emissiveTexture) {
      material.emissiveMap = await this.loadTexture(params.emissiveTexture, params.textureTransform);
    }
    if (params.emissiveIntensity !== undefined) {
      material.emissiveIntensity = params.emissiveIntensity;
    }

    // Ambient Occlusion
    if (params.aoTexture) {
      material.aoMap = await this.loadTexture(params.aoTexture, params.textureTransform);
      if (params.aoIntensity !== undefined) {
        material.aoMapIntensity = params.aoIntensity;
      }
    }

    // Clearcoat
    if (params.clearcoat !== undefined) {
      material.clearcoat = params.clearcoat;
    }
    if (params.clearcoatTexture) {
      material.clearcoatMap = await this.loadTexture(params.clearcoatTexture, params.textureTransform);
    }
    if (params.clearcoatRoughness !== undefined) {
      material.clearcoatRoughness = params.clearcoatRoughness;
    }
    if (params.clearcoatRoughnessTexture) {
      material.clearcoatRoughnessMap = await this.loadTexture(params.clearcoatRoughnessTexture, params.textureTransform);
    }
    if (params.clearcoatNormalTexture) {
      material.clearcoatNormalMap = await this.loadTexture(params.clearcoatNormalTexture, params.textureTransform);
      if (params.clearcoatNormalScale !== undefined) {
        material.clearcoatNormalScale = new THREE.Vector2(params.clearcoatNormalScale, params.clearcoatNormalScale);
      }
    }

    // Sheen
    if (params.sheen !== undefined) {
      material.sheen = params.sheen;
    }
    if (params.sheenColor !== undefined) {
      material.sheenColor = new THREE.Color(params.sheenColor);
    }
    if (params.sheenColorTexture) {
      material.sheenColorMap = await this.loadTexture(params.sheenColorTexture, params.textureTransform);
    }
    if (params.sheenRoughness !== undefined) {
      material.sheenRoughness = params.sheenRoughness;
    }
    if (params.sheenRoughnessTexture) {
      material.sheenRoughnessMap = await this.loadTexture(params.sheenRoughnessTexture, params.textureTransform);
    }

    // Transmission
    if (params.transmission !== undefined) {
      material.transmission = params.transmission;
    }
    if (params.transmissionTexture) {
      material.transmissionMap = await this.loadTexture(params.transmissionTexture, params.textureTransform);
    }
    if (params.thickness !== undefined) {
      material.thickness = params.thickness;
    }
    if (params.thicknessTexture) {
      material.thicknessMap = await this.loadTexture(params.thicknessTexture, params.textureTransform);
    }
    if (params.attenuationDistance !== undefined) {
      material.attenuationDistance = params.attenuationDistance;
    }
    if (params.attenuationColor !== undefined) {
      material.attenuationColor = new THREE.Color(params.attenuationColor);
    }
    if (params.ior !== undefined) {
      material.ior = params.ior; // Main IOR property for realistic glass/water
    }

    // Iridescence
    if (params.iridescence !== undefined) {
      material.iridescence = params.iridescence;
    }
    if (params.iridescenceTexture) {
      material.iridescenceMap = await this.loadTexture(params.iridescenceTexture, params.textureTransform);
    }
    if (params.iridescenceIOR !== undefined) {
      material.iridescenceIOR = params.iridescenceIOR;
    }
    if (params.iridescenceThicknessRange) {
      material.iridescenceThicknessRange = params.iridescenceThicknessRange;
    }
    if (params.iridescenceThicknessTexture) {
      material.iridescenceThicknessMap = await this.loadTexture(params.iridescenceThicknessTexture, params.textureTransform);
    }

    // Specular workflow (alternative to metallic)
    if (params.specularIntensity !== undefined) {
      material.specularIntensity = params.specularIntensity;
    }
    if (params.specularColor !== undefined) {
      material.specularColor = new THREE.Color(params.specularColor);
    }
    if (params.specularColorTexture) {
      material.specularColorMap = await this.loadTexture(params.specularColorTexture, params.textureTransform);
    }
    if (params.specularIntensityTexture) {
      material.specularIntensityMap = await this.loadTexture(params.specularIntensityTexture, params.textureTransform);
    }

    // Displacement
    if (params.displacementTexture) {
      material.displacementMap = await this.loadTexture(params.displacementTexture, params.textureTransform);
      if (params.displacementScale !== undefined) {
        material.displacementScale = params.displacementScale;
      }
      if (params.displacementBias !== undefined) {
        material.displacementBias = params.displacementBias;
      }
    }

    // Transparency
    if (params.opacity !== undefined) {
      material.opacity = params.opacity;
    }
    if (params.alphaTexture) {
      material.alphaMap = await this.loadTexture(params.alphaTexture, params.textureTransform);
    }
    if (params.transparent !== undefined) {
      material.transparent = params.transparent;
    }
    if (params.alphaTest !== undefined) {
      material.alphaTest = params.alphaTest;
    }

    return material;
  }

  /**
   * Create a MeshStandardMaterial
   */
  private async createStandardMaterial(params: MaterialParameters): Promise<THREE.MeshStandardMaterial> {
    const material = new THREE.MeshStandardMaterial();

    // Base color
    if (params.baseColor !== undefined) {
      material.color = new THREE.Color(params.baseColor);
    }
    if (params.baseColorTexture) {
      material.map = await this.loadTexture(params.baseColorTexture, params.textureTransform);
    }

    // Metalness
    if (params.metalness !== undefined) {
      material.metalness = params.metalness;
    }
    if (params.metalnessTexture) {
      material.metalnessMap = await this.loadTexture(params.metalnessTexture, params.textureTransform);
    }

    // Roughness
    if (params.roughness !== undefined) {
      material.roughness = params.roughness;
    }
    if (params.roughnessTexture) {
      material.roughnessMap = await this.loadTexture(params.roughnessTexture, params.textureTransform);
    }

    // Normal mapping
    if (params.normalTexture) {
      material.normalMap = await this.loadTexture(params.normalTexture, params.textureTransform);
      if (params.normalScale !== undefined) {
        material.normalScale = new THREE.Vector2(params.normalScale, params.normalScale);
      }
    }

    // Emissive
    if (params.emissive !== undefined) {
      material.emissive = new THREE.Color(params.emissive);
    }
    if (params.emissiveTexture) {
      material.emissiveMap = await this.loadTexture(params.emissiveTexture, params.textureTransform);
    }
    if (params.emissiveIntensity !== undefined) {
      material.emissiveIntensity = params.emissiveIntensity;
    }

    // Ambient Occlusion
    if (params.aoTexture) {
      material.aoMap = await this.loadTexture(params.aoTexture, params.textureTransform);
      if (params.aoIntensity !== undefined) {
        material.aoMapIntensity = params.aoIntensity;
      }
    }

    // Displacement
    if (params.displacementTexture) {
      material.displacementMap = await this.loadTexture(params.displacementTexture, params.textureTransform);
      if (params.displacementScale !== undefined) {
        material.displacementScale = params.displacementScale;
      }
      if (params.displacementBias !== undefined) {
        material.displacementBias = params.displacementBias;
      }
    }

    // Transparency
    if (params.opacity !== undefined) {
      material.opacity = params.opacity;
    }
    if (params.alphaTexture) {
      material.alphaMap = await this.loadTexture(params.alphaTexture, params.textureTransform);
    }
    if (params.transparent !== undefined) {
      material.transparent = params.transparent;
    }
    if (params.alphaTest !== undefined) {
      material.alphaTest = params.alphaTest;
    }

    return material;
  }

  /**
   * Load and configure a texture
   */
  private async loadTexture(
    source: string | THREE.Texture, 
    transform?: TextureTransform
  ): Promise<THREE.Texture> {
    let texture: THREE.Texture;

    if (typeof source === 'string') {
      // Check cache first
      if (this.textures.has(source)) {
        texture = this.textures.get(source)!.clone();
      } else {
        texture = await new Promise<THREE.Texture>((resolve, reject) => {
          this.textureLoader.load(
            source,
            (loadedTexture) => {
              this.textures.set(source, loadedTexture);
              resolve(loadedTexture.clone());
            },
            undefined,
            reject
          );
        });
      }
    } else {
      texture = source.clone();
    }

    // Apply texture transform
    if (transform) {
      if (transform.offset) {
        texture.offset.set(transform.offset[0], transform.offset[1]);
      }
      if (transform.repeat) {
        texture.repeat.set(transform.repeat[0], transform.repeat[1]);
      }
      if (transform.rotation !== undefined) {
        texture.rotation = transform.rotation;
      }
      if (transform.center) {
        texture.center.set(transform.center[0], transform.center[1]);
      }
    }

    return texture;
  }

  /**
   * Update material parameters
   */
  public async updateMaterial(materialId: string, params: Partial<MaterialParameters>): Promise<void> {
    const material = this.materials.get(materialId);
    if (!material) {
      throw new Error(`Material with id ${materialId} not found`);
    }

    // Get the material config from userData
    const config = material.userData?.config as MaterialConfig;
    if (!config) {
      throw new Error(`Material configuration not found for ${materialId}`);
    }

    // Update the config
    Object.assign(config.parameters, params);

    // Recreate the material with updated parameters
    const updatedMaterial = await this.createMaterial(config);
    
    // Replace the old material
    this.materials.set(materialId, updatedMaterial);
    
    // Dispose the old material
    material.dispose();
  }

  /**
   * Get material by ID
   */
  public getMaterial(id: string): THREE.Material | undefined {
    return this.materials.get(id);
  }

  /**
   * Get all materials
   */
  public getAllMaterials(): Map<string, THREE.Material> {
    return new Map(this.materials);
  }

  /**
   * Remove material
   */
  public removeMaterial(id: string): void {
    const material = this.materials.get(id);
    if (material) {
      material.dispose();
      this.materials.delete(id);
    }
  }

  /**
   * Apply material to mesh
   */
  public applyMaterialToMesh(mesh: THREE.Mesh, materialId: string): void {
    const material = this.materials.get(materialId);
    if (material) {
      mesh.material = material;
    }
  }

  /**
   * Create procedural texture
   */
  public createProceduralTexture(
    type: 'noise' | 'gradient' | 'checker',
    options: any = {},
    size = 512
  ): THREE.DataTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    switch (type) {
      case 'checker':
        this.generateCheckerPattern(ctx, size, options);
        break;
      case 'gradient':
        this.generateGradientPattern(ctx, size, options);
        break;
      case 'noise':
        this.generateNoisePattern(ctx, size, options);
        break;
    }

    const imageData = ctx.getImageData(0, 0, size, size);
    const texture = new THREE.DataTexture(imageData.data, size, size);
    texture.needsUpdate = true;

    return texture;
  }

  private generateCheckerPattern(ctx: CanvasRenderingContext2D, size: number, options: any): void {
    const { checkSize = 32, color1 = '#ffffff', color2 = '#000000' } = options;
    
    for (let x = 0; x < size; x += checkSize) {
      for (let y = 0; y < size; y += checkSize) {
        const isEven = Math.floor(x / checkSize) % 2 === Math.floor(y / checkSize) % 2;
        ctx.fillStyle = isEven ? color1 : color2;
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }
  }

  private generateGradientPattern(ctx: CanvasRenderingContext2D, size: number, options: any): void {
    const { direction = 'horizontal', colors = ['#000000', '#ffffff'] } = options;
    
    let gradient: CanvasGradient;
    if (direction === 'horizontal') {
      gradient = ctx.createLinearGradient(0, 0, size, 0);
    } else if (direction === 'vertical') {
      gradient = ctx.createLinearGradient(0, 0, 0, size);
    } else {
      gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    }

    colors.forEach((color: string, index: number) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  private generateNoisePattern(ctx: CanvasRenderingContext2D, size: number, options: any): void {
    const { scale = 0.01, octaves = 4, persistence = 0.5 } = options;
    const imageData = ctx.createImageData(size, size);
    
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        let value = 0;
        let amplitude = 1;
        let frequency = scale;
        
        for (let i = 0; i < octaves; i++) {
          value += this.noise(x * frequency, y * frequency) * amplitude;
          amplitude *= persistence;
          frequency *= 2;
        }
        
        const index = (y * size + x) * 4;
        const gray = Math.floor((value + 1) * 127.5);
        imageData.data[index] = gray;     // R
        imageData.data[index + 1] = gray; // G
        imageData.data[index + 2] = gray; // B
        imageData.data[index + 3] = 255;  // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  private noise(x: number, y: number): number {
    // Simple noise function (Perlin-like)
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return 2 * (n - Math.floor(n)) - 1;
  }

  /**
   * Dispose all materials and textures
   */
  public dispose(): void {
    // Dispose all materials
    for (const material of this.materials.values()) {
      material.dispose();
    }
    this.materials.clear();

    // Dispose all textures
    for (const texture of this.textures.values()) {
      texture.dispose();
    }
    this.textures.clear();
  }
}
