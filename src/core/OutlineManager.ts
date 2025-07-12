import * as THREE from 'three';

/**
 * OutlineManager handles Blender-like contour highlighting for selected meshes
 * Uses a combination of outline shader and post-processing for professional-grade selection feedback
 */
export class OutlineManager {
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private outlineScene: THREE.Scene;
  private outlineMaterial: THREE.ShaderMaterial;
  private selectedMeshes: Set<THREE.Mesh> = new Set();
  private outlineColor = new THREE.Color(0x00bfff); // Blender-like cyan
  private outlineThickness = 2.0;
  private outlineAlpha = 0.8;

  // Outline shader for edge detection
  private static readonly vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  private static readonly fragmentShader = `
    uniform vec3 outlineColor;
    uniform float outlineAlpha;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      // Calculate edge factor based on normal and view direction
      vec3 viewDirection = normalize(-vPosition);
      float edgeFactor = 1.0 - abs(dot(vNormal, viewDirection));
      
      // Create soft outline effect
      float outline = smoothstep(0.0, 1.0, edgeFactor);
      outline = pow(outline, 2.0); // Sharpen the edge
      
      gl_FragColor = vec4(outlineColor, outline * outlineAlpha);
    }
  `;

  constructor(_scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.camera = camera;
    this.renderer = renderer;
    
    // Create separate scene for outlines
    this.outlineScene = new THREE.Scene();
    
    // Create outline material
    this.outlineMaterial = new THREE.ShaderMaterial({
      vertexShader: OutlineManager.vertexShader,
      fragmentShader: OutlineManager.fragmentShader,
      uniforms: {
        outlineColor: { value: this.outlineColor },
        outlineAlpha: { value: this.outlineAlpha }
      },
      transparent: true,
      side: THREE.BackSide, // Render back faces for outline effect
      depthTest: true,
      depthWrite: false
    });
  }

  /**
   * Add mesh to selection outline
   */
  public selectMesh(mesh: THREE.Mesh): void {
    if (this.selectedMeshes.has(mesh)) return;
    
    this.selectedMeshes.add(mesh);
    this.createOutlineForMesh(mesh);
  }

  /**
   * Remove mesh from selection outline
   */
  public deselectMesh(mesh: THREE.Mesh): void {
    if (!this.selectedMeshes.has(mesh)) return;
    
    this.selectedMeshes.delete(mesh);
    this.removeOutlineForMesh(mesh);
  }

  /**
   * Clear all selections
   */
  public clearSelection(): void {
    this.selectedMeshes.forEach(mesh => {
      this.removeOutlineForMesh(mesh);
    });
    this.selectedMeshes.clear();
  }

  /**
   * Set a single mesh as selected (clears previous selection)
   */
  public setSelectedMesh(mesh: THREE.Mesh | null): void {
    this.clearSelection();
    if (mesh) {
      this.selectMesh(mesh);
    }
  }

  /**
   * Create outline effect for a specific mesh
   */
  private createOutlineForMesh(mesh: THREE.Mesh): void {
    try {
      // Create outline mesh with slightly larger scale
      const outlineMesh = new THREE.Mesh(mesh.geometry, this.outlineMaterial.clone());
      
      // Copy transform from original mesh
      outlineMesh.matrix.copy(mesh.matrix);
      outlineMesh.matrixAutoUpdate = false;
      
      // Calculate proper bounding box for the mesh geometry
      const boundingBox = new THREE.Box3();
      
      // For groups or complex hierarchies, calculate actual mesh bounds
      if (mesh.parent && mesh.parent.type === 'Group') {
        // Calculate bounding box from geometry directly
        boundingBox.setFromObject(mesh);
      } else {
        // For individual meshes, use geometry bounds
        if (mesh.geometry.boundingBox) {
          boundingBox.copy(mesh.geometry.boundingBox);
        } else {
          mesh.geometry.computeBoundingBox();
          boundingBox.copy(mesh.geometry.boundingBox!);
        }
      }
      
      // Calculate appropriate outline thickness based on actual mesh size
      const size = boundingBox.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      
      // Scale outline based on mesh size, not world scale
      let outlineScale = 1.0;
      if (maxDimension > 0) {
        // For very small objects, use a smaller outline scale
        if (maxDimension < 0.1) {
          outlineScale = 1.02; // 2% larger for tiny objects
        } else if (maxDimension < 1.0) {
          outlineScale = 1.01; // 1% larger for small objects  
        } else {
          outlineScale = 1.005; // 0.5% larger for normal objects
        }
      }
      
      outlineMesh.scale.setScalar(outlineScale);
      
      // Store reference for cleanup
      outlineMesh.name = `outline-${mesh.uuid}`;
      outlineMesh.userData.originalMesh = mesh;
      
      // Add to outline scene
      this.outlineScene.add(outlineMesh);
      
      // Store reference on original mesh for easy removal
      (mesh as any).__outlineMesh = outlineMesh;
      
    } catch (error) {
      console.warn('Failed to create outline for mesh:', error);
    }
  }

