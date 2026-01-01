/**
 * Custom logger that only outputs in development mode.
 * Use this instead of console.log for debugging.
 */

const PREFIX = '[RN-Weather]';

export const logger = {
  /**
   * Debug-level logging (only in dev)
   * Use for verbose debugging info
   */
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.log(PREFIX, '[DEBUG]', ...args);
    }
  },

  /**
   * Info-level logging (only in dev)
   * Use for general information
   */
  info: (...args: any[]) => {
    if (__DEV__) {
      console.info(PREFIX, '[INFO]', ...args);
    }
  },

  /**
   * Warning-level logging (always shown)
   * Use for recoverable issues
   */
  warn: (...args: any[]) => {
    console.warn(PREFIX, '[WARN]', ...args);
  },

  /**
   * Error-level logging (always shown)
   * Use for exceptions and failures
   */
  error: (...args: any[]) => {
    console.error(PREFIX, '[ERROR]', ...args);
  },

  /**
   * Trace function execution (only in dev)
   * Useful for tracking function calls
   */
  trace: (functionName: string, ...args: any[]) => {
    if (__DEV__) {
      console.log(PREFIX, `[TRACE] ${functionName}`, ...args);
    }
  },

  /**
   * Group logs together (only in dev)
   */
  group: (label: string) => {
    if (__DEV__) {
      console.group(PREFIX, label);
    }
  },

  groupEnd: () => {
    if (__DEV__) {
      console.groupEnd();
    }
  },
};

// Export individual functions for convenience
export const { debug, info, warn, error, trace } = logger;
