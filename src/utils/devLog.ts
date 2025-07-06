// Development-safe logging utility that doesn't interfere with Fast Refresh
export const devLog = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      // Use a timeout to avoid interfering with React's render cycle
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log(...args);
      }, 0);
    }
  },
  
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.warn(...args);
      }, 0);
    }
  },
  
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.error(...args);
      }, 0);
    }
  }
};
