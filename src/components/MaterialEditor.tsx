import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface MaterialEditorProps {
  configurator: Con3DConfigurator;
  selectedMesh: THREE.Mesh | null;
}

interface MaterialPreset {
  name: string;
  category: string;
  params: {
    color: string;
    metalness: number;
    roughness: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
    transmission?: number;
    thickness?: number;
    ior?: number;
    emissive?: string;
    emissiveIntensity?: number;
    sheen?: number;
    sheenColor?: string;
    iridescence?: number;
    anisotropy?: number;
  };
}

// Material Library with 50+ Professional Presets
const MATERIAL_LIBRARY: MaterialPreset[] = [
  // METALS
  { name: 'Aluminum', category: 'Metals', params: { color: '#c7c7c7', metalness: 1.0, roughness: 0.1 } },
  { name: 'Chrome', category: 'Metals', params: { color: '#ffffff', metalness: 1.0, roughness: 0.05 } },
  { name: 'Gold', category: 'Metals', params: { color: '#ffd700', metalness: 1.0, roughness: 0.1 } },
  { name: 'Silver', category: 'Metals', params: { color: '#c0c0c0', metalness: 1.0, roughness: 0.05 } },
  { name: 'Copper', category: 'Metals', params: { color: '#b87333', metalness: 1.0, roughness: 0.15 } },
  { name: 'Brass', category: 'Metals', params: { color: '#cd7f32', metalness: 1.0, roughness: 0.2 } },
  { name: 'Bronze', category: 'Metals', params: { color: '#cd7f32', metalness: 1.0, roughness: 0.25 } },
  { name: 'Iron', category: 'Metals', params: { color: '#b0b0b0', metalness: 1.0, roughness: 0.4 } },
  { name: 'Steel', category: 'Metals', params: { color: '#d0d0d0', metalness: 1.0, roughness: 0.2 } },
  { name: 'Titanium', category: 'Metals', params: { color: '#878681', metalness: 1.0, roughness: 0.15 } },
  { name: 'Brushed Steel', category: 'Metals', params: { color: '#b8b8b8', metalness: 1.0, roughness: 0.6, anisotropy: 0.8 } },
  { name: 'Oxidized Copper', category: 'Metals', params: { color: '#40826d', metalness: 0.7, roughness: 0.8 } },
  { name: 'Aged Bronze', category: 'Metals', params: { color: '#8c6239', metalness: 0.8, roughness: 0.7 } },
  { name: 'Galvanized Steel', category: 'Metals', params: { color: '#a8a8a8', metalness: 1.0, roughness: 0.3 } },
  { name: 'Pewter', category: 'Metals', params: { color: '#8b8680', metalness: 0.9, roughness: 0.4 } },

  // GLASS & TRANSPARENT
  { name: 'Clear Glass', category: 'Glass', params: { color: '#ffffff', metalness: 0.0, roughness: 0.0, transmission: 1.0, ior: 1.5, thickness: 0.5 } },
  { name: 'Tinted Glass Blue', category: 'Glass', params: { color: '#87ceeb', metalness: 0.0, roughness: 0.0, transmission: 0.8, ior: 1.5, thickness: 0.5 } },
  { name: 'Tinted Glass Green', category: 'Glass', params: { color: '#90ee90', metalness: 0.0, roughness: 0.0, transmission: 0.8, ior: 1.5, thickness: 0.5 } },
  { name: 'Frosted Glass', category: 'Glass', params: { color: '#ffffff', metalness: 0.0, roughness: 0.1, transmission: 0.7, ior: 1.5, thickness: 0.5 } },
  { name: 'Diamond', category: 'Glass', params: { color: '#ffffff', metalness: 0.0, roughness: 0.0, transmission: 0.9, ior: 2.4, thickness: 0.1 } },
  { name: 'Water', category: 'Glass', params: { color: '#87ceeb', metalness: 0.0, roughness: 0.0, transmission: 0.95, ior: 1.33, thickness: 1.0 } },
  { name: 'Ice', category: 'Glass', params: { color: '#e0f6ff', metalness: 0.0, roughness: 0.05, transmission: 0.8, ior: 1.31, thickness: 0.3 } },
  { name: 'Crystal', category: 'Glass', params: { color: '#ffffff', metalness: 0.0, roughness: 0.0, transmission: 0.95, ior: 1.7, thickness: 0.2 } },
  { name: 'Amber Glass', category: 'Glass', params: { color: '#ffbf00', metalness: 0.0, roughness: 0.0, transmission: 0.7, ior: 1.55, thickness: 0.4 } },
  { name: 'Ruby Glass', category: 'Glass', params: { color: '#e0115f', metalness: 0.0, roughness: 0.0, transmission: 0.6, ior: 1.76, thickness: 0.3 } },

  // PLASTICS & POLYMERS
  { name: 'White Plastic', category: 'Plastics', params: { color: '#ffffff', metalness: 0.0, roughness: 0.5 } },
  { name: 'Black Plastic', category: 'Plastics', params: { color: '#1a1a1a', metalness: 0.0, roughness: 0.6 } },
  { name: 'Glossy Plastic', category: 'Plastics', params: { color: '#ff4444', metalness: 0.0, roughness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.1 } },
  { name: 'Matte Plastic', category: 'Plastics', params: { color: '#4444ff', metalness: 0.0, roughness: 0.9 } },
  { name: 'Rubber', category: 'Plastics', params: { color: '#2d2d2d', metalness: 0.0, roughness: 0.95 } },
  { name: 'Silicone', category: 'Plastics', params: { color: '#f0f0f0', metalness: 0.0, roughness: 0.8 } },
  { name: 'PVC', category: 'Plastics', params: { color: '#e8e8e8', metalness: 0.0, roughness: 0.4 } },
  { name: 'Acrylic', category: 'Plastics', params: { color: '#ffffff', metalness: 0.0, roughness: 0.05, clearcoat: 0.9, clearcoatRoughness: 0.05 } },
  { name: 'Carbon Fiber', category: 'Plastics', params: { color: '#1a1a1a', metalness: 0.1, roughness: 0.2, anisotropy: 0.9 } },

  // WOODS
  { name: 'Oak Wood', category: 'Wood', params: { color: '#8b4513', metalness: 0.0, roughness: 0.8 } },
  { name: 'Pine Wood', category: 'Wood', params: { color: '#deb887', metalness: 0.0, roughness: 0.7 } },
  { name: 'Mahogany', category: 'Wood', params: { color: '#c04000', metalness: 0.0, roughness: 0.6 } },
  { name: 'Cherry Wood', category: 'Wood', params: { color: '#d2691e', metalness: 0.0, roughness: 0.7 } },
  { name: 'Ebony', category: 'Wood', params: { color: '#555d50', metalness: 0.0, roughness: 0.4 } },
  { name: 'Bamboo', category: 'Wood', params: { color: '#e4d96f', metalness: 0.0, roughness: 0.6 } },
  { name: 'Polished Wood', category: 'Wood', params: { color: '#8b4513', metalness: 0.0, roughness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.1 } },

  // CERAMICS & STONE
  { name: 'White Ceramic', category: 'Ceramics', params: { color: '#ffffff', metalness: 0.0, roughness: 0.1, clearcoat: 0.9, clearcoatRoughness: 0.05 } },
  { name: 'Porcelain', category: 'Ceramics', params: { color: '#faf0e6', metalness: 0.0, roughness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.02 } },
  { name: 'Marble White', category: 'Stone', params: { color: '#f8f8ff', metalness: 0.0, roughness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.1 } },
  { name: 'Marble Black', category: 'Stone', params: { color: '#36454f', metalness: 0.0, roughness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.1 } },
  { name: 'Granite', category: 'Stone', params: { color: '#696969', metalness: 0.0, roughness: 0.3 } },
  { name: 'Concrete', category: 'Stone', params: { color: '#a8a8a8', metalness: 0.0, roughness: 0.9 } },
  { name: 'Limestone', category: 'Stone', params: { color: '#e6ddd4', metalness: 0.0, roughness: 0.8 } },
  { name: 'Slate', category: 'Stone', params: { color: '#2f4f4f', metalness: 0.0, roughness: 0.6 } },

  // FABRICS & TEXTILES
  { name: 'Cotton', category: 'Fabrics', params: { color: '#ffffff', metalness: 0.0, roughness: 1.0 } },
  { name: 'Silk', category: 'Fabrics', params: { color: '#ffffff', metalness: 0.0, roughness: 0.1, sheen: 0.8, sheenColor: '#ffffff' } },
  { name: 'Velvet', category: 'Fabrics', params: { color: '#8b0000', metalness: 0.0, roughness: 1.0, sheen: 0.3 } },
  { name: 'Denim', category: 'Fabrics', params: { color: '#483d8b', metalness: 0.0, roughness: 0.9 } },
  { name: 'Leather', category: 'Fabrics', params: { color: '#8b4513', metalness: 0.0, roughness: 0.7 } },
  { name: 'Patent Leather', category: 'Fabrics', params: { color: '#000000', metalness: 0.0, roughness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.02 } },

  // SPECIAL EFFECTS
  { name: 'Car Paint Red', category: 'Special', params: { color: '#dc143c', metalness: 0.0, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.03 } },
  { name: 'Car Paint Blue', category: 'Special', params: { color: '#0000ff', metalness: 0.0, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.03 } },
  { name: 'Iridescent', category: 'Special', params: { color: '#ffffff', metalness: 0.0, roughness: 0.1, iridescence: 1.0 } },
  { name: 'Pearl', category: 'Special', params: { color: '#f8f8ff', metalness: 0.0, roughness: 0.1, iridescence: 0.8, clearcoat: 0.9 } },
  { name: 'Oil Slick', category: 'Special', params: { color: '#000000', metalness: 0.0, roughness: 0.05, iridescence: 1.0 } },
  { name: 'Neon Glow', category: 'Special', params: { color: '#00ff00', metalness: 0.0, roughness: 0.1, emissive: '#00ff00', emissiveIntensity: 2.0 } },
  { name: 'Holographic', category: 'Special', params: { color: '#ffffff', metalness: 0.0, roughness: 0.0, iridescence: 1.0, clearcoat: 1.0 } },
  { name: 'Mirror', category: 'Special', params: { color: '#ffffff', metalness: 1.0, roughness: 0.0 } },
];