  /**
   * Remove outline effect for a specific mesh
   */
  private removeOutlineForMesh(mesh: THREE.Mesh): void {
    const outlineMesh = (mesh as any).__outlineMesh;
    if (outlineMesh) {
      this.outlineScene.remove(outlineMesh);
      
      // Dispose of cloned material
      if (outlineMesh.material && outlineMesh.material !== this.outlineMaterial) {
        outlineMesh.material.dispose();
      }
      
      delete (mesh as any).__outlineMesh;
    }
  }

  /**
   * Update outline transforms to match selected meshes
   */
  public update(): void {
    this.selectedMeshes.forEach(mesh => {
      const outlineMesh = (mesh as any).__outlineMesh;
      if (outlineMesh) {
        // Update transform to match original mesh
        outlineMesh.matrix.copy(mesh.matrix);
        outlineMesh.updateMatrixWorld(true);
      }
    });
  }

  /**
   * Render outlines (call this after main scene render)
   */
  public render(): void {
    if (this.outlineScene.children.length === 0) return;
    
    // Save current render state
    const originalClearColor = this.renderer.getClearColor(new THREE.Color());
    const originalClearAlpha = this.renderer.getClearAlpha();
    const originalAutoClear = this.renderer.autoClear;
    
    // Configure for outline rendering
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    
    // Render outlines
    this.renderer.render(this.outlineScene, this.camera);
    
    // Restore render state
    this.renderer.setClearColor(originalClearColor, originalClearAlpha);
    this.renderer.autoClear = originalAutoClear;
  }

  /**
   * Set outline color (Blender-like cyan by default)
   */
  public setOutlineColor(color: THREE.ColorRepresentation): void {
    this.outlineColor.set(color);
    this.outlineMaterial.uniforms.outlineColor.value = this.outlineColor;
    
    // Update all outline materials
    this.outlineScene.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
        child.material.uniforms.outlineColor.value = this.outlineColor;
      }
    });
  }

  /**
   * Set outline thickness
   */
  public setOutlineThickness(thickness: number): void {
    this.outlineThickness = thickness;
    
    // Update scale factor for all existing outlines
    this.selectedMeshes.forEach(mesh => {
      const outlineMesh = (mesh as any).__outlineMesh;
      if (outlineMesh) {
        const scale = new THREE.Vector3();
        mesh.getWorldScale(scale);
        const outlineScale = Math.max(scale.x, scale.y, scale.z) * (this.outlineThickness * 0.01) + 1.001;
        outlineMesh.scale.setScalar(outlineScale);
      }
    });
  }

  /**
   * Set outline alpha/opacity
   */
  public setOutlineAlpha(alpha: number): void {
    this.outlineAlpha = alpha;
    this.outlineMaterial.uniforms.outlineAlpha.value = alpha;
    
    // Update all outline materials
    this.outlineScene.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
        child.material.uniforms.outlineAlpha.value = alpha;
      }
    });
  }

  /**
   * Check if mesh is selected
   */
  public isSelected(mesh: THREE.Mesh): boolean {
    return this.selectedMeshes.has(mesh);
  }

  /**
   * Get all selected meshes
   */
  public getSelectedMeshes(): THREE.Mesh[] {
    return Array.from(this.selectedMeshes);
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.clearSelection();
    this.outlineMaterial.dispose();
    
    // Clear outline scene
    while (this.outlineScene.children.length > 0) {
      const child = this.outlineScene.children[0];
      this.outlineScene.remove(child);
      
      if (child instanceof THREE.Mesh && child.material) {
        child.material.dispose();
      }
    }
  }
}
