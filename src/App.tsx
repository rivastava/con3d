import React, { useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import Con3DComponent from './components/Con3DComponent';
import { DiagnosticPanel } from './components/DiagnosticPanel';
import { DualSidebar } from './components/DualSidebar';
import { SceneIndicators } from './components/SceneIndicators';
import { FullscreenToggle } from './components/FullscreenToggle';
import { Con3DConfigurator } from './core/Con3DConfigurator';
import { setupMeshSelection } from './utils/meshSelection';

function App() {
  const configuratorRef = React.useRef<Con3DConfigurator | null>(null);
  const [selectedMesh, setSelectedMesh] = React.useState<THREE.Mesh | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

  const meshSelectionCleanupRef = React.useRef<(() => void) | null>(null);

  // Memoize the options object to prevent Con3DComponent useEffect from running on every render
  const configuratorOptions = useMemo(() => ({
    renderer: {
      antialias: true,
      alpha: true,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.0,
    },
    camera: {
      fov: 75,
      position: [5, 5, 5] as [number, number, number],
      near: 0.01, // Prevent close clipping
      far: 1000,
    },
    controls: {
      enableDamping: true,
      dampingFactor: 0.05,
      autoRotate: false,
      minDistance: 0.01, // Allow extremely close zoom
      maxDistance: 500, // Allow zooming out much further
      enableZoom: true,
    },
  }), []);

  // Memoize the error handler to prevent Con3DComponent useEffect from running on every render
  const handleError = useCallback((error: Error) => {
    // Use setTimeout to avoid logging during render cycle
    setTimeout(() => console.error('Configurator error:', error), 0);
  }, []);

  // Memoize setupMeshSelectionSystem to prevent Con3DComponent useEffect from running on every render
  const setupMeshSelectionSystem = useCallback((configurator: Con3DConfigurator) => {
    // Clean up any existing mesh selection
    if (meshSelectionCleanupRef.current) {
      meshSelectionCleanupRef.current();
      meshSelectionCleanupRef.current = null;
    }

    const canvas = configurator.getCanvas();
    const camera = configurator.getCamera();
    const scene = configurator.getScene();
    
    const handleMeshSelection = (mesh: THREE.Mesh | null) => {
      setSelectedMesh(prevSelected => {
        if (prevSelected === mesh) {
          return prevSelected; // No change, don't trigger re-render
        }
        return mesh;
      });
    };

    // Setup mesh selection and store the cleanup function it returns
    meshSelectionCleanupRef.current = setupMeshSelection(canvas, camera, scene, handleMeshSelection);
  }, []);

  // Memoize createDefaultCube to prevent Con3DComponent useEffect from running on every render
  const createDefaultCube = useCallback((configurator: Con3DConfigurator) => {
    // Clear any existing objects first
    const scene = configurator.getScene();
    const objectsToRemove = scene.children.filter(child => 
      child instanceof THREE.Mesh && (child.name?.includes('Cube') || child.name?.includes('Sphere'))
    );
    objectsToRemove.forEach(obj => scene.remove(obj));

    // Create multiple test objects to showcase material system
    
    // 1. Main cube - Indigo plastic
    const geometry1 = new THREE.BoxGeometry(2, 2, 2);
    const material1 = new THREE.MeshPhysicalMaterial({
      color: 0x4f46e5,
      metalness: 0.0,
      roughness: 0.2,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1
    });
    const cube1 = new THREE.Mesh(geometry1, material1);
    cube1.name = 'Main Cube';
    cube1.position.set(0, 1, 0);
    cube1.castShadow = true;
    cube1.receiveShadow = true;
    scene.add(cube1);
    
    // 2. Metal sphere - Chrome
    const geometry2 = new THREE.SphereGeometry(1.2, 32, 16);
    const material2 = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      envMapIntensity: 1.5
    });
    const sphere = new THREE.Mesh(geometry2, material2);
    sphere.name = 'Chrome Sphere';
    sphere.position.set(4, 1.2, 0);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);
    
    // 3. Glass cube - Transparent
    const geometry3 = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material3 = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.0,
      transmission: 1.0,
      thickness: 0.5,
      ior: 1.5,
      transparent: true,
      opacity: 0.1
    });
    const glassCube = new THREE.Mesh(geometry3, material3);
    glassCube.name = 'Glass Cube';
    glassCube.position.set(-3, 0.75, 0);
    glassCube.castShadow = true;
    glassCube.receiveShadow = true;
    scene.add(glassCube);
    
    // 4. Torus - Gold metal
    const geometry4 = new THREE.TorusGeometry(1, 0.4, 16, 100);
    const material4 = new THREE.MeshPhysicalMaterial({
      color: 0xffd700,
      metalness: 1.0,
      roughness: 0.1,
      envMapIntensity: 1.2
    });
    const torus = new THREE.Mesh(geometry4, material4);
    torus.name = 'Gold Torus';
    torus.position.set(0, 1, 4);
    torus.castShadow = true;
    torus.receiveShadow = true;
    scene.add(torus);
    
    // 5. Ground plane - Matte surface
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x888888,
      metalness: 0.0,
      roughness: 0.8
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.name = 'Ground Plane';
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    plane.receiveShadow = true;
    scene.add(plane);
    
    // Enable shadows for all objects
    [cube1, sphere, glassCube, torus].forEach(obj => {
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
    
    // Position camera to view all objects
    const camera = configurator.getCamera();
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 1, 0);
    
    const controls = configurator.getControls();
    controls.target.set(0, 1, 0);
    controls.update();
    
    // Auto-adjust clipping for the scene
    configurator.autoAdjustClipping();
  }, []);

  // Memoize the handleReady callback to prevent Con3DComponent useEffect from running on every render
  const handleReady = useCallback(async (configurator: Con3DConfigurator) => {
    configuratorRef.current = configurator;
    
    // Setup mesh selection after configurator is ready
    setupMeshSelectionSystem(configurator);
    
    // Start with a simple test cube
    createDefaultCube(configurator);
    
    // Try loading assets after the basic scene is working
    setTimeout(async () => {
      try {
        
        // Try to load default model
        let modelLoaded = false;
        try {
          await configurator.scene.load('/assets/models/baseModel.glb');
          modelLoaded = true;
        } catch (modelError) {
          // Use setTimeout to avoid logging during render cycle
          setTimeout(() => console.warn('Model loading failed:', modelError), 0);
        }
        
        // Try to load default HDRI environment
        try {
          await configurator.environment.setHDRI('/assets/hdri/BaseHDRI.hdr', {
            hdriIntensity: 1.0,
            hdriRotation: 0,
            hdriBlur: 0.0
          });
        } catch (hdriError) {
          // Use setTimeout to avoid logging during render cycle
          setTimeout(() => console.warn('HDRI loading failed:', hdriError), 0);
          // Fall back to default environment - use a simple color background
          const scene = configurator.getScene();
          scene.background = new THREE.Color(0x222222);
        }
        
        // If no model was loaded, keep the default cube
        if (!modelLoaded) {
        }
      } catch (error) {
        // Use setTimeout to avoid logging during render cycle
        setTimeout(() => console.error('Asset loading error:', error), 0);
        // Create default cube if assets fail to load
        createDefaultCube(configurator);
      }
    }, 1000);
  }, [setupMeshSelectionSystem, createDefaultCube]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup mesh selection first
      if (meshSelectionCleanupRef.current) {
        meshSelectionCleanupRef.current();
        meshSelectionCleanupRef.current = null;
      }
      
      // Cleanup configurator
      if (configuratorRef.current) {
        configuratorRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="w-full h-screen bg-gray-900 relative flex">
      {/* Left Sidebar - Object Controls */}
      {!isFullscreen && (
        <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
          <DualSidebar
            configurator={configuratorRef.current || undefined}
            selectedMesh={selectedMesh}
            onMeshSelect={setSelectedMesh}
            isFullscreen={isFullscreen}
            position="left"
          />
        </div>
      )}

      {/* Main 3D View */}
      <div className="flex-1 relative">
        <Con3DComponent 
          apiKey="demo"
          containerId="con3d-container"
          options={configuratorOptions}
          onReady={handleReady}
          onError={handleError}
        />
        
        {/* Scene Indicators - Light and Camera Icons */}
        {configuratorRef.current && (
          <SceneIndicators configurator={configuratorRef.current} />
        )}
        
        {/* Fullscreen Toggle - positioned at bottom right of 3D scene */}
        <FullscreenToggle 
          isFullscreen={isFullscreen}
          onToggle={() => setIsFullscreen(!isFullscreen)}
        />
        
        <DiagnosticPanel />
      </div>

      {/* Right Sidebar - Scene Controls */}
      {!isFullscreen && (
        <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
          <DualSidebar
            configurator={configuratorRef.current || undefined}
            selectedMesh={selectedMesh}
            onMeshSelect={setSelectedMesh}
            isFullscreen={isFullscreen}
            position="right"
          />
        </div>
      )}
    </div>
  );
}

export default App;