export const MaterialEditor: React.FC<MaterialEditorProps> = ({ configurator, selectedMesh }) => {
  const [material, setMaterial] = useState<THREE.MeshPhysicalMaterial | null>(null);
  const [selectedMeshes, setSelectedMeshes] = useState<string[]>([]);
  const [showMaterialLibrary, setShowMaterialLibrary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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
    sheen: 0.0,
    sheenRoughness: 1.0,
    sheenColor: '#ffffff',
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
    
    // Emission
    emissive: '#000000',
    emissiveIntensity: 1.0,
    
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

  const [textures, setTextures] = useState({
    map: null as THREE.Texture | null,
    normalMap: null as THREE.Texture | null,
    roughnessMap: null as THREE.Texture | null,
    metalnessMap: null as THREE.Texture | null,
    aoMap: null as THREE.Texture | null,
    emissiveMap: null as THREE.Texture | null,
    displacementMap: null as THREE.Texture | null,
    clearcoatMap: null as THREE.Texture | null,
    clearcoatNormalMap: null as THREE.Texture | null,
    clearcoatRoughnessMap: null as THREE.Texture | null,
    sheenColorMap: null as THREE.Texture | null,
    sheenRoughnessMap: null as THREE.Texture | null,
    transmissionMap: null as THREE.Texture | null,
    thicknessMap: null as THREE.Texture | null,
    iridescenceMap: null as THREE.Texture | null,
    iridescenceThicknessMap: null as THREE.Texture | null,
    anisotropyMap: null as THREE.Texture | null,
  });

  useEffect(() => {
    if (selectedMesh && selectedMesh.material instanceof THREE.MeshPhysicalMaterial) {
      const mat = selectedMesh.material;
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

  const updateMaterialProperty = (property: string, value: any) => {
    if (!material) return;

    const newParams = { ...materialParams, [property]: value };
    setMaterialParams(newParams);

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
      case 'attenuationColor':
        material.attenuationColor.setHex(parseInt(value.replace('#', '0x')));
        break;
      case 'normalScale':
        material.normalScale.set(value, value);
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
  };

  const handleTextureUpload = async (property: string, file: File) => {
    const textureLoader = new THREE.TextureLoader();
    const url = URL.createObjectURL(file);
    
    try {
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load(url, resolve, undefined, reject);
      });
      
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = property === 'map' || property === 'emissiveMap' ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
      
      setTextures(prev => ({ ...prev, [property]: texture }));
      
      if (material) {
        (material as any)[property] = texture;
        material.needsUpdate = true;
      }
    } catch (error) {
      console.error('Failed to load texture:', error);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const removeTexture = (property: string) => {
    setTextures(prev => ({ ...prev, [property]: null }));
    if (material) {
      (material as any)[property] = null;
      material.needsUpdate = true;
    }
  };

  const createNewMaterial = () => {
    if (!selectedMesh) return;
    
    const newMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.5,
    });
    
    selectedMesh.material = newMaterial;
    setMaterial(newMaterial);
  };

  const applyMaterialPreset = (preset: MaterialPreset) => {
    if (!material) return;

    // Apply the preset to the material
    material.color.setHex(parseInt(preset.params.color.replace('#', '0x')));
    material.metalness = preset.params.metalness;
    material.roughness = preset.params.roughness;
    
    if (preset.params.clearcoat !== undefined) {
      material.clearcoat = preset.params.clearcoat;
    }
    if (preset.params.clearcoatRoughness !== undefined) {
      material.clearcoatRoughness = preset.params.clearcoatRoughness;
    }
    if (preset.params.sheen !== undefined) {
      material.sheen = preset.params.sheen;
    }
    if (preset.params.sheenColor !== undefined) {
      material.sheenColor.setHex(parseInt(preset.params.sheenColor.replace('#', '0x')));
    }
    if (preset.params.transmission !== undefined) {
      material.transmission = preset.params.transmission;
    }
    if (preset.params.thickness !== undefined) {
      material.thickness = preset.params.thickness;
    }
    if (preset.params.ior !== undefined) {
      material.ior = preset.params.ior;
    }
    if (preset.params.iridescence !== undefined) {
      material.iridescence = preset.params.iridescence;
    }
    if (preset.params.anisotropy !== undefined) {
      material.anisotropy = preset.params.anisotropy;
    }
    if (preset.params.emissive !== undefined) {
      material.emissive.setHex(parseInt(preset.params.emissive.replace('#', '0x')));
    }
    if (preset.params.emissiveIntensity !== undefined) {
      material.emissiveIntensity = preset.params.emissiveIntensity;
    }

    // Update the UI params to match the applied preset
    setMaterialParams(prev => ({
      ...prev,
      color: preset.params.color,
      metalness: preset.params.metalness,
      roughness: preset.params.roughness,
      clearcoat: preset.params.clearcoat || prev.clearcoat,
      clearcoatRoughness: preset.params.clearcoatRoughness || prev.clearcoatRoughness,
      sheen: preset.params.sheen || prev.sheen,
      sheenColor: preset.params.sheenColor || prev.sheenColor,
      transmission: preset.params.transmission || prev.transmission,
      thickness: preset.params.thickness || prev.thickness,
      ior: preset.params.ior || prev.ior,
      iridescence: preset.params.iridescence || prev.iridescence,
      anisotropy: preset.params.anisotropy || prev.anisotropy,
      emissive: preset.params.emissive || prev.emissive,
      emissiveIntensity: preset.params.emissiveIntensity || prev.emissiveIntensity,
    }));
    
    material.needsUpdate = true;
  };

  const handleMeshSelect = (meshId: string) => {
    setSelectedMeshes(prev => {
      if (prev.includes(meshId)) {
        return prev.filter(id => id !== meshId);
      } else {
        return [...prev, meshId];
      }
    });
  };

  const applyToSelectedMeshes = () => {
    if (selectedMeshes.length === 0 || !material) return;

    const scene = configurator.getScene();
    
    for (const meshId of selectedMeshes) {
      const mesh = scene.getObjectByProperty('uuid', meshId) as THREE.Mesh;
      if (mesh && mesh.material instanceof THREE.MeshPhysicalMaterial) {
        // Create a clone of the current material and apply it to the mesh
        const newMaterial = material.clone();
        mesh.material = newMaterial;
      }
    }
  };

  const getAllMeshes = () => {
    const scene = configurator.getScene();
    const meshes: Array<{ id: string, name: string }> = [];
    
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.name && !object.name.includes('Helper')) {
        meshes.push({
          id: object.uuid,
          name: object.name || `Mesh ${object.uuid.slice(0, 8)}`
        });
      }
    });
    
    return meshes;
  };

  const categories = ['All', ...Array.from(new Set(MATERIAL_LIBRARY.map(m => m.category)))];

  const handlePresetSelect = (preset: MaterialPreset) => {
    applyMaterialPreset(preset);
    setShowMaterialLibrary(false);
  };

  const filteredMaterials = selectedCategory === 'All' ? MATERIAL_LIBRARY : MATERIAL_LIBRARY.filter(mat => mat.category === selectedCategory);

  if (!selectedMesh) {
    return (
      <div className="p-4 bg-gray-800 text-white">
        <h3 className="text-lg font-semibold mb-4">Material Editor</h3>
        <p className="text-gray-400">Select a mesh to edit its material</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 text-white max-h-screen overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">Material Editor</h3>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowMaterialLibrary(true)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            📚 Material Library
          </button>
          
          <button
            onClick={createNewMaterial}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            ➕ New Material
          </button>
        </div>
      </div>

      {/* Material Switcher - Apply to Multiple Meshes */}
      <div className="mb-6 p-4 border border-gray-600 rounded-lg">
        <h4 className="text-md font-medium mb-3">Material Switcher</h4>
        <p className="text-sm text-gray-400 mb-3">Select meshes to apply the current material to:</p>
        
        <div className="max-h-32 overflow-y-auto border border-gray-700 rounded p-2 mb-3">
          {getAllMeshes().map(mesh => (
            <label key={mesh.id} className="flex items-center space-x-2 mb-1 cursor-pointer hover:bg-gray-700 p-1 rounded">
              <input
                type="checkbox"
                checked={selectedMeshes.includes(mesh.id)}
                onChange={() => handleMeshSelect(mesh.id)}
                className="w-4 h-4"
              />
              <span className="text-sm">{mesh.name}</span>
            </label>
          ))}
          {getAllMeshes().length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">No meshes found in scene</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {selectedMeshes.length} mesh(es) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMeshes(getAllMeshes().map(m => m.id))}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedMeshes([])}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
            >
              Clear
            </button>
            <button
              onClick={applyToSelectedMeshes}
              disabled={selectedMeshes.length === 0 || !material}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded"
            >
              Apply Material
            </button>
          </div>
        </div>
      </div>

      {material && (
        <div className="space-y-6">
          {/* Basic Properties */}
          <div>
            <h4 className="text-md font-medium mb-3">Basic Properties</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Base Color</label>
                <input
                  type="color"
                  value={materialParams.color}
                  onChange={(e) => updateMaterialProperty('color', e.target.value)}
                  className="w-full h-8 rounded border border-gray-600"
                />
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
                  className="w-full"
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
          </div>

          {/* PBR Properties */}
          <div>
            <h4 className="text-md font-medium mb-3">PBR Properties</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Metalness: {materialParams.metalness.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={materialParams.metalness}
                  onChange={(e) => updateMaterialProperty('metalness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Roughness: {materialParams.roughness.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={materialParams.roughness}
                  onChange={(e) => updateMaterialProperty('roughness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">IOR: {materialParams.ior.toFixed(2)}</label>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.01"
                  value={materialParams.ior}
                  onChange={(e) => updateMaterialProperty('ior', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Clearcoat */}
          <div>
            <h4 className="text-md font-medium mb-3">Clearcoat</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Clearcoat: {materialParams.clearcoat.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={materialParams.clearcoat}
                  onChange={(e) => updateMaterialProperty('clearcoat', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Clearcoat Roughness: {materialParams.clearcoatRoughness.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={materialParams.clearcoatRoughness}
                  onChange={(e) => updateMaterialProperty('clearcoatRoughness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Transmission */}
          <div>
            <h4 className="text-md font-medium mb-3">Transmission</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Transmission: {materialParams.transmission.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={materialParams.transmission}
                  onChange={(e) => updateMaterialProperty('transmission', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Thickness: {materialParams.thickness.toFixed(3)}</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.001"
                  value={materialParams.thickness}
                  onChange={(e) => updateMaterialProperty('thickness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Attenuation Color</label>
                <input
                  type="color"
                  value={materialParams.attenuationColor}
                  onChange={(e) => updateMaterialProperty('attenuationColor', e.target.value)}
                  className="w-full h-8 rounded border border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Sheen (Advanced PBR) */}
          <div>
            <h4 className="text-md font-medium mb-3">Sheen (Fabric Properties)</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Sheen: {materialParams.sheen.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={materialParams.sheen}
                  onChange={(e) => updateMaterialProperty('sheen', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Sheen Roughness: {materialParams.sheenRoughness.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={materialParams.sheenRoughness}
                  onChange={(e) => updateMaterialProperty('sheenRoughness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Sheen Color</label>
                <input
                  type="color"
                  value={materialParams.sheenColor}
                  onChange={(e) => updateMaterialProperty('sheenColor', e.target.value)}
                  className="w-full h-8 rounded border border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Emission */}
          <div>
            <h4 className="text-md font-medium mb-3">Emission</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Emissive Color</label>
                <input
                  type="color"
                  value={materialParams.emissive}
                  onChange={(e) => updateMaterialProperty('emissive', e.target.value)}
                  className="w-full h-8 rounded border border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Emissive Intensity: {materialParams.emissiveIntensity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={materialParams.emissiveIntensity}
                  onChange={(e) => updateMaterialProperty('emissiveIntensity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Texture Maps */}
          <div>
            <h4 className="text-md font-medium mb-3">Texture Maps</h4>
            <div className="space-y-4">
              {Object.entries({
                map: 'Base Color Map',
                normalMap: 'Normal Map',
                roughnessMap: 'Roughness Map',
                metalnessMap: 'Metalness Map',
                aoMap: 'AO Map',
                emissiveMap: 'Emissive Map',
                displacementMap: 'Displacement Map',
              }).map(([key, label]) => (
                <div key={key} className="border border-gray-600 rounded p-3">
                  <label className="block text-sm mb-2 font-medium">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleTextureUpload(key, file);
                      }}
                      className="flex-1 text-sm text-gray-300"
                    />
                    {textures[key as keyof typeof textures] && (
                      <button
                        onClick={() => removeTexture(key)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Material Library */}
      {showMaterialLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg shadow-lg max-w-3xl w-full p-6">
            <h4 className="text-lg font-semibold mb-4">Material Library</h4>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                All
              </button>
              
              {categories.slice(1).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="max-h-80 overflow-y-auto mb-4">
              {filteredMaterials.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">No materials found in this category</p>
              )}

              {filteredMaterials.map(preset => (
                <div
                  key={preset.name}
                  className="flex justify-between items-center bg-gray-800 rounded-lg p-4 mb-2 transition-all hover:bg-gray-700"
                >
                  <div>
                    <h5 className="text-md font-medium">{preset.name}</h5>
                    <p className="text-xs text-gray-400">{preset.category}</p>
                  </div>
                  
                  <button
                    onClick={() => handlePresetSelect(preset)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowMaterialLibrary(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
