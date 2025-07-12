import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';
import { EnhancedRenderingManager, RenderQualitySettings } from '@/core/EnhancedRenderingManager';

interface RenderingQualityControlsProps {
  configurator: Con3DConfigurator;
}

export const RenderingQualityControls: React.FC<RenderingQualityControlsProps> = ({ 
  configurator 
}) => {
  const [renderingManager, setRenderingManager] = useState<EnhancedRenderingManager | null>(null);
  const [settings, setSettings] = useState<RenderQualitySettings | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    presets: true,
    shadows: false,
    antialiasing: false,
    postProcessing: false,
    lighting: false,
    performance: false,
    advanced: false,
    render: false,
  });

  useEffect(() => {
    if (configurator) {
      const manager = configurator.getEnhancedRenderingManager();
      setRenderingManager(manager);
      setSettings(manager.getSettings());
    }
  }, [configurator]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const applyPreset = (preset: 'low' | 'medium' | 'high' | 'ultra') => {
    if (renderingManager) {
      renderingManager.applyQualityPreset(preset);
      setSettings(renderingManager.getSettings());
    }
  };

  const updateSettings = (updates: Partial<RenderQualitySettings>) => {
    if (renderingManager && settings) {
      const newSettings = { ...settings, ...updates };
      renderingManager.updateSettings(updates);
      setSettings(newSettings);
      
      // Update post-processing if available
      const postProcessing = renderingManager.getPostProcessingManager();
      if (postProcessing && updates.postProcessing) {
        postProcessing.updateSettings(updates.postProcessing);
      }
    }
  };

  // Render function that hides helpers and exports clean image
  const performRender = async () => {
    try {
      const scene = configurator.getScene();
      const camera = configurator.getCamera();
      const renderer = configurator.getRenderer();
      
      // Get render settings
      const widthInput = document.getElementById('render-width') as HTMLInputElement;
      const heightInput = document.getElementById('render-height') as HTMLInputElement;
      const formatSelect = document.getElementById('render-format') as HTMLSelectElement;
      
      const width = parseInt(widthInput?.value || '1920');
      const height = parseInt(heightInput?.value || '1080');
      const format = formatSelect?.value || 'png';
      
      // Store original renderer size
      const originalSize = renderer.getSize(new THREE.Vector2());
      
      // Store visibility of helpers and gizmos
      const hiddenObjects: THREE.Object3D[] = [];
      
      scene.traverse((object) => {
        if (
          object.userData.isHelper ||
          object.userData.isGizmo ||
          object.userData.isTransformControls ||
          object.userData.isLightSelector ||
          object.userData.hideInRender ||
          object.name.includes('helper') ||
          object.name.includes('Helper') ||
          object.name.includes('gizmo') ||
          object.name.includes('Gizmo') ||
          object.name.includes('_target') ||
          object.name.includes('_selector') ||
          object.type.includes('Helper')
        ) {
          if (object.visible) {
            object.visible = false;
            hiddenObjects.push(object);
          }
        }
      });
      
      // Set render size
      renderer.setSize(width, height);
      
      // Update camera aspect ratio
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      
      // Render the scene
      renderer.render(scene, camera);
      
      // Get the image data
      const canvas = renderer.domElement;
      const dataURL = canvas.toDataURL(`image/${format}`);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `render_${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`;
      link.href = dataURL;
      link.click();
      
      // Restore original settings
      renderer.setSize(originalSize.x, originalSize.y);
      
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = originalSize.x / originalSize.y;
        camera.updateProjectionMatrix();
      }
      
      // Restore helper visibility
      hiddenObjects.forEach(object => {
        object.visible = true;
      });
      
      // Final render to restore viewport
      renderer.render(scene, camera);
      
    } catch (error) {
      console.error('Failed to render image:', error);
    }
  };

  if (!settings || !renderingManager) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Render Quality</h3>
        <p className="text-gray-400 text-sm">Loading rendering settings...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-gray-700 pb-2">
        <h3 className="text-lg font-semibold">Render Quality</h3>
        <p className="text-sm text-gray-400">
          Advanced rendering and quality settings
        </p>
      </div>

      {/* Quality Presets */}
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection('presets')}
          className="w-full p-3 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-t-lg"
        >
          <span className="font-medium">Quality Presets</span>
          <span className={`transform transition-transform ${expandedSections.presets ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.presets && (
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPreset('low')}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
              >
                Low
              </button>
              <button
                onClick={() => applyPreset('medium')}
                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium transition-colors"
              >
                Medium
              </button>
              <button
                onClick={() => applyPreset('high')}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
              >
                High
              </button>
              <button
                onClick={() => applyPreset('ultra')}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors"
              >
                Ultra
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shadow Settings */}
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection('shadows')}
          className="w-full p-3 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-t-lg"
        >
          <span className="font-medium">Shadow Quality</span>
          <span className={`transform transition-transform ${expandedSections.shadows ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.shadows && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable Shadows</span>
              <input
                type="checkbox"
                checked={settings.shadows.enabled}
                onChange={(e) => updateSettings({
                  shadows: { ...settings.shadows, enabled: e.target.checked }
                })}
                className="w-4 h-4"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Shadow Type</label>
              <select
                value={settings.shadows.type}
                onChange={(e) => updateSettings({
                  shadows: { ...settings.shadows, type: e.target.value as any }
                })}
                className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value="basic">Basic</option>
                <option value="pcf">PCF</option>
                <option value="pcfSoft">PCF Soft</option>
                <option value="vsm">VSM</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Shadow Map Size</label>
              <select
                value={settings.shadows.mapSize}
                onChange={(e) => updateSettings({
                  shadows: { ...settings.shadows, mapSize: parseInt(e.target.value) as any }
                })}
                className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value="512">512</option>
                <option value="1024">1024</option>
                <option value="2048">2048</option>
                <option value="4096">4096</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Shadow Softness: {settings.shadows.radius.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={settings.shadows.radius}
                onChange={(e) => updateSettings({
                  shadows: { ...settings.shadows, radius: parseFloat(e.target.value) }
                })}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Post-Processing Settings */}
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection('postProcessing')}
          className="w-full p-3 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-t-lg"
        >
          <span className="font-medium">Post-Processing</span>
          <span className={`transform transition-transform ${expandedSections.postProcessing ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.postProcessing && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Bloom</span>
              <input
                type="checkbox"
                checked={settings.postProcessing.enableBloom}
                onChange={(e) => updateSettings({
                  postProcessing: { ...settings.postProcessing, enableBloom: e.target.checked }
                })}
                className="w-4 h-4"
              />
            </div>
            
            {settings.postProcessing.enableBloom && (
              <div className="ml-4 space-y-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Bloom Strength: {settings.postProcessing.bloomStrength.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.postProcessing.bloomStrength}
                    onChange={(e) => updateSettings({
                      postProcessing: { ...settings.postProcessing, bloomStrength: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Bloom Threshold: {settings.postProcessing.bloomThreshold.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.postProcessing.bloomThreshold}
                    onChange={(e) => updateSettings({
                      postProcessing: { ...settings.postProcessing, bloomThreshold: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm">SSAO</span>
              <input
                type="checkbox"
                checked={settings.postProcessing.enableSSAO}
                onChange={(e) => updateSettings({
                  postProcessing: { ...settings.postProcessing, enableSSAO: e.target.checked }
                })}
                className="w-4 h-4"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Vignette</span>
              <input
                type="checkbox"
                checked={settings.postProcessing.enableVignette}
                onChange={(e) => updateSettings({
                  postProcessing: { ...settings.postProcessing, enableVignette: e.target.checked }
                })}
                className="w-4 h-4"
              />
            </div>
            
            <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded">
              💡 Depth of Field controls are now available in Camera Settings for more precise control
            </div>
          </div>
        )}
      </div>

      {/* Lighting Settings */}
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection('lighting')}
          className="w-full p-3 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-t-lg"
        >
          <span className="font-medium">Global Illumination</span>
          <span className={`transform transition-transform ${expandedSections.lighting ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.lighting && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ambient Intensity: {settings.globalIllumination.ambientIntensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.globalIllumination.ambientIntensity}
                onChange={(e) => updateSettings({
                  globalIllumination: { 
                    ...settings.globalIllumination, 
                    ambientIntensity: parseFloat(e.target.value) 
                  }
                })}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable GI</span>
              <input
                type="checkbox"
                checked={settings.globalIllumination.enableGI}
                onChange={(e) => updateSettings({
                  globalIllumination: { 
                    ...settings.globalIllumination, 
                    enableGI: e.target.checked 
                  }
                })}
                className="w-4 h-4"
              />
            </div>
          </div>
        )}
      </div>

      {/* Performance Settings */}
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection('performance')}
          className="w-full p-3 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-t-lg"
        >
          <span className="font-medium">Performance</span>
          <span className={`transform transition-transform ${expandedSections.performance ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.performance && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Pixel Ratio: {settings.performance.pixelRatio.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={settings.performance.pixelRatio}
                onChange={(e) => updateSettings({
                  performance: { 
                    ...settings.performance, 
                    pixelRatio: parseFloat(e.target.value) 
                  }
                })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Lights: {settings.performance.maxLights}
              </label>
              <input
                type="range"
                min="1"
                max="16"
                step="1"
                value={settings.performance.maxLights}
                onChange={(e) => updateSettings({
                  performance: { 
                    ...settings.performance, 
                    maxLights: parseInt(e.target.value) 
                  }
                })}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Frustum Culling</span>
              <input
                type="checkbox"
                checked={settings.performance.frustumCulling}
                onChange={(e) => updateSettings({
                  performance: { 
                    ...settings.performance, 
                    frustumCulling: e.target.checked 
                  }
                })}
                className="w-4 h-4"
              />
            </div>
          </div>
        )}
      </div>

      {/* Advanced Professional Features */}
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection('advanced')}
          className="w-full p-3 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-t-lg"
        >
          <span className="font-medium">Professional Features</span>
          <span className={`transform transition-transform ${expandedSections.advanced ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.advanced && (
          <div className="p-3 space-y-3">
            <button
              onClick={() => renderingManager?.enhanceAllMaterials()}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
            >
              Enhance All Materials (PBR)
            </button>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Environment Intensity: {(1.0).toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                defaultValue="1.0"
                onChange={(e) => renderingManager?.updateAdvancedLighting({
                  environmentIntensity: parseFloat(e.target.value)
                })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Shadow Softness: {(5.0).toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                defaultValue="5.0"
                onChange={(e) => renderingManager?.updateAdvancedLighting({
                  shadowSoftness: parseFloat(e.target.value)
                })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Tone Mapping Exposure: {(1.0).toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                defaultValue="1.0"
                onChange={(e) => renderingManager?.updateAdvancedLighting({
                  toneMappingExposure: parseFloat(e.target.value)
                })}
                className="w-full"
              />
            </div>
            
            <button
              onClick={() => {
                const advancedLighting = renderingManager?.getAdvancedLightingSystem();
                if (advancedLighting) {
                  advancedLighting.addAreaLight(5, 5, 1);
                }
              }}
              className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium transition-colors"
            >
              Add Area Light
            </button>
          </div>
        )}
      </div>

      {/* Render Section */}
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection('render')}
          className="w-full p-3 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-t-lg"
        >
          <span className="font-medium">Final Render</span>
          <span className={`transform transition-transform ${expandedSections.render ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.render && (
          <div className="p-3 space-y-3">
            <div className="text-sm text-gray-400 mb-3">
              Render a clean image without gizmos, helpers, or transform controls
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Width</label>
                <input
                  type="number"
                  defaultValue="1920"
                  min="256"
                  max="4096"
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                  id="render-width"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height</label>
                <input
                  type="number"
                  defaultValue="1080"
                  min="256"
                  max="4096"
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                  id="render-height"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Format</label>
              <select
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                id="render-format"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            
            <button
              onClick={() => performRender()}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
            >
              🎬 Render Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
