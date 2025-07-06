/**
 * Safe logging utility that never interferes with React Fast Refresh
 */

export interface SafeLogger {
  log: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

class SafeDevelopmentLogger implements SafeLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  log(message: string, ...args: any[]): void {
    // Never log during development to avoid Fast Refresh issues
    if (!this.isDevelopment) {
      console.log(message, ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    // Never log during development to avoid Fast Refresh issues  
    if (!this.isDevelopment) {
      console.warn(message, ...args);
    }
  }
  
  error(message: string, ...args: any[]): void {
    // Always show errors, but only in production for non-critical ones
    console.error(message, ...args);
  }
  
  debug(message: string, ...args: any[]): void {
    // Never log during development
    if (!this.isDevelopment) {
      console.debug(message, ...args);
    }
  }
}

export const safeLogger = new SafeDevelopmentLogger();

/**
 * Use this for any logging that might be triggered during React render cycles
 * or during frequently called operations like mesh selection
 */
export const safeProdLog = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'development') {
    console.log(...args);
  }
};

export const safeProdWarn = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn(...args);
  }
};
