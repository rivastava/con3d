import React from 'react';
import { Con3DConfigurator } from '@/core/Con3DConfigurator';

interface ToolbarProps {
  configurator?: Con3DConfigurator;
}

export const Toolbar: React.FC<ToolbarProps> = ({ configurator }) => {
  const handleExportImage = () => {
    if (configurator) {
      const dataUrl = configurator.takeScreenshot();
      const link = document.createElement('a');
      link.download = 'con3d-export.png';
      link.href = dataUrl;
      link.click();
    }
  };

  const handleExportGLTF = async () => {
    if (configurator) {
      try {
        const buffer = await configurator.scene.exportGLTF();
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'con3d-export.glb';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Export failed:', error);
      }
    }
  };

  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold text-white">Con3D Material Configurator</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={handleExportImage}
          disabled={!configurator}
          className="btn btn-secondary"
        >
          Export Image
        </button>
        <button
          onClick={handleExportGLTF}
          disabled={!configurator}
          className="btn btn-primary"
        >
          Export GLTF
        </button>
      </div>
    </div>
  );
};
