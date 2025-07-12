import * as THREE from 'three';

interface MeshSelectionState {
  isMouseDown: boolean;
  isDragging: boolean;
  localHandleMouseMove: ((event: MouseEvent) => void) | null;
  localHandleMouseUp: ((event: MouseEvent) => void) | null;
}

// Use module-scoped state to ensure proper cleanup
const state: MeshSelectionState = {
  isMouseDown: false,
  isDragging: false,
  localHandleMouseMove: null,
  localHandleMouseUp: null
};

const handleMouseDown = () => {
  state.isMouseDown = true;
  state.isDragging = false;
};

const handleMouseMove = () => {
  if (state.isMouseDown) {
    state.isDragging = true;
  }
};

const handleMouseUp = (
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  onSelect: (mesh: THREE.Mesh | null) => void
) => {
  if (state.isDragging) {
    state.isDragging = false;
    state.isMouseDown = false;
    return;
  }

  state.isMouseDown = false;

  try {
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    
    // Improve raycaster for small objects
    raycaster.near = camera.near;
    raycaster.far = camera.far;
    raycaster.setFromCamera(mouse, camera);
    
    // Get all selectable objects (exclude helpers and invisible objects)
    const selectableObjects: THREE.Object3D[] = [];
    scene.traverse((object) => {
      if (
        object.visible &&
        !object.userData.isHelper &&
        !object.userData.hideInOutliner &&
        !object.userData.isTransformControls &&
        !object.name.includes('helper') &&
        !object.name.includes('Helper') &&
        !object.name.includes('gizmo') &&
        !object.name.includes('Gizmo') &&
        !object.name.includes('_target') &&
        (
          (object instanceof THREE.Mesh && !object.name.includes('_selector')) ||
          (object.userData.isLightSelector) // Include light selectors for light selection
        )
      ) {
        selectableObjects.push(object);
      }
    });
    
    // Use more precise intersection with selectable objects only
    const intersects = raycaster.intersectObjects(selectableObjects, false);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      
      // Check if this is a light selector
      if (intersectedObject.userData.isLightSelector) {
        const parentLight = intersectedObject.userData.parentLight;
        if (parentLight) {
          console.log('Selected light via selector:', parentLight.name, parentLight.type);
          // For light selection, we could extend the callback to handle lights
          // For now, clear mesh selection when light is selected
          onSelect(null);
        }
        return;
      }
      
      if (intersectedObject instanceof THREE.Mesh) {
        console.log('Selected mesh:', intersectedObject.name, 'at distance:', intersects[0].distance);
        onSelect(intersectedObject);
      } else {
        onSelect(null);
      }
    } else {
      onSelect(null);
    }
  } catch (error) {
    // Use error logging that doesn't interfere with Fast Refresh
    if (process.env.NODE_ENV !== 'development') {
      console.error('Error during mesh selection:', error);
    }
    onSelect(null);
  }
};

export const setupMeshSelection = (
  canvas: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  onSelect: (mesh: THREE.Mesh | null) => void
): (() => void) => {
  // Clean up any existing listeners first
  cleanupMeshSelection(canvas);

  state.localHandleMouseMove = () => handleMouseMove();
  state.localHandleMouseUp = (event: MouseEvent) => handleMouseUp(event, canvas, camera, scene, onSelect);

  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', state.localHandleMouseMove);
  canvas.addEventListener('mouseup', state.localHandleMouseUp);

  // Return cleanup function
  return () => cleanupMeshSelection(canvas);
};

export const cleanupMeshSelection = (canvas: HTMLCanvasElement): void => {
  try {
    canvas.removeEventListener('mousedown', handleMouseDown);
    if (state.localHandleMouseMove) {
      canvas.removeEventListener('mousemove', state.localHandleMouseMove);
      state.localHandleMouseMove = null;
    }
    if (state.localHandleMouseUp) {
      canvas.removeEventListener('mouseup', state.localHandleMouseUp);
      state.localHandleMouseUp = null;
    }
    
    // Reset state
    state.isMouseDown = false;
    state.isDragging = false;
  } catch (error) {
    // Canvas might be disposed already
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error during mesh selection cleanup:', error);
    }
  }
};
