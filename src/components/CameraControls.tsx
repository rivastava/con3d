import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';
import { CameraManager, CameraConfig } from '@/core/CameraManager';

interface CameraControlsProps {
  configurator: Con3DConfigurator;
}

interface AdvancedCameraSettings {
  focalLength: number;
  aperture: number;
  focusDistance: number;
  focusTarget: 'manual' | 'object' | 'center';
  selectedFocusObject: string | null;
  bokehEnabled: boolean;
  fov: number;
  near: number;
  far: number;
  filmGauge: number;
  enableDepthOfField: boolean;
  isAutoFocusing: boolean;
  circleOfConfusion: number; // Physical camera property
}

export const CameraControls: React.FC<CameraControlsProps> = ({ configurator }) => {
  const [cameraManager, setCameraManager] = useState<CameraManager | null>(null);
  const [cameras, setCameras] = useState<CameraConfig[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [newCameraName, setNewCameraName] = useState('');
  const [newCameraType, setNewCameraType] = useState<'perspective' | 'orthographic'>('perspective');
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedCameraSettings>({
    focalLength: 50,
    aperture: 2.8,
    focusDistance: 10,
    focusTarget: 'manual',
    selectedFocusObject: null,
    bokehEnabled: false,
    fov: 75,
    near: 0.1,
    far: 1000,
    filmGauge: 35,
    enableDepthOfField: false,
    isAutoFocusing: false,
    circleOfConfusion: 0.03, // Standard 35mm film circle of confusion in mm
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    if (configurator) {
      const manager = configurator.getCameraManager();
      setCameraManager(manager);
      console.log('CameraControls: manager set', !!manager);
    }
  }, [configurator]);

  useEffect(() => {
    if (cameraManager) {
      console.log('CameraControls: loading cameras');
      loadCameras();
    }
  }, [cameraManager]);

  const loadCameras = () => {
    if (!cameraManager) {
      console.log('CameraControls: cameraManager not available');
      return;
    }
    
    const cameraList = cameraManager.getAllCameras();
    console.log('CameraControls: loaded cameras', cameraList.length);
    setCameras(cameraList.map(item => item.config));
    setActiveCameraId(cameraManager.getActiveCameraId());
  };

  const handleSwitchCamera = (cameraId: string) => {
    if (!cameraManager) return;
    
    console.log('Switching to camera:', cameraId);
    
    // Set active camera in manager
    cameraManager.setActiveCamera(cameraId);
    setActiveCameraId(cameraId);
    
    // Get the new camera
    const newCamera = cameraManager.getCamera(cameraId);
    if (newCamera) {
      console.log('New camera position:', newCamera.position);
      
      // Use the proper camera switching method
      configurator.switchCamera(newCamera);
      
      // Force viewport update by updating the renderer and controls
      const renderer = configurator.getRenderer();
      const controls = configurator.getControls();
      
      // Update camera aspect ratio to current canvas size
      const canvas = renderer.domElement;
      if (newCamera instanceof THREE.PerspectiveCamera) {
        newCamera.aspect = canvas.clientWidth / canvas.clientHeight;
        newCamera.updateProjectionMatrix();
      }
      
      // Update controls to use the new camera
      if (controls) {
        // Safely cast the camera type for controls
        if (newCamera instanceof THREE.PerspectiveCamera || newCamera instanceof THREE.OrthographicCamera) {
          (controls as any).object = newCamera;
          controls.update();
        }
      }
      
      // Force a render
      renderer.render(configurator.getScene(), newCamera);
    }
  };

  const handleAddCamera = () => {
    if (!cameraManager || !newCameraName.trim()) return;
    
    cameraManager.createCameraAtCurrentPosition(newCameraName, newCameraType);
    setNewCameraName('');
    setShowAddCamera(false);
    loadCameras();
  };

  const handleDeleteCamera = (cameraId: string) => {
    if (!cameraManager) return;
    
    if (cameraManager.deleteCamera(cameraId)) {
      loadCameras();
    }
  };

  const generatePreview = async (cameraId: string): Promise<string> => {
    if (!cameraManager) return '';
    
    try {
      return await cameraManager.generatePreview(cameraId, 120, 90);
    } catch (error) {
      console.warn('Failed to generate camera preview:', error);
      return '';
    }
  };

  // Advanced camera settings functions
  const updateCameraFOV = (fov: number) => {
    const camera = configurator.getRenderingEngine().camera;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  };

  const updateCameraFocalLength = (length: number) => {
    const camera = configurator.getRenderingEngine().camera;
    if (camera instanceof THREE.PerspectiveCamera) {
      // Convert focal length to FOV
      // FOV = 2 * arctan(filmGauge / (2 * focalLength)) * (180/π)
      const filmGauge = advancedSettings.filmGauge;
      const fov = 2 * Math.atan(filmGauge / (2 * length)) * (180 / Math.PI);
      camera.fov = fov;
      camera.updateProjectionMatrix();
      
      // Update FOV in settings to keep UI in sync
      setAdvancedSettings(prev => ({ ...prev, fov }));
    }
  };

  const updateCameraAperture = (aperture: number) => {
    console.log('CameraControls: updateCameraAperture called with:', aperture);
    // Update post-processing DOF aperture with physical calculation
    updatePhysicalDOF(advancedSettings.focalLength, aperture, advancedSettings.focusDistance);
  };

  const updateCameraFocusDistance = (distance: number) => {
    console.log('CameraControls: updateCameraFocusDistance called with:', distance);
    // Convert UI units (which are in meters) to proper focus distance
    const focusDistanceInMeters = Math.max(0.1, distance);
    
    // Update post-processing DOF focus distance with physical calculation
    updatePhysicalDOF(advancedSettings.focalLength, advancedSettings.aperture, focusDistanceInMeters);
  };

  const toggleDepthOfField = (enabled: boolean) => {
    console.log('CameraControls: toggleDepthOfField called with:', enabled);
    // Enable/disable depth of field in post-processing
    const enhancedRendering = configurator.getEnhancedRenderingManager();
    const postProcessing = enhancedRendering?.getPostProcessingManager();
    console.log('CameraControls: postProcessing available:', !!postProcessing);
    if (postProcessing) {
      postProcessing.updateSettings({
        enableDepthOfField: enabled,
        dofFocus: advancedSettings.focusDistance,
        dofAperture: advancedSettings.aperture
      });
    }
  };

  const toggleBokeh = (enabled: boolean) => {
    // Enable/disable bokeh effect via DOF bokeh scale
    const enhancedRendering = configurator.getEnhancedRenderingManager();
    const postProcessing = enhancedRendering?.getPostProcessingManager();
    if (postProcessing) {
      postProcessing.setBokehScale(enabled ? 2.0 : 0.0);
    }
  };

  const updateCameraNear = (near: number) => {
    const camera = configurator.getRenderingEngine().camera;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }
  };

  const updateCameraFar = (far: number) => {
    const camera = configurator.getRenderingEngine().camera;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.far = far;
      camera.updateProjectionMatrix();
    }
  };

  const resetCameraSettings = () => {
    const defaultSettings: AdvancedCameraSettings = {
      focalLength: 50,
      aperture: 2.8,
      focusDistance: 10,
      focusTarget: 'manual',
      selectedFocusObject: null,
      bokehEnabled: false,
      fov: 75,
      near: 0.1,
      far: 1000,
      filmGauge: 35,
      enableDepthOfField: false,
      isAutoFocusing: false,
      circleOfConfusion: 0.03,
    };
    
    setAdvancedSettings(defaultSettings);
    
    // Apply all default settings to camera
    const camera = configurator.getRenderingEngine().camera;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = defaultSettings.fov;
      camera.near = defaultSettings.near;
      camera.far = defaultSettings.far;
      camera.updateProjectionMatrix();
    }
    
    // Reset post-processing settings
    const enhancedRendering = configurator.getEnhancedRenderingManager();
    const postProcessing = enhancedRendering?.getPostProcessingManager();
    if (postProcessing) {
      postProcessing.updateSettings({
        enableDepthOfField: defaultSettings.enableDepthOfField,
        dofFocus: defaultSettings.focusDistance,
        dofAperture: defaultSettings.aperture,
        dofBokehScale: defaultSettings.bokehEnabled ? 2.0 : 0.0
      });
    }
  };

  /**
   * Calculate Circle of Confusion based on physical camera parameters
   * Uses hyperfocal distance formula: CoC = (f^2) / (N * H)
   * where f = focal length, N = f-number (aperture), H = hyperfocal distance
   */
  const calculateCircleOfConfusion = (focalLength: number, aperture: number, focusDistance: number): number => {
    // Calculate CoC based on aperture and focus distance
    const coc = (focalLength * focalLength) / (aperture * (focusDistance * 1000)); // Convert to mm
    return Math.min(coc, 2.0); // Cap at reasonable value for rendering
  };

  /**
   * Get all focusable objects in the scene
   */
  const getFocusableObjects = (): Array<{name: string, distance: number, object: THREE.Object3D}> => {
    const scene = configurator.getScene();
    const camera = configurator.getRenderingEngine().camera;
    const focusableObjects: Array<{name: string, distance: number, object: THREE.Object3D}> = [];

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.name && !object.name.includes('Helper')) {
        const distance = camera.position.distanceTo(object.position);
        focusableObjects.push({
          name: object.name,
          distance: distance,
          object: object
        });
      }
    });

    return focusableObjects.sort((a, b) => a.distance - b.distance);
  };

  /**
   * Focus on a specific object by calculating distance and updating DOF
   */
  const focusOnObject = (objectName: string) => {
    const focusableObjects = getFocusableObjects();
    const targetObject = focusableObjects.find(obj => obj.name === objectName);
    
    if (targetObject) {
      const camera = configurator.getRenderingEngine().camera;
      
      // For small objects, use bounding box to calculate proper focus distance
      const box = new THREE.Box3().setFromObject(targetObject.object);
      const size = box.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      
      // Calculate distance based on object size and camera FOV
      let targetDistance = targetObject.distance;
      
      // For very small objects (< 0.1 units), adjust focus distance
      if (maxDimension < 0.1) {
        // Use center-to-surface distance for small objects
        const center = box.getCenter(new THREE.Vector3());
        const surfaceDistance = camera.position.distanceTo(center) + (maxDimension * 0.5);
        targetDistance = Math.max(0.05, surfaceDistance); // Minimum 5cm focus distance
      }
      
      // Calculate physically accurate DOF
      const coc = calculateCircleOfConfusion(advancedSettings.focalLength, advancedSettings.aperture, targetDistance);
      
      setAdvancedSettings(prev => ({
        ...prev,
        focusDistance: targetDistance,
        selectedFocusObject: objectName,
        focusTarget: 'object',
        circleOfConfusion: coc
      }));
      
      // Update post-processing with physically calculated values
      updateCameraFocusDistance(targetDistance);
      updatePhysicalDOF(advancedSettings.focalLength, advancedSettings.aperture, targetDistance);
    }
  };

  /**
   * Focus on scene center
   */
  const focusOnCenter = () => {
    const camera = configurator.getRenderingEngine().camera;
    const controls = configurator.getControls();
    const centerDistance = camera.position.distanceTo(controls.target);
    
    setAdvancedSettings(prev => ({
      ...prev,
      focusDistance: centerDistance,
      selectedFocusObject: null,
      focusTarget: 'center'
    }));
    
    updateCameraFocusDistance(centerDistance);
    updatePhysicalDOF(advancedSettings.focalLength, advancedSettings.aperture, centerDistance);
  };

  /**
   * Update DOF with physical camera calculations
   */
  const updatePhysicalDOF = (focalLength: number, aperture: number, focusDistance: number) => {
    console.log('CameraControls: updatePhysicalDOF called with:', { focalLength, aperture, focusDistance });
    const enhancedRendering = configurator.getEnhancedRenderingManager();
    const postProcessing = enhancedRendering?.getPostProcessingManager();
    
    console.log('CameraControls: postProcessing available for updatePhysicalDOF:', !!postProcessing);
    console.log('CameraControls: DOF enabled:', advancedSettings.enableDepthOfField);
    
    if (postProcessing && advancedSettings.enableDepthOfField) {
      // Calculate Circle of Confusion based on aperture and focus distance
      const coc = calculateCircleOfConfusion(focalLength, aperture, focusDistance);
      console.log('CameraControls: calculated COC:', coc);
      
      // Update post-processing with calculated values
      postProcessing.updateSettings({
        enableDepthOfField: true,
        dofFocus: focusDistance,
        dofAperture: aperture,
        dofBokehScale: advancedSettings.bokehEnabled ? (coc * 10) : 0.0, // Scale COC for visible effect
      });
      
      // Also try the direct methods
      postProcessing.setFocusDistance(focusDistance);
      postProcessing.setAperture(aperture);
      postProcessing.setBokehScale(advancedSettings.bokehEnabled ? (coc * 10) : 0.0);
    }
  };

  if (!cameraManager) {
    return (
      <div className="p-4">
        <p className="text-gray-400 text-sm">Camera manager not available</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Camera Views</h3>
        <button
          onClick={() => setShowAddCamera(!showAddCamera)}
          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          + Add
        </button>
      </div>

      {/* Add Camera Form */}
      {showAddCamera && (
        <div className="bg-gray-800 p-3 rounded border border-gray-600 space-y-2">
          <input
            type="text"
            placeholder="Camera name"
            value={newCameraName}
            onChange={(e) => setNewCameraName(e.target.value)}
            className="w-full px-2 py-1 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
          />
          
          <select
            value={newCameraType}
            onChange={(e) => setNewCameraType(e.target.value as 'perspective' | 'orthographic')}
            className="w-full px-2 py-1 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
          >
            <option value="perspective">Perspective</option>
            <option value="orthographic">Orthographic</option>
          </select>
          
          <div className="flex gap-2">
            <button
              onClick={handleAddCamera}
              className="flex-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Create
            </button>
            <button
              onClick={() => setShowAddCamera(false)}
              className="flex-1 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Camera List */}
      <div className="space-y-2">
        {cameras.map((camera) => (
          <CameraItem
            key={camera.id}
            camera={camera}
            isActive={camera.id === activeCameraId}
            onSwitch={() => handleSwitchCamera(camera.id)}
            onDelete={() => handleDeleteCamera(camera.id)}
            generatePreview={() => generatePreview(camera.id)}
          />
        ))}
      </div>

      {/* Camera Settings */}
      {activeCameraId && (
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <h4 className="text-xs font-medium text-white mb-2">Active Camera Settings</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-300">
              <span>Type:</span>
              <span>{cameras.find(c => c.id === activeCameraId)?.type}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Position:</span>
              <span className="text-[10px]">
                {cameras.find(c => c.id === activeCameraId)?.position
                  ? `${cameras.find(c => c.id === activeCameraId)!.position.x.toFixed(1)}, ${cameras.find(c => c.id === activeCameraId)!.position.y.toFixed(1)}, ${cameras.find(c => c.id === activeCameraId)!.position.z.toFixed(1)}`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Camera Settings */}
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="w-full p-3 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-t-lg"
        >
          <span className="font-medium">Advanced Camera Settings</span>
          <span className={`transform transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {showAdvancedSettings && (
          <div className="p-3 space-y-3">
            {/* Field of View */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Field of View: {advancedSettings.fov.toFixed(1)}°
              </label>
              <input
                type="range"
                min="10"
                max="120"
                step="1"
                value={advancedSettings.fov}
                onChange={(e) => {
                  const newFov = parseFloat(e.target.value);
                  setAdvancedSettings(prev => ({ ...prev, fov: newFov }));
                  updateCameraFOV(newFov);
                }}
                className="w-full"
              />
            </div>
            
            {/* Focal Length */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Focal Length: {advancedSettings.focalLength.toFixed(1)}mm ({(advancedSettings.focalLength / 10).toFixed(2)}cm)
              </label>
              <input
                type="range"
                min="14"
                max="200"
                step="1"
                value={advancedSettings.focalLength}
                onChange={(e) => {
                  const newFocalLength = parseFloat(e.target.value);
                  setAdvancedSettings(prev => ({ ...prev, focalLength: newFocalLength }));
                  updateCameraFocalLength(newFocalLength);
                }}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                Range: 14mm (1.4cm) - 200mm (20cm) • Professional camera focal lengths
              </div>
            </div>
            
            {/* Aperture */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Aperture: f/{advancedSettings.aperture.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.8"
                max="22"
                step="0.1"
                value={advancedSettings.aperture}
                onChange={(e) => {
                  const newAperture = parseFloat(e.target.value);
                  setAdvancedSettings(prev => ({ ...prev, aperture: newAperture }));
                  updateCameraAperture(newAperture);
                }}
                className="w-full"
              />
            </div>
            
            {/* Focus Target Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Focus Target</label>
              <div className="space-y-2">
                <select
                  value={advancedSettings.focusTarget}
                  onChange={(e) => {
                    const newTarget = e.target.value as 'manual' | 'object' | 'center';
                    setAdvancedSettings(prev => ({ ...prev, focusTarget: newTarget }));
                    
                    if (newTarget === 'center') {
                      focusOnCenter();
                    } else if (newTarget === 'manual') {
                      setAdvancedSettings(prev => ({ ...prev, selectedFocusObject: null }));
                    }
                  }}
                  className="w-full px-2 py-1 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="manual">Manual Distance</option>
                  <option value="center">Scene Center</option>
                  <option value="object">Focus on Object</option>
                </select>
                
                {/* Object Selection Dropdown */}
                {advancedSettings.focusTarget === 'object' && (
                  <select
                    value={advancedSettings.selectedFocusObject || ''}
                    onChange={(e) => {
                      const objectName = e.target.value;
                      if (objectName) {
                        focusOnObject(objectName);
                      }
                    }}
                    className="w-full px-2 py-1 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select an object...</option>
                    {getFocusableObjects().map((obj) => (
                      <option key={obj.name} value={obj.name}>
                        {obj.name} ({(obj.distance * 100).toFixed(0)}cm)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            
            {/* Focus Distance */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Focus Distance: {(advancedSettings.focusDistance * 100).toFixed(0)}cm
                {advancedSettings.focusTarget !== 'manual' && (
                  <span className="text-xs text-gray-400 ml-2">
                    (Auto from {advancedSettings.focusTarget})
                  </span>
                )}
              </label>
              <input
                type="range"
                min="5"
                max="10000"
                step="5"
                value={advancedSettings.focusDistance * 100}
                disabled={advancedSettings.focusTarget !== 'manual'}
                onChange={(e) => {
                  const newFocusDistanceCm = parseFloat(e.target.value);
                  const newFocusDistanceM = newFocusDistanceCm / 100;
                  setAdvancedSettings(prev => ({ 
                    ...prev, 
                    focusDistance: newFocusDistanceM,
                    focusTarget: 'manual' 
                  }));
                  updateCameraFocusDistance(newFocusDistanceM);
                }}
                className={`w-full ${advancedSettings.focusTarget !== 'manual' ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="text-xs text-gray-400 mt-1">
                Range: 5cm - 100m • Professional camera focus distances
              </div>
            </div>
            
            {/* Depth of Field Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Depth of Field</span>
              <input
                type="checkbox"
                checked={advancedSettings.enableDepthOfField}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setAdvancedSettings(prev => ({ ...prev, enableDepthOfField: enabled }));
                  toggleDepthOfField(enabled);
                }}
                className="w-4 h-4"
              />
            </div>
            
            {/* Bokeh Enable */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Bokeh Effect</span>
              <input
                type="checkbox"
                checked={advancedSettings.bokehEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setAdvancedSettings(prev => ({ ...prev, bokehEnabled: enabled }));
                  toggleBokeh(enabled);
                }}
                className="w-4 h-4"
              />
            </div>
            
            {/* Near/Far Clipping */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Near: {advancedSettings.near.toFixed(3)}
                </label>
                <input
                  type="range"
                  min="0.001"
                  max="10"
                  step="0.001"
                  value={advancedSettings.near}
                  onChange={(e) => {
                    const newNear = parseFloat(e.target.value);
                    setAdvancedSettings(prev => ({ ...prev, near: newNear }));
                    updateCameraNear(newNear);
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Far: {advancedSettings.far.toFixed(0)}
                </label>
                <input
                  type="range"
                  min="10"
                  max="10000"
                  step="10"
                  value={advancedSettings.far}
                  onChange={(e) => {
                    const newFar = parseFloat(e.target.value);
                    setAdvancedSettings(prev => ({ ...prev, far: newFar }));
                    updateCameraFar(newFar);
                  }}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Reset Button */}
            <button
              onClick={resetCameraSettings}
              className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface CameraItemProps {
  camera: CameraConfig;
  isActive: boolean;
  onSwitch: () => void;
  onDelete: () => void;
  generatePreview: () => Promise<string>;
}

const CameraItem: React.FC<CameraItemProps> = ({ 
  camera, 
  isActive, 
  onSwitch, 
  onDelete, 
  generatePreview 
}) => {
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate preview on mount
    if (!preview) {
      setLoading(true);
      generatePreview()
        .then(setPreview)
        .finally(() => setLoading(false));
    }
  }, [generatePreview, preview]);

  return (
    <div 
      className={`p-2 rounded border cursor-pointer transition-colors ${
        isActive 
          ? 'border-blue-500 bg-blue-900/20' 
          : 'border-gray-600 bg-gray-800 hover:border-gray-500'
      }`}
      onClick={onSwitch}
    >
      <div className="flex items-center gap-2">
        {/* Preview thumbnail */}
        <div className="w-12 h-9 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
          {loading ? (
            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : preview ? (
            <img src={preview} alt="Camera preview" className="w-full h-full object-cover rounded" />
          ) : (
            <div className="w-4 h-4 text-gray-400">📷</div>
          )}
        </div>
        
        {/* Camera info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium truncate ${isActive ? 'text-blue-300' : 'text-white'}`}>
              {camera.name}
            </span>
            {!isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-gray-400 hover:text-red-400 text-xs ml-1"
                title="Delete camera"
              >
                ×
              </button>
            )}
          </div>
          <div className="text-[10px] text-gray-400 truncate">
            {camera.type} • {camera.position.x.toFixed(1)}, {camera.position.y.toFixed(1)}, {camera.position.z.toFixed(1)}
          </div>
        </div>
        
        {/* Active indicator */}
        {isActive && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
        )}
      </div>
    </div>
  );
};
