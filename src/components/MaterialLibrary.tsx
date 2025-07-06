import React, { useState, useCallback } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface MaterialLibraryProps {
  configurator: Con3DConfigurator;
  selectedMesh: THREE.Mesh | null;
}

interface MaterialPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  properties: Record<string, any>;
  preview?: string; // Base64 encoded preview image
}

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const MATERIAL_LIBRARY: MaterialPreset[] = [
  // Metals
  {
    id: 'chrome',
    name: 'Chrome',
    description: 'Highly reflective chrome finish',
    category: 'Metal',
    properties: {
      color: '#ffffff',
      metalness: 1.0,
      roughness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      envMapIntensity: 1.5
    }
  },
  {
    id: 'brushed_steel',
    name: 'Brushed Steel',
    description: 'Brushed stainless steel surface',
    category: 'Metal',
    properties: {
      color: '#c4c4c4',
      metalness: 1.0,
      roughness: 0.3,
      anisotropy: 0.8,
      clearcoat: 0.2,
      clearcoatRoughness: 0.1
    }
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'Pure gold material',
    category: 'Metal',
    properties: {
      color: '#ffd700',
      metalness: 1.0,
      roughness: 0.1,
      envMapIntensity: 1.2
    }
  },
  {
    id: 'copper',
    name: 'Copper',
    description: 'Copper with natural patina',
    category: 'Metal',
    properties: {
      color: '#b87333',
      metalness: 1.0,
      roughness: 0.2,
      envMapIntensity: 1.0
    }
  },
  
  // Plastics
  {
    id: 'white_plastic',
    name: 'White Plastic',
    description: 'Glossy white plastic finish',
    category: 'Plastic',
    properties: {
      color: '#ffffff',
      metalness: 0.0,
      roughness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1
    }
  },
  {
    id: 'black_plastic',
    name: 'Black Plastic',
    description: 'Matte black plastic',
    category: 'Plastic',
    properties: {
      color: '#1a1a1a',
      metalness: 0.0,
      roughness: 0.6,
      clearcoat: 0.0
    }
  },
  {
    id: 'colored_plastic',
    name: 'Colored Plastic',
    description: 'Vibrant colored plastic',
    category: 'Plastic',
    properties: {
      color: '#4f46e5',
      metalness: 0.0,
      roughness: 0.2,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1
    }
  },
  
  // Glass & Transparent
  {
    id: 'clear_glass',
    name: 'Clear Glass',
    description: 'Transparent clear glass',
    category: 'Glass',
    properties: {
      color: '#ffffff',
      metalness: 0.0,
      roughness: 0.0,
      transmission: 1.0,
      thickness: 0.5,
      ior: 1.5,
      transparent: true,
      opacity: 0.1
    }
  },
  {
    id: 'frosted_glass',
    name: 'Frosted Glass',
    description: 'Frosted glass with subtle roughness',
    category: 'Glass',
    properties: {
      color: '#ffffff',
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      ior: 1.5,
      transparent: true,
      opacity: 0.2
    }
  },
  {
    id: 'diamond',
    name: 'Diamond',
    description: 'Brilliant cut diamond',
    category: 'Glass',
    properties: {
      color: '#ffffff',
      metalness: 0.0,
      roughness: 0.0,
      transmission: 1.0,
      thickness: 0.1,
      ior: 2.42,
      iridescence: 0.8,
      iridescenceIOR: 1.3,
      transparent: true,
      opacity: 0.05
    }
  },
  
  // Fabric & Organic
  {
    id: 'velvet',
    name: 'Velvet',
    description: 'Soft velvet fabric',
    category: 'Fabric',
    properties: {
      color: '#8b2635',
      metalness: 0.0,
      roughness: 1.0,
      sheen: 0.8,
      sheenRoughness: 0.2,
      sheenColor: '#ffffff'
    }
  },
  {
    id: 'silk',
    name: 'Silk',
    description: 'Lustrous silk material',
    category: 'Fabric',
    properties: {
      color: '#f0f8ff',
      metalness: 0.0,
      roughness: 0.3,
      sheen: 0.6,
      sheenRoughness: 0.1,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2
    }
  },
  {
    id: 'leather',
    name: 'Leather',
    description: 'Natural leather texture',
    category: 'Organic',
    properties: {
      color: '#8b4513',
      metalness: 0.0,
      roughness: 0.8,
      clearcoat: 0.1,
      clearcoatRoughness: 0.6
    }
  },
  
  // Special Effects
  {
    id: 'carbon_fiber',
    name: 'Carbon Fiber',
    description: 'High-tech carbon fiber weave',
    category: 'Composite',
    properties: {
      color: '#1a1a1a',
      metalness: 0.9,
      roughness: 0.3,
      anisotropy: 0.8,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2
    }
  },
  {
    id: 'holographic',
    name: 'Holographic',
    description: 'Iridescent holographic surface',
    category: 'Special',
    properties: {
      color: '#ffffff',
      metalness: 0.8,
      roughness: 0.1,
      iridescence: 1.0,
      iridescenceIOR: 1.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0
    }
  }
];

