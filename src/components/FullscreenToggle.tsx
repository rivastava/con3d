import React, { useEffect } from 'react';

interface FullscreenToggleProps {
  isFullscreen: boolean;
  onToggle: () => void;
}

export const FullscreenToggle: React.FC<FullscreenToggleProps> = ({ 
  isFullscreen, 
  onToggle 
}) => {
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Check current fullscreen state
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      // If the browser fullscreen state doesn't match our component state, sync it
      if (isCurrentlyFullscreen !== isFullscreen) {
        onToggle();
      }
    };

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullscreen, onToggle]);

  const handleToggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
        // Don't call onToggle here - let the event listener handle it
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        // Don't call onToggle here - let the event listener handle it
      }
    } catch (error) {
      console.warn('Fullscreen operation failed:', error);
      // Only toggle if fullscreen API failed completely
      onToggle();
    }
  };

  return (
    <button
      onClick={handleToggleFullscreen}
      className="absolute bottom-4 right-4 z-50 px-3 py-2 bg-gray-900 bg-opacity-80 hover:bg-opacity-100 text-white rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200 backdrop-blur-sm"
      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">
          {isFullscreen ? '🔲' : '⛶'}
        </span>
        <span className="text-sm font-medium">
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </span>
      </div>
    </button>
  );
};
