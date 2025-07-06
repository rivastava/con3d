# Con3D Material Configurator

A comprehensive API-first 3D material configurator and viewer built on Three.js r178. The industry's most advanced, embeddable configurator with photorealistic lighting, full PBR workflows, dynamic texture tools, and a rich JavaScript API for seamless third-party integration.

## Features

### Core Capabilities
- **Photorealistic PBR Rendering** - Full physically-based materials with advanced features
- **Real-time Material Editor** - Live parameter tweaking with instant feedback
- **HDRI Environment Support** - High-quality environment mapping and lighting
- **Dynamic Texture Painting** - Paint directly on UV maps with brush tools
- **Advanced Lighting System** - Multiple light types with real-time shadows
- **Post-processing Pipeline** - Bloom, SSAO, tone mapping, and more
- **Asset Management** - Smart loading, caching, and optimization
- **API-First Design** - Complete programmatic control via JavaScript API

### Material System
- **Advanced PBR Properties**: Base color, metalness, roughness, normal mapping, emission
- **Extended Features**: Clearcoat, sheen, transmission, iridescence, displacement
- **Procedural Textures**: Built-in noise, gradient, and pattern generators
- **Texture Transforms**: UV offset, repeat, rotation controls
- **Material Presets**: 100+ curated material library

### Lighting & Environment
- **HDRI Support**: .hdr/.exr loading with intensity and rotation controls
- **Dynamic Lights**: Directional, point, spot, hemisphere, and area lights
- **Real-time Shadows**: PCF soft shadows with configurable quality
- **Tone Mapping**: ACESFilmic, Reinhard, and custom tone mapping curves
- **Environment Presets**: Studio, outdoor, and artistic lighting setups

## Installation

```bash
npm install con3d-material-configurator
```

## Asset Setup

To load default assets when the application starts, place your files in the following locations:

### Default Model
Place your `baseModel.glb` file here:
```
public/assets/models/baseModel.glb
```

### Default HDRI Environment
Place your `baseHDRI.hdr` file here:
```
public/assets/hdri/baseHDRI.hdr
```

### Asset Structure
```
public/
├── assets/
│   ├── models/
│   │   └── baseModel.glb       # Your default 3D model
│   └── hdri/
│       └── baseHDRI.hdr        # Your default HDRI environment
```

The application will automatically load these files when it starts. If the files are not found, the application will still run but display a warning in the console.

### File Formats Supported
- **Models:** .glb, .gltf
- **HDRI:** .hdr, .exr
- **Textures:** .jpg, .png, .webp

## Quick Start

### Basic Integration

```typescript
import { initializeCon3D } from 'con3d-material-configurator';

const configurator = initializeCon3D({
  apiKey: 'your-api-key',
  containerId: 'con3d-container',
  options: {
    renderer: {
      antialias: true,
      toneMapping: 'ACESFilmic',
      shadowMapType: 'PCFSoft'
    },
    camera: {
      fov: 75,
      position: [5, 5, 5]
    },
    ui: {
      theme: 'light',
      showStats: true
    }
  }
});

// Wait for initialization
configurator.events.on('ready', () => {
  console.log('Configurator ready!');
});
```

### React Integration

```tsx
import React from 'react';
import { Con3DComponent } from 'con3d-material-configurator';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Con3DComponent
        apiKey="your-api-key"
        containerId="con3d-canvas"
        options={{
          ui: { theme: 'light' },
          renderer: { antialias: true }
        }}
        onReady={(configurator) => {
          console.log('Configurator ready:', configurator);
        }}
      />
    </div>
  );
}
```

## API Reference

### Material API

```typescript
// Create a new material
const material = await configurator.material.create({
  name: 'My Material',
  type: 'physical',
  parameters: {
    baseColor: '#ff6b35',
    metalness: 0.8,
    roughness: 0.2,
    normalScale: 1.0,
    emissive: '#000000'
  }
});

// Update material parameters
await configurator.material.update(material.id, {
  metalness: 0.5,
  roughness: 0.3
});

// Apply to mesh
await configurator.material.apply('mesh-id', material.id);
```

### Environment API

```typescript
// Set HDRI environment
await configurator.environment.setHDRI('/assets/studio.hdr', {
  intensity: 1.2,
  rotation: Math.PI / 4,
  blur: 0.1
});

// Set gradient environment
await configurator.environment.set({
  id: 'gradient-env',
  name: 'Gradient',
  type: 'gradient',
  parameters: {
    topColor: '#87CEEB',
    bottomColor: '#FFFFFF'
  }
});
```

