import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface SceneIndicatorsProps {
  configurator: Con3DConfigurator;
}

interface IndicatorItem {
  id: string;
  name: string;
  type: string;
  position: THREE.Vector3;
  screenPosition: { x: number; y: number };
  visible: boolean;
  object: THREE.Object3D;
}

export const SceneIndicators: React.FC<SceneIndicatorsProps> = ({ configurator }) => {
  const [indicators, setIndicators] = useState<IndicatorItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!configurator) return;

    const updateIndicators = () => {
      const renderingEngine = configurator.getRenderingEngine();
      const scene = renderingEngine.scene;
      const camera = renderingEngine.camera;
      const renderer = renderingEngine.renderer;
      
      if (!scene || !camera || !renderer) return;

      const newIndicators: IndicatorItem[] = [];
      const tempVector = new THREE.Vector3();

      scene.traverse((object: THREE.Object3D) => {
        if (shouldShowIndicator(object)) {
          // Get world position
          object.getWorldPosition(tempVector);
          
          // Project to screen coordinates
          const screenPosition = tempVector.clone().project(camera);
          
          // Convert to pixel coordinates
          const canvasRect = renderer.domElement.getBoundingClientRect();
          const x = (screenPosition.x * 0.5 + 0.5) * canvasRect.width;
          const y = (screenPosition.y * -0.5 + 0.5) * canvasRect.height;
          
          // Check if object is in front of camera
          const cameraDirection = new THREE.Vector3();
          camera.getWorldDirection(cameraDirection);
          const objectDirection = tempVector.clone().sub(camera.position).normalize();
          const isInFront = cameraDirection.dot(objectDirection) > 0;
          
          // Check if within viewport
          const isInViewport = x >= 0 && x <= canvasRect.width && y >= 0 && y <= canvasRect.height;
          
          newIndicators.push({
            id: object.uuid,
            name: object.name || getObjectTypeName(object),
            type: getObjectTypeName(object),
            position: tempVector.clone(),
            screenPosition: { x, y },
            visible: object.visible && isInFront && isInViewport,
            object
          });
        }
      });

      setIndicators(newIndicators);
    };

    // Update indicators on animation frame
    let animationId: number;
    const animate = () => {
      updateIndicators();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [configurator]);

  const shouldShowIndicator = (object: THREE.Object3D): boolean => {
    if (object instanceof THREE.Light) return true;
    if (object instanceof THREE.Camera) return true;
    if (object.name && (
      object.name.includes('light') ||
      object.name.includes('Light') ||
      object.name.includes('camera') ||
      object.name.includes('Camera')
    )) return true;
    
    return false;
  };

  const getObjectTypeName = (object: THREE.Object3D): string => {
    if (object instanceof THREE.DirectionalLight) return 'DirectionalLight';
    if (object instanceof THREE.PointLight) return 'PointLight';
    if (object instanceof THREE.SpotLight) return 'SpotLight';
    if (object instanceof THREE.AmbientLight) return 'AmbientLight';
    if (object instanceof THREE.HemisphereLight) return 'HemisphereLight';
    if (object instanceof THREE.RectAreaLight) return 'AreaLight';
    if (object instanceof THREE.PerspectiveCamera) return 'Camera';
    if (object instanceof THREE.OrthographicCamera) return 'OrthoCamera';
    return 'Object3D';
  };

  const getIndicatorIcon = (type: string): { icon: string; color: string } => {
    switch (type) {
      case 'DirectionalLight': return { icon: '☀️', color: 'text-yellow-400' };
      case 'PointLight': return { icon: '💡', color: 'text-yellow-300' };
      case 'SpotLight': return { icon: '🔦', color: 'text-orange-400' };
      case 'AmbientLight': return { icon: '🌟', color: 'text-blue-300' };
      case 'HemisphereLight': return { icon: '🌅', color: 'text-purple-300' };
      case 'AreaLight': return { icon: '🔲', color: 'text-green-400' };
      case 'Camera': return { icon: '📷', color: 'text-blue-400' };
      case 'OrthoCamera': return { icon: '📹', color: 'text-cyan-400' };
      default: return { icon: '📦', color: 'text-gray-400' };
    }
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {indicators.map(indicator => {
        if (!indicator.visible) return null;
        
        const { icon, color } = getIndicatorIcon(indicator.type);
        
        return (
          <div
            key={indicator.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer ${color}`}
            style={{
              left: `${indicator.screenPosition.x}px`,
              top: `${indicator.screenPosition.y}px`,
            }}
            title={`${indicator.name} (${indicator.type})`}
          >
            <div className="relative">
              <span 
                className="text-lg drop-shadow-lg hover:scale-125 transition-transform duration-200"
                style={{
                  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
                }}
              >
                {icon}
              </span>
              
              {/* Name label */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-200">
                {indicator.name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
