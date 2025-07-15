import React, { useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';
import { SceneTransformControls } from '@/core/SceneTransformControls';

interface TransformControlsProps {
  configurator: Con3DConfigurator;
  selectedMesh: THREE.Mesh | null;
}

export const TransformControls: React.FC<TransformControlsProps> = ({ configurator, selectedMesh }) => {
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });
  const [use3DGizmo, setUse3DGizmo] = useState(false);
  const [sceneTransformControls, setSceneTransformControls] = useState<SceneTransformControls | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize 3D transform controls
  useEffect(() => {
    if (configurator && !sceneTransformControls) {
      const scene = configurator.getScene();
      const camera = configurator.getCamera();
      const renderer = configurator.getRenderer();
      const controls = configurator.getControls();
      
      const transformControls = new SceneTransformControls(scene, camera, renderer, controls);
      
      // Set up callback to sync UI when object is transformed via 3D gizmo
      transformControls.onTransform((mesh: THREE.Mesh) => {
        // Use requestAnimationFrame to avoid state updates during render
        requestAnimationFrame(() => {
          setPosition({
            x: parseFloat(mesh.position.x.toFixed(3)),
            y: parseFloat(mesh.position.y.toFixed(3)),
            z: parseFloat(mesh.position.z.toFixed(3))
          });
          setRotation({
            x: parseFloat((mesh.rotation.x * (180 / Math.PI)).toFixed(1)),
            y: parseFloat((mesh.rotation.y * (180 / Math.PI)).toFixed(1)),
            z: parseFloat((mesh.rotation.z * (180 / Math.PI)).toFixed(1))
          });
          setScale({
            x: parseFloat(mesh.scale.x.toFixed(3)),
            y: parseFloat(mesh.scale.y.toFixed(3)),
            z: parseFloat(mesh.scale.z.toFixed(3))
          });
        });
      });
      
      setSceneTransformControls(transformControls);
    }
    
    // Cleanup function
    return () => {
      if (sceneTransformControls) {
        sceneTransformControls.dispose();
      }
    };
  }, [configurator]); // Remove sceneTransformControls from deps to prevent recreation

  // Update 3D gizmo when mesh selection or mode changes
  useEffect(() => {
    if (sceneTransformControls) {
      if (use3DGizmo && selectedMesh) {
        sceneTransformControls.attachToMesh(selectedMesh);
        sceneTransformControls.setMode(transformMode);
        sceneTransformControls.setEnabled(true);
      } else {
        // Properly hide the gizmo when toggled off
        sceneTransformControls.attachToMesh(null);
        sceneTransformControls.setEnabled(false);
      }
    }
  }, [sceneTransformControls, selectedMesh, use3DGizmo, transformMode]);

  // Update state when mesh changes
  React.useEffect(() => {
    if (selectedMesh) {
      setPosition({
        x: selectedMesh.position.x,
        y: selectedMesh.position.y,
        z: selectedMesh.position.z
      });
      setRotation({
        x: selectedMesh.rotation.x * (180 / Math.PI), // Convert to degrees
        y: selectedMesh.rotation.y * (180 / Math.PI),
        z: selectedMesh.rotation.z * (180 / Math.PI)
      });
      setScale({
        x: selectedMesh.scale.x,
        y: selectedMesh.scale.y,
        z: selectedMesh.scale.z
      });
      setIsInitialized(true);
    } else {
      setIsInitialized(false);
    }
  }, [selectedMesh]);

  const updatePosition = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedMesh || !isInitialized) return;
    
    const newPosition = { ...position, [axis]: value };
    setPosition(newPosition);
    
    // Schedule Three.js mutation for next tick to avoid render cycle side effects
    setTimeout(() => {
      if (selectedMesh) {
        selectedMesh.position[axis] = value;
      }
    }, 0);
  }, [selectedMesh, position, isInitialized]);

  const updateRotation = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedMesh || !isInitialized) return;
    
    const newRotation = { ...rotation, [axis]: value };
    setRotation(newRotation);
    
    // Schedule Three.js mutation for next tick to avoid render cycle side effects
    setTimeout(() => {
      if (selectedMesh) {
        selectedMesh.rotation[axis] = value * (Math.PI / 180); // Convert to radians
      }
    }, 0);
  }, [selectedMesh, rotation, isInitialized]);

  const updateScale = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedMesh || !isInitialized) return;
    
    const newScale = { ...scale, [axis]: value };
    setScale(newScale);
    
    // Schedule Three.js mutation for next tick to avoid render cycle side effects
    setTimeout(() => {
      if (selectedMesh) {
        selectedMesh.scale[axis] = value;
      }
    }, 0);
  }, [selectedMesh, scale, isInitialized]);

  const resetTransform = useCallback(() => {
    if (!selectedMesh || !isInitialized) return;
    
    // Schedule Three.js mutations for next tick to avoid render cycle side effects
    setTimeout(() => {
      if (selectedMesh) {
        selectedMesh.position.set(0, 0, 0);
        selectedMesh.rotation.set(0, 0, 0);
        selectedMesh.scale.set(1, 1, 1);
      }
    }, 0);
    
    setPosition({ x: 0, y: 0, z: 0 });
    setRotation({ x: 0, y: 0, z: 0 });
    setScale({ x: 1, y: 1, z: 1 });
  }, [selectedMesh, isInitialized]);

  const duplicateMesh = useCallback(() => {
    if (!selectedMesh) return;
    
    try {
      const clonedMesh = selectedMesh.clone();
      clonedMesh.name = `${selectedMesh.name || 'Object'} Copy`;
      clonedMesh.position.x += 2; // Offset the duplicate
      
      const scene = configurator.getScene();
      scene.add(clonedMesh);
    } catch (error) {
      // Use setTimeout to avoid logging during render cycle
      setTimeout(() => console.error('Failed to duplicate mesh:', error), 0);
    }
  }, [selectedMesh, configurator]);

  const applyTransforms = useCallback(() => {
    if (!selectedMesh || !isInitialized) return;
    
    try {
      // Call the configurator's apply transforms method
      configurator.applyTransforms();
      
      // Reset UI values since transforms have been applied
      setPosition({ x: 0, y: 0, z: 0 });
      setRotation({ x: 0, y: 0, z: 0 });
      setScale({ x: 1, y: 1, z: 1 });
      
      // Use setTimeout to avoid logging during render cycle
      setTimeout(() => console.log('Transforms applied to all meshes'), 0);
    } catch (error) {
      // Use setTimeout to avoid logging during render cycle
      setTimeout(() => console.error('Error applying transforms:', error), 0);
    }
  }, [selectedMesh, configurator, isInitialized]);

  if (!selectedMesh) {
    return (
      <div className="p-4 bg-gray-800 text-white h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Transform Controls</h3>
        <div className="text-center py-8 flex-1 flex flex-col justify-center">
          <div className="text-6xl mb-4">📐</div>
          <p className="text-gray-400 mb-2">Select an object to transform</p>
          <p className="text-gray-500 text-sm">Move, rotate, and scale objects in the scene</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 text-white">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transform Controls</h3>
          {use3DGizmo && selectedMesh && (
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400">3D Gizmo Active</span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-400">
          Editing: <span className="text-green-400 font-medium">{selectedMesh.name || 'Unnamed Object'}</span>
        </p>
        {use3DGizmo && (
          <p className="text-xs text-blue-300 mt-1">
            💡 Use keyboard shortcuts or drag the 3D handles
          </p>
        )}
      </div>

      {/* Transform Mode Selector */}
      <div className="mb-4">
        <label className="block text-sm mb-2">Transform Mode</label>
        <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
          {[
            { key: 'translate', label: '📍 Move', icon: '📍' },
            { key: 'rotate', label: '🔄 Rotate', icon: '🔄' },
            { key: 'scale', label: '📏 Scale', icon: '📏' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                const newMode = key as 'translate' | 'rotate' | 'scale';
                setTransformMode(newMode);
                // Immediately update 3D gizmo mode if active
                if (sceneTransformControls && use3DGizmo && selectedMesh) {
                  sceneTransformControls.setMode(newMode);
                }
              }}
              className={`flex-1 py-2 px-3 text-xs rounded-md transition-colors ${
                transformMode === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced 3D Gizmo Controls */}
      <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={use3DGizmo}
              onChange={(e) => setUse3DGizmo(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">
              🎯 Professional 3D Gizmos
            </span>
          </label>
          {use3DGizmo && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Active</span>
            </div>
          )}
        </div>
        
        {use3DGizmo && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              Drag the colored handles in the 3D view to transform objects directly.
            </p>
            
            {/* Professional Keyboard Shortcuts */}
            <div className="text-xs text-gray-400 space-y-1 bg-gray-900 p-2 rounded">
              <div className="font-medium text-gray-300 mb-1">Keyboard Shortcuts:</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div><kbd className="bg-gray-700 px-1 rounded text-red-300">G</kbd> Grab/Move</div>
                <div><kbd className="bg-gray-700 px-1 rounded text-green-300">R</kbd> Rotate</div>
                <div><kbd className="bg-gray-700 px-1 rounded text-blue-300">S</kbd> Scale</div>
                <div><kbd className="bg-gray-700 px-1 rounded text-purple-300">Tab</kbd> Local/World</div>
                <div><kbd className="bg-gray-700 px-1 rounded text-yellow-300">X</kbd> X-Axis</div>
                <div><kbd className="bg-gray-700 px-1 rounded text-yellow-300">Y</kbd> Y-Axis</div>
                <div><kbd className="bg-gray-700 px-1 rounded text-yellow-300">Z</kbd> Z-Axis</div>
                <div><kbd className="bg-gray-700 px-1 rounded text-gray-300">Esc</kbd> Cancel</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                💡 Hold <kbd className="bg-gray-700 px-1 rounded">Shift</kbd> + axis key for plane constraints
              </div>
            </div>
            
            {/* Transform Space Controls */}
            <div className="flex space-x-2">
              <button
                onClick={() => sceneTransformControls?.setSpace('world')}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  sceneTransformControls?.getTransformState().space === 'world'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                title="Transform in world coordinates"
              >
                🌍 World Space
              </button>
              <button
                onClick={() => sceneTransformControls?.setSpace('local')}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  sceneTransformControls?.getTransformState().space === 'local'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                title="Transform in local coordinates"
              >
                📍 Local Space
              </button>
            </div>

            {/* Gizmo Size Control */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Gizmo Size: {sceneTransformControls?.getTransformState().size.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.3"
                max="3.0"
                step="0.1"
                value={sceneTransformControls?.getTransformState().size || 1.0}
                onChange={(e) => {
                  const newSize = parseFloat(e.target.value);
                  sceneTransformControls?.setSize(newSize);
                }}
                className="w-full"
                title="Adjust gizmo handle size"
              />
            </div>

            {/* Current State Display */}
            {sceneTransformControls?.getTransformState().isDragging && (
              <div className="bg-yellow-900/20 border border-yellow-600 rounded p-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-yellow-400 font-medium">
                    Transforming - Press <kbd className="bg-gray-700 px-1 rounded">Enter</kbd> to confirm or <kbd className="bg-gray-700 px-1 rounded">Esc</kbd> to cancel
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!use3DGizmo && (
          <p className="text-xs text-gray-400">
            Enable to access professional 3D manipulation tools with keyboard shortcuts and visual feedback like Blender or Maya.
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-4 space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={resetTransform}
            className="btn btn-secondary flex-1"
            title="Reset all transforms to default"
          >
            🔄 Reset
          </button>
          <button
            onClick={duplicateMesh}
            className="btn btn-secondary flex-1"
            title="Duplicate selected object"
          >
            📋 Duplicate
          </button>
        </div>
        <button
          onClick={applyTransforms}
          className="btn btn-warning w-full"
          title="Apply Transform - Bakes transforms into geometry vertices while resetting object transform to identity (like Blender's Apply Transform)"
        >
          ⚡ Apply Transform
        </button>
      </div>

      {/* Position Controls */}
      {transformMode === 'translate' && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Position</h4>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis}>
              <label className="block text-sm mb-1 flex justify-between">
                <span>{axis.toUpperCase()}: {position[axis].toFixed(2)}</span>
                <span className="text-xs text-gray-400">
                  {axis === 'x' ? 'Left ↔ Right' : axis === 'y' ? 'Down ↔ Up' : 'Back ↔ Forward'}
                </span>
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={position[axis]}
                onChange={(e) => updatePosition(axis, parseFloat(e.target.value))}
                className="w-full input-range"
              />
              <input
                type="number"
                value={position[axis].toFixed(2)}
                onChange={(e) => updatePosition(axis, parseFloat(e.target.value) || 0)}
                className="mt-1 w-full input text-xs"
                step="0.1"
              />
            </div>
          ))}
        </div>
      )}

      {/* Rotation Controls */}
      {transformMode === 'rotate' && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Rotation (Degrees)</h4>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis}>
              <label className="block text-sm mb-1 flex justify-between">
                <span>{axis.toUpperCase()}: {rotation[axis].toFixed(1)}°</span>
                <span className="text-xs text-gray-400">
                  {axis === 'x' ? 'Pitch' : axis === 'y' ? 'Yaw' : 'Roll'}
                </span>
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={rotation[axis]}
                onChange={(e) => updateRotation(axis, parseFloat(e.target.value))}
                className="w-full input-range"
              />
              <input
                type="number"
                value={rotation[axis].toFixed(1)}
                onChange={(e) => updateRotation(axis, parseFloat(e.target.value) || 0)}
                className="mt-1 w-full input text-xs"
                step="1"
                min="-180"
                max="180"
              />
            </div>
          ))}
        </div>
      )}

      {/* Scale Controls */}
      {transformMode === 'scale' && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Scale</h4>
          <div className="mb-2">
            <button
              onClick={() => {
                const uniformScale = (scale.x + scale.y + scale.z) / 3;
                updateScale('x', uniformScale);
                updateScale('y', uniformScale);
                updateScale('z', uniformScale);
              }}
              className="btn btn-secondary w-full text-xs"
            >
              🔗 Lock Proportions
            </button>
          </div>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis}>
              <label className="block text-sm mb-1 flex justify-between">
                <span>{axis.toUpperCase()}: {scale[axis].toFixed(2)}</span>
                <span className="text-xs text-gray-400">
                  {axis === 'x' ? 'Width' : axis === 'y' ? 'Height' : 'Depth'}
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={scale[axis]}
                onChange={(e) => updateScale(axis, parseFloat(e.target.value))}
                className="w-full input-range"
              />
              <input
                type="number"
                value={scale[axis].toFixed(2)}
                onChange={(e) => updateScale(axis, Math.max(0.01, parseFloat(e.target.value) || 1))}
                className="mt-1 w-full input text-xs"
                step="0.1"
                min="0.01"
              />
            </div>
          ))}
        </div>
      )}

      {/* Professional Tips and Help */}
      <div className="mt-6 p-3 bg-gray-900 rounded-lg">
        <h5 className="text-sm font-medium mb-2">💡 Professional Tips</h5>
        <div className="text-xs text-gray-400 space-y-1">
          <div>• Use sliders for precise numerical control</div>
          <div>• Enable 3D Gizmos for direct manipulation</div>
          <div>• Keyboard shortcuts work like Blender/Maya</div>
          <div>• Hold Shift with axis keys for plane constraints</div>
          <div>• Tab switches between World/Local space</div>
          <div>• Esc cancels active transformations</div>
          <div>• Reset button restores original transform</div>
          <div>• Duplicate creates a copy of the object</div>
        </div>
      </div>
    </div>
  );
};
