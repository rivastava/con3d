import React, { useState, useEffect } from 'react';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface SelectionDebugPanelProps {
  configurator?: Con3DConfigurator;
}

export const SelectionDebugPanel: React.FC<SelectionDebugPanelProps> = ({ configurator }) => {
  const [selectedObject, setSelectedObject] = useState<string>('None');
  const [selectableObjects, setSelectableObjects] = useState<Array<{ name: string; type: string; visible: boolean }>>([]);

  useEffect(() => {
    if (!configurator) return;

    const updateSelectionInfo = () => {
      // Get current selection
      const selected = configurator.getSelectedMesh();
      setSelectedObject(selected ? (selected.name || 'Unnamed') : 'None');

      // Get all selectable objects
      const selectable = configurator.getAllSelectableObjects();
      setSelectableObjects(selectable.map(obj => ({
        name: obj.name || 'Unnamed',
        type: obj.type,
        visible: obj.visible
      })));
    };

    // Update initially
    updateSelectionInfo();

    // Listen for selection changes
    configurator.onMeshSelected(() => {
      updateSelectionInfo();
    });

    // Update every second to catch any changes
    const interval = setInterval(updateSelectionInfo, 1000);

    return () => clearInterval(interval);
  }, [configurator]);

  const handleSelectNext = () => {
    if (configurator) {
      configurator.selectNextObject();
    }
  };

  const handleSelectPrevious = () => {
    if (configurator) {
      configurator.selectPreviousObject();
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-200">Selection Debug</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSelectPrevious}
            className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs hover:bg-gray-500"
            title="Select Previous (Shift+Tab)"
          >
            ← Prev
          </button>
          <button
            onClick={handleSelectNext}
            className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs hover:bg-gray-500"
            title="Select Next (Tab)"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Current Selection */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Selected Object</label>
          <div className="px-2 py-1 bg-gray-700 rounded text-xs text-white">
            {selectedObject}
          </div>
        </div>

        {/* Selectable Objects List */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Selectable Objects ({selectableObjects.length})
          </label>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {selectableObjects.map((obj, index) => {
              // Show light selectors as lights in the UI
              const displayName = obj.name.includes('_selector') 
                ? obj.name.replace('_selector', ' (Light)')
                : obj.name;
              const displayType = obj.name.includes('_selector') 
                ? 'Light Selector'
                : obj.type;
                
              return (
                <div
                  key={index}
                  className={`px-2 py-1 rounded text-xs flex justify-between items-center ${
                    obj.name === selectedObject
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <span>{displayName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60">{displayType}</span>
                    <span className={`w-2 h-2 rounded-full ${obj.visible ? 'bg-green-400' : 'bg-red-400'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection Rules */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="font-medium text-gray-400">Selection Rules (Blender-style):</div>
          <div>✅ Meshes and Lights (via invisible selectors)</div>
          <div>❌ Hidden objects excluded</div>
          <div>❌ Helpers excluded (Grid, Axes, Light Targets)</div>
          <div>❌ Transform controls excluded</div>
          <div>❌ Unnamed Object3D excluded</div>
          <div>❌ Objects with selectable=false</div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="font-medium text-gray-400">Shortcuts:</div>
          <div>Tab - Select Next | Shift+Tab - Select Previous</div>
          <div>Click - Select Object | ESC - Deselect</div>
        </div>
      </div>
    </div>
  );
};

export default SelectionDebugPanel;
