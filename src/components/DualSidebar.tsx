import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';
import { MaterialEditor } from './MaterialEditorEnhanced';
import { MaterialLibrary } from './MaterialLibrary';
import { SceneControls } from './SceneControls';
import { TransformControls } from './TransformControls';
import { LightingControls } from './LightingControls';
import { CameraControls } from './CameraControls';
import { ObjectSettingsControls } from './ObjectSettingsControls';
import { PrimitiveControls } from './PrimitiveControls';
import { RenderingQualityControls } from './RenderingQualityControls';
import { Outliner } from './Outliner';

interface DualSidebarProps {
  configurator?: Con3DConfigurator;
  selectedMesh?: THREE.Mesh | null;
  onMeshSelect?: (mesh: THREE.Mesh | null) => void;
  isFullscreen?: boolean;
  position: 'left' | 'right';
}

export const DualSidebar: React.FC<DualSidebarProps> = ({ 
  configurator, 
  selectedMesh: propSelectedMesh,
  onMeshSelect,
  isFullscreen = false,
  position
}) => {
  const [selectedMesh, setSelectedMesh] = useState<THREE.Mesh | null>(null);
  const [leftActiveTab, setLeftActiveTab] = useState<'material' | 'objects' | 'transform' | 'primitives'>('material');
  const [rightActiveTab, setRightActiveTab] = useState<'outliner' | 'lighting' | 'camera' | 'library' | 'scene' | 'rendering'>('outliner');

  // Use the prop selectedMesh directly when available
  const currentSelectedMesh = propSelectedMesh !== undefined ? propSelectedMesh : selectedMesh;

  useEffect(() => {
    if (configurator && propSelectedMesh === undefined) {
      // Only listen to configurator events if not controlled by parent
      configurator.onMeshSelected((mesh: THREE.Mesh | null) => {
        setSelectedMesh(mesh);
        onMeshSelect?.(mesh);
      });
    }
  }, [configurator, propSelectedMesh, onMeshSelect]);

  const handleMeshSelect = (mesh: THREE.Mesh | null) => {
    setSelectedMesh(mesh);
    onMeshSelect?.(mesh);
  };

  if (isFullscreen) {
    return null; // Hide sidebars in fullscreen mode
  }

  if (!configurator) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {position === 'left' ? 'Object Controls' : 'Scene Controls'}
          </h2>
        </div>
        <div className="flex-1 p-4">
          <p className="text-gray-400">Configurator not ready...</p>
        </div>
      </div>
    );
  }

  if (position === 'left') {
    return (
      <>
        {/* Left Tab Navigation */}
        <div className="border-b border-gray-700">
          <nav className="flex text-xs">
            <button
              onClick={() => setLeftActiveTab('material')}
              className={`flex-1 px-3 py-2 font-medium ${
                leftActiveTab === 'material'
                  ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Material
            </button>
            <button
              onClick={() => setLeftActiveTab('objects')}
              className={`flex-1 px-3 py-2 font-medium ${
                leftActiveTab === 'objects'
                  ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Objects
            </button>
          </nav>
          <nav className="flex text-xs border-t border-gray-700">
            <button
              onClick={() => setLeftActiveTab('transform')}
              className={`flex-1 px-3 py-2 font-medium ${
                leftActiveTab === 'transform'
                  ? 'text-white bg-gray-800 border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Transform
            </button>
            <button
              onClick={() => setLeftActiveTab('primitives')}
              className={`flex-1 px-3 py-2 font-medium ${
                leftActiveTab === 'primitives'
                  ? 'text-white bg-gray-800 border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Add
            </button>
          </nav>
        </div>
        
        {/* Left Tab Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
          {leftActiveTab === 'material' && (
            <MaterialEditor
              configurator={configurator}
              selectedMesh={currentSelectedMesh}
            />
          )}
          {leftActiveTab === 'transform' && (
            <TransformControls
              configurator={configurator}
              selectedMesh={currentSelectedMesh}
            />
          )}
          {leftActiveTab === 'objects' && (
            <ObjectSettingsControls
              configurator={configurator}
              selectedMesh={currentSelectedMesh}
            />
          )}
          {leftActiveTab === 'primitives' && (
            <PrimitiveControls
              configurator={configurator}
            />
          )}
        </div>
      </>
    );
  }

  // Right sidebar
  return (
    <>
      {/* Right Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex text-xs">
          <button
            onClick={() => setRightActiveTab('outliner')}
            className={`flex-1 px-2 py-2 font-medium ${
              rightActiveTab === 'outliner'
                ? 'text-white bg-gray-800 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Outliner
          </button>
          <button
            onClick={() => setRightActiveTab('lighting')}
            className={`flex-1 px-2 py-2 font-medium ${
              rightActiveTab === 'lighting'
                ? 'text-white bg-gray-800 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Lighting
          </button>
          <button
            onClick={() => setRightActiveTab('camera')}
            className={`flex-1 px-2 py-2 font-medium ${
              rightActiveTab === 'camera'
                ? 'text-white bg-gray-800 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Camera
          </button>
        </nav>
        <nav className="flex text-xs border-t border-gray-700">
          <button
            onClick={() => setRightActiveTab('library')}
            className={`flex-1 px-2 py-2 font-medium ${
              rightActiveTab === 'library'
                ? 'text-white bg-gray-800 border-b-2 border-yellow-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Library
          </button>
          <button
            onClick={() => setRightActiveTab('scene')}
            className={`flex-1 px-2 py-2 font-medium ${
              rightActiveTab === 'scene'
                ? 'text-white bg-gray-800 border-b-2 border-yellow-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Scene
          </button>
          <button
            onClick={() => setRightActiveTab('rendering')}
            className={`flex-1 px-2 py-2 font-medium ${
              rightActiveTab === 'rendering'
                ? 'text-white bg-gray-800 border-b-2 border-yellow-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Render
          </button>
        </nav>
      </div>
      
      {/* Right Tab Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
        {rightActiveTab === 'outliner' && (
          <Outliner
            configurator={configurator}
            selectedMesh={currentSelectedMesh}
            onMeshSelect={handleMeshSelect}
          />
        )}
        {rightActiveTab === 'lighting' && (
          <LightingControls
            configurator={configurator}
          />
        )}
        {rightActiveTab === 'camera' && (
          <CameraControls
            configurator={configurator}
          />
        )}
        {rightActiveTab === 'library' && (
          <MaterialLibrary
            configurator={configurator}
            selectedMesh={currentSelectedMesh}
          />
        )}
        {rightActiveTab === 'rendering' && (
          <RenderingQualityControls
            configurator={configurator}
          />
        )}
        {rightActiveTab === 'scene' && (
          <SceneControls configurator={configurator} />
        )}
      </div>
    </>
  );
};