### Lighting API

```typescript
// Add directional light
await configurator.lighting.add({
  name: 'Key Light',
  type: 'directional',
  parameters: {
    color: '#ffffff',
    intensity: 1.0,
    position: [10, 10, 5],
    castShadow: true,
    shadowMapSize: 2048
  }
});

// Update light
await configurator.lighting.update('light-id', {
  intensity: 1.5,
  position: [15, 15, 8]
});
```

### Scene API

```typescript
// Load 3D model
await configurator.scene.load('/models/product.gltf');

// Export as image
const imageDataUrl = await configurator.scene.exportImage({
  width: 1920,
  height: 1080,
  format: 'png'
});

// Export as GLTF
const gltfBuffer = await configurator.scene.exportGLTF();
```

## Advanced Features

### Texture Painting

```typescript
// Enable texture painting mode
configurator.painting.setActive(true);

// Configure brush
configurator.painting.setBrush({
  size: 50,
  opacity: 0.8,
  hardness: 0.5,
  type: 'round'
});

// Paint on UV coordinates
configurator.painting.paint(0.5, 0.3, '#ff0000');
```

### Post-Processing

```typescript
// Enable effects
configurator.enablePostProcessing(['bloom', 'fxaa', 'ssao']);

// Configure bloom
configurator.postProcessing.updateEffect('bloom', {
  intensity: 1.5,
  threshold: 0.9,
  radius: 0.8
});
```

### Custom Materials

```typescript
// Create procedural texture
const noiseTexture = configurator.material.createProceduralTexture('noise', {
  scale: 0.02,
  octaves: 4,
  persistence: 0.5
});

// Advanced material with all PBR features
const advancedMaterial = await configurator.material.create({
  name: 'Car Paint',
  type: 'physical',
  parameters: {
    baseColor: '#1a237e',
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    normalTexture: '/textures/car-normal.jpg',
    normalScale: 0.5,
    emissive: '#000000',
    envMapIntensity: 1.0
  }
});
```

## Configuration Options

### Renderer Options

```typescript
renderer: {
  antialias: boolean;           // Enable antialiasing
  toneMapping: string;          // 'Linear', 'Reinhard', 'ACESFilmic'
  toneMappingExposure: number;  // Exposure value
  shadowMapType: string;        // 'Basic', 'PCF', 'PCFSoft'
  outputColorSpace: string;     // 'sRGB', 'LinearSRGB'
}
```

### Camera Options

```typescript
camera: {
  fov: number;                  // Field of view
  near: number;                 // Near clipping plane
  far: number;                  // Far clipping plane
  position: [number, number, number]; // Initial position
}
```

### UI Options

```typescript
ui: {
  theme: 'light' | 'dark' | 'auto';
  panels: UIPanel[];            // Custom UI panels
  showStats: boolean;           // Show performance stats
  showGridHelper: boolean;      // Show grid
  showAxesHelper: boolean;      // Show coordinate axes
}
```

## Events

```typescript
// Listen to material changes
configurator.events.on('material:updated', (data) => {
  console.log('Material updated:', data);
});

// Listen to environment changes
configurator.events.on('environment:changed', (data) => {
  console.log('Environment changed:', data);
});

// Listen to scene events
configurator.events.on('scene:loaded', (data) => {
  console.log('Scene loaded:', data);
});
```

## Performance Optimization

### Asset Loading

```typescript
// Preload assets
await configurator.assets.preloadAssets([
  '/models/product.gltf',
  '/textures/base-color.jpg',
  '/hdri/studio.hdr'
]);

// Enable compression
options.assets = {
  loaderOptions: {
    dracoDecoderPath: '/draco/',
    ktx2DecoderPath: '/ktx2/'
  }
};
```

### Quality Settings

```typescript
// Adaptive quality
options.performance = {
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  enableLOD: true,
  enableInstancing: true,
  enableFrustumCulling: true
};
```

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+

WebGL 2.0 required for full feature support.

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: [https://docs.con3d.io](https://docs.con3d.io)
- GitHub Issues: [https://github.com/con3d/material-configurator/issues](https://github.com/con3d/material-configurator/issues)
- Discord Community: [https://discord.gg/con3d](https://discord.gg/con3d)

## Examples

Check out the `/examples` directory for:
- Basic integration
- React integration
- Advanced material editor
- Custom UI components
- Performance optimization
- Asset pipeline setup
