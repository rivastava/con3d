import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { DRACOLoader } from 'three-stdlib';
import { KTX2Loader } from 'three-stdlib';
import { GLTFExporter } from 'three-stdlib';
import { MeshoptDecoder } from 'three-stdlib';
import { AssetConfig, AssetMetadata } from '@/types';
import { safeProdLog } from '../utils/developmentLogger';
import { debugModelImport } from '../utils/debugModelImport';

// GLTF Extension support types
interface GLTFExtensionSupport {
  KHR_draco_mesh_compression: boolean;
  KHR_texture_transform: boolean;
  KHR_materials_clearcoat: boolean;
  KHR_materials_ior: boolean;
  KHR_materials_sheen: boolean;
  KHR_materials_specular: boolean;
  KHR_materials_transmission: boolean;
  KHR_materials_unlit: boolean;
  KHR_materials_volume: boolean;
  KHR_materials_variants: boolean;
  KHR_texture_basisu: boolean;
  EXT_meshopt_compression: boolean;
  EXT_texture_webp: boolean;
  KHR_lights_punctual: boolean;
  KHR_materials_emissive_strength: boolean;
  KHR_materials_iridescence: boolean;
}

export class AssetManager {
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private ktx2Loader: KTX2Loader;
  private gltfExporter: GLTFExporter;
  private textureLoader: THREE.TextureLoader;
  
  private loadedModels: Map<string, THREE.Group> = new Map();
  private loadedTextures: Map<string, THREE.Texture> = new Map();
  private meshes: Map<string, THREE.Mesh> = new Map();
  
  private baseUrl: string;
  private supportedExtensions: GLTFExtensionSupport;

  constructor(options?: { baseUrl?: string; loaderOptions?: any }) {
    this.baseUrl = options?.baseUrl || '';
    
    // Initialize supported GLTF extensions
    this.supportedExtensions = {
      KHR_draco_mesh_compression: true,
      KHR_texture_transform: true,
      KHR_materials_clearcoat: true,
      KHR_materials_ior: true,
      KHR_materials_sheen: true,
      KHR_materials_specular: true,
      KHR_materials_transmission: true,
      KHR_materials_unlit: true,
      KHR_materials_volume: true,
      KHR_materials_variants: true,
      KHR_texture_basisu: true,
      EXT_meshopt_compression: true,
      EXT_texture_webp: true,
      KHR_lights_punctual: true,
      KHR_materials_emissive_strength: true,
      KHR_materials_iridescence: true,
    };
    
    // Initialize loaders
    this.gltfLoader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.ktx2Loader = new KTX2Loader();
    this.gltfExporter = new GLTFExporter();
    this.textureLoader = new THREE.TextureLoader();
    
    this.setupGLTFLoader();
    
    if (process.env.NODE_ENV !== 'development') {
      console.log('AssetManager initialized with enhanced GLTF extensions support');
    }
  }

  /**
   * Setup GLTF loader with enhanced extension support and robust error handling
   */
  private setupGLTFLoader(): void {
    try {
      // Configure Draco decoder for mesh compression
      this.dracoLoader.setDecoderPath('/draco/');
      this.gltfLoader.setDRACOLoader(this.dracoLoader);
      if (process.env.NODE_ENV !== 'development') {
        console.log('✓ DRACO mesh compression decoder configured');
      }
    } catch (error) {
      console.warn('⚠ DRACO decoder setup failed:', error);
      this.supportedExtensions.KHR_draco_mesh_compression = false;
    }
    
    try {
      // Configure KTX2 decoder for texture compression
      this.ktx2Loader.setTranscoderPath('/ktx2/');
      this.gltfLoader.setKTX2Loader(this.ktx2Loader);
      if (process.env.NODE_ENV !== 'development') {
        console.log('✓ KTX2 texture compression decoder configured');
      }
    } catch (error) {
      console.warn('⚠ KTX2 decoder setup failed:', error);
      this.supportedExtensions.KHR_texture_basisu = false;
    }
    
    try {
      // Enable Meshopt decoder for mesh optimization
      this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);
      if (process.env.NODE_ENV !== 'development') {
        console.log('✓ Meshopt mesh optimization decoder configured');
      }
    } catch (error) {
      console.warn('⚠ MeshoptDecoder setup failed:', error);
      this.supportedExtensions.EXT_meshopt_compression = false;
    }

