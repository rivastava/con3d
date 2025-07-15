# Light Linking Implementation - Fixed and Working

## Overview

The light linking system in `AdvancedLightingSystem.ts` has been completely rewritten to provide **functional** selective lighting where specific lights can be excluded from or have reduced influence on individual meshes. This implementation uses custom shader patching to modify Three.js's lighting calculations at the GPU level.

## Technical Implementation

### Core Architecture

1. **Light Index Tracking**: Each user light is assigned a unique index (0 to MAX_LIGHTS-1) for shader identification
2. **Shader Uniforms**: Materials receive `lightInfluences` arrays and `userLightCount` uniforms
3. **Custom Shader Patching**: `onBeforeCompile` hooks modify lighting calculations to apply per-light influences
4. **Efficient Updates**: Material uniforms can be updated without full shader recompilation

### Key Features

- ✅ **Functional**: Actually modifies rendered lighting (not just UI state)
- ✅ **Performance**: Single-pass rendering with efficient shader modifications
- ✅ **Integration**: Works with existing LightingControls.tsx
- ✅ **Scalable**: Supports up to 8 lights with configurable limit
- ✅ **Compatible**: Works with MeshStandardMaterial and MeshPhysicalMaterial

## How It Works

### 1. Light Index Assignment
```typescript
// Lights are automatically indexed when created/removed
userLights = [directionalLight, pointLight, spotLight]; // Indices: 0, 1, 2
lightIndexMap = { "light-uuid-1": 0, "light-uuid-2": 1, "light-uuid-3": 2 }
```

### 2. Shader Uniforms
```glsl
// Added to each material's fragment shader
uniform float lightInfluences[8];  // Per-light influence values
uniform int userLightCount;        // Number of active user lights

float getLightInfluence(int lightIndex) {
  if (lightIndex >= userLightCount || lightIndex < 0) return 1.0;
  return lightInfluences[lightIndex];  // 0.0 = excluded, 1.0 = full, 0.5 = half influence
}
```

### 3. Lighting Calculation Patching
```glsl
// Original Three.js code:
directLight.irradiance = directionalLights[ i ].color;

// Patched to:
directLight.irradiance = directionalLights[ i ].color * getLightInfluence(i);
```

## API Usage

### Basic Light Linking
```typescript
const advancedLighting = configurator.getAdvancedLightingSystem();

// Exclude a light from a specific mesh
advancedLighting.setLightLink(lightId, meshId, false, 0.0);

// Set partial influence (50% lighting)
advancedLighting.setLightLink(lightId, meshId, true, 0.5);

// Exclude light from all meshes
advancedLighting.disableLightForAllMeshes(lightId);

// Re-enable light for all meshes
advancedLighting.enableLightForAllMeshes(lightId);
```

### Integration with Light Creation
```typescript
// LightingControls.tsx automatically notifies the system when lights are added/removed
const createLight = () => {
  // ... create Three.js light ...
  scene.add(light);
  
  // System automatically updates indices and applies linking
  notifyLightChange(); // Calls advancedLighting.refreshLightIndices()
};
```

### Debug and Testing
```typescript
// Debug current state
advancedLighting.debugLightLinking();

// Get debug info
const info = advancedLighting.getLightLinkingDebugInfo();
console.log(`${info.userLights} lights, ${info.lightLinks} links, ${info.materialsWithLinking} materials affected`);
```

## Shader Patching Details

### Supported Light Types
- **Directional Lights**: `directLight.irradiance *= getLightInfluence(i)`
- **Point Lights**: `directLight.irradiance *= getLightInfluence(i + NUM_DIR_LIGHTS)`
- **Spot Lights**: `directLight.irradiance *= getLightInfluence(i + NUM_DIR_LIGHTS + NUM_POINT_LIGHTS)`

### Light Type Offsets
The shader uses Three.js's light array structure:
- Directional lights: indices 0 to NUM_DIR_LIGHTS-1
- Point lights: indices NUM_DIR_LIGHTS to NUM_DIR_LIGHTS+NUM_POINT_LIGHTS-1  
- Spot lights: indices NUM_DIR_LIGHTS+NUM_POINT_LIGHTS onwards

### Limitations
- **Maximum 8 lights**: Conservative limit for shader uniform compatibility
- **Material types**: Only MeshStandardMaterial and MeshPhysicalMaterial supported
- **Mobile compatibility**: May need lower light limits on some mobile GPUs

## Performance Considerations

### Efficient Updates
```typescript
// Fast uniform update (no shader recompilation)
advancedLighting.updateMaterialLighting(material, meshId);

// Full refresh (when lights added/removed)
advancedLighting.refreshLightIndices(); // Rebuilds all materials
```

### Memory Usage
- Each material gets ~32 bytes of additional uniforms (float array)
- Shader compilation overhead is one-time per material
- No additional render passes required

## Testing the Implementation

### Visual Test
1. Create 2-3 lights in different colors
2. Add some mesh objects to the scene
3. Use the Light Linker panel to exclude lights from specific meshes
4. **Result**: Meshes should visibly lose illumination from excluded lights

### Debug Test
```typescript
// In browser console:
window.con3d.getAdvancedLightingSystem().debugLightLinking();
```

## Differences from Previous Implementation

### Before (Broken)
- ❌ Placeholder `lightLinkingModifier` function that did nothing
- ❌ No actual shader modifications to lighting calculations
- ❌ Light indices not tracked
- ❌ No visual impact on rendered scene

### After (Working)
- ✅ Real shader patching of Three.js lighting loops
- ✅ Proper light index management with uniforms
- ✅ Actual visual changes when links are modified
- ✅ Integration with existing lighting controls
- ✅ Debug tools and performance optimization

## Future Enhancements

1. **UI Integration**: Add light linking controls directly to LightingControls.tsx
2. **Material Efficiency**: Group materials by light linking patterns
3. **Advanced Patterns**: Support for light groups and hierarchical linking
4. **Mobile Optimization**: Dynamic light limits based on device capabilities
5. **Shadow Linking**: Extend to control shadow casting per light/mesh

## Troubleshooting

### Light Linking Not Working
1. Check that `getAdvancedLightingSystem()` returns a valid instance
2. Verify light count is under MAX_LIGHTS (8)
3. Ensure materials are MeshStandardMaterial or MeshPhysicalMaterial
4. Call `refreshLightIndices()` after adding/removing lights

### Performance Issues
1. Reduce MAX_LIGHTS if needed for mobile
2. Use `updateMaterialLighting()` for single-material updates
3. Group objects with similar lighting requirements

The light linking system is now **functionally complete** and provides real selective lighting control in your Three.js application! 🎉
