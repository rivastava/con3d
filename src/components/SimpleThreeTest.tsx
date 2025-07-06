import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

const SimpleThreeTest: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Only log in production to avoid Fast Refresh issues
      if (process.env.NODE_ENV !== 'development') {
        console.log('Creating simple Three.js scene...');
      }
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      renderer.setClearColor(0x222222, 1);
      canvasRef.current.appendChild(renderer.domElement);

      // Create scene
      const scene = new THREE.Scene();

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        canvasRef.current.clientWidth / canvasRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(5, 5, 5);

      // Create controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      // Create a simple cube
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xff6b6b,
        metalness: 0.5,
        roughness: 0.3,
      });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      // Add lighting
      const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 5);
      scene.add(directionalLight);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
      animate();

      if (process.env.NODE_ENV !== 'development') {
        console.log('Simple Three.js scene created successfully');
      }

      // Cleanup
      return () => {
        renderer.dispose();
        controls.dispose();
        if (canvasRef.current && renderer.domElement.parentNode) {
          canvasRef.current.removeChild(renderer.domElement);
        }
      };
    } catch (error) {
      console.error('Simple Three.js test failed:', error);
    }
  }, []);

  return (
    <div className="w-full h-full bg-gray-800">
      <div className="p-4 text-white text-center">
        <h2 className="text-lg font-semibold mb-2">Simple Three.js Test</h2>
        <p className="text-sm text-gray-300">
          This should show a rotating red cube with orbit controls
        </p>
      </div>
      <div 
        ref={canvasRef} 
        className="flex-1"
        style={{ width: '100%', height: 'calc(100% - 100px)' }}
      />
    </div>
  );
};

export default SimpleThreeTest;
