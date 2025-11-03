/**
 * Production-safe logger that only logs in development
 * Provides typed logging methods that are stripped in production builds
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // In production, errors should be sent to error tracking service
    // This is handled by ErrorBoundary for React errors
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

/**
 * Log errors to external service in production
 * This can be extended to integrate with Sentry, LogRocket, etc.
 */
export function logErrorToService(error: Error, errorInfo?: Record<string, unknown>) {
  // In production, send to error tracking service
  if (!isDevelopment) {
    // TODO: Integrate with error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }
}
