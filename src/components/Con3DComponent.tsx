import React, { useEffect, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import * as THREE from 'three';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';
import { Con3DConfig } from '@/types';
import { store } from '@/store';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { ErrorBoundary } from './ErrorBoundary';
import '@/styles/globals.css';

interface Con3DComponentProps extends Con3DConfig {
  className?: string;
  onReady?: (configurator: Con3DConfigurator) => void;
  onError?: (error: Error) => void;
}

export const Con3DComponent: React.FC<Con3DComponentProps> = ({
  apiKey,
  containerId,
  options,
  className = '',
  onReady,
  onError
}) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const configuratorRef = useRef<Con3DConfigurator>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Initialize configurator
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const initConfigurator = async () => {
      try {
        const log = (message: string) => {
          // Completely disable logging in development to avoid Fast Refresh issues
          if (process.env.NODE_ENV !== 'development') {
            console.log(message);
            setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
          }
        };
        
        log('Starting configurator initialization...');
        setIsLoading(true);
        setError(undefined);

        // Create a temporary container ID for the canvas
        const tempContainerId = `con3d-canvas-${Date.now()}`;
        canvasContainerRef.current!.id = tempContainerId;

        log(`Creating configurator with container ID: ${tempContainerId}`);

        // Create configurator
        const configurator = new Con3DConfigurator({
          apiKey,
          containerId: tempContainerId,
          options
        });

        log('Configurator created successfully');
        configuratorRef.current = configurator;

        // Setup event listeners
        configurator.events.on('ready', () => {
          log('Configurator ready event received');
          setIsLoading(false);
          onReady?.(configurator);
        });

        configurator.events.on('error', (error: any) => {
          log(`Configurator error event: ${error.message}`);
          setError((error as Error).message || 'Unknown error occurred');
          onError?.(error as Error);
        });

        // Manually trigger ready state after a short delay
        // since the configurator constructor should emit ready immediately
        setTimeout(() => {
          if (configuratorRef.current) {
            log('Manually setting configurator as ready');
            setIsLoading(false);
            onReady?.(configurator);
          }
        }, 2000);

        // Add keyboard event listener for F key focus functionality
        const handleKeyDown = (event: KeyboardEvent) => {
          if (!configuratorRef.current) return;
          
          // F key to focus on last selected object
          if (event.key === 'f' || event.key === 'F') {
            // Prevent default browser behavior
            event.preventDefault();
            
            try {
              const configurator = configuratorRef.current;
              const renderingEngine = configurator.getRenderingEngine();
              const selectedObjects = renderingEngine.scene.children.filter(child => 
                child.userData?.selected === true && 
                child.userData?.isSelectable !== false &&
                child.name !== 'shadowCatcher' &&
                !child.name.includes('TransformControl') &&
                !child.name.includes('_helper')
              );
              
              if (selectedObjects.length > 0) {
                // Focus on the last selected object
                const lastSelected = selectedObjects[selectedObjects.length - 1];
                log(`Focusing on selected object: ${lastSelected.name}`);
                configurator.focusCameraOnObject(lastSelected);
              } else {
                // If no object selected, focus on the entire scene
                log('No object selected, focusing on scene');
                const sceneObjects = renderingEngine.scene.children.filter(child => 
                  child.userData?.isSelectable !== false &&
                  child.name !== 'shadowCatcher' &&
                  !child.name.includes('TransformControl') &&
                  !child.name.includes('_helper') &&
                  child.type === 'Mesh'
                );
                
                if (sceneObjects.length > 0) {
                  // Create a group to encompass all scene objects for focusing
                  const tempGroup = new THREE.Group();
                  sceneObjects.forEach(obj => {
                    tempGroup.add(obj.clone());
                  });
                  configurator.focusCameraOnObject(tempGroup);
                }
              }
            } catch (error) {
              console.error('Error during F key focus:', error);
            }
          }
        };

        // Add event listener
        window.addEventListener('keydown', handleKeyDown);
        
        // Store cleanup function for the outer useEffect
        const keyboardCleanup = () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
        
        // Store cleanup on configurator ref for later use
        (configurator as any).keyboardCleanup = keyboardCleanup;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize configurator';
        console.error('Configurator initialization error:', err);
        setDebugInfo(prev => [...prev, `ERROR: ${errorMessage}`]);
        setError(errorMessage);
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    initConfigurator();

    // Cleanup
    return () => {
      if (configuratorRef.current) {
        configuratorRef.current.dispose();
      }
    };
  }, [apiKey, containerId, options, onReady, onError]);

  // Cleanup keyboard listener on unmount
  useEffect(() => {
    return () => {
      if (configuratorRef.current && (configuratorRef.current as any).keyboardCleanup) {
        (configuratorRef.current as any).keyboardCleanup();
      }
    };
  }, []);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    const fileName = file.name.toLowerCase();
    const supportedFormats = ['.glb', '.gltf', '.obj', '.fbx'];
    const isSupported = supportedFormats.some(format => fileName.endsWith(format));

    if (!isSupported) {
      setUploadStatus('❌ Unsupported file format. Please use GLB, GLTF, OBJ, or FBX files.');
      setTimeout(() => setUploadStatus(''), 3000);
      return;
    }

    if (!configuratorRef.current) {
      setUploadStatus('❌ Configurator not ready. Please wait and try again.');
      setTimeout(() => setUploadStatus(''), 3000);
      return;
    }

    try {
      setUploadStatus('📁 Loading model...');
      const url = URL.createObjectURL(file);
      
      // Clear existing scene before loading new model
      const scene = configuratorRef.current.getScene();
      const objectsToRemove = scene.children.filter(child => 
        child instanceof THREE.Mesh && child.name !== 'Ground Plane'
      );
      objectsToRemove.forEach(obj => scene.remove(obj));

      // Load the new model
      await configuratorRef.current.scene.load(url);
      
      // Auto-adjust camera for the new model
      configuratorRef.current.autoAdjustClipping();
      
      setUploadStatus('✅ Model loaded successfully!');
      setTimeout(() => setUploadStatus(''), 3000);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to load dropped file:', error);
      setUploadStatus('❌ Failed to load model. Please check the file format.');
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <div className={`con3d-container h-full w-full flex flex-col bg-gray-900 ${className}`}>
          {/* Header Toolbar */}
          <Toolbar configurator={configuratorRef.current} />

          <div className="flex flex-1 overflow-hidden">
            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col">
              {/* Canvas Container */}
              <div className="flex-1 relative bg-gray-800">
                {/* Drag overlay */}
                {dragActive && (
                  <div className="absolute inset-0 bg-blue-600 bg-opacity-20 border-4 border-dashed border-blue-400 z-50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">📁</div>
                      <h2 className="text-2xl font-bold mb-2">Drop 3D Model Here</h2>
                      <p className="text-lg">Supports GLB, GLTF, OBJ, FBX files</p>
                    </div>
                  </div>
                )}

                {/* Upload status notification */}
                {uploadStatus && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg border border-gray-600">
                    {uploadStatus}
                  </div>
                )}

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-10">
                    <div className="text-center max-w-md">
                      <div className="spinner mb-4"></div>
                      <p className="text-gray-300 mb-4">Loading 3D Configurator...</p>
                      <div className="text-left text-xs text-gray-400 max-h-32 overflow-y-auto">
                        {debugInfo.map((info, index) => (
                          <div key={index}>{info}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
                    <div className="text-center p-8">
                      <div className="text-red-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Configurator</h3>
                      <p className="text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                <div 
                  ref={canvasContainerRef}
                  className="canvas-container"
                  style={{ width: '100%', height: '100%' }}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              </div>

              {/* Status Bar */}
              <StatusBar configurator={configuratorRef.current} />
            </div>
          </div>
        </div>
      </Provider>
    </ErrorBoundary>
  );
};

// Export configurator for programmatic access
export { Con3DConfigurator };

// Default export
export default Con3DComponent;
