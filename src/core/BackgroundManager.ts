import * as THREE from 'three';

/**
 * BackgroundManager handles scene background management
 * Supports solid colors, gradients, and HDRI environments
 */
export class BackgroundManager {
  private scene: THREE.Scene;
  private currentType: 'color' | 'gradient' | 'hdri' | 'none' = 'color';
  private solidColor: THREE.Color = new THREE.Color(0x222222);
  private gradientTop: THREE.Color = new THREE.Color(0x87CEEB);
  private gradientBottom: THREE.Color = new THREE.Color(0x98FB98);
  private hdriTexture: THREE.Texture | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setSolidColor(this.solidColor);
  }

  /**
   * Set solid color background
   */
  public setSolidColor(color: THREE.ColorRepresentation): void {
    this.solidColor.set(color);
    this.currentType = 'color';
    this.scene.background = this.solidColor;
  }

  /**
   * Set gradient background
   */
  public setGradient(topColor: THREE.ColorRepresentation, bottomColor: THREE.ColorRepresentation): void {
    this.gradientTop.set(topColor);
    this.gradientBottom.set(bottomColor);
    this.currentType = 'gradient';

    // Create gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, `#${this.gradientTop.getHexString()}`);
    gradient.addColorStop(1, `#${this.gradientBottom.getHexString()}`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    
    this.scene.background = texture;
  }

  /**
   * Set HDRI environment
   */
  public setHDRI(texture: THREE.Texture): void {
    this.hdriTexture = texture;
    this.currentType = 'hdri';
    this.scene.background = texture;
    this.scene.environment = texture;
  }

  /**
   * Remove background (transparent)
   */
  public setNone(): void {
    this.currentType = 'none';
    this.scene.background = null;
  }

  /**
   * Get current background type
   */
  public getCurrentType(): 'color' | 'gradient' | 'hdri' | 'none' {
    return this.currentType;
  }

  /**
   * Get solid color
   */
  public getSolidColor(): THREE.Color {
    return this.solidColor.clone();
  }

  /**
   * Get gradient colors
   */
  public getGradientColors(): { top: THREE.Color; bottom: THREE.Color } {
    return {
      top: this.gradientTop.clone(),
      bottom: this.gradientBottom.clone()
    };
  }

  /**
   * Get HDRI texture
   */
  public getHDRITexture(): THREE.Texture | null {
    return this.hdriTexture;
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    if (this.scene.background instanceof THREE.Texture) {
      this.scene.background.dispose();
    }
    if (this.hdriTexture) {
      this.hdriTexture.dispose();
    }
  }
}
