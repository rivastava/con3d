import React from 'react';
import ReactDOM from 'react-dom/client';
import * as THREE from 'three';
import Con3DComponent from './components/Con3DComponent';
import { Con3DConfigurator } from './core/Con3DConfigurator';
import './styles/globals.css';

const App = () => {
  const handleReady = async (configurator: Con3DConfigurator) => {
    console.log('Configurator ready!', configurator);
    
    // Start with a simple test cube
    createDefaultCube(configurator);
    
    // Try loading assets after the basic scene is working
    setTimeout(async () => {
      try {
        console.log('Attempting to load assets...');
        
        // Try to load default model
        let modelLoaded = false;
        try {
          console.log('Loading model: /assets/models/baseModel.glb');
          await configurator.scene.load('/assets/models/baseModel.glb');
          console.log('Model loaded successfully');
          modelLoaded = true;
        } catch (modelError) {
          console.warn('Model loading failed:', modelError);
        }
        
        // Try to load default HDRI environment
        try {
          console.log('Loading HDRI: /assets/hdri/BaseHDRI.hdr');
          await configurator.environment.setHDRI('/assets/hdri/BaseHDRI.hdr', {
            hdriIntensity: 1.0,
            hdriRotation: 0,
            hdriBlur: 0.0
          });
          console.log('HDRI loaded successfully');
        } catch (hdriError) {
          console.warn('HDRI loading failed:', hdriError);
          // Fall back to default environment - use a simple color background
          const scene = configurator.getScene();
          scene.background = new THREE.Color(0x222222);
        }
        
        // If no model was loaded, keep the default cube
        if (!modelLoaded) {
          console.log('Keeping default cube as no model was loaded');
        }
      } catch (error) {
        console.error('Asset loading error:', error);
        // Create default cube if assets fail to load
        createDefaultCube(configurator);
      }
    }, 1000);
  };

  const createDefaultCube = (configurator: Con3DConfigurator) => {
    // Clear any existing objects first
    const scene = configurator.getScene();
    const objectsToRemove = scene.children.filter(child => 
      child instanceof THREE.Mesh && child.name === 'Default Cube'
    );
    objectsToRemove.forEach(obj => scene.remove(obj));

    // Create a default cube with PBR material for testing
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.3,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.name = 'Default Cube';
    
    scene.add(cube);
    
    // Position camera to view the cube
    const camera = configurator.getCamera();
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    
    const controls = configurator.getControls();
    controls.target.set(0, 0, 0);
    controls.update();
  };

  return (
    <div className="w-full h-screen bg-gray-900">
      <Con3DComponent 
        apiKey="demo"
        containerId="con3d-container"
        options={{
          renderer: {
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          },
          camera: {
            fov: 75,
            position: [5, 5, 5],
          },
          controls: {
            enableDamping: true,
            dampingFactor: 0.05,
            autoRotate: false,
          },
        }}
        onReady={handleReady}
        onError={(error) => {
          console.error('Configurator error:', error);
        }}
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
