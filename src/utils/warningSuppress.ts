/**
 * Utility to suppress specific browser warnings that don't affect functionality
 * but can clutter the development console
 */

let originalConsoleWarn: typeof console.warn | null = null;

export function suppressPassiveEventWarnings(): void {
  if (process.env.NODE_ENV !== 'development') {
    return; // Only suppress in development
  }
  
  if (originalConsoleWarn) {
    return; // Already suppressed
  }
  
  originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0];
    
    // Suppress specific known warnings that don't affect functionality
    if (typeof message === 'string' && (
      message.includes('Added non-passive event listener') ||
      message.includes('scroll-blocking') ||
      message.includes('passive event listener to a scroll-blocking')
    )) {
      return; // Don't log these warnings
    }
    
    // Log all other warnings normally
    originalConsoleWarn!(...args);
  };
}

export function restoreConsoleWarnings(): void {
  if (originalConsoleWarn) {
    console.warn = originalConsoleWarn;
    originalConsoleWarn = null;
  }
}

/**
 * Use this to temporarily suppress passive event warnings during OrbitControls creation
 */
export function withSuppressedWarnings<T>(fn: () => T): T {
  suppressPassiveEventWarnings();
  try {
    return fn();
  } finally {
    restoreConsoleWarnings();
  }
}
