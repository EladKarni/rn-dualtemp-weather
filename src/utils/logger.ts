/**
 * Centralized logging system with Sentry integration
 * Handles both console logging and error reporting to Sentry
 *
 * Usage:
 * - logger.debug() - Development-only verbose logging
 * - logger.info() - Development-only informational logging
 * - logger.warn() - Warnings (always logged, sent to Sentry breadcrumbs)
 * - logger.error() - Errors (always logged, sent to Sentry as errors)
 * - logger.exception() - Exceptions (always logged, sent to Sentry with full context)
 */

import * as Sentry from "@sentry/react-native";

const PREFIX = '[RN-Weather]';

/**
 * Helper to format log arguments into a readable message
 */
const formatMessage = (args: any[]): string => {
  return args
    .map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
};

export const logger = {
  /**
   * Debug-level logging (only in dev)
   * Use for verbose debugging info
   * Does NOT send to Sentry
   */
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.log(PREFIX, '[DEBUG]', ...args);
    }
    // Add as breadcrumb in dev mode for debugging
    if (__DEV__) {
      Sentry.addBreadcrumb({
        category: 'debug',
        message: formatMessage(args),
        level: 'debug',
      });
    }
  },

  /**
   * Info-level logging (only in dev)
   * Use for general information
   * Adds breadcrumb to Sentry for context
   */
  info: (...args: any[]) => {
    if (__DEV__) {
      console.info(PREFIX, '[INFO]', ...args);
    }
    // Always add info breadcrumbs for context in error reports
    Sentry.addBreadcrumb({
      category: 'info',
      message: formatMessage(args),
      level: 'info',
    });
  },

  /**
   * Warning-level logging (always shown)
   * Use for recoverable issues
   * Sends to Sentry as warning-level breadcrumb
   */
  warn: (...args: any[]) => {
    console.warn(PREFIX, '[WARN]', ...args);

    // Add as breadcrumb with warning level
    Sentry.addBreadcrumb({
      category: 'warning',
      message: formatMessage(args),
      level: 'warning',
    });
  },

  /**
   * Error-level logging (always shown)
   * Use for exceptions and failures
   * Sends message to Sentry as error-level event
   */
  error: (...args: any[]) => {
    console.error(PREFIX, '[ERROR]', ...args);

    // Send as error message to Sentry
    const message = formatMessage(args);
    Sentry.captureMessage(message, {
      level: 'error',
      tags: {
        error_source: 'logger.error',
      },
    });
  },

  /**
   * Exception logging with full Sentry integration
   * Use for caught exceptions that should be reported
   *
   * @param error - The error object or message
   * @param context - Optional additional context (tags, extra data)
   *
   * @example
   * try {
   *   // risky operation
   * } catch (error) {
   *   logger.exception(error, {
   *     tags: { module: 'weather' },
   *     extra: { locationId: '123' }
   *   });
   * }
   */
  exception: (
    error: Error | string,
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, any>;
      level?: Sentry.SeverityLevel;
    }
  ) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    console.error(PREFIX, '[EXCEPTION]', errorObj);

    // Send to Sentry with full context
    Sentry.captureException(errorObj, {
      level: context?.level || 'error',
      tags: {
        error_source: 'logger.exception',
        ...context?.tags,
      },
      extra: context?.extra,
    });
  },

  /**
   * Trace function execution (only in dev)
   * Useful for tracking function calls
   */
  trace: (functionName: string, ...args: any[]) => {
    if (__DEV__) {
      console.log(PREFIX, `[TRACE] ${functionName}`, ...args);
    }
    // Add as breadcrumb for function call tracking
    Sentry.addBreadcrumb({
      category: 'trace',
      message: `${functionName} ${formatMessage(args)}`,
      level: 'debug',
    });
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

  /**
   * Set user context for Sentry error tracking
   * Call this when user identity is known
   *
   * @example
   * logger.setUser({ id: 'user123', email: 'user@example.com' });
   */
  setUser: (user: { id?: string; email?: string; username?: string } | null) => {
    Sentry.setUser(user);
  },

  /**
   * Add custom context to Sentry
   * Useful for adding app-specific data to error reports
   *
   * @example
   * logger.setContext('app_state', {
   *   selectedLocation: 'New York',
   *   tempScale: 'F'
   * });
   */
  setContext: (key: string, context: Record<string, any> | null) => {
    Sentry.setContext(key, context);
  },

  /**
   * Add a tag to all future Sentry events
   *
   * @example
   * logger.setTag('app_version', '1.2.0');
   */
  setTag: (key: string, value: string) => {
    Sentry.setTag(key, value);
  },
};

// Export individual functions for convenience
export const { debug, info, warn, error, exception, trace } = logger;
