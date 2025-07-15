import * as THREE from 'three';

/**
 * Industry-standard 3D object filtering system
 * Based on practices from Blender, Maya, 3ds Max, and Unreal Engine
 */

export interface ObjectInfo {
  id: string;
  name: string;
  object: THREE.Object3D;
  category: ObjectCategory;
  isUserContent: boolean;
  isSystemObject: boolean;
}

export enum ObjectCategory {
  // User Content
  USER_MESH = 'user_mesh',
  USER_LIGHT = 'user_light',
  USER_CAMERA = 'user_camera',
  USER_GROUP = 'user_group',
  
  // System Objects
  SYSTEM_HELPER = 'system_helper',
  SYSTEM_GIZMO = 'system_gizmo',
  SYSTEM_GRID = 'system_grid',
  SYSTEM_LIGHT_HELPER = 'system_light_helper',
  SYSTEM_CAMERA_HELPER = 'system_camera_helper',
  
  // Transform/Control System
  TRANSFORM_CONTROL = 'transform_control',
  TRANSFORM_HANDLE = 'transform_handle',
  
  // Unknown/Other
  UNKNOWN = 'unknown'
}

export interface FilterOptions {
  includeUserMeshes?: boolean;
  includeUserLights?: boolean;
  includeUserCameras?: boolean;
  includeUserGroups?: boolean;
  includeSystemHelpers?: boolean;
  includeSystemGizmos?: boolean;
  includeTransformControls?: boolean;
  includeUnknown?: boolean;
}

/**
 * Categorize objects based on industry-standard patterns
 */
export function categorizeObject(object: THREE.Object3D): ObjectCategory {
  const name = object.name || '';
  const nameLower = name.toLowerCase();
  const userData = object.userData || {};
  const type = object.type;

  // Check userData first (most reliable)
  if (userData.isSystemObject || userData.isHelper) {
    return ObjectCategory.SYSTEM_HELPER;
  }
  
  if (userData.isLightHelper || userData.lightId) {
    return ObjectCategory.SYSTEM_LIGHT_HELPER;
  }
  
  if (userData.isTransformControl || userData.isGizmo || userData.isTransformHandle) {
    return ObjectCategory.TRANSFORM_CONTROL;
  }

  // Check if parent is a transform control
  let parent = object.parent;
  while (parent) {
    if (parent.userData?.isTransformControl || 
        parent.name?.includes('TransformControls') ||
        parent.name?.includes('TransformControl')) {
      return ObjectCategory.TRANSFORM_CONTROL;
    }
    parent = parent.parent;
  }

  // System helper types (Three.js built-ins)
  const systemHelperTypes = [
    'GridHelper', 'AxesHelper', 'ArrowHelper', 'BoxHelper', 'PlaneHelper',
    'PointLightHelper', 'DirectionalLightHelper', 'SpotLightHelper', 
    'HemisphereLightHelper', 'CameraHelper', 'SkeletonHelper'
  ];
  
  if (systemHelperTypes.includes(type)) {
    return ObjectCategory.SYSTEM_HELPER;
  }

  // Transform control patterns (exact matches for coordinates)
  const transformHandlePatterns = [
    /^[xyz]$/i,           // Single axis: x, y, z  
    /^[xyz]{2,3}$/i,      // Multi-axis: xy, xz, yz, xyz
    /^[XYZ]$/,            // Uppercase versions
    /^[XYZ]{2,3}$/,       // Uppercase multi-axis
    /^E$/i,               // End handle
    /^start$/i,           // Start handle
    /^end$/i              // End handle
  ];

  if (transformHandlePatterns.some(pattern => pattern.test(name))) {
    return ObjectCategory.TRANSFORM_HANDLE;
  }

  // System gizmo patterns
  const gizmoPatterns = [
    /helper$/i, /gizmo$/i, /target$/i, /selector$/i,
    /_helper$/i, /_gizmo$/i, /_target$/i,
    /^helper_/i, /^gizmo_/i,
    /control/i, /handle/i, /arrow/i, /axis/i
  ];

  if (gizmoPatterns.some(pattern => pattern.test(nameLower))) {
    return ObjectCategory.SYSTEM_GIZMO;
  }

  // Grid and axis helpers
  if (/grid|axis|line|plane|bounds?|collision/i.test(nameLower)) {
    return ObjectCategory.SYSTEM_GRID;
  }

  // Light helpers (by naming convention)
  if (/_light$|_emissive$|light_helper/i.test(nameLower)) {
    return ObjectCategory.SYSTEM_LIGHT_HELPER;
  }

  // Camera helpers
  if (/camera_helper|_camera$/i.test(nameLower)) {
    return ObjectCategory.SYSTEM_CAMERA_HELPER;
  }

  // Now categorize actual content objects
  if (object instanceof THREE.Mesh) {
    return ObjectCategory.USER_MESH;
  }
  
  if (object instanceof THREE.Light) {
    return ObjectCategory.USER_LIGHT;
  }
  
  if (object instanceof THREE.Camera) {
    return ObjectCategory.USER_CAMERA;
  }
  
  if (object instanceof THREE.Group && object.children.length > 0) {
    return ObjectCategory.USER_GROUP;
  }

  return ObjectCategory.UNKNOWN;
}

