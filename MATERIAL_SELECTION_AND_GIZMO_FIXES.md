# Material Selection and Gizmo Fixes After Transform Application

## Issues Addressed

### 1. Material Selection Not Working After Transform Application
**Problem**: After applying transforms to imported 3D models (baking transforms into geometry), materials could no longer be selected or edited.

**Root Cause**: The MaterialEditorEnhanced component's useEffect was only triggered when the selectedMesh object changed, but not when the mesh's geometry was modified. After applying transforms, the mesh object remained the same but its geometry.uuid changed.

**Solution**: Enhanced the dependency array of the material editor's useEffect to include geometry and material references:
```tsx
}, [
  selectedMesh, 
  selectedMesh?.geometry?.uuid, 
  selectedMesh?.material, 
  Array.isArray(selectedMesh?.material) 
    ? selectedMesh.material[0]?.uuid 
    : (selectedMesh?.material as THREE.Material)?.uuid
];
```

### 2. Gizmo Positioning Incorrectly at (0,0,0) After Transform Application
**Problem**: After applying transforms, the gizmo would position itself at (0,0,0) instead of the visual center of the object.

**Root Cause**: The gizmo was reading the mesh's transform values (which are now 0,0,0 after applying) instead of the geometry's visual position.

**Solution**: Updated the NonInterferingTransformControls to handle geometry changes properly:
- Added visual center calculation before geometry modifications
- Enhanced updateAfterGeometryChange() method to maintain gizmo positioning
- Forced proper bounds recalculation after geometry matrix application

### 3. X Y Z Mesh Components Appearing in Selection
**Problem**: Many unwanted X Y Z mesh components were showing up as selectable objects.

**Root Cause**: Transform control axes, helpers, and gizmo components weren't being properly filtered from the selection system.

**Solution**: Enhanced meshSelection.ts filtering logic:
```typescript
!object.name.includes('AxesHelper') &&
!object.name.includes('GridHelper') &&
!object.name.match(/^[XYZ]$/i) &&
!object.name.includes('axis') &&
!object.name.includes('Axis') &&
```

### 4. Material Editor Not Refreshing for New Models
**Problem**: When loading a new 3D model, the material editor wouldn't show materials even when a mesh was selected.

**Root Cause**: Scene clearing wasn't properly notifying the material editor, and stale mesh references were preventing proper material detection.

**Solution**: Enhanced scene clearing and loading process:
- Added proper selection clearing when scene is cleared
- Force refresh material editor after model loading and transform application
- Added debug logging to track material detection issues

## Code Changes

### 1. MaterialEditorEnhanced.tsx
- Enhanced useEffect dependency array to detect geometry, material, and material UUID changes
- Added debug logging for material detection issues
- Now properly refreshes when geometry.uuid or material.uuid changes after transform application

### 2. NonInterferingTransformControls.ts
- Improved updateAfterGeometryChange() method
- Added visual center preservation logic
- Enhanced bounds recalculation after geometry modifications

### 3. AssetManager.ts
- Enhanced applyModelTransforms() method to better preserve material references
- Added comprehensive material and userData preservation during geometry matrix application
- Improved ensureMeshEditability() calls after transform application

### 4. Con3DConfigurator.ts
- Added model:transformsApplied event emission
- Enhanced callback system for UI updates after geometry changes
- Improved scene clearing to properly notify selection callbacks
- Added forced material editor refresh after model loading

### 5. meshSelection.ts (utils)
- Enhanced filtering to exclude X Y Z axis components
- Added filters for AxesHelper, GridHelper, and axis-related objects
- Improved regex filtering to catch single-letter axis names

## How It Works

1. **Model Import**: 3D models are loaded with their original transforms
2. **Transform Application**: Transforms are baked into geometry using `geometry.applyMatrix4()`
3. **Material Preservation**: Original materials and userData are preserved during the process
4. **Gizmo Update**: Transform controls are updated to handle the new geometry state
5. **UI Refresh**: Material editor detects geometry changes and refreshes its state
6. **Event Emission**: System emits events to notify UI components of changes

## Expected Behavior

- ✅ Imported models have their transforms set to (0,0,0) values without visual position change
- ✅ Materials remain selectable and editable after transform application
- ✅ Gizmo positions correctly at the object's visual center, not at origin
- ✅ Transform values display as 0,0,0 while object stays in original position
- ✅ Material editor refreshes properly after geometry modifications
- ✅ X Y Z axis components are no longer selectable
- ✅ AxesHelper and GridHelper components are filtered from selection
- ✅ New models show materials immediately when selected
- ✅ Scene clearing properly resets material editor state

## Debug Utilities

Created `debug_materials.ts` utility for troubleshooting material selection issues:
- Provides comprehensive material and geometry information
- Logs transform and selection state
- Useful for debugging material selection problems

## Testing

To verify the fixes work correctly:
1. Import a 3D model from Blender
2. Check that transform values show as 0,0,0
3. Verify that the object remains in its original visual position
4. Test material selection and editing functionality
5. Confirm gizmo positions at the object's center, not at world origin
