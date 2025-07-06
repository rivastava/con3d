import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface MaterialEditorProps {
  configurator: Con3DConfigurator;
  selectedMesh: THREE.Mesh | null;
}

export const MaterialEditor: React.FC<MaterialEditorProps> = ({ configurator: _configurator, selectedMesh }) => {
  const [material, setMaterial] = useState<THREE.MeshPhysicalMaterial | null>(null);
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
      
      {!material && (
        <button
          onClick={createNewMaterial}
          className="btn btn-primary mb-4 w-full"
        >
          Create New Material
        </button>
      )}

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
                        className="btn btn-secondary text-xs px-2 py-1"
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
    </div>
  );
};
