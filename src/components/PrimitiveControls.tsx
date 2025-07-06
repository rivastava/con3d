import React, { useState, useEffect } from 'react';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';
import { PrimitiveManager, PrimitiveType } from '@/core/PrimitiveManager';

interface PrimitiveControlsProps {
  configurator: Con3DConfigurator;
}

export const PrimitiveControls: React.FC<PrimitiveControlsProps> = ({ configurator }) => {
  const [primitiveManager, setPrimitiveManager] = useState<PrimitiveManager | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    if (configurator) {
      const manager = configurator.getPrimitiveManager();
      setPrimitiveManager(manager);
    }
  }, [configurator]);

  const primitiveTypes: { type: PrimitiveType; label: string; icon: string }[] = [
    { type: 'plane', label: 'Plane', icon: '⬜' },
    { type: 'cube', label: 'Cube', icon: '🟦' },
    { type: 'sphere', label: 'Sphere', icon: '🔵' },
    { type: 'cylinder', label: 'Cylinder', icon: '🥫' },
    { type: 'cone', label: 'Cone', icon: '🔺' },
    { type: 'torus', label: 'Torus', icon: '🍩' },
    { type: 'icosphere', label: 'Ico Sphere', icon: '⚽' },
  ];

  const handleAddPrimitive = (type: PrimitiveType) => {
    if (primitiveManager) {
      primitiveManager.createPrimitive(type);
      setShowAddMenu(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Add Primitives</h3>
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
        >
          + Add Mesh
        </button>
      </div>

      {showAddMenu && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <h4 className="text-sm font-medium mb-3">Select Primitive Type</h4>
          <div className="grid grid-cols-2 gap-2">
            {primitiveTypes.map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => handleAddPrimitive(type)}
                className="flex items-center space-x-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400">
        <p className="mb-2">Quick Add:</p>
        <div className="grid grid-cols-4 gap-1">
          {primitiveTypes.slice(0, 4).map(({ type, icon }) => (
            <button
              key={type}
              onClick={() => handleAddPrimitive(type)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-center"
              title={`Add ${type}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
