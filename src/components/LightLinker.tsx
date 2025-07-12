import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface LightLinkerProps {
  configurator: Con3DConfigurator;
}

interface LightObject {
  id: string;
  name: string;
  light: THREE.Light;
  type: string;
}

interface MeshObject {
  id: string;
  name: string;
  mesh: THREE.Mesh;
}

interface LightLink {
  lightId: string;
  meshId: string;
  enabled: boolean;
  influence: number; // 0.0 to 1.0
}

export const LightLinker: React.FC<LightLinkerProps> = ({ configurator }) => {
  const [lights, setLights] = useState<LightObject[]>([]);
  const [meshes, setMeshes] = useState<MeshObject[]>([]);
  const [lightLinks, setLightLinks] = useState<LightLink[]>([]);
  const [selectedLight, setSelectedLight] = useState<string | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  // Helper function to check if an object is a helper or system object
  const isHelperOrSystemObject = (object: THREE.Object3D): boolean => {
    const name = object.name?.toLowerCase() || '';
    const userData = object.userData || {};
    
    // Check for helper/system indicators
    if (name.includes('helper') || name.includes('gizmo') || name.includes('target') || name.includes('selector')) {
      return true;
    }
    
    // Check userData flags
    if (userData.isHelper || userData.isSystemObject || userData.hideInOutliner) {
      return true;
    }
    
    // Check for transform control axis names (X, Y, Z, etc.)
    if (['x', 'y', 'z', 'xyz', 'yz', 'xz', 'xy'].includes(name)) {
      return true;
    }
    
    return false;
  };

  // Helper function to check if a mesh is valid for light linking
  const isValidMeshForLinking = (object: THREE.Mesh): boolean => {
    if (!object.name) return false;
    if (isHelperOrSystemObject(object)) return false;
    
    // Only include user-created or loaded meshes
    const validMeshPrefixes = ['Main', 'Chrome', 'Glass', 'Gold', 'Ground', 'Cube', 'Sphere', 'Torus', 'Plane'];
    const name = object.name;
    
    // Accept meshes with recognizable names or those that don't look like helpers
    return validMeshPrefixes.some(prefix => name.includes(prefix)) || 
           (!name.includes('Helper') && !name.includes('helper') && !name.includes('Gizmo'));
  };

  // Get the advanced lighting system from the configurator
  const getAdvancedLightingSystem = () => {
    try {
      return configurator.getAdvancedLightingSystem();
    } catch (error) {
      console.warn('Could not access AdvancedLightingSystem:', error);
      return null;
    }
  };

  // Refresh scene objects
  const refreshSceneObjects = () => {
    const lightingSystem = getAdvancedLightingSystem();
    
    if (lightingSystem) {
      console.log('Using AdvancedLightingSystem for light linking');
      const foundLights = lightingSystem.getLights();
      const foundMeshes = lightingSystem.getMeshes();
      
      console.log('Found lights:', foundLights.length, 'Found meshes:', foundMeshes.length);
      
      setLights(foundLights);
      setMeshes(foundMeshes);
      
      // Get current light links from the lighting system
      const currentLinks = lightingSystem.getAllLightLinks();
      
      // Initialize missing links with default enabled state
      const allLinks: LightLink[] = [];
      foundLights.forEach((light: any) => {
        foundMeshes.forEach((mesh: any) => {
          const existingLink = currentLinks.find((link: any) => 
            link.lightId === light.id && link.meshId === mesh.id
          );
          
          allLinks.push(existingLink || {
            lightId: light.id,
            meshId: mesh.id,
            enabled: true, // Default to enabled
            influence: 1.0
          });
        });
      });
      
      setLightLinks(allLinks);
    } else {
      console.log('AdvancedLightingSystem not available, using fallback');
      // Fallback to manual scene traversal
      const scene = configurator.getScene();
      const foundLights: LightObject[] = [];
      const foundMeshes: MeshObject[] = [];

      scene.traverse((object) => {
        if (object instanceof THREE.Light && object.name && !isHelperOrSystemObject(object)) {
          foundLights.push({
            id: object.uuid,
            name: object.name || `${object.type} ${object.uuid.slice(0, 8)}`,
            light: object,
            type: object.type
          });
        } else if (object instanceof THREE.Mesh && isValidMeshForLinking(object)) {
          foundMeshes.push({
            id: object.uuid,
            name: object.name || `Mesh ${object.uuid.slice(0, 8)}`,
            mesh: object
          });
        }
      });

      console.log('Fallback - Found lights:', foundLights.length, 'Found meshes:', foundMeshes.length);

      setLights(foundLights);
      setMeshes(foundMeshes);

      // Initialize light links for all light-mesh combinations
      const newLinks: LightLink[] = [];
      foundLights.forEach(light => {
        foundMeshes.forEach(mesh => {
          newLinks.push({
            lightId: light.id,
            meshId: mesh.id,
            enabled: true, // Default to enabled
            influence: 1.0
          });
        });
      });

      setLightLinks(newLinks);
    }
  };

  useEffect(() => {
    refreshSceneObjects();
  }, [configurator]);

  // Update light linking
  const updateLightLink = (lightId: string, meshId: string, enabled: boolean, influence?: number) => {
    const newInfluence = influence !== undefined ? influence : 1.0;
    
    console.log('Updating light link:', { lightId, meshId, enabled, influence: newInfluence });
    
    // Update local state
    setLightLinks(prev => prev.map(link => {
      if (link.lightId === lightId && link.meshId === meshId) {
        return {
          ...link,
          enabled,
          influence: newInfluence
        };
      }
      return link;
    }));

    // Update the advanced lighting system
    const lightingSystem = getAdvancedLightingSystem();
    if (lightingSystem) {
      console.log('Applying light link to AdvancedLightingSystem');
      lightingSystem.setLightLink(lightId, meshId, enabled, newInfluence);
    } else {
      console.warn('AdvancedLightingSystem not available - light linking changes won\'t be applied');
    }
  };

  // Get light link for specific light-mesh combination
  const getLightLink = (lightId: string, meshId: string): LightLink | undefined => {
    return lightLinks.find(link => link.lightId === lightId && link.meshId === meshId);
  };

  // Bulk operations
  const enableAllLightsForMesh = (meshId: string) => {
    console.log('Enabling all lights for mesh:', meshId);
    
    setLightLinks(prev => prev.map(link => 
      link.meshId === meshId ? { ...link, enabled: true } : link
    ));
    
    const lightingSystem = getAdvancedLightingSystem();
    if (lightingSystem) {
      lightingSystem.enableAllLightsForMesh(meshId);
    } else {
      console.warn('AdvancedLightingSystem not available for bulk operation');
    }
  };

  const disableAllLightsForMesh = (meshId: string) => {
    console.log('Disabling all lights for mesh:', meshId);
    
    setLightLinks(prev => prev.map(link => 
      link.meshId === meshId ? { ...link, enabled: false } : link
    ));
    
    const lightingSystem = getAdvancedLightingSystem();
    if (lightingSystem) {
      lightingSystem.disableAllLightsForMesh(meshId);
    } else {
      console.warn('AdvancedLightingSystem not available for bulk operation');
    }
  };

  const enableLightForAllMeshes = (lightId: string) => {
    console.log('Enabling light for all meshes:', lightId);
    
    setLightLinks(prev => prev.map(link => 
      link.lightId === lightId ? { ...link, enabled: true } : link
    ));
    
    const lightingSystem = getAdvancedLightingSystem();
    if (lightingSystem) {
      lightingSystem.enableLightForAllMeshes(lightId);
    } else {
      console.warn('AdvancedLightingSystem not available for bulk operation');
    }
  };

  const disableLightForAllMeshes = (lightId: string) => {
    console.log('Disabling light for all meshes:', lightId);
    
    setLightLinks(prev => prev.map(link => 
      link.lightId === lightId ? { ...link, enabled: false } : link
    ));
    
    const lightingSystem = getAdvancedLightingSystem();
    if (lightingSystem) {
      lightingSystem.disableLightForAllMeshes(lightId);
    } else {
      console.warn('AdvancedLightingSystem not available for bulk operation');
    }
  };

  // Get light type icon
  const getLightIcon = (type: string) => {
    switch (type) {
      case 'DirectionalLight': return '☀️';
      case 'PointLight': return '💡';
      case 'SpotLight': return '🔦';
      case 'AmbientLight': return '🌅';
      case 'HemisphereLight': return '🌗';
      case 'RectAreaLight': return '⬜';
      default: return '💡';
    }
  };

  return (
    <div className="p-4 bg-gray-800 text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Light Linking</h3>
        <div className="flex gap-2">
          <button
            onClick={refreshSceneObjects}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm"
          >
            {showMatrix ? '📊 List View' : '🔗 Matrix View'}
          </button>
        </div>
      </div>

      {lights.length === 0 && (
        <p className="text-gray-400 text-sm mb-4">No lights found in scene</p>
      )}

      {meshes.length === 0 && (
        <p className="text-gray-400 text-sm mb-4">No meshes found in scene</p>
      )}

      {!showMatrix ? (
        // List View - Traditional approach
        <div className="space-y-6">
          {/* Lights Section */}
          <div>
            <h4 className="text-md font-medium mb-3">Lights ({lights.length})</h4>
            <div className="space-y-2">
              {lights.map(light => (
                <div
                  key={light.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedLight === light.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedLight(selectedLight === light.id ? null : light.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>{getLightIcon(light.type)}</span>
                      <span className="font-medium">{light.name}</span>
                      <span className="text-xs text-gray-400">({light.type})</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          enableLightForAllMeshes(light.id);
                        }}
                        className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs"
                      >
                        Enable All
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          disableLightForAllMeshes(light.id);
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs"
                      >
                        Disable All
                      </button>
                    </div>
                  </div>
                  
                  {selectedLight === light.id && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <h5 className="text-sm font-medium mb-2">Affected Meshes:</h5>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                        {meshes.map(mesh => {
                          const link = getLightLink(light.id, mesh.id);
                          return (
                            <div key={mesh.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                              <span className="text-sm">{mesh.name}</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={link?.influence || 1}
                                  onChange={(e) => updateLightLink(light.id, mesh.id, link?.enabled || true, parseFloat(e.target.value))}
                                  className="w-16"
                                  disabled={!link?.enabled}
                                />
                                <span className="text-xs text-gray-400 w-8">{((link?.influence || 1) * 100).toFixed(0)}%</span>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={link?.enabled || false}
                                    onChange={(e) => updateLightLink(light.id, mesh.id, e.target.checked)}
                                    className="ml-2"
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Meshes Section */}
          <div>
            <h4 className="text-md font-medium mb-3">Meshes ({meshes.length})</h4>
            <div className="space-y-2">
              {meshes.map(mesh => (
                <div
                  key={mesh.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMesh === mesh.id
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedMesh(selectedMesh === mesh.id ? null : mesh.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>🧊</span>
                      <span className="font-medium">{mesh.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          enableAllLightsForMesh(mesh.id);
                        }}
                        className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs"
                      >
                        Enable All
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          disableAllLightsForMesh(mesh.id);
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs"
                      >
                        Disable All
                      </button>
                    </div>
                  </div>
                  
                  {selectedMesh === mesh.id && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <h5 className="text-sm font-medium mb-2">Affecting Lights:</h5>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                        {lights.map(light => {
                          const link = getLightLink(light.id, mesh.id);
                          return (
                            <div key={light.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                              <div className="flex items-center gap-2">
                                <span>{getLightIcon(light.type)}</span>
                                <span className="text-sm">{light.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={link?.influence || 1}
                                  onChange={(e) => updateLightLink(light.id, mesh.id, link?.enabled || true, parseFloat(e.target.value))}
                                  className="w-16"
                                  disabled={!link?.enabled}
                                />
                                <span className="text-xs text-gray-400 w-8">{((link?.influence || 1) * 100).toFixed(0)}%</span>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={link?.enabled || false}
                                    onChange={(e) => updateLightLink(light.id, mesh.id, e.target.checked)}
                                    className="ml-2"
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Matrix View - Blender-style grid
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 border-b border-gray-600 sticky left-0 bg-gray-800 z-10">
                  Mesh / Light
                </th>
                {lights.map(light => (
                  <th key={light.id} className="text-center p-2 border-b border-gray-600 min-w-20">
                    <div className="flex flex-col items-center gap-1">
                      <span>{getLightIcon(light.type)}</span>
                      <span className="text-xs max-w-16 truncate" title={light.name}>
                        {light.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meshes.map(mesh => (
                <tr key={mesh.id} className="border-b border-gray-700">
                  <td className="p-2 font-medium sticky left-0 bg-gray-800 border-r border-gray-600">
                    <div className="flex items-center gap-2">
                      <span>🧊</span>
                      <span className="max-w-32 truncate" title={mesh.name}>{mesh.name}</span>
                    </div>
                  </td>
                  {lights.map(light => {
                    const link = getLightLink(light.id, mesh.id);
                    return (
                      <td key={light.id} className="p-1 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="checkbox"
                            checked={link?.enabled || false}
                            onChange={(e) => updateLightLink(light.id, mesh.id, e.target.checked)}
                            className="w-4 h-4"
                          />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={link?.influence || 1}
                            onChange={(e) => updateLightLink(light.id, mesh.id, link?.enabled || true, parseFloat(e.target.value))}
                            className="w-12 h-1"
                            disabled={!link?.enabled}
                          />
                          <span className="text-xs text-gray-400">
                            {((link?.influence || 1) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
