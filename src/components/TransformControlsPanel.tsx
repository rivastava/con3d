import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface TransformControlsPanelProps {
  configurator?: Con3DConfigurator;
}

export const TransformControlsPanel: React.FC<TransformControlsPanelProps> = ({ configurator }) => {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);

  useEffect(() => {
    if (!configurator) return;

    const renderingEngine = configurator.getRenderingEngine();
    if (!renderingEngine) return;

    // Check initial state
    setEnabled(renderingEngine.isTransformControlsEnabled());
    setMode(renderingEngine.getTransformMode());

    // Listen for mesh selection changes
    const handleMeshSelection = (mesh: THREE.Mesh | null) => {
      setSelectedMesh(mesh ? (mesh.name || 'Unnamed mesh') : null);
    };

    renderingEngine.onMeshSelected(handleMeshSelection);
    setSelectedMesh(renderingEngine.getSelectedMesh()?.name || null);

  }, [configurator]);

  const handleToggleTransformControls = () => {
    if (!configurator) return;

    const renderingEngine = configurator.getRenderingEngine();
    if (!renderingEngine) return;

    if (enabled) {
      renderingEngine.disableTransformControls();
      setEnabled(false);
    } else {
      renderingEngine.enableTransformControls();
      setEnabled(true);
      
      // Auto-attach to selected mesh if any
      const mesh = renderingEngine.getSelectedMesh();
      if (mesh) {
        renderingEngine.attachTransformControls(mesh);
      }
    }
  };

  const handleModeChange = (newMode: 'translate' | 'rotate' | 'scale') => {
    if (!configurator) return;

    const renderingEngine = configurator.getRenderingEngine();
    if (!renderingEngine) return;

    renderingEngine.setTransformMode(newMode);
    setMode(newMode);
  };

  const getModeIcon = (mode: 'translate' | 'rotate' | 'scale') => {
    switch (mode) {
      case 'translate': return '📐'; // Move/Translate icon
      case 'rotate': return '🔄'; // Rotate icon
      case 'scale': return '📏'; // Scale icon
      default: return '📐';
    }
  };

  const getModeLabel = (mode: 'translate' | 'rotate' | 'scale') => {
    switch (mode) {
      case 'translate': return 'Move (W)';
      case 'rotate': return 'Rotate (E)';
      case 'scale': return 'Scale (R)';
      default: return 'Move';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-200">Transform Controls</h3>
        <button
          onClick={handleToggleTransformControls}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            enabled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {enabled && (
        <div className="space-y-3">
          {/* Mode Selection */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Transform Mode</label>
            <div className="grid grid-cols-3 gap-1">
              {(['translate', 'rotate', 'scale'] as const).map((modeOption) => (
                <button
                  key={modeOption}
                  onClick={() => handleModeChange(modeOption)}
                  className={`px-2 py-2 rounded text-xs font-medium transition-colors flex items-center justify-center ${
                    mode === modeOption
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title={getModeLabel(modeOption)}
                >
                  <span className="mr-1">{getModeIcon(modeOption)}</span>
                  <span className="hidden sm:inline">{modeOption}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="text-xs text-gray-400">
            {selectedMesh ? (
              <div>
                <span className="text-green-400">●</span> Attached to: {selectedMesh}
              </div>
            ) : (
              <div>
                <span className="text-yellow-400">●</span> No mesh selected
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="text-xs text-gray-500 space-y-1">
            <div className="font-medium text-gray-400">Shortcuts:</div>
            <div>W - Move | E - Rotate | R - Scale</div>
            <div>X - Toggle World/Local | ESC - Deselect</div>
          </div>
        </div>
      )}

      {!enabled && (
        <div className="text-xs text-gray-500 mt-2">
          Enable transform controls to move, rotate, and scale objects in the scene.
          Click on a mesh to select it first.
        </div>
      )}
    </div>
  );
};

export default TransformControlsPanel;
