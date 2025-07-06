import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface OutlinerProps {
  configurator: Con3DConfigurator;
  selectedMesh?: THREE.Mesh | null;
  onMeshSelect?: (mesh: THREE.Mesh | null) => void;
}

interface SceneItem {
  id: string;
  name: string;
  type: string;
  object: THREE.Object3D;
  visible: boolean;
  children: SceneItem[];
}

export const Outliner: React.FC<OutlinerProps> = ({ 
  configurator, 
  selectedMesh,
  onMeshSelect 
}) => {
  const [sceneItems, setSceneItems] = useState<SceneItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (configurator) {
      updateSceneItems();
      
      // Update outliner when scene changes
      const interval = setInterval(updateSceneItems, 1000);
      return () => clearInterval(interval);
    }
  }, [configurator]);

  const updateSceneItems = () => {
    if (!configurator) return;
    
    // Access scene through the configurator's rendering engine
    const renderingEngine = configurator.getRenderingEngine();
    const scene = renderingEngine?.scene;
    if (!scene) return;
    
    const buildSceneTree = (object: THREE.Object3D, level: number = 0): SceneItem => {
      const item: SceneItem = {
        id: object.uuid,
        name: object.name || getObjectTypeName(object),
        type: getObjectTypeName(object),
        object,
        visible: object.visible,
        children: []
      };
      
      // Build children recursively
      object.children.forEach((child: THREE.Object3D) => {
        if (shouldShowInOutliner(child)) {
          item.children.push(buildSceneTree(child, level + 1));
        }
      });
      
      return item;
    };
    
    const items: SceneItem[] = [];
    scene.children.forEach((child: THREE.Object3D) => {
      if (shouldShowInOutliner(child)) {
        items.push(buildSceneTree(child));
      }
    });
    
    setSceneItems(items);
  };

  const shouldShowInOutliner = (object: THREE.Object3D): boolean => {
    // Filter out helper objects and internal objects
    if (object.name.includes('helper')) return false;
    if (object.name.includes('Helper')) return false;
    if (object.name.includes('gizmo')) return false;
    if (object.userData.hideInOutliner) return false;
    
    return true;
  };

  const getObjectTypeName = (object: THREE.Object3D): string => {
    if (object instanceof THREE.Mesh) return 'Mesh';
    if (object instanceof THREE.DirectionalLight) return 'Directional Light';
    if (object instanceof THREE.PointLight) return 'Point Light';
    if (object instanceof THREE.SpotLight) return 'Spot Light';
    if (object instanceof THREE.AmbientLight) return 'Ambient Light';
    if (object instanceof THREE.HemisphereLight) return 'Hemisphere Light';
    if (object instanceof THREE.RectAreaLight) return 'Area Light';
    if (object instanceof THREE.PerspectiveCamera) return 'Camera';
    if (object instanceof THREE.OrthographicCamera) return 'Ortho Camera';
    if (object instanceof THREE.Group) return 'Group';
    if (object instanceof THREE.Scene) return 'Scene';
    return 'Object3D';
  };

  const getObjectIcon = (type: string): string => {
    switch (type) {
      case 'Mesh': return '🔷';
      case 'Directional Light': return '☀️';
      case 'Point Light': return '💡';
      case 'Spot Light': return '🔦';
      case 'Ambient Light': return '🌟';
      case 'Hemisphere Light': return '🌅';
      case 'Area Light': return '🔲';
      case 'Camera': return '📷';
      case 'Ortho Camera': return '📹';
      case 'Group': return '📁';
      case 'Scene': return '🌍';
      default: return '📦';
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const toggleVisibility = (item: SceneItem) => {
    item.object.visible = !item.object.visible;
    updateSceneItems();
  };

  const selectObject = (item: SceneItem) => {
    if (item.object instanceof THREE.Mesh) {
      onMeshSelect?.(item.object);
    } else {
      onMeshSelect?.(null);
    }
  };

  const renderItem = (item: SceneItem, level: number = 0): React.ReactNode => {
    const hasChildren = item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isSelected = selectedMesh?.uuid === item.id;
    const indent = level * 16;

    return (
      <div key={item.id}>
        <div 
          className={`flex items-center px-2 py-1 text-sm hover:bg-gray-800 cursor-pointer ${
            isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${8 + indent}px` }}
          onClick={() => selectObject(item)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              className="mr-1 text-xs hover:text-white"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <span className="w-3 mr-1"></span>}
          
          <span className="mr-2 text-xs">{getObjectIcon(item.type)}</span>
          
          <span className="flex-1 truncate">{item.name}</span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleVisibility(item);
            }}
            className={`ml-2 text-xs hover:text-white ${
              item.visible ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {item.visible ? '👁' : '🙈'}
          </button>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {item.children.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-gray-700 pb-2">
        <h3 className="text-lg font-semibold">Scene Outliner</h3>
        <p className="text-sm text-gray-400">
          Scene hierarchy and object management
        </p>
      </div>

      <div className="space-y-1">
        {sceneItems.length > 0 ? (
          sceneItems.map(item => renderItem(item))
        ) : (
          <p className="text-gray-400 text-sm">No objects in scene</p>
        )}
      </div>

      <div className="pt-2 border-t border-gray-700">
        <button
          onClick={updateSceneItems}
          className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
        >
          Refresh Outliner
        </button>
      </div>
    </div>
  );
};
