import { OrbitControls } from 'three-stdlib';
import * as THREE from 'three';

/**
 * Enhanced OrbitControls wrapper that properly handles passive event listeners
 * to avoid warnings that can interfere with React Fast Refresh
 */
export class PassiveOrbitControls extends OrbitControls {
  constructor(object: THREE.PerspectiveCamera | THREE.OrthographicCamera, domElement: HTMLElement) {
    // Temporarily override addEventListener to make wheel events passive
    const originalAddEventListener = domElement.addEventListener.bind(domElement);
    
    domElement.addEventListener = function(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) {
      // Make wheel and touch events passive to prevent scroll-blocking warnings
      if (type === 'wheel' || type === 'touchstart' || type === 'touchmove') {
        const passiveOptions = typeof options === 'object' 
          ? { ...options, passive: true }
          : { passive: true };
        return originalAddEventListener(type, listener, passiveOptions);
      }
      return originalAddEventListener(type, listener, options);
    };
    
    // Call parent constructor
    super(object, domElement);
    
    // Restore original addEventListener
    domElement.addEventListener = originalAddEventListener;
  }
}