/**
 * Check if an object is user content (not system/helper)
 */
export function isUserContent(object: THREE.Object3D): boolean {
  const category = categorizeObject(object);
  return [
    ObjectCategory.USER_MESH,
    ObjectCategory.USER_LIGHT,
    ObjectCategory.USER_CAMERA,
    ObjectCategory.USER_GROUP
  ].includes(category);
}

/**
 * Check if an object is a system helper/utility
 */
export function isSystemObject(object: THREE.Object3D): boolean {
  const category = categorizeObject(object);
  return [
    ObjectCategory.SYSTEM_HELPER,
    ObjectCategory.SYSTEM_GIZMO,
    ObjectCategory.SYSTEM_GRID,
    ObjectCategory.SYSTEM_LIGHT_HELPER,
    ObjectCategory.SYSTEM_CAMERA_HELPER,
    ObjectCategory.TRANSFORM_CONTROL,
    ObjectCategory.TRANSFORM_HANDLE
  ].includes(category);
}

/**
 * Get filtered objects from scene with detailed categorization
 */
export function getFilteredObjects(
  scene: THREE.Scene, 
  options: FilterOptions = {}
): ObjectInfo[] {
  const defaultOptions: FilterOptions = {
    includeUserMeshes: true,
    includeUserLights: true,
    includeUserCameras: true,
    includeUserGroups: true,
    includeSystemHelpers: false,
    includeSystemGizmos: false,
    includeTransformControls: false,
    includeUnknown: false,
    ...options
  };

  const objects: ObjectInfo[] = [];

  scene.traverse((object) => {
    const category = categorizeObject(object);
    const isUserContent = [
      ObjectCategory.USER_MESH,
      ObjectCategory.USER_LIGHT,
      ObjectCategory.USER_CAMERA,
      ObjectCategory.USER_GROUP
    ].includes(category);

    // Apply filtering based on options
    let shouldInclude = false;

    switch (category) {
      case ObjectCategory.USER_MESH:
        shouldInclude = defaultOptions.includeUserMeshes!;
        break;
      case ObjectCategory.USER_LIGHT:
        shouldInclude = defaultOptions.includeUserLights!;
        break;
      case ObjectCategory.USER_CAMERA:
        shouldInclude = defaultOptions.includeUserCameras!;
        break;
      case ObjectCategory.USER_GROUP:
        shouldInclude = defaultOptions.includeUserGroups!;
        break;
      case ObjectCategory.SYSTEM_HELPER:
      case ObjectCategory.SYSTEM_GRID:
      case ObjectCategory.SYSTEM_LIGHT_HELPER:
      case ObjectCategory.SYSTEM_CAMERA_HELPER:
        shouldInclude = defaultOptions.includeSystemHelpers!;
        break;
      case ObjectCategory.SYSTEM_GIZMO:
        shouldInclude = defaultOptions.includeSystemGizmos!;
        break;
      case ObjectCategory.TRANSFORM_CONTROL:
      case ObjectCategory.TRANSFORM_HANDLE:
        shouldInclude = defaultOptions.includeTransformControls!;
        break;
      case ObjectCategory.UNKNOWN:
        shouldInclude = defaultOptions.includeUnknown!;
        break;
    }

    if (shouldInclude) {
      objects.push({
        id: object.uuid,
        name: object.name || `${object.type} ${object.uuid.slice(0, 8)}`,
        object,
        category,
        isUserContent,
        isSystemObject: !isUserContent
      });
    }
  });

  return objects;
}

/**
 * Get only user meshes (for material editor, etc.)
 */
export function getUserMeshes(scene: THREE.Scene): ObjectInfo[] {
  return getFilteredObjects(scene, {
    includeUserMeshes: true,
    includeUserLights: false,
    includeUserCameras: false,
    includeUserGroups: false
  }).filter(obj => obj.object instanceof THREE.Mesh);
}

/**
 * Get simple mesh list for dropdowns
 */
export function getUserMeshesSimple(scene: THREE.Scene): Array<{ id: string; name: string }> {
  return getUserMeshes(scene).map(info => ({
    id: info.id,
    name: info.name
  }));
}

/**
 * Get objects for outliner (user content + optionally some system objects)
 */
export function getOutlinerObjects(scene: THREE.Scene, showSystemObjects: boolean = false): ObjectInfo[] {
  return getFilteredObjects(scene, {
    includeUserMeshes: true,
    includeUserLights: true,
    includeUserCameras: true,
    includeUserGroups: true,
    includeSystemHelpers: showSystemObjects,
    includeSystemGizmos: false,  // Never show gizmos in outliner
    includeTransformControls: false // Never show transform controls
  });
}
