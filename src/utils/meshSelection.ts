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
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    const selectedObject = intersects[0]?.object;

    if (selectedObject instanceof THREE.Mesh) {
      onSelect(selectedObject);
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
