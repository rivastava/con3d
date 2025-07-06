import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface StatusBarProps {
  configurator?: Con3DConfigurator;
}

export const StatusBar: React.FC<StatusBarProps> = ({ configurator }) => {
  const [status, setStatus] = useState<string>('Ready');
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);

  useEffect(() => {
    if (configurator) {
      // Listen for mesh selection
      configurator.onMeshSelected((mesh: THREE.Mesh | null) => {
        if (mesh) {
          setSelectedMesh(mesh.name || 'Unnamed Mesh');
        } else {
          setSelectedMesh(null);
        }
      });

      // Listen for scene events
      configurator.events.on('scene:loading', () => setStatus('Loading model...'));
      configurator.events.on('scene:loaded', () => setStatus('Model loaded'));
      configurator.events.on('environment:hdri-changed', () => setStatus('HDRI updated'));
      configurator.events.on('material:updated', () => setStatus('Material updated'));
    }
  }, [configurator]);

  return (
    <div className="bg-gray-900 border-t border-gray-700 px-4 py-2 text-sm text-gray-300 flex justify-between">
      <span>{status}</span>
      {selectedMesh && (
        <span>Selected: {selectedMesh}</span>
      )}
    </div>
  );
};