export const MaterialLibrary: React.FC<MaterialLibraryProps> = ({ configurator, selectedMesh }) => {
  // Suppress unused variable warning
  void configurator;
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    const toast: ToastNotification = { id, message, type };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const categories = ['All', ...Array.from(new Set(MATERIAL_LIBRARY.map(m => m.category)))];

  const filteredMaterials = MATERIAL_LIBRARY.filter(material => {
    const matchesCategory = selectedCategory === 'All' || material.category === selectedCategory;
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const applyMaterial = useCallback((preset: MaterialPreset) => {
    if (!selectedMesh) return;

    const material = selectedMesh.material as THREE.MeshPhysicalMaterial;
    if (!material || !(material instanceof THREE.MeshPhysicalMaterial)) {
      // Create new PBR material if current one isn't suitable
      const newMaterial = new THREE.MeshPhysicalMaterial();
      selectedMesh.material = newMaterial;
    }

    const currentMaterial = selectedMesh.material as THREE.MeshPhysicalMaterial;

    // Apply all properties from the preset
    Object.entries(preset.properties).forEach(([key, value]) => {
      switch (key) {
        case 'color':
          currentMaterial.color.setHex(parseInt(value.replace('#', '0x')));
          break;
        case 'sheenColor':
          currentMaterial.sheenColor.setHex(parseInt(value.replace('#', '0x')));
          break;
        case 'emissive':
          currentMaterial.emissive.setHex(parseInt(value.replace('#', '0x')));
          break;
        case 'attenuationColor':
          currentMaterial.attenuationColor.setHex(parseInt(value.replace('#', '0x')));
          break;
        case 'iridescenceThicknessMin':
          currentMaterial.iridescenceThicknessRange = [value, currentMaterial.iridescenceThicknessRange[1]];
          break;
        case 'iridescenceThicknessMax':
          currentMaterial.iridescenceThicknessRange = [currentMaterial.iridescenceThicknessRange[0], value];
          break;
        default:
          if (key in currentMaterial) {
            (currentMaterial as any)[key] = value;
          }
      }
    });

    currentMaterial.needsUpdate = true;
    
    showToast(`Applied ${preset.name} material`, 'success');
  }, [selectedMesh]);

  const createCustomMaterial = useCallback(() => {
    if (!selectedMesh) return;

    const newMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.5
    });

    selectedMesh.material = newMaterial;
    showToast('Created new custom material', 'success');
  }, [selectedMesh]);

  if (!selectedMesh) {
    return (
      <div className="p-4 bg-gray-800 text-white h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Material Library</h3>
        <div className="text-center py-8 flex-1 flex flex-col justify-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-400 mb-2">Select a mesh to browse materials</p>
          <p className="text-gray-500 text-sm">Choose from our curated collection of PBR materials</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 text-white relative">
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`px-4 py-2 rounded-md shadow-lg transition-all ${
                toast.type === 'success' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Material Library</h3>
        <p className="text-sm text-gray-400">
          Applying to: <span className="text-blue-400 font-medium">{selectedMesh.name || 'Unnamed Object'}</span>
        </p>
      </div>
      
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full input text-sm"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Create New Material Button */}
      <button
        onClick={createCustomMaterial}
        className="w-full mb-4 p-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
      >
        <div className="text-2xl mb-1">➕</div>
        <div className="text-sm">Create Custom Material</div>
      </button>

      {/* Material Grid */}
      <div className="space-y-3">
        {filteredMaterials.map(material => {
          const props = material.properties;
          const isMetallic = (props.metalness || 0) > 0.7;
          const isGlass = (props.transmission || 0) > 0.5;
          const isRough = (props.roughness || 0) > 0.7;
          
          let previewClass = 'material-preview';
          if (isGlass) previewClass += ' glass';
          else if (isMetallic) previewClass += ' metallic';
          else if (isRough) previewClass += ' rough';
          
          return (
            <div
              key={material.id}
              onClick={() => applyMaterial(material)}
              className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors border border-transparent hover:border-blue-500"
            >
              <div className="flex items-start space-x-3 mb-2">
                {/* Visual Preview */}
                <div 
                  className={previewClass}
                  style={{
                    '--preview-color': props.color || '#888888'
                  } as React.CSSProperties}
                >
                  {isGlass && <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white opacity-20"></div>}
                  {isMetallic && <div className="absolute top-1 left-1 w-2 h-2 bg-white opacity-60 rounded-full"></div>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm truncate">{material.name}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2">{material.description}</p>
                    </div>
                    <span className="text-xs bg-gray-600 px-2 py-1 rounded shrink-0 ml-2">
                      {material.category}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Material Properties Preview */}
              <div className="text-xs text-gray-400 grid grid-cols-2 gap-2">
                {props.metalness !== undefined && (
                  <div className="flex justify-between">
                    <span>Metal:</span>
                    <span className={props.metalness > 0.5 ? 'text-yellow-400' : 'text-gray-500'}>
                      {(props.metalness * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {props.roughness !== undefined && (
                  <div className="flex justify-between">
                    <span>Rough:</span>
                    <span className={props.roughness > 0.5 ? 'text-orange-400' : 'text-blue-400'}>
                      {(props.roughness * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {props.transmission !== undefined && props.transmission > 0 && (
                  <div className="flex justify-between col-span-2">
                    <span>Transmission:</span>
                    <span className="text-cyan-400">{(props.transmission * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-400">No materials found</p>
        </div>
      )}
    </div>
  );
};