    // Log supported extensions
    const enabledExtensions = Object.entries(this.supportedExtensions)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
    
    if (process.env.NODE_ENV !== 'development') {
      console.log(`GLTF Extensions enabled (${enabledExtensions.length}):`, enabledExtensions);
    }
  }

  /**
   * Load a 3D model with enhanced GLTF extension support
   */
  public async loadModel(url: string): Promise<THREE.Group> {
    const fullUrl = this.resolveUrl(url);
    
    // Check cache first
    if (this.loadedModels.has(fullUrl)) {
      if (process.env.NODE_ENV !== 'development') {
        console.log('Loading model from cache:', fullUrl);
      }
      return this.loadedModels.get(fullUrl)!.clone();
    }

    try {
      if (process.env.NODE_ENV !== 'development') {
        console.log('Loading model:', fullUrl);
      }
      
      const gltf = await new Promise<any>((resolve, reject) => {
        this.gltfLoader.load(
          fullUrl,
          (gltf) => {
            if (process.env.NODE_ENV !== 'development') {
              console.log('✓ Model loaded successfully:', fullUrl);
            }
            this.logGLTFExtensions(gltf);
            resolve(gltf);
          },
          (progress) => {
            const percent = progress.total > 0 ? (progress.loaded / progress.total * 100) : 0;
            if (process.env.NODE_ENV !== 'development') {
              console.log(`Loading progress: ${percent.toFixed(1)}%`);
            }
          },
          (error) => {
            console.error('✗ Model loading failed:', fullUrl, error);
            reject(new Error(`Failed to load model: ${error.message || 'Unknown error'}`));
          }
        );
      });

      const model = gltf.scene;
      model.name = this.getFileNameFromUrl(url);
      
      // Process the model with enhanced material and extension support
      this.processModelWithExtensions(model, gltf);
      
      // Debug logging for development
      if (process.env.NODE_ENV !== 'development') {
        debugModelImport(model);
      }
      
      // Cache the model
      this.loadedModels.set(fullUrl, model);
      
      if (process.env.NODE_ENV !== 'development') {
        console.log('✓ Model processed and cached:', model.name);
      }
      return model.clone();
    } catch (error) {
      console.error('Failed to load model:', error);
      
      // Provide fallback or enhanced error information
      if (error instanceof Error) {
        throw new Error(`Model loading failed for ${url}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Log GLTF extensions found in the loaded file
   */
  private logGLTFExtensions(gltf: any): void {
    if (gltf.parser && gltf.parser.json && process.env.NODE_ENV !== 'development') {
      const extensions = gltf.parser.json.extensionsUsed || [];
      const required = gltf.parser.json.extensionsRequired || [];
      
      if (extensions.length > 0) {
        console.log('GLTF Extensions used:', extensions);
        
        // Check which extensions we support
        const unsupported = extensions.filter((ext: string) => 
          !(ext in this.supportedExtensions) || !this.supportedExtensions[ext as keyof GLTFExtensionSupport]
        );
        
        if (unsupported.length > 0) {
          console.warn('⚠ Unsupported GLTF extensions detected:', unsupported);
        }
        
        if (required.length > 0) {
          console.log('Required extensions:', required);
          const missingRequired = required.filter((ext: string) => 
            !(ext in this.supportedExtensions) || !this.supportedExtensions[ext as keyof GLTFExtensionSupport]
          );
          
          if (missingRequired.length > 0) {
            console.error('✗ Missing required GLTF extensions:', missingRequired);
          }
        }
      }
    }
  }

  /**
   * Load a texture
   */
  public async loadTexture(url: string): Promise<THREE.Texture> {
    const fullUrl = this.resolveUrl(url);
    
    // Check cache first
    if (this.loadedTextures.has(fullUrl)) {
      return this.loadedTextures.get(fullUrl)!.clone();
    }

    try {
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        this.textureLoader.load(
          fullUrl,
          (texture) => resolve(texture),
          undefined,
          (error) => reject(error)
        );
      });

      // Cache the texture
      this.loadedTextures.set(fullUrl, texture);
      
      return texture.clone();
    } catch (error) {
      console.error('Failed to load texture:', error);
      throw error;
    }
  }

  /**
   * Process loaded model with enhanced GLTF extension support
   */
  private processModelWithExtensions(model: THREE.Group, gltf: any): void {
    let meshIndex = 0;
    
    // DO NOT apply transforms automatically - let users choose when to apply them
    // this.applyModelTransforms(model); // REMOVED - this was causing all pivots to reset to (0,0,0)
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Generate unique ID for mesh
        const meshId = `mesh_${meshIndex++}`;
        child.userData.id = meshId;
        child.name = child.name || meshId;
        
        // Store mesh reference
        this.meshes.set(meshId, child);
        
        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Enhanced material processing with GLTF extension support
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => this.processMaterialWithExtensions(mat, gltf));
          } else {
            this.processMaterialWithExtensions(child.material, gltf);
          }
        }
        
        // Ensure mesh is ready for selection and editing
        this.ensureMeshEditability(child);
      }
      
      // Process lights if KHR_lights_punctual extension is used
      if (child.userData && child.userData.gltfExtensions && child.userData.gltfExtensions.KHR_lights_punctual) {
        this.processGLTFLight(child, gltf);
      }
    });
    
    // Process animations if present
    if (gltf.animations && gltf.animations.length > 0) {
      if (process.env.NODE_ENV !== 'development') {
        console.log(`Found ${gltf.animations.length} animation(s)`);
      }
      // Store animations in userData for later access
      model.userData.animations = gltf.animations;
    }
    
    // Process variants if KHR_materials_variants extension is used
    if (gltf.parser && gltf.parser.json.extensions && gltf.parser.json.extensions.KHR_materials_variants) {
      this.processMaterialVariants(model, gltf);
    }
  }

  /**
   * Process material with enhanced GLTF extension support
   */
  private processMaterialWithExtensions(material: THREE.Material, _gltf: any): void {
    // Convert all materials to MeshPhysicalMaterial for consistent editing
    if (material instanceof THREE.MeshBasicMaterial && !(material instanceof THREE.MeshPhysicalMaterial)) {
      // Skip conversion for basic materials, but ensure they're editable
      material.userData.materialType = 'basic';
      material.userData.editable = true;
      return;
    }
    
    // For imported models, ensure materials are editable and properly configured
    if (material instanceof THREE.MeshStandardMaterial || 
        material instanceof THREE.MeshPhysicalMaterial) {
      
      // Mark as editable
      material.userData.editable = true;
      material.userData.imported = true;
      
      // Ensure proper texture encoding
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
      }
      if (material.emissiveMap) {
        material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      }
      
      // Set up for realistic rendering
      material.envMapIntensity = 1.0;
      
      // Handle KHR_materials_transmission extension
      if (material instanceof THREE.MeshPhysicalMaterial) {
        // Already handled by three.js GLTFLoader
        if (material.transmission > 0) {
          safeProdLog('✓ Transmission material detected');
          material.transparent = true;
        }
      }
      
      // Handle KHR_materials_volume extension
      if (material instanceof THREE.MeshPhysicalMaterial && material.thickness > 0) {
        safeProdLog('✓ Volume material detected');
      }
      
      // Handle KHR_materials_clearcoat extension
      if (material instanceof THREE.MeshPhysicalMaterial && material.clearcoat > 0) {
        safeProdLog('✓ Clearcoat material detected');
      }
      
      // Handle KHR_materials_sheen extension
      if (material instanceof THREE.MeshPhysicalMaterial && material.sheen > 0) {
        safeProdLog('✓ Sheen material detected');
      }
      
      // Handle KHR_materials_iridescence extension
      if (material instanceof THREE.MeshPhysicalMaterial && material.iridescence > 0) {
        safeProdLog('✓ Iridescence material detected');
      }
      
      // Ensure material updates properly
      material.needsUpdate = true;
    } else {
      // For other material types, mark them as needing conversion
      material.userData.needsConversion = true;
      material.userData.originalType = material.type;
      material.userData.editable = true;
    }
  }

  /**
   * Process GLTF lights from KHR_lights_punctual extension
   */
  private processGLTFLight(object: THREE.Object3D, _gltf: any): void {
    // KHR_lights_punctual processing would go here
    // This is typically handled by the GLTFLoader automatically
    if (process.env.NODE_ENV !== 'development') {
      console.log('✓ GLTF light processed:', object.name);
    }
  }

  /**
   * Process material variants from KHR_materials_variants extension
   */
  private processMaterialVariants(model: THREE.Group, _gltf: any): void {
    // Material variants processing would go here
    // This allows switching between different material configurations
    if (process.env.NODE_ENV !== 'development') {
      console.log('✓ Material variants available');
    }
    model.userData.materialVariants = true;
  }

  /**
   * Get mesh by ID
   */
  public getMesh(id: string): THREE.Mesh | undefined {
    return this.meshes.get(id);
  }

  /**
   * Get all loaded meshes
   */
  public getAllMeshes(): Map<string, THREE.Mesh> {
    return new Map(this.meshes);
  }

  /**
   * Clear all loaded assets from scene
   */
  public clearScene(): void {
    // This would typically remove objects from the scene
    // Implementation depends on how the scene is managed
    this.meshes.clear();
  }

  /**
   * Export scene as GLTF
   */
  public async exportGLTF(): Promise<ArrayBuffer> {
    // Create a scene with all loaded models
    const exportScene = new THREE.Scene();
    
    for (const model of this.loadedModels.values()) {
      exportScene.add(model.clone());
    }

    return new Promise((resolve, reject) => {
      this.gltfExporter.parse(
        exportScene,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            resolve(gltf);
          } else {
            // Convert JSON to ArrayBuffer
            const jsonString = JSON.stringify(gltf);
            const buffer = new TextEncoder().encode(jsonString);
            resolve(buffer);
          }
        },
        (error) => reject(error),
        { binary: true }
      );
    });
  }

  /**
   * Get asset metadata
   */
  public async getAssetMetadata(url: string): Promise<AssetMetadata> {
    // This would typically fetch metadata from a backend service
    // For now, return basic info
    return {
      fileSize: 0,
      format: this.getFileExtension(url),
      tags: [],
      description: '',
      license: 'Unknown'
    };
  }

  /**
   * Create asset configuration
   */
  public createAssetConfig(
    id: string,
    name: string,
    type: 'model' | 'texture' | 'hdri' | 'material',
    url: string
  ): AssetConfig {
    return {
      id,
      name,
      type,
      url,
      metadata: {
        fileSize: 0,
        format: this.getFileExtension(url),
        tags: [],
        description: '',
        license: 'Unknown'
      }
    };
  }

  /**
   * Preload assets
   */
  public async preloadAssets(urls: string[]): Promise<void> {
    const promises = urls.map(url => {
      const extension = this.getFileExtension(url);
      
      if (this.isModelExtension(extension)) {
        return this.loadModel(url);
      } else if (this.isTextureExtension(extension)) {
        return this.loadTexture(url);
      } else {
        console.warn(`Unsupported asset type: ${extension}`);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get loading progress
   */
  public getLoadingProgress(): { loaded: number; total: number } {
    // This would track loading progress across all assets
    // For now, return a placeholder
    return { loaded: 0, total: 0 };
  }

  // Utility methods
  private resolveUrl(url: string): string {
    if (url.startsWith('http') || url.startsWith('/')) {
      return url;
    }
    return this.baseUrl + url;
  }

  private getFileNameFromUrl(url: string): string {
    return url.split('/').pop()?.split('.')[0] || 'untitled';
  }

  private getFileExtension(url: string): string {
    return url.split('.').pop()?.toLowerCase() || '';
  }

  private isModelExtension(ext: string): boolean {
    return ['gltf', 'glb', 'fbx', 'obj'].includes(ext);
  }

  private isTextureExtension(ext: string): boolean {
    return ['jpg', 'jpeg', 'png', 'webp', 'hdr', 'exr', 'ktx2'].includes(ext);
  }

  /**
   * Dispose all loaded assets
   */
  public dispose(): void {
    // Dispose loaded models
    for (const model of this.loadedModels.values()) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
    this.loadedModels.clear();

    // Dispose loaded textures
    for (const texture of this.loadedTextures.values()) {
      texture.dispose();
    }
    this.loadedTextures.clear();

    // Clear mesh references
    this.meshes.clear();

    // Dispose loaders
    this.dracoLoader.dispose();
    this.ktx2Loader.dispose();
  }

  /**
   * Ensure mesh has editable material and proper setup for selection
   */
  public ensureMeshEditability(mesh: THREE.Mesh): void {
    // Ensure mesh has proper geometry for selection
    if (mesh.geometry) {
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
    }
    
    // Mark as selectable
    mesh.userData.selectable = true;
    mesh.userData.materialEditable = true;
    
    // Ensure material is in a compatible format
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => {
          mat.userData.editable = true;
          mat.needsUpdate = true;
        });
      } else {
        mesh.material.userData.editable = true;
        mesh.material.needsUpdate = true;
      }
    }
    
    if (process.env.NODE_ENV !== 'development') {
      console.log(`✓ Mesh "${mesh.name}" prepared for editing and selection`);
    }
  }

  /**
   * Apply transforms to model geometry (like Blender's "Apply Transform")
   * This bakes the current transform into the geometry and resets object transform to identity
   * The mesh stays visually in the same place but the origin moves to (0,0,0)
   */
  public applyModelTransforms(model: THREE.Group, onComplete?: () => void): void {
    let appliedCount = 0;
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        // Store original material references before any modifications
        const originalMaterial = child.material;
        const originalUserData = { ...child.userData };
        
        // Check if the mesh has any non-identity transforms
        const hasTransforms = 
          !child.position.equals(new THREE.Vector3(0, 0, 0)) ||
          !child.rotation.equals(new THREE.Euler(0, 0, 0)) ||
          !child.scale.equals(new THREE.Vector3(1, 1, 1));
          
        if (hasTransforms) {
          // Create a matrix from the current transform
          const matrix = new THREE.Matrix4();
          matrix.compose(child.position, child.quaternion, child.scale);
          
          // Apply the transform to the geometry vertices (this is the key step)
          // This moves the vertices so the mesh stays visually in the same place
          // even after we reset the object transform to identity
          child.geometry.applyMatrix4(matrix);
          
          // Update bounding box and sphere after geometry modification
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();
          
          // Recompute vertex normals for correct shading after transform
          child.geometry.computeVertexNormals();
          
          // Reset the object transform to identity (like Blender)
          // This moves the origin/pivot to world center (0,0,0)
          child.position.set(0, 0, 0);
          child.rotation.set(0, 0, 0);
          child.scale.set(1, 1, 1);
          
          // Update matrix world after transform reset
          child.updateMatrixWorld(true);
          
          console.log(`🎯 Applied transform to "${child.name}", origin now at (0,0,0)`);
          
          appliedCount++;
        }
        
        // Restore material references and userData (critical for selection)
        child.material = originalMaterial;
        child.userData = { ...originalUserData };
        
        // Ensure mesh remains selectable and editable
        this.ensureMeshEditability(child);
        
        // Force material update if it exists
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.needsUpdate = true;
            });
          } else {
            child.material.needsUpdate = true;
          }
        }
      }
    });
    
    // Apply transforms to the root group as well if needed
    const hasRootTransforms = 
      !model.position.equals(new THREE.Vector3(0, 0, 0)) ||
      !model.rotation.equals(new THREE.Euler(0, 0, 0)) ||
      !model.scale.equals(new THREE.Vector3(1, 1, 1));
      
    if (hasRootTransforms) {
      // For root group, we need to apply transforms to all children
      const matrix = new THREE.Matrix4();
      matrix.compose(model.position, model.quaternion, model.scale);
      
      model.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.geometry) {
          // Store material references before applying matrix
          const originalMaterial = child.material;
          const originalUserData = { ...child.userData };
          
          child.geometry.applyMatrix4(matrix);
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();
          child.geometry.computeVertexNormals();
          
          // Restore material and userData
          child.material = originalMaterial;
          child.userData = { ...originalUserData };
          
          // Ensure mesh remains selectable
          this.ensureMeshEditability(child);
        } else {
          // For non-mesh children, apply transform to their position
          child.applyMatrix4(matrix);
        }
      });
      
      // Reset root transform to identity (origin moves to world center)
      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      
      // Update matrix world after transform reset
      model.updateMatrixWorld(true);
      
      console.log(`🎯 Applied root transform, origin now at (0,0,0)`);
      appliedCount++;
    }
    
    if (process.env.NODE_ENV !== 'development') {
      console.log(`✓ Applied transforms for ${appliedCount} objects in model "${model.name}"`);
      console.log(`✓ Materials preserved and meshes remain selectable`);
    }
    
    // Call completion callback if provided
    if (onComplete) {
      // Use setTimeout to ensure all geometry updates are complete
      setTimeout(onComplete, 0);
    }
  }
}
