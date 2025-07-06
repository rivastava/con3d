import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface LightingControlsProps {
  configurator: Con3DConfigurator;
}

interface LightConfig {
  id: string;
  name: string;
  type: 'directional' | 'ambient' | 'point' | 'spot';
  light: THREE.Light;
  intensity: number;
  color: string;
  position?: { x: number; y: number; z: number };
  target?: { x: number; y: number; z: number };
  distance?: number;
  angle?: number;
  penumbra?: number;
  decay?: number;
}

export const LightingControls: React.FC<LightingControlsProps> = ({ configurator }) => {
  const [lights, setLights] = useState<LightConfig[]>([]);
  const [selectedLightId, setSelectedLightId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [gizmoMode, setGizmoMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [gizmoEnabled, setGizmoEnabled] = useState<boolean>(false);
  
  const transformControlsRef = useRef<TransformControls | null>(null);
  const selectedLightRef = useRef<THREE.Light | null>(null);

  // Initialize with existing lights in the scene
  useEffect(() => {
    if (!configurator) return;

    const scene = configurator.getScene();
    const existingLights: LightConfig[] = [];

    scene.traverse((child) => {
      if (child instanceof THREE.Light) {
        const lightConfig: LightConfig = {
          id: child.uuid,
          name: child.name || `${child.type}`,
          type: getLightType(child),
          light: child,
          intensity: child.intensity,
          color: `#${child.color.getHexString()}`,
        };

        // Add position for lights that have it
        if ('position' in child) {
          lightConfig.position = {
            x: child.position.x,
            y: child.position.y,
            z: child.position.z,
          };
        }

        // Add specific properties for different light types
        if (child instanceof THREE.SpotLight) {
          lightConfig.distance = child.distance;
          lightConfig.angle = child.angle;
          lightConfig.penumbra = child.penumbra;
          lightConfig.decay = child.decay;
          lightConfig.target = {
            x: child.target.position.x,
            y: child.target.position.y,
            z: child.target.position.z,
          };
        } else if (child instanceof THREE.PointLight) {
          lightConfig.distance = child.distance;
          lightConfig.decay = child.decay;
        }

        existingLights.push(lightConfig);
      }
    });

    setLights(existingLights);
  }, [configurator]);

  // Initialize transform controls
  useEffect(() => {
    if (!configurator) return;

    const scene = configurator.getScene();
    const camera = configurator.getCamera();
    const renderer = configurator.getRenderer();
    const controls = configurator.getControls();

    // Create transform controls (gizmo)
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControlsRef.current = transformControls;
    
    // Add to scene
    scene.add(transformControls);

    // Handle transform control events
    const onDragStart = () => {
      // Disable orbit controls during transform
      controls.enabled = false;
    };

    const onDragEnd = () => {
      // Re-enable orbit controls
      controls.enabled = true;
      
      // Update light config if a light is being transformed
      if (selectedLightRef.current) {
        updateLightConfigFromTransform(selectedLightRef.current);
      }
    };

    // Cast to any to handle the specific TransformControls events
    (transformControls as any).addEventListener('objectChange', () => {
      // Update light config during transform
      if (selectedLightRef.current) {
        updateLightConfigFromTransform(selectedLightRef.current);
      }
    });

    (transformControls as any).addEventListener('dragging-changed', (event: any) => {
      if (event.value) {
        onDragStart();
      } else {
        onDragEnd();
      }
    });

    // Cleanup
    return () => {
      scene.remove(transformControls);
      transformControls.dispose();
    };
  }, [configurator]);

  // Update transform controls when gizmo mode changes
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(gizmoMode);
    }
  }, [gizmoMode]);

  // Handle light selection and gizmo attachment
  useEffect(() => {
    const selectedLight = lights.find(l => l.id === selectedLightId)?.light;
    selectedLightRef.current = selectedLight || null;

    if (transformControlsRef.current) {
      if (selectedLight && gizmoEnabled && 'position' in selectedLight) {
        transformControlsRef.current.attach(selectedLight);
        transformControlsRef.current.visible = true;
      } else {
        transformControlsRef.current.detach();
        transformControlsRef.current.visible = false;
      }
    }
  }, [selectedLightId, gizmoEnabled, lights]);

  const updateLightConfigFromTransform = (light: THREE.Light) => {
    setLights(prevLights => 
      prevLights.map(lightConfig => {
        if (lightConfig.id === light.uuid && 'position' in light) {
          return {
            ...lightConfig,
            position: {
              x: light.position.x,
              y: light.position.y,
              z: light.position.z
            }
          };
        }
        return lightConfig;
      })
    );
  };

  const getLightType = (light: THREE.Light): LightConfig['type'] => {
    if (light instanceof THREE.DirectionalLight) return 'directional';
    if (light instanceof THREE.AmbientLight) return 'ambient';
    if (light instanceof THREE.PointLight) return 'point';
    if (light instanceof THREE.SpotLight) return 'spot';
    return 'directional';
  };

  const createLight = useCallback((type: LightConfig['type']) => {
    if (!configurator) return;

    const scene = configurator.getScene();
    let light: THREE.Light;
    let lightConfig: Partial<LightConfig> = {
      type,
      intensity: 1,
      color: '#ffffff',
    };

    switch (type) {
      case 'ambient':
        light = new THREE.AmbientLight(0xffffff, 0.4);
        light.name = 'Ambient Light';
        break;
      case 'directional':
        light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        light.castShadow = true;
        light.name = 'Directional Light';
        lightConfig.position = { x: 5, y: 5, z: 5 };
        break;
      case 'point':
        light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(0, 5, 0);
        light.castShadow = true;
        light.name = 'Point Light';
        lightConfig.position = { x: 0, y: 5, z: 0 };
        lightConfig.distance = 100;
        lightConfig.decay = 2;
        break;
      case 'spot':
        const spotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 4, 0.1, 2);
        spotLight.position.set(0, 10, 0);
        spotLight.target.position.set(0, 0, 0);
        spotLight.castShadow = true;
        spotLight.name = 'Spot Light';
        light = spotLight;
        lightConfig.position = { x: 0, y: 10, z: 0 };
        lightConfig.target = { x: 0, y: 0, z: 0 };
        lightConfig.distance = 100;
        lightConfig.angle = Math.PI / 4;
        lightConfig.penumbra = 0.1;
        lightConfig.decay = 2;
        break;
      default:
        return;
    }

    scene.add(light);

    const newLightConfig: LightConfig = {
      id: light.uuid,
      name: light.name,
      light,
      ...lightConfig,
    } as LightConfig;

    setLights(prev => [...prev, newLightConfig]);
    setSelectedLightId(light.uuid);
    setShowAddMenu(false);
  }, [configurator]);

  const removeLight = useCallback((lightId: string) => {
    if (!configurator) return;

    const lightConfig = lights.find(l => l.id === lightId);
    if (!lightConfig) return;

    const scene = configurator.getScene();
    scene.remove(lightConfig.light);

    setLights(prev => prev.filter(l => l.id !== lightId));
    if (selectedLightId === lightId) {
      setSelectedLightId(null);
    }
  }, [configurator, lights, selectedLightId]);

  const updateLightProperty = useCallback((lightId: string, property: string, value: any) => {
    const lightConfig = lights.find(l => l.id === lightId);
    if (!lightConfig) return;

    const { light } = lightConfig;

    switch (property) {
      case 'intensity':
        light.intensity = value;
        break;
      case 'color':
        light.color.set(value);
        break;
      case 'position.x':
        if ('position' in light) light.position.x = value;
        break;
      case 'position.y':
        if ('position' in light) light.position.y = value;
        break;
      case 'position.z':
        if ('position' in light) light.position.z = value;
        break;
      case 'target.x':
        if (light instanceof THREE.SpotLight || light instanceof THREE.DirectionalLight) {
          light.target.position.x = value;
        }
        break;
      case 'target.y':
        if (light instanceof THREE.SpotLight || light instanceof THREE.DirectionalLight) {
          light.target.position.y = value;
        }
        break;
      case 'target.z':
        if (light instanceof THREE.SpotLight || light instanceof THREE.DirectionalLight) {
          light.target.position.z = value;
        }
        break;
      case 'distance':
        if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
          light.distance = value;
        }
        break;
      case 'angle':
        if (light instanceof THREE.SpotLight) {
          light.angle = value;
        }
        break;
      case 'penumbra':
        if (light instanceof THREE.SpotLight) {
          light.penumbra = value;
        }
        break;
      case 'decay':
        if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
          light.decay = value;
        }
        break;
    }

    // Update the lights state
    setLights(prev => prev.map(l => {
      if (l.id === lightId) {
        const updated = { ...l };
        const keys = property.split('.');
        if (keys.length === 2 && keys[0] in updated) {
          (updated as any)[keys[0]][keys[1]] = value;
        } else if (keys.length === 1 && keys[0] in updated) {
          (updated as any)[keys[0]] = value;
        }
        return updated;
      }
      return l;
    }));
  }, [lights]);

  const selectedLight = lights.find(l => l.id === selectedLightId);

  return (
    <div className="p-4 bg-gray-800 text-white">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Lighting Controls</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">{lights.length} light(s) in scene</span>
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="btn btn-primary text-sm"
            >
              ➕ Add Light
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-600 rounded-lg shadow-lg z-10 min-w-32">
                {[
                  { type: 'ambient' as const, label: '🌍 Ambient', desc: 'Uniform lighting' },
                  { type: 'directional' as const, label: '☀️ Directional', desc: 'Sun-like lighting' },
                  { type: 'point' as const, label: '💡 Point', desc: 'Light bulb' },
                  { type: 'spot' as const, label: '🔦 Spot', desc: 'Cone of light' },
                ].map(({ type, label, desc }) => (
                  <button
                    key={type}
                    onClick={() => createLight(type)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
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
      <div className="mb-4 flex-1 overflow-y-auto">
        {lights.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💡</div>
            <p className="text-gray-400 mb-2">No lights in scene</p>
            <p className="text-gray-500 text-sm">Add lights to illuminate your model</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lights.map((light) => (
              <div
                key={light.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedLightId === light.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => setSelectedLightId(light.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">{light.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{light.type} Light</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLight(light.id);
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                    title="Remove light"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gizmo Controls */}
      {selectedLight && selectedLight.type !== 'ambient' && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold mb-3">Transform Gizmo</h4>
          
          {/* Gizmo Toggle */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm">Enable Gizmo</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={gizmoEnabled}
                onChange={(e) => setGizmoEnabled(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-11 h-6 rounded-full transition-colors ${
                gizmoEnabled ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  gizmoEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </label>
          </div>

          {/* Gizmo Mode */}
          {gizmoEnabled && (
            <div>
              <label className="block text-sm mb-2">Gizmo Mode</label>
              <div className="grid grid-cols-3 gap-1">
                {(['translate', 'rotate', 'scale'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGizmoMode(mode)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      gizmoMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                    }`}
                  >
                    {mode === 'translate' && '⬌'}
                    {mode === 'rotate' && '⟲'}
                    {mode === 'scale' && '⤢'}
                    <br />
                    <span className="capitalize">{mode}</span>
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Click and drag the gizmo in the 3D view to transform the light
              </div>
            </div>
          )}
        </div>
      )}

      {/* Light Properties */}
      {selectedLight && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-md font-medium mb-3">Light Properties</h4>
          <div className="space-y-3">
            {/* Intensity */}
            <div>
              <label className="block text-sm mb-1">
                Intensity: {selectedLight.intensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={selectedLight.intensity}
                onChange={(e) => updateLightProperty(selectedLight.id, 'intensity', parseFloat(e.target.value))}
                className="w-full input-range"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm mb-1">Color</label>
              <input
                type="color"
                value={selectedLight.color}
                onChange={(e) => updateLightProperty(selectedLight.id, 'color', e.target.value)}
                className="w-full h-8 rounded border border-gray-600"
              />
            </div>

            {/* Position (for non-ambient lights) */}
            {selectedLight.type !== 'ambient' && selectedLight.position && (
              <div>
                <label className="block text-sm mb-2">Position</label>
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <div key={axis} className="mb-2">
                    <label className="block text-xs mb-1">
                      {axis.toUpperCase()}: {selectedLight.position![axis].toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      step="0.5"
                      value={selectedLight.position![axis]}
                      onChange={(e) => updateLightProperty(selectedLight.id, `position.${axis}`, parseFloat(e.target.value))}
                      className="w-full input-range"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Target (for directional and spot lights) */}
            {(selectedLight.type === 'directional' || selectedLight.type === 'spot') && selectedLight.target && (
              <div>
                <label className="block text-sm mb-2">Target</label>
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <div key={axis} className="mb-2">
                    <label className="block text-xs mb-1">
                      {axis.toUpperCase()}: {selectedLight.target![axis].toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="0.5"
                      value={selectedLight.target![axis]}
                      onChange={(e) => updateLightProperty(selectedLight.id, `target.${axis}`, parseFloat(e.target.value))}
                      className="w-full input-range"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Distance (for point and spot lights) */}
            {(selectedLight.type === 'point' || selectedLight.type === 'spot') && (
              <div>
                <label className="block text-sm mb-1">
                  Distance: {selectedLight.distance?.toFixed(1) || 0}
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={selectedLight.distance || 0}
                  onChange={(e) => updateLightProperty(selectedLight.id, 'distance', parseFloat(e.target.value))}
                  className="w-full input-range"
                />
              </div>
            )}

            {/* Spot light specific properties */}
            {selectedLight.type === 'spot' && (
              <>
                <div>
                  <label className="block text-sm mb-1">
                    Angle: {((selectedLight.angle || 0) * 180 / Math.PI).toFixed(1)}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="1"
                    value={(selectedLight.angle || 0) * 180 / Math.PI}
                    onChange={(e) => updateLightProperty(selectedLight.id, 'angle', parseFloat(e.target.value) * Math.PI / 180)}
                    className="w-full input-range"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    Penumbra: {(selectedLight.penumbra || 0).toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedLight.penumbra || 0}
                    onChange={(e) => updateLightProperty(selectedLight.id, 'penumbra', parseFloat(e.target.value))}
                    className="w-full input-range"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
