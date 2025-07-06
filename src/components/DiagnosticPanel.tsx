import React from 'react';

interface DiagnosticPanelProps {
  className?: string;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = () => {
  // Always return null to completely hide the diagnostic panel
  return null;
};
