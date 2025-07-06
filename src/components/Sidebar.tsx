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

interface SidebarProps {
  configurator?: Con3DConfigurator;
  selectedMesh?: THREE.Mesh | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ configurator, selectedMesh: propSelectedMesh }) => {
  const [selectedMesh, setSelectedMesh] = useState<THREE.Mesh | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'library' | 'scene' | 'transform' | 'lighting' | 'camera' | 'objects' | 'primitives' | 'rendering'>('editor');

  // Use the prop selectedMesh directly when available
  const currentSelectedMesh = propSelectedMesh !== undefined ? propSelectedMesh : selectedMesh;

  useEffect(() => {
    if (configurator && propSelectedMesh === undefined) {
      // Only listen to configurator events if not controlled by parent
      configurator.onMeshSelected((mesh: THREE.Mesh | null) => {
        setSelectedMesh(mesh);
      });
    }
  }, [configurator, propSelectedMesh]);

  if (!configurator) {
    return (
      <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Controls</h2>
        </div>
        <div className="flex-1 p-4">
          <p className="text-gray-400">Configurator not ready...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        {/* Primary Navigation */}
        <nav className="flex text-xs">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex-1 px-1 py-2 font-medium ${
              activeTab === 'editor'
                ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Material
          </button>
          <button
            onClick={() => setActiveTab('objects')}
            className={`flex-1 px-1 py-2 font-medium ${
              activeTab === 'objects'
                ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Objects
          </button>
          <button
            onClick={() => setActiveTab('transform')}
            className={`flex-1 px-1 py-2 font-medium ${
              activeTab === 'transform'
                ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Transform
          </button>
          <button
            onClick={() => setActiveTab('primitives')}
            className={`flex-1 px-1 py-2 font-medium ${
              activeTab === 'primitives'
                ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Add
          </button>
        </nav>
        
        {/* Secondary Navigation */}
        <nav className="flex text-xs border-t border-gray-700">
          <button
            onClick={() => setActiveTab('lighting')}
            className={`flex-1 px-1 py-2 font-medium ${
              activeTab === 'lighting'
                ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Lighting
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 px-1 py-2 font-medium ${
              activeTab === 'camera'
                ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Camera
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 px-1 py-2 font-medium ${
              activeTab === 'library'
                ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Library
          </button>
          <button
            onClick={() => setActiveTab('rendering')}
            className={`flex-1 px-1 py-2 font-medium ${
              activeTab === 'rendering'
                ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Rendering
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
        {activeTab === 'editor' && (
          <MaterialEditor
            configurator={configurator}
            selectedMesh={currentSelectedMesh}
          />
        )}
        {activeTab === 'transform' && (
          <TransformControls
            configurator={configurator}
            selectedMesh={currentSelectedMesh}
          />
        )}
        {activeTab === 'lighting' && (
          <LightingControls
            configurator={configurator}
          />
        )}
        {activeTab === 'objects' && (
          <ObjectSettingsControls
            configurator={configurator}
            selectedMesh={currentSelectedMesh}
          />
        )}
        {activeTab === 'primitives' && (
          <PrimitiveControls
            configurator={configurator}
          />
        )}
        {activeTab === 'camera' && (
          <CameraControls
            configurator={configurator}
          />
        )}
        {activeTab === 'library' && (
          <MaterialLibrary
            configurator={configurator}
            selectedMesh={currentSelectedMesh}
          />
        )}
        {activeTab === 'rendering' && (
          <RenderingQualityControls
            configurator={configurator}
          />
        )}
        {activeTab === 'scene' && (
          <SceneControls configurator={configurator} />
        )}
      </div>
    </div>
  );
};
