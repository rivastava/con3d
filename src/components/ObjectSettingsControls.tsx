import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';
import { ObjectSettings, ObjectSettingsManager } from '@/core/ObjectSettingsManager';

interface ObjectSettingsControlsProps {
  configurator: Con3DConfigurator;
  selectedMesh?: THREE.Mesh | null;
}

export const ObjectSettingsControls: React.FC<ObjectSettingsControlsProps> = ({ 
  configurator, 
  selectedMesh 
}) => {
  const [objectSettingsManager, setObjectSettingsManager] = useState<ObjectSettingsManager | null>(null);
  const [settings, setSettings] = useState<ObjectSettings | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    visibility: true,
    shadows: true,
    material: false,
    animation: false,
  });

  useEffect(() => {
    if (configurator) {
      const manager = configurator.getObjectSettingsManager();
      setObjectSettingsManager(manager);
    }
  }, [configurator]);

  useEffect(() => {
    if (objectSettingsManager && selectedMesh) {
      // Register the object if not already registered
      const id = objectSettingsManager.registerObject(selectedMesh, 'mesh');
      const objectSettings = objectSettingsManager.getSettings(id);
      setSettings(objectSettings || null);
      
      // Set up listener for settings changes
      const handleSettingsChange = (changedId: string, newSettings: ObjectSettings) => {
        if (changedId === id) {
          setSettings(newSettings);
        }
      };
      
      objectSettingsManager.onSettingsChange(handleSettingsChange);
    } else {
      setSettings(null);
    }
  }, [objectSettingsManager, selectedMesh]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateSettings = (updates: Partial<ObjectSettings>) => {
    if (objectSettingsManager && settings) {
      objectSettingsManager.updateSettings(settings.id, updates);
    }
  };

  const handleVisibilityChange = (property: keyof ObjectSettings['visibility'], value: boolean) => {
    if (!settings) return;
    
    updateSettings({
      visibility: {
        ...settings.visibility,
        [property]: value
      }
    });
  };

  const handleShadowChange = (property: keyof ObjectSettings['shadows'], value: boolean | number) => {
    if (!settings) return;
    
    updateSettings({
      shadows: {
        ...settings.shadows,
        [property]: value
      }
    });
  };

  const handleMaterialOverrideChange = (property: keyof ObjectSettings['materialOverride'], value: any) => {
    if (!settings) return;
    
    updateSettings({
      materialOverride: {
        ...settings.materialOverride,
        [property]: value
      }
    });
  };

  if (!selectedMesh) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Object Settings</h3>
        <p className="text-gray-400 text-sm">Select an object to view its settings</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Object Settings</h3>
        <p className="text-gray-400 text-sm">Loading object settings...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-gray-700 pb-2">
        <h3 className="text-lg font-semibold">Object Settings</h3>
        <p className="text-sm text-gray-400">
          {settings.name} ({settings.type})
        </p>
      </div>

      {/* Visibility Section */}
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection('visibility')}
          className="w-full p-3 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-t-lg"
        >
          <span className="font-medium">Visibility</span>
          <span className={`transform transition-transform ${expandedSections.visibility ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.visibility && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Camera</span>
              <input
                type="checkbox"
                checked={settings.visibility.camera}
                onChange={(e) => handleVisibilityChange('camera', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Viewport</span>
              <input
                type="checkbox"
                checked={settings.visibility.viewport}
                onChange={(e) => handleVisibilityChange('viewport', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Render</span>
              <input
                type="checkbox"
                checked={settings.visibility.render}
                onChange={(e) => handleVisibilityChange('render', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Wireframe</span>
              <input
                type="checkbox"
                checked={settings.visibility.wireframe}
                onChange={(e) => handleVisibilityChange('wireframe', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </div>
        )}
      </div>

      {/* Shadows Section */}
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection('shadows')}
          className="w-full p-3 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-t-lg"
        >
          <span className="font-medium">Shadows</span>
          <span className={`transform transition-transform ${expandedSections.shadows ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.shadows && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Cast Shadow</span>
              <input
                type="checkbox"
                checked={settings.shadows.castShadow}
                onChange={(e) => handleShadowChange('castShadow', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Receive Shadow</span>
              <input
                type="checkbox"
                checked={settings.shadows.receiveShadow}
                onChange={(e) => handleShadowChange('receiveShadow', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </div>
        )}
      </div>

      {/* Material Override Section */}
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection('material')}
          className="w-full p-3 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-t-lg"
        >
          <span className="font-medium">Material Override</span>
          <span className={`transform transition-transform ${expandedSections.material ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.material && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable Override</span>
              <input
                type="checkbox"
                checked={settings.materialOverride.enabled}
                onChange={(e) => handleMaterialOverrideChange('enabled', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            
            {settings.materialOverride.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    value={`#${settings.materialOverride.color.getHexString()}`}
                    onChange={(e) => handleMaterialOverrideChange('color', new THREE.Color(e.target.value))}
                    className="w-full h-8 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Opacity: {settings.materialOverride.opacity.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.materialOverride.opacity}
                    onChange={(e) => handleMaterialOverrideChange('opacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Metalness: {settings.materialOverride.metalness.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.materialOverride.metalness}
                    onChange={(e) => handleMaterialOverrideChange('metalness', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Roughness: {settings.materialOverride.roughness.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.materialOverride.roughness}
                    onChange={(e) => handleMaterialOverrideChange('roughness', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
