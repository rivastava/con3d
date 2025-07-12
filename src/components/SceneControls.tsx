import React, { useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';
import { ShadowCatcher } from '@/core/ShadowCatcher';
import { BackgroundManager } from '@/core/BackgroundManager';

interface SceneControlsProps {
  configurator: Con3DConfigurator;
}

const TONE_MAPPING_OPTIONS = [
  { value: THREE.NoToneMapping, label: 'None' },
  { value: THREE.LinearToneMapping, label: 'Linear' },
  { value: THREE.ReinhardToneMapping, label: 'Reinhard' },
  { value: THREE.CineonToneMapping, label: 'Cineon' },
  { value: THREE.ACESFilmicToneMapping, label: 'ACES Filmic' },
  { value: THREE.AgXToneMapping, label: 'AgX' },
  { value: THREE.NeutralToneMapping, label: 'Neutral' },
];

export const SceneControls: React.FC<SceneControlsProps> = ({ configurator }) => {
  const [toneMapping, setToneMapping] = useState<THREE.ToneMapping>(THREE.ACESFilmicToneMapping);
  const [exposure, setExposure] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [backgroundVisible, setBackgroundVisible] = useState<boolean>(true);
  
  // New state for ShadowCatcher and Background
  const [shadowCatcher, setShadowCatcher] = useState<ShadowCatcher | null>(null);
  const [backgroundManager, setBackgroundManager] = useState<BackgroundManager | null>(null);
  const [shadowCatcherEnabled, setShadowCatcherEnabled] = useState<boolean>(true);
  const [shadowColor, setShadowColor] = useState<string>('#000000');
  const [shadowOpacity, setShadowOpacity] = useState<number>(0.3);
  const [shadowSize, setShadowSize] = useState<number>(10);
  const [backgroundType, setBackgroundType] = useState<'color' | 'gradient' | 'hdri' | 'none'>('color');
  const [backgroundColor, setBackgroundColor] = useState<string>('#222222');
  const [gradientTop, setGradientTop] = useState<string>('#87CEEB');
  const [gradientBottom, setGradientBottom] = useState<string>('#98FB98');

  useEffect(() => {
    if (configurator) {
      const sc = configurator.getShadowCatcher();
      const bg = configurator.getBackgroundManager();
      setShadowCatcher(sc);
      setBackgroundManager(bg);
      
      console.log('SceneControls initialized:', { shadowCatcher: !!sc, backgroundManager: !!bg });
      if (sc) {
        console.log('✅ ShadowCatcher is available - controls should be visible');
      } else {
        console.log('❌ ShadowCatcher is not available');
      }
    }
  }, [configurator]);

  const handleToneMappingChange = (newToneMapping: THREE.ToneMapping) => {
    setToneMapping(newToneMapping);
    
    // Use enhanced rendering manager for consistent tone mapping
    const enhancedRendering = configurator.getEnhancedRenderingManager();
    enhancedRendering.setToneMapping(newToneMapping, exposure);
    
    // Legacy renderer access for compatibility
    const renderer = configurator.getRenderer();
    renderer.toneMapping = newToneMapping;
    
    // Some tone mapping algorithms need specific settings
    if (newToneMapping === THREE.ACESFilmicToneMapping) {
      // ACES works best with linear color space
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    } else if (newToneMapping === THREE.AgXToneMapping || newToneMapping === THREE.NeutralToneMapping) {
      // Modern tone mappers work with sRGB output
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    
    console.log('🎨 Tone mapping changed to:', newToneMapping, 'with exposure:', exposure);
  };

  const handleExposureChange = (newExposure: number) => {
    setExposure(newExposure);
    
    // Use enhanced rendering manager for consistent exposure
    const enhancedRendering = configurator.getEnhancedRenderingManager();
    enhancedRendering.setToneMapping(toneMapping, newExposure);
    
    // Legacy renderer access for compatibility
    const renderer = configurator.getRenderer();
    renderer.toneMappingExposure = newExposure;
    
    console.log('💡 Exposure changed to:', newExposure);
  };

  const handleModelUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingProgress('Loading model...');
    
    try {
      const url = URL.createObjectURL(file);
      
      // Clear existing scene
      configurator.scene.clear();
      
      // Load new model
      await configurator.scene.load(url);
      
      setLoadingProgress('Model loaded successfully!');
      setTimeout(() => {
        setLoadingProgress('');
        setIsLoading(false);
      }, 2000);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to load model:', error);
      setLoadingProgress('Failed to load model');
      setTimeout(() => {
        setLoadingProgress('');
        setIsLoading(false);
      }, 3000);
    }
  }, [configurator]);

  const handleHDRIUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingProgress('Loading HDRI...');
    
    try {
      const url = URL.createObjectURL(file);
      
      // Set new HDRI environment
      await configurator.environment.setHDRI(url, {
        hdriIntensity: 1.0,
        hdriRotation: 0,
        hdriBlur: 0.0
      });
      
      setLoadingProgress('HDRI loaded successfully!');
      setTimeout(() => {
        setLoadingProgress('');
        setIsLoading(false);
      }, 2000);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to load HDRI:', error);
      setLoadingProgress('Failed to load HDRI');
      setTimeout(() => {
        setLoadingProgress('');
        setIsLoading(false);
      }, 3000);
    }
  }, [configurator]);

  const resetCamera = () => {
    const controls = configurator.getControls();
    const camera = configurator.getCamera();
    
    // Reset camera position
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    
    // Reset controls
    controls.reset();
  };

  const exportScene = async () => {
    try {
      const glb = await configurator.scene.exportGLTF();
      const blob = new Blob([glb], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scene.glb';
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export scene:', error);
    }
  };

  const exportImage = async () => {
    try {
      const imageData = await configurator.scene.exportImage({
        width: 1920,
        height: 1080,
        format: 'png'
      });
      
      const a = document.createElement('a');
      a.href = imageData;
      a.download = 'render.png';
      a.click();
    } catch (error) {
      console.error('Failed to export image:', error);
    }
  };

  const handleBackgroundVisibilityToggle = () => {
    const newVisible = !backgroundVisible;
    setBackgroundVisible(newVisible);
    if (backgroundManager) {
      if (newVisible) {
        // Restore previous background
        handleBackgroundTypeChange(backgroundType);
      } else {
        // Set to transparent
        backgroundManager.setNone();
      }
    }
  };

  // Shadow Catcher handlers
  const handleShadowCatcherToggle = () => {
    setShadowCatcherEnabled(!shadowCatcherEnabled);
    if (shadowCatcher) {
      shadowCatcher.setEnabled(!shadowCatcherEnabled);
    }
  };

  const handleShadowColorChange = (color: string) => {
    setShadowColor(color);
    if (shadowCatcher) {
      shadowCatcher.setColor(color);
    }
  };

  const handleShadowOpacityChange = (opacity: number) => {
    setShadowOpacity(opacity);
    if (shadowCatcher) {
      shadowCatcher.setOpacity(opacity);
    }
  };

  const handleShadowSizeChange = (size: number) => {
    setShadowSize(size);
    if (shadowCatcher) {
      shadowCatcher.setSize(size);
    }
  };

  // Background handlers
  const handleBackgroundTypeChange = (type: 'color' | 'gradient' | 'hdri' | 'none') => {
    setBackgroundType(type);
    if (backgroundManager) {
      switch (type) {
        case 'color':
          backgroundManager.setSolidColor(backgroundColor);
          break;
        case 'gradient':
          backgroundManager.setGradient(gradientTop, gradientBottom);
          break;
        case 'hdri':
          // For now, just set to transparent - HDRI loading would need separate implementation
          backgroundManager.setNone();
          break;
        case 'none':
          backgroundManager.setNone();
          break;
      }
    }
  };

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    if (backgroundManager && backgroundType === 'color') {
      backgroundManager.setSolidColor(color);
    }
  };

  const handleGradientTopChange = (color: string) => {
    setGradientTop(color);
    if (backgroundManager && backgroundType === 'gradient') {
      backgroundManager.setGradient(color, gradientBottom);
    }
  };

  const handleGradientBottomChange = (color: string) => {
    setGradientBottom(color);
    if (backgroundManager && backgroundType === 'gradient') {
      backgroundManager.setGradient(gradientTop, color);
    }
  };

  return (
    <div className="p-4 bg-gray-800 text-white space-y-6">
      <h3 className="text-lg font-semibold">Scene Controls</h3>

      {/* Loading indicator */}
      {isLoading && (
        <div className="bg-blue-600 text-white p-3 rounded">
          <div className="flex items-center space-x-2">
            <div className="spinner"></div>
            <span>{loadingProgress}</span>
          </div>
        </div>
      )}

      {/* Tone Mapping */}
      <div>
        <h4 className="text-md font-medium mb-3">Tone Mapping</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-2">Algorithm</label>
            <select
              value={toneMapping}
              onChange={(e) => handleToneMappingChange(parseInt(e.target.value) as THREE.ToneMapping)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              {TONE_MAPPING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-1">
              Exposure: {exposure.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={exposure}
              onChange={(e) => handleExposureChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Asset Loading */}
      <div>
        <h4 className="text-md font-medium mb-3">Assets</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-2">Load 3D Model</label>
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleModelUpload(file);
              }}
              className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm mb-2">Load HDRI Environment</label>
            <input
              type="file"
              accept=".hdr,.exr"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleHDRIUpload(file);
              }}
              className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Camera Controls */}
      <div>
        <h4 className="text-md font-medium mb-3">Camera</h4>
        <button
          onClick={resetCamera}
          className="btn btn-secondary w-full"
        >
          Reset Camera
        </button>
      </div>

      {/* Export */}
      <div>
        <h4 className="text-md font-medium mb-3">Export</h4>
        <div className="space-y-2">
          <button
            onClick={exportScene}
            className="btn btn-primary w-full"
          >
            Export Scene (GLB)
          </button>
          <button
            onClick={exportImage}
            className="btn btn-primary w-full"
          >
            Export Image (PNG)
          </button>
        </div>
      </div>

      {/* Environment Controls */}
      <div>
        <h4 className="text-md font-medium mb-3">Environment</h4>
        <div className="space-y-3">
          <button
            onClick={() => {
              // Load default environment
              configurator.environment.setHDRI('/assets/hdri/baseHDRI.hdr', {
                hdriIntensity: 1.0,
                hdriRotation: 0,
                hdriBlur: 0.0
              }).catch((error) => console.error('Failed to load default HDRI:', error));
            }}
            className="btn btn-secondary w-full"
            disabled={isLoading}
          >
            Load Default HDRI
          </button>
          
          <button
            onClick={() => {
              // Clear environment (use scene background)
              const scene = configurator.getScene();
              scene.environment = null;
              scene.background = new THREE.Color(0x222222);
            }}
            className="btn btn-secondary w-full"
          >
            Clear Environment
          </button>
        </div>
      </div>

      {/* Camera Clipping */}
      <div>
        <h4 className="text-md font-medium mb-3">Camera Settings</h4>
        <div className="space-y-3">
          <button
            onClick={() => configurator.autoAdjustClipping()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
          >
            🔧 Auto-Adjust Clipping
          </button>
          
          <div className="text-xs text-gray-400">
            Automatically adjusts camera near/far clipping and controls distance based on scene size
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => configurator.adjustCameraClipping(0.001)}
              className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
              title="Set very close near clipping for detailed inspection"
            >
              Very Close
            </button>
            <button
              onClick={() => configurator.adjustCameraClipping(0.1)}
              className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
              title="Set normal near clipping"
            >
              Normal
            </button>
          </div>
        </div>
      </div>

      {/* Shadow Catcher Controls */}
      <div>
        <h4 className="text-md font-medium mb-3">Shadow Catcher</h4>
        {shadowCatcher ? (
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={shadowCatcherEnabled}
                onChange={handleShadowCatcherToggle}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm">Enable Shadow Catcher</span>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Shadow Color</label>
              <input
                type="color"
                value={shadowColor}
                onChange={(e) => handleShadowColorChange(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">
                Shadow Opacity: {shadowOpacity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={shadowOpacity}
                onChange={(e) => handleShadowOpacityChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">
                Shadow Size: {shadowSize}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={shadowSize}
                onChange={(e) => handleShadowSizeChange(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">
            Shadow Catcher not available (configurator loading...)
          </div>
        )}
      </div>

      {/* Background Controls */}
      <div>
        <h4 className="text-md font-medium mb-3">Background</h4>
        <div className="space-y-3">
          {/* Background Visibility Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
            <div>
              <label className="block text-sm font-medium mb-1">Background Visible</label>
              <p className="text-xs text-gray-400">Hide background but keep environment lighting</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={backgroundVisible}
                onChange={handleBackgroundVisibilityToggle}
                className="sr-only"
              />
              <div className={`relative w-12 h-6 rounded-full transition-colors ${
                backgroundVisible ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  backgroundVisible ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
            </label>
          </div>
          
          {/* Background Type Selection */}
          <div>
            <label className="block text-sm mb-2">Background Type</label>
            <select
              value={backgroundType}
              onChange={(e) => handleBackgroundTypeChange(e.target.value as 'color' | 'gradient' | 'hdri' | 'none')}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="color">Solid Color</option>
              <option value="gradient">Gradient</option>
              <option value="hdri">HDRI</option>
              <option value="none">None</option>
            </select>
          </div>
          
          {backgroundType === 'color' && (
            <div>
              <label className="block text-sm mb-1">Color</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
              />
            </div>
          )}
          
          {backgroundType === 'gradient' && (
            <div>
              <label className="block text-sm mb-1">Gradient Colors</label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={gradientTop}
                  onChange={(e) => handleGradientTopChange(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                />
                <input
                  type="color"
                  value={gradientBottom}
                  onChange={(e) => handleGradientBottomChange(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                />
              </div>
            </div>
          )}
          
          {backgroundType === 'hdri' && (
            <div className="text-sm text-gray-400">
              HDRI background is currently set to default. You can upload a new HDRI in the Assets section.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
