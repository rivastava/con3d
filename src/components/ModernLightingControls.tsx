import React, { useState, useEffect, useCallback } from 'react';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';
import { ModernLightingSystem, ModernLightConfig } from '@/core/ModernLightingSystem';

interface ModernLightingControlsProps {
  configurator: Con3DConfigurator;
}

const colorTemperatureToHex = (temp: number): string => {
  temp = temp / 100;
  
  let red: number, green: number, blue: number;
  
  if (temp <= 66) {
    red = 255;
  } else {
    red = temp - 60;
    red = 329.698727446 * Math.pow(red, -0.1332047592);
    red = Math.max(0, Math.min(255, red));
  }
  
  if (temp <= 66) {
    green = temp;
    green = 99.4708025861 * Math.log(green) - 161.1195681661;
  } else {
    green = temp - 60;
    green = 288.1221695283 * Math.pow(green, -0.0755148492);
  }
  green = Math.max(0, Math.min(255, green));
  
  if (temp >= 66) {
    blue = 255;
  } else if (temp <= 19) {
    blue = 0;
  } else {
    blue = temp - 10;
    blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
    blue = Math.max(0, Math.min(255, blue));
  }
  
  const r = Math.round(red).toString(16).padStart(2, '0');
  const g = Math.round(green).toString(16).padStart(2, '0');
  const b = Math.round(blue).toString(16).padStart(2, '0');
  
  return `#${r}${g}${b}`;
};

export const ModernLightingControls: React.FC<ModernLightingControlsProps> = ({ configurator }) => {
  const [lightingSystem, setLightingSystem] = useState<ModernLightingSystem | null>(null);
  const [lights, setLights] = useState<ModernLightConfig[]>([]);
  const [selectedLightId, setSelectedLightId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [colorTemperature, setColorTemperature] = useState<number>(5500); // Default daylight

  // Initialize the modern lighting system
  useEffect(() => {
    if (configurator) {
      const scene = configurator.getScene();
      const system = new ModernLightingSystem(scene);
      setLightingSystem(system);
      
      // Load initial lights
      refreshLights(system);
      
      // Sync with viewport light selection
      configurator.onLightSelected((lightId) => {
        console.log('🔄 Viewport selected light:', lightId);
        setSelectedLightId(lightId);
      });
    }
  }, [configurator]);

  // Sync selection changes back to viewport
  useEffect(() => {
    if (configurator && selectedLightId !== configurator.getSelectedLight()) {
      configurator.setSelectedLight(selectedLightId);
    }
  }, [selectedLightId, configurator]);

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
                  { type: 'hemisphere' as const, label: '🌐 Hemisphere', desc: 'Sky lighting' },
                  { type: 'ring' as const, label: '⭕ Ring', desc: 'Circular array' },
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
                onClick={() => {
                  const newSelectedId = light.id === selectedLightId ? null : light.id;
                  setSelectedLightId(newSelectedId);
                  // Also update the configurator selection
                  if (configurator) {
                    configurator.setSelectedLight(newSelectedId);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {light.type === 'ambient' && '🌍'}
                      {light.type === 'directional' && '☀️'}
                      {light.type === 'point' && '💡'}
                      {light.type === 'spot' && '🔦'}
                      {light.type === 'area' && '🟩'}
                      {light.type === 'hemisphere' && '🌐'}
                      {light.type === 'ring' && '⭕'}
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
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>2.5</span>
                <span>5</span>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedLight.properties.color}
                  onChange={(e) => updateLightProperty(selectedLight.id, 'color', e.target.value)}
                  className="flex-1 h-8 rounded border border-gray-600"
                />
                <button
                  onClick={() => updateLightProperty(selectedLight.id, 'color', '#ffffff')}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                  title="Reset to white"
                >
                  ⚪
                </button>
              </div>
              <div className="mt-2">
                <label className="block text-xs text-gray-400 mb-1">Quick Colors</label>
                <div className="flex gap-1">
                  {[
                    { color: '#ffffff', name: 'White' },
                    { color: '#fff5e6', name: 'Warm White' },
                    { color: '#e6f3ff', name: 'Cool White' },
                    { color: '#ffb366', name: 'Tungsten' },
                    { color: '#ff6b6b', name: 'Red' },
                    { color: '#4ecdc4', name: 'Cyan' },
                    { color: '#45b7d1', name: 'Blue' },
                    { color: '#96ceb4', name: 'Green' },
                  ].map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => updateLightProperty(selectedLight.id, 'color', color)}
                      className="w-6 h-6 rounded border border-gray-500 hover:border-white transition-colors"
                      style={{ backgroundColor: color }}
                      title={name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Color Temperature (for compatible lights) */}
            {selectedLight.type !== 'ambient' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Color Temperature: {colorTemperature} K
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="100"
                  value={colorTemperature}
                  onChange={(e) => {
                    const newTemp = parseInt(e.target.value);
                    setColorTemperature(newTemp);
                    const hexColor = colorTemperatureToHex(newTemp);
                    updateLightProperty(selectedLight.id, 'color', hexColor);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Candlelight</span>
                  <span>Daylight</span>
                  <span>Cool Blue</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {colorTemperature < 2000 && "🕯️ Warm candlelight"}
                  {colorTemperature >= 2000 && colorTemperature < 3000 && "💡 Tungsten bulb"}
                  {colorTemperature >= 3000 && colorTemperature < 4000 && "🌅 Sunrise/sunset"}
                  {colorTemperature >= 4000 && colorTemperature < 5500 && "🌤️ Cool white"}
                  {colorTemperature >= 5500 && colorTemperature < 6500 && "☀️ Daylight"}
                  {colorTemperature >= 6500 && "🌌 Cool blue sky"}
                </div>
              </div>
            )}

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
