import React, { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface MaterialEditorProps {
  configurator: Con3DConfigurator;
  selectedMesh: THREE.Mesh | null;
}

// Material Presets Library
const MATERIAL_PRESETS = {
  'chrome': {
    name: 'Chrome',
    color: '#ffffff',
    metalness: 1.0,
    roughness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    specularIntensity: 1.0
  },
  'gold': {
    name: 'Gold',
    color: '#ffd700',
    metalness: 1.0,
    roughness: 0.1,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    specularIntensity: 1.0
  },
  'copper': {
    name: 'Copper',
    color: '#b87333',
    metalness: 1.0,
    roughness: 0.2,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    specularIntensity: 1.0
  },
  'brushed_aluminum': {
    name: 'Brushed Aluminum',
    color: '#c0c0c0',
    metalness: 1.0,
    roughness: 0.3,
    anisotropy: 0.8,
    anisotropyRotation: 0,
    specularIntensity: 1.0
  },
  'plastic_glossy': {
    name: 'Glossy Plastic',
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    specularIntensity: 0.5
  },
  'plastic_matte': {
    name: 'Matte Plastic',
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.8,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    specularIntensity: 0.5
  },
  'rubber': {
    name: 'Rubber',
    color: '#2a2a2a',
    metalness: 0.0,
    roughness: 1.0,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    specularIntensity: 0.2
  },
  'glass': {
    name: 'Glass',
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.0,
    transmission: 1.0,
    thickness: 0.5,
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    specularIntensity: 0.9
  },
  'diamond': {
    name: 'Diamond',
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.0,
    transmission: 1.0,
    thickness: 0.1,
    ior: 2.42,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    iridescence: 0.8,
    specularIntensity: 1.0
  },
  'carbon_fiber': {
    name: 'Carbon Fiber',
    color: '#1a1a1a',
    metalness: 0.9,
    roughness: 0.3,
    anisotropy: 0.8,
    anisotropyRotation: Math.PI / 4,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    specularIntensity: 0.9
  },
  'fabric': {
    name: 'Fabric',
    color: '#8b4513',
    metalness: 0.0,
    roughness: 0.9,
    sheen: 0.5,
    sheenRoughness: 0.8,
    sheenColor: '#ddd',
    specularIntensity: 0.1
  },
  'velvet': {
    name: 'Velvet',
    color: '#4a0e4e',
    metalness: 0.0,
    roughness: 1.0,
    sheen: 0.9,
    sheenRoughness: 0.2,
    sheenColor: '#8b4a8b',
    specularIntensity: 0.05
  },
  'soap_bubble': {
    name: 'Soap Bubble',
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.0,
    transmission: 0.9,
    thickness: 0.001,
    ior: 1.33,
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessMin: 100,
    iridescenceThicknessMax: 400,
    specularIntensity: 0.9
  },
  'car_paint': {
    name: 'Car Paint',
    color: '#cc0000',
    metalness: 0.0,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    clearcoatNormalScale: 0.5,
    specularIntensity: 0.5
  },
  'glowing_material': {
    name: 'Glowing LED',
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.1,
    emissive: '#0066ff',
    emissiveIntensity: 2.0,
    specularIntensity: 0.1
  }
};

export const MaterialEditor: React.FC<MaterialEditorProps> = ({ configurator, selectedMesh }) => {
  // Suppress unused variable warning
  void configurator;

  const [material, setMaterial] = useState<THREE.MeshPhysicalMaterial | null>(null);
  const [materialHistory, setMaterialHistory] = useState<Array<typeof materialParams>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [materialParams, setMaterialParams] = useState({
    // Base properties
    color: '#ffffff',
    opacity: 1.0,
    transparent: false,
    
    // PBR properties
    metalness: 0.0,
    roughness: 0.5,
    
    // Advanced PBR
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    clearcoatNormalScale: 1.0,
    
    // Sheen properties
    sheen: 0.0,
    sheenRoughness: 1.0,
    sheenColor: '#ffffff',
    
    // Transmission properties
    transmission: 0.0,
    thickness: 0.01,
    ior: 1.5,
    
    // Iridescence
    iridescence: 0.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessMin: 100,
    iridescenceThicknessMax: 400,
    
    // Anisotropy
    anisotropy: 0.0,
    anisotropyRotation: 0.0,
    
    // Specular workflow (alternative to metallic)
    specularIntensity: 1.0,
    specularColor: '#ffffff',
    
    // Emission
    emissive: '#000000',
    emissiveIntensity: 0.0,
    
    // Normal & displacement
    normalScale: 1.0,
    displacementScale: 1.0,
    displacementBias: 0.0,
    
    // AO
    aoMapIntensity: 1.0,
    
    // Environment
    envMapIntensity: 1.0,
    
    // Attenuation (for transmission)
    attenuationDistance: Infinity,
    attenuationColor: '#ffffff'
  });

  const [activeSection, setActiveSection] = useState<'basic' | 'advanced' | 'textures' | 'presets'>('basic');

  useEffect(() => {
    if (selectedMesh && selectedMesh.material) {
      // Handle material arrays by taking the first material
      const meshMaterial = Array.isArray(selectedMesh.material) 
        ? selectedMesh.material[0] 
        : selectedMesh.material;
      
      if (!meshMaterial) {
        setMaterial(null);
        return;
      }
      
      let mat: THREE.MeshPhysicalMaterial;
      
      // Handle different material types
      if (meshMaterial instanceof THREE.MeshPhysicalMaterial) {
        mat = meshMaterial;
      } else if (meshMaterial instanceof THREE.MeshStandardMaterial) {
        // Convert MeshStandardMaterial to MeshPhysicalMaterial
        const oldMat = meshMaterial;
        mat = new THREE.MeshPhysicalMaterial({
          color: oldMat.color,
          opacity: oldMat.opacity,
          transparent: oldMat.transparent,
          metalness: oldMat.metalness,
          roughness: oldMat.roughness,
          map: oldMat.map,
          normalMap: oldMat.normalMap,
          roughnessMap: oldMat.roughnessMap,
          metalnessMap: oldMat.metalnessMap,
          aoMap: oldMat.aoMap,
          emissiveMap: oldMat.emissiveMap,
          emissive: oldMat.emissive,
          emissiveIntensity: oldMat.emissiveIntensity,
          envMapIntensity: oldMat.envMapIntensity,
          normalScale: oldMat.normalScale,
          displacementMap: oldMat.displacementMap,
          displacementScale: oldMat.displacementScale,
          displacementBias: oldMat.displacementBias,
          aoMapIntensity: oldMat.aoMapIntensity,
        });
        
        // Schedule Three.js mutation for next tick to avoid render cycle side effects
        setTimeout(() => {
          if (selectedMesh) {
            selectedMesh.material = mat;
          }
        }, 0);
      } else {
        // Convert any other material type to MeshPhysicalMaterial
        const oldMat = meshMaterial as any;
        mat = new THREE.MeshPhysicalMaterial({
          color: oldMat.color || new THREE.Color(0xffffff),
          opacity: oldMat.opacity || 1.0,
          transparent: oldMat.transparent || false,
          metalness: 0.0,
          roughness: 0.5,
        });
        
        // Schedule Three.js mutation for next tick to avoid render cycle side effects
        setTimeout(() => {
          if (selectedMesh) {
            selectedMesh.material = mat;
          }
        }, 0);
      }
      
      setMaterial(mat);
      
      // Load current material parameters
      setMaterialParams({
        color: `#${mat.color.getHexString()}`,
        opacity: mat.opacity,
        transparent: mat.transparent,
        metalness: mat.metalness,
        roughness: mat.roughness,
        clearcoat: mat.clearcoat,
        clearcoatRoughness: mat.clearcoatRoughness,
        clearcoatNormalScale: mat.clearcoatNormalScale?.x || 1.0,
        sheen: mat.sheen,
        sheenRoughness: mat.sheenRoughness,
        sheenColor: `#${mat.sheenColor.getHexString()}`,
        transmission: mat.transmission,
        thickness: mat.thickness,
        ior: mat.ior,
        iridescence: mat.iridescence,
        iridescenceIOR: mat.iridescenceIOR,
        iridescenceThicknessMin: mat.iridescenceThicknessRange[0],
        iridescenceThicknessMax: mat.iridescenceThicknessRange[1],
        anisotropy: mat.anisotropy,
        anisotropyRotation: mat.anisotropyRotation || 0,
        specularIntensity: mat.specularIntensity || 1.0,
        specularColor: mat.specularColor ? `#${mat.specularColor.getHexString()}` : '#ffffff',
        emissive: `#${mat.emissive.getHexString()}`,
        emissiveIntensity: mat.emissiveIntensity,
        normalScale: mat.normalScale.x,
        displacementScale: mat.displacementScale,
        displacementBias: mat.displacementBias,
        aoMapIntensity: mat.aoMapIntensity,
        envMapIntensity: mat.envMapIntensity,
        attenuationDistance: mat.attenuationDistance,
        attenuationColor: `#${mat.attenuationColor.getHexString()}`
      });
    } else {
      setMaterial(null);
    }
  }, [selectedMesh]);

  // Add material change to history
  const addToHistory = useCallback((params: typeof materialParams) => {
    setMaterialHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(params);
      return newHistory.slice(-10); // Keep last 10 changes
    });
    setHistoryIndex(prev => Math.min(prev + 1, 9));
  }, [historyIndex]);

  const updateMaterialProperty = useCallback((property: string, value: any) => {
    if (!material) return;

    const newParams = { ...materialParams, [property]: value };
    setMaterialParams(newParams);
    
    // Add to history
    addToHistory(newParams);

    // Apply the change to the material
    switch (property) {
      case 'color':
        material.color.setHex(parseInt(value.replace('#', '0x')));
        break;
      case 'emissive':
        material.emissive.setHex(parseInt(value.replace('#', '0x')));
        break;
      case 'sheenColor':
        material.sheenColor.setHex(parseInt(value.replace('#', '0x')));
        break;
      case 'specularColor':
        if (material.specularColor) {
          material.specularColor.setHex(parseInt(value.replace('#', '0x')));
        }
        break;
      case 'attenuationColor':
        material.attenuationColor.setHex(parseInt(value.replace('#', '0x')));
        break;
      case 'normalScale':
        material.normalScale.set(value, value);
        break;
      case 'clearcoatNormalScale':
        if (material.clearcoatNormalScale) {
          material.clearcoatNormalScale.set(value, value);
        }
        break;
      case 'iridescenceThicknessMin':
        material.iridescenceThicknessRange = [value, material.iridescenceThicknessRange[1]];
        break;
      case 'iridescenceThicknessMax':
        material.iridescenceThicknessRange = [material.iridescenceThicknessRange[0], value];
        break;
      default:
        (material as any)[property] = value;
    }
    
    material.needsUpdate = true;
  }, [material, materialParams, addToHistory]);

  // Undo/Redo functions
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevParams = materialHistory[historyIndex - 1];
      setMaterialParams(prevParams);
      
      // Apply all properties to material
      if (material) {
        Object.entries(prevParams).forEach(([key, value]) => {
          updateMaterialProperty(key, value);
        });
      }
      
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex, materialHistory, material, updateMaterialProperty]);

  const redo = useCallback(() => {
    if (historyIndex < materialHistory.length - 1) {
      const nextParams = materialHistory[historyIndex + 1];
      setMaterialParams(nextParams);
      
      // Apply all properties to material
      if (material) {
        Object.entries(nextParams).forEach(([key, value]) => {
          updateMaterialProperty(key, value);
        });
      }
      
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, materialHistory, material, updateMaterialProperty]);

  const applyPreset = useCallback((presetKey: string) => {
    if (!material) return;
    
    const preset = MATERIAL_PRESETS[presetKey as keyof typeof MATERIAL_PRESETS];
    if (!preset) return;

    Object.entries(preset).forEach(([key, value]) => {
      if (key !== 'name') {
        updateMaterialProperty(key, value);
      }
    });
  }, [material, updateMaterialProperty]);

  const createNewMaterial = useCallback(() => {
    if (!selectedMesh) return;
    
    const newMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.5,
    });
    
    // Schedule Three.js mutation for next tick to avoid render cycle side effects
    setTimeout(() => {
      if (selectedMesh) {
        selectedMesh.material = newMaterial;
      }
    }, 0);
    
    setMaterial(newMaterial);
  }, [selectedMesh]);

  const createStandardMaterial = useCallback(() => {
    if (!selectedMesh) return;
    
    const newMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.5,
    });
    
    // Convert to physical material for editing
    const physicalMat = new THREE.MeshPhysicalMaterial({
      color: newMaterial.color,
      metalness: newMaterial.metalness,
      roughness: newMaterial.roughness,
    });
    
    // Schedule Three.js mutations for next tick to avoid render cycle side effects
    setTimeout(() => {
      if (selectedMesh) {
        selectedMesh.material = physicalMat;
      }
    }, 0);
    
    setMaterial(physicalMat);
  }, [selectedMesh]);

  const createBasicMaterial = useCallback(() => {
    if (!selectedMesh) return;
    
    const newMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    
    // Convert to physical material for editing
    const physicalMat = new THREE.MeshPhysicalMaterial({
      color: newMaterial.color,
      metalness: 0.0,
      roughness: 1.0, // Basic materials are typically non-reflective
    });
    
    // Schedule Three.js mutation for next tick to avoid render cycle side effects
    setTimeout(() => {
      if (selectedMesh) {
        selectedMesh.material = physicalMat;
      }
    }, 0);
    
    setMaterial(physicalMat);
  }, [selectedMesh]);

  const handleTextureUpload = useCallback(async (property: string, file: File) => {
    if (!material) return;
    
    const textureLoader = new THREE.TextureLoader();
    const url = URL.createObjectURL(file);
    
    try {
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load(url, resolve, undefined, reject);
      });
      
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = property === 'map' || property === 'emissiveMap' ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
      
      (material as any)[property] = texture;
      material.needsUpdate = true;
      
    } catch (error) {
      // Use setTimeout to avoid logging during render cycle
      setTimeout(() => console.error('Failed to load texture:', error), 0);
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [material]);

  // Keyboard shortcuts for quick operations
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!selectedMesh || !material) return;
      
      // Only handle shortcuts when not typing in an input
      if (event.target instanceof HTMLInputElement) return;
      
      switch (event.key.toLowerCase()) {
        case 'r':
          if (event.ctrlKey) {
            event.preventDefault();
            createNewMaterial();
          }
          break;
        case 'm':
          updateMaterialProperty('metalness', materialParams.metalness > 0.5 ? 0 : 1);
          break;
        case 'g':
          updateMaterialProperty('roughness', materialParams.roughness > 0.5 ? 0 : 1);
          break;
        case 't':
          updateMaterialProperty('transmission', materialParams.transmission > 0.5 ? 0 : 1);
          break;
        case 'c':
          updateMaterialProperty('clearcoat', materialParams.clearcoat > 0.5 ? 0 : 1);
          break;
        case 's':
          updateMaterialProperty('sheen', materialParams.sheen > 0.5 ? 0 : 1);
          break;
        case 'i':
          updateMaterialProperty('iridescence', materialParams.iridescence > 0.5 ? 0 : 1);
          break;
        case 'z':
          if (event.ctrlKey) {
            event.preventDefault();
            undo();
          }
          break;
        case 'y':
          if (event.ctrlKey) {
            event.preventDefault();
            redo();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedMesh, material, materialParams, createNewMaterial, updateMaterialProperty, undo, redo]);

  if (!selectedMesh) {
    return (
      <div className="p-4 bg-gray-800 text-white h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Material Editor</h3>
        <div className="text-center py-8 flex-1 flex flex-col justify-center">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-gray-400 mb-2">Click on a mesh to edit its material</p>
          <p className="text-gray-500 text-sm">Select any object in the 3D scene to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 text-white">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Material Editor</h3>
        <p className="text-sm text-gray-400">
          Editing: <span className="text-blue-400 font-medium">{selectedMesh.name || 'Unnamed Object'}</span>
        </p>
        
        {/* Material Type Selector */}
        <div className="mt-3">
          <label className="block text-sm mb-2">Material Type</label>
          <select
            value={material ? 'physical' : 'none'}
            onChange={(e) => {
              if (e.target.value === 'new') {
                createNewMaterial();
              } else if (e.target.value === 'standard') {
                createStandardMaterial();
              } else if (e.target.value === 'basic') {
                createBasicMaterial();
              }
            }}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="none">No Material</option>
            <option value="physical">Physical Material (PBR)</option>
            <option value="new">+ Create New Physical Material</option>
            <option value="standard">+ Create Standard Material</option>
            <option value="basic">+ Create Basic Material</option>
          </select>
        </div>
      </div>

      {material && (
            <div className="flex space-x-2 mb-4">
              <button
                onClick={createNewMaterial}
                className="btn btn-secondary flex-1"
                title="Reset to default material"
              >
                🔄 Reset
              </button>
              <button
                onClick={() => {
                  if (selectedMesh && selectedMesh.material instanceof THREE.MeshPhysicalMaterial) {
                    const newMat = selectedMesh.material.clone();
                    // Schedule Three.js mutation for next tick to avoid render cycle side effects
                    setTimeout(() => {
                      if (selectedMesh) {
                        selectedMesh.material = newMat;
                      }
                    }, 0);
                    setMaterial(newMat);
                  }
                }}
                className="btn btn-secondary flex-1"
                title="Duplicate current material"
              >
                📋 Clone
              </button>
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="btn btn-secondary px-3"
                title="Undo last change (Ctrl+Z)"
              >
                ↶
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= materialHistory.length - 1}
                className="btn btn-secondary px-3"
                title="Redo last change (Ctrl+Y)"
              >
                ↷
              </button>
            </div>
          )}

      {material && (
        <div className="space-y-4">
          {/* Material Type Indicator */}
          <div className="bg-gray-900 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs text-gray-400">Material Properties</div>
              <div className="text-xs text-gray-500">PBR Physical Material</div>
            </div>
            <div className="text-sm font-medium">
              {materialParams.transmission > 0.5 ? (
                <span className="text-blue-400">🔍 Transmissive Glass</span>
              ) : materialParams.metalness > 0.7 ? (
                <span className="text-yellow-400">⚡ Metallic Surface</span>
              ) : materialParams.clearcoat > 0.5 ? (
                <span className="text-green-400">✨ Clearcoated Finish</span>
              ) : (
                <span className="text-purple-400">🎨 Dielectric Material</span>
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-400">
              <div>M: {(materialParams.metalness * 100).toFixed(0)}%</div>
              <div>R: {(materialParams.roughness * 100).toFixed(0)}%</div>
              <div>T: {(materialParams.transmission * 100).toFixed(0)}%</div>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
            {[
              { key: 'basic', label: 'Basic' },
              { key: 'advanced', label: 'Advanced' },
              { key: 'textures', label: 'Textures' },
              { key: 'presets', label: 'Presets' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as any)}
                className={`flex-1 py-2 px-3 text-xs rounded-md transition-colors ${
                  activeSection === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>        {/* Current Material Info */}
        <div className="mb-4 p-3 bg-gray-900 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Current Material Status</div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-400">✓ Ready for editing</span>
            <span className="text-xs text-gray-500">
              {Array.isArray(selectedMesh.material) 
                ? 'Multi-Material' 
                : (selectedMesh.material as THREE.Material)?.type || 'Unknown Type'}
            </span>
          </div>
          {selectedMesh.material && !Array.isArray(selectedMesh.material) && (
            <div className="mt-2 text-xs text-gray-400">
              <div>UUID: {(selectedMesh.material as THREE.Material).uuid.substring(0, 8)}...</div>
              {(selectedMesh.material as THREE.Material).name && (
                <div>Name: {(selectedMesh.material as THREE.Material).name}</div>
              )}
            </div>
          )}
        </div>

          {/* Basic Properties */}
          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Base Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={materialParams.color}
                    onChange={(e) => updateMaterialProperty('color', e.target.value)}
                    className="w-16 h-10 rounded border border-gray-600"
                  />
                  <input
                    type="text"
                    value={materialParams.color}
                    onChange={(e) => updateMaterialProperty('color', e.target.value)}
                    className="flex-1 input text-xs"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm mb-1 flex items-center justify-between">
                  <span>Metalness</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    materialParams.metalness > 0.7 ? 'bg-yellow-900 text-yellow-300' : 
                    materialParams.metalness > 0.3 ? 'bg-gray-700 text-gray-300' : 
                    'bg-blue-900 text-blue-300'
                  }`}>
                    {materialParams.metalness.toFixed(2)}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={materialParams.metalness}
                  onChange={(e) => updateMaterialProperty('metalness', parseFloat(e.target.value))}
                  className="w-full input-range"
                  title="0 = Dielectric (plastic, ceramic), 1 = Metal"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {materialParams.metalness < 0.1 ? 'Dielectric' : 
                   materialParams.metalness > 0.9 ? 'Metallic' : 'Semi-metallic'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm mb-1 flex items-center justify-between">
                  <span>Roughness</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    materialParams.roughness < 0.1 ? 'bg-blue-900 text-blue-300' : 
                    materialParams.roughness > 0.7 ? 'bg-orange-900 text-orange-300' : 
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {materialParams.roughness.toFixed(2)}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={materialParams.roughness}
                  onChange={(e) => updateMaterialProperty('roughness', parseFloat(e.target.value))}
                  className="w-full input-range"
                  title="0 = Mirror-like, 1 = Completely rough"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {materialParams.roughness < 0.1 ? 'Mirror-like' : 
                   materialParams.roughness > 0.7 ? 'Very rough' : 'Semi-glossy'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Opacity: {materialParams.opacity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={materialParams.opacity}
                  onChange={(e) => updateMaterialProperty('opacity', parseFloat(e.target.value))}
                  className="w-full input-range"
                />
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={materialParams.transparent}
                    onChange={(e) => updateMaterialProperty('transparent', e.target.checked)}
                  />
                  <span>Transparent</span>
                </label>
              </div>
            </div>
          )}

          {/* Advanced Properties */}
          {activeSection === 'advanced' && (
            <div className="space-y-4">
              {/* Clearcoat Section */}
              <div className="bg-gray-900 p-3 rounded-lg">
                <h4 className="text-sm font-semibold mb-3 text-blue-400">✨ Clearcoat</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Clearcoat</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.clearcoat.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={materialParams.clearcoat}
                      onChange={(e) => updateMaterialProperty('clearcoat', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Clear protective layer over the base material"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Clearcoat Roughness</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.clearcoatRoughness.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={materialParams.clearcoatRoughness}
                      onChange={(e) => updateMaterialProperty('clearcoatRoughness', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Roughness of the clearcoat layer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Clearcoat Normal Scale</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.clearcoatNormalScale.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.01"
                      value={materialParams.clearcoatNormalScale}
                      onChange={(e) => updateMaterialProperty('clearcoatNormalScale', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Strength of clearcoat normal mapping"
                    />
                  </div>
                </div>
              </div>

              {/* Sheen Section */}
              <div className="bg-gray-900 p-3 rounded-lg">
                <h4 className="text-sm font-semibold mb-3 text-purple-400">🧶 Sheen (Fabric/Velvet)</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Sheen</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.sheen.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={materialParams.sheen}
                      onChange={(e) => updateMaterialProperty('sheen', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Fabric-like retroreflective sheen (cloth, velvet)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Sheen Roughness</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.sheenRoughness.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={materialParams.sheenRoughness}
                      onChange={(e) => updateMaterialProperty('sheenRoughness', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Roughness of the sheen effect"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Sheen Color</label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={materialParams.sheenColor}
                        onChange={(e) => updateMaterialProperty('sheenColor', e.target.value)}
                        className="w-16 h-10 rounded border border-gray-600"
                      />
                      <input
                        type="text"
                        value={materialParams.sheenColor}
                        onChange={(e) => updateMaterialProperty('sheenColor', e.target.value)}
                        className="flex-1 input text-xs"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Transmission Section */}
              <div className="bg-gray-900 p-3 rounded-lg">
                <h4 className="text-sm font-semibold mb-3 text-cyan-400">🔍 Transmission (Glass)</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Transmission</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.transmission.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={materialParams.transmission}
                      onChange={(e) => updateMaterialProperty('transmission', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="How much light passes through (glass, water)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Thickness</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.thickness.toFixed(3)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.001"
                      value={materialParams.thickness}
                      onChange={(e) => updateMaterialProperty('thickness', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Material thickness for transmission calculations"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>IOR (Index of Refraction)</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.ior.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="2.5"
                      step="0.01"
                      value={materialParams.ior}
                      onChange={(e) => updateMaterialProperty('ior', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="1.0=air, 1.33=water, 1.5=glass, 2.42=diamond"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {materialParams.ior === 1.0 ? 'Air' :
                       materialParams.ior < 1.4 ? 'Water-like' :
                       materialParams.ior < 1.7 ? 'Glass-like' :
                       materialParams.ior < 2.0 ? 'Sapphire-like' : 'Diamond-like'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Attenuation Distance</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {isFinite(materialParams.attenuationDistance) ? materialParams.attenuationDistance.toFixed(2) : '∞'}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={isFinite(materialParams.attenuationDistance) ? materialParams.attenuationDistance : 10}
                      onChange={(e) => updateMaterialProperty('attenuationDistance', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Distance for light attenuation in transmissive materials"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Attenuation Color</label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={materialParams.attenuationColor}
                        onChange={(e) => updateMaterialProperty('attenuationColor', e.target.value)}
                        className="w-16 h-10 rounded border border-gray-600"
                      />
                      <input
                        type="text"
                        value={materialParams.attenuationColor}
                        onChange={(e) => updateMaterialProperty('attenuationColor', e.target.value)}
                        className="flex-1 input text-xs"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Iridescence Section */}
              <div className="bg-gray-900 p-3 rounded-lg">
                <h4 className="text-sm font-semibold mb-3 text-pink-400">🌈 Iridescence (Oil/Soap bubble)</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Iridescence</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.iridescence.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={materialParams.iridescence}
                      onChange={(e) => updateMaterialProperty('iridescence', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Color-shifting interference effect (soap bubbles, oil slicks)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Iridescence IOR</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.iridescenceIOR.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.01"
                      value={materialParams.iridescenceIOR}
                      onChange={(e) => updateMaterialProperty('iridescenceIOR', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Index of refraction for the iridescence layer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Thickness Min</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.iridescenceThicknessMin.toFixed(0)}nm
                      </span>
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="10"
                      value={materialParams.iridescenceThicknessMin}
                      onChange={(e) => updateMaterialProperty('iridescenceThicknessMin', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Minimum thickness of iridescence layer in nanometers"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Thickness Max</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.iridescenceThicknessMax.toFixed(0)}nm
                      </span>
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="10"
                      value={materialParams.iridescenceThicknessMax}
                      onChange={(e) => updateMaterialProperty('iridescenceThicknessMax', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Maximum thickness of iridescence layer in nanometers"
                    />
                  </div>
                </div>
              </div>

              {/* Anisotropy Section */}
              <div className="bg-gray-900 p-3 rounded-lg">
                <h4 className="text-sm font-semibold mb-3 text-yellow-400">↔️ Anisotropy (Brushed Metal)</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Anisotropy</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.anisotropy.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={materialParams.anisotropy}
                      onChange={(e) => updateMaterialProperty('anisotropy', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Directional reflectance (brushed metal, hair, fabric)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Anisotropy Rotation</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {(materialParams.anisotropyRotation * 180 / Math.PI).toFixed(0)}°
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={Math.PI * 2}
                      step="0.01"
                      value={materialParams.anisotropyRotation}
                      onChange={(e) => updateMaterialProperty('anisotropyRotation', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Rotation of the anisotropy direction"
                    />
                  </div>
                </div>
              </div>

              {/* Specular Workflow Section */}
              <div className="bg-gray-900 p-3 rounded-lg">
                <h4 className="text-sm font-semibold mb-3 text-green-400">⚡ Specular Workflow (Alternative to Metallic)</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Specular Intensity</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.specularIntensity.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={materialParams.specularIntensity}
                      onChange={(e) => updateMaterialProperty('specularIntensity', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Strength of specular reflections"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Specular Color</label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={materialParams.specularColor}
                        onChange={(e) => updateMaterialProperty('specularColor', e.target.value)}
                        className="w-16 h-10 rounded border border-gray-600"
                      />
                      <input
                        type="text"
                        value={materialParams.specularColor}
                        onChange={(e) => updateMaterialProperty('specularColor', e.target.value)}
                        className="flex-1 input text-xs"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emission Section */}
              <div className="bg-gray-900 p-3 rounded-lg">
                <h4 className="text-sm font-semibold mb-3 text-red-400">💡 Emission (Glow)</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-2">Emissive Color</label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={materialParams.emissive}
                        onChange={(e) => updateMaterialProperty('emissive', e.target.value)}
                        className="w-16 h-10 rounded border border-gray-600"
                      />
                      <input
                        type="text"
                        value={materialParams.emissive}
                        onChange={(e) => updateMaterialProperty('emissive', e.target.value)}
                        className="flex-1 input text-xs"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center justify-between">
                      <span>Emissive Intensity</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {materialParams.emissiveIntensity.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={materialParams.emissiveIntensity}
                      onChange={(e) => updateMaterialProperty('emissiveIntensity', parseFloat(e.target.value))}
                      className="w-full input-range"
                      title="Brightness of emissive glow"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Texture Maps */}
          {activeSection === 'textures' && (
            <div className="space-y-4">
              {[
                { key: 'map', label: 'Diffuse/Albedo' },
                { key: 'normalMap', label: 'Normal Map' },
                { key: 'roughnessMap', label: 'Roughness Map' },
                { key: 'metalnessMap', label: 'Metalness Map' },
                { key: 'aoMap', label: 'AO Map' },
                { key: 'emissiveMap', label: 'Emissive Map' },
                { key: 'displacementMap', label: 'Displacement Map' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm mb-2">{label}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleTextureUpload(key, file);
                    }}
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Material Presets */}
          {activeSection === 'presets' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 mb-3">Click a preset to apply it:</p>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(MATERIAL_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-semibold text-sm">{preset.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      M: {preset.metalness || 0} • R: {preset.roughness || 0}
                      {(preset as any).transmission && ` • T: ${(preset as any).transmission}`}
                      {(preset as any).clearcoat && (preset as any).clearcoat > 0 && ` • CC: ${(preset as any).clearcoat}`}
                      {(preset as any).sheen && (preset as any).sheen > 0 && ` • Sheen: ${(preset as any).sheen}`}
                      {(preset as any).iridescence && (preset as any).iridescence > 0 && ` • Iris: ${(preset as any).iridescence}`}
                      {(preset as any).anisotropy && (preset as any).anisotropy > 0 && ` • Anis: ${(preset as any).anisotropy}`}
                    </div>
                    {(preset as any).emissiveIntensity && (preset as any).emissiveIntensity > 0 && (
                      <div className="text-xs text-red-400 mt-1">💡 Emissive</div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Keyboard Shortcuts Help */}
              <div className="mt-6 p-3 bg-gray-900 rounded-lg">
                <h5 className="text-sm font-medium mb-2">Keyboard Shortcuts</h5>
                <div className="text-xs text-gray-400 space-y-1">
                  <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+R</kbd> Reset material</div>
                  <div><kbd className="bg-gray-700 px-1 rounded">M</kbd> Toggle metalness</div>
                  <div><kbd className="bg-gray-700 px-1 rounded">G</kbd> Toggle roughness</div>
                  <div><kbd className="bg-gray-700 px-1 rounded">T</kbd> Toggle transmission</div>
                  <div><kbd className="bg-gray-700 px-1 rounded">C</kbd> Toggle clearcoat</div>
                  <div><kbd className="bg-gray-700 px-1 rounded">S</kbd> Toggle sheen</div>
                  <div><kbd className="bg-gray-700 px-1 rounded">I</kbd> Toggle iridescence</div>
                  <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+Z</kbd> Undo</div>
                  <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+Y</kbd> Redo</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
