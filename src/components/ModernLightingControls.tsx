import React, { useState, useEffect, useCallback } from 'react';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';
import { ModernLightingSystem, ModernLightConfig } from '@/core/ModernLightingSystem';

interface ModernLightingControlsProps {
  configurator: Con3DConfigurator;
}

export const ModernLightingControls: React.FC<ModernLightingControlsProps> = ({ configurator }) => {
  const [lightingSystem, setLightingSystem] = useState<ModernLightingSystem | null>(null);
  const [lights, setLights] = useState<ModernLightConfig[]>([]);
  const [selectedLightId, setSelectedLightId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Initialize the modern lighting system
  useEffect(() => {
    if (configurator) {
      const scene = configurator.getScene();
      const system = new ModernLightingSystem(scene);
      setLightingSystem(system);
      
      // Load initial lights
      refreshLights(system);
    }
  }, [configurator]);

  const refreshLights = (system?: ModernLightingSystem) => {
    const sys = system || lightingSystem;
    if (sys) {
      const allLights = sys.getAllLights();
      setLights(allLights);
      console.log('🔄 Refreshed lights:', allLights.length);
    }
  };

  const createLight = useCallback((type: ModernLightConfig['type']) => {
    if (!lightingSystem) return;
    
    const lightId = lightingSystem.createLight(type);
    refreshLights();
    setSelectedLightId(lightId);
    setShowAddMenu(false);
  }, [lightingSystem]);

  const removeLight = useCallback((lightId: string) => {
    if (!lightingSystem) return;
    
    lightingSystem.removeLight(lightId);
    refreshLights();
    
    if (selectedLightId === lightId) {
      setSelectedLightId(null);
    }
  }, [lightingSystem, selectedLightId]);

  const toggleLightVisibility = useCallback((lightId: string) => {
    if (!lightingSystem) return;
    
    lightingSystem.toggleLightVisibility(lightId);
    refreshLights();
  }, [lightingSystem]);

  const updateLightProperty = useCallback((lightId: string, property: string, value: any) => {
    if (!lightingSystem) return;
    
    lightingSystem.updateLightProperty(lightId, property, value);
    refreshLights();
  }, [lightingSystem]);

  const selectedLight = lights.find(l => l.id === selectedLightId);

  if (!lightingSystem) {
    return (
      <div className="p-4 bg-gray-800 text-white">
        <p className="text-gray-400">Loading lighting system...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 text-white max-h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Modern Lighting System</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">{lights.length} light(s) in scene</span>
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              ➕ Add Light
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-600 rounded-lg shadow-lg z-10 min-w-40">
                {[
                  { type: 'ambient' as const, label: '🌍 Ambient', desc: 'Uniform lighting' },
                  { type: 'directional' as const, label: '☀️ Directional', desc: 'Sun-like lighting' },
                  { type: 'point' as const, label: '💡 Point', desc: 'Light bulb' },
                  { type: 'spot' as const, label: '🔦 Spot', desc: 'Cone of light' },
                  { type: 'area' as const, label: '🟩 Area', desc: 'Panel lighting' },
                ].map(({ type, label, desc }) => (
                  <button
                    key={type}
                    onClick={() => createLight(type)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                  >
                    <div className="text-sm">{label}</div>
                    <div className="text-xs text-gray-400">{desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Light List */}
      <div className="mb-4">
        {lights.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">💡</div>
            <p className="text-sm">No lights in scene</p>
            <p className="text-xs">Click "Add Light" to create your first light</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lights.map((light) => (
              <div
                key={light.id}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  selectedLightId === light.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
                onClick={() => setSelectedLightId(light.id === selectedLightId ? null : light.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {light.type === 'ambient' && '🌍'}
                      {light.type === 'directional' && '☀️'}
                      {light.type === 'point' && '💡'}
                      {light.type === 'spot' && '🔦'}
                      {light.type === 'area' && '🟩'}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{light.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{light.type} Light</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Visibility toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLightVisibility(light.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        light.visible 
                          ? 'text-blue-400 hover:text-blue-300' 
                          : 'text-gray-500 hover:text-gray-400'
                      }`}
                      title={light.visible ? 'Hide light' : 'Show light'}
                    >
                      {light.visible ? '👁️' : '🙈'}
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLight(light.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete light"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Light Properties Panel */}
      {selectedLight && (
        <div className="border-t border-gray-600 pt-4">
          <h4 className="text-md font-medium mb-3">{selectedLight.name} Properties</h4>
          
          <div className="space-y-3">
            {/* Intensity */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Intensity: {selectedLight.properties.intensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={selectedLight.properties.intensity}
                onChange={(e) => updateLightProperty(selectedLight.id, 'intensity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="color"
                value={selectedLight.properties.color}
                onChange={(e) => updateLightProperty(selectedLight.id, 'color', e.target.value)}
                className="w-full h-8 rounded border border-gray-600"
              />
            </div>

            {/* Position (for non-ambient lights) */}
            {selectedLight.type !== 'ambient' && selectedLight.properties.position && (
              <div>
                <label className="block text-sm font-medium mb-2">Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {['x', 'y', 'z'].map((axis) => (
                    <div key={axis}>
                      <label className="block text-xs text-gray-400 mb-1">{axis.toUpperCase()}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedLight.properties.position![axis as 'x' | 'y' | 'z'].toFixed(1)}
                        onChange={(e) => updateLightProperty(selectedLight.id, `position.${axis}`, parseFloat(e.target.value))}
                        className="w-full px-2 py-1 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Distance (for point and spot lights) */}
            {(selectedLight.type === 'point' || selectedLight.type === 'spot') && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Distance: {selectedLight.properties.distance?.toFixed(1) || '10.0'}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.5"
                  value={selectedLight.properties.distance || 10}
                  onChange={(e) => updateLightProperty(selectedLight.id, 'distance', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Spot light specific properties */}
            {selectedLight.type === 'spot' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Angle: {((selectedLight.properties.angle || Math.PI / 6) * 180 / Math.PI).toFixed(0)}°
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="1"
                    value={(selectedLight.properties.angle || Math.PI / 6) * 180 / Math.PI}
                    onChange={(e) => updateLightProperty(selectedLight.id, 'angle', parseFloat(e.target.value) * Math.PI / 180)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Penumbra: {(selectedLight.properties.penumbra || 0).toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedLight.properties.penumbra || 0}
                    onChange={(e) => updateLightProperty(selectedLight.id, 'penumbra', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {/* Decay (for point and spot lights) */}
            {(selectedLight.type === 'point' || selectedLight.type === 'spot') && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Decay: {selectedLight.properties.decay?.toFixed(1) || '2.0'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={selectedLight.properties.decay || 2}
                  onChange={(e) => updateLightProperty(selectedLight.id, 'decay', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
