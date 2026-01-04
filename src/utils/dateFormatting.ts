import moment from 'moment';
import { logger } from './logger';
import { uses24HourClock } from 'react-native-localize';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Safe date formatting utility that ensures locale synchronization
 * Prevents mixed language issues by using the correct moment locale
 */

/**
 * Core formatting function with proper error handling and meaningful fallbacks
 * @param timestamp Unix timestamp
 * @param format Moment format string
 * @param fallback Fallback string if formatting fails
 * @returns Formatted date string or fallback
 */
const safeMomentFormat = (
  timestamp: number,
  format: string,
  fallback: string = 'Invalid Date'
): string => {
  try {
    // Validate timestamp
    if (!timestamp || timestamp < 0) {
      logger.warn('Invalid timestamp provided:', timestamp);
      return fallback;
    }

    const formatted = moment.unix(timestamp).format(format);

    // Check if moment returned 'Invalid date'
    if (formatted === 'Invalid date') {
      logger.warn('Moment returned invalid date for timestamp:', timestamp);
      return fallback;
    }

    return formatted;
  } catch (error) {
    logger.error('Error formatting moment:', { timestamp, format, error });
    return fallback;
  }
};

/**
 * Helper function to get time format string based on clock format preference
 * @param clockFormat The clock format preference ("12hour", "24hour", or "auto")
 * @returns The appropriate moment format string
 */
const getTimeFormatString = (clockFormat?: "12hour" | "24hour" | "auto"): string => {
  switch (clockFormat) {
    case "12hour":
      return "h:mm A";
    case "24hour":
      return "HH:mm";
    case "auto":
    default:
      return uses24HourClock() ? "HH:mm" : "h:mm A";
  }
};

/**
 * Formats a day name (Monday, Tuesday, etc.) using the current locale
 */
export const formatDayName = (timestamp: number): string => {
  return safeMomentFormat(timestamp, 'dddd', 'Day');
};

/**
 * Formats a time in short format (e.g., "3:30 PM") using the current locale
 * @param timestamp Unix timestamp
 * @param clockFormat Optional clock format preference
 */
export const formatTime = (timestamp: number, clockFormat?: "12hour" | "24hour" | "auto"): string => {
  const format = getTimeFormatString(clockFormat);
  return safeMomentFormat(timestamp, format, '--:--').toUpperCase();
};

/**
 * Formats sunrise/sunset time using the current locale
 * @param timestamp Unix timestamp
 * @param clockFormat Optional clock format preference
 */
export const formatSunTime = (timestamp: number, clockFormat?: "12hour" | "24hour" | "auto"): string => {
  const format = getTimeFormatString(clockFormat);
  return safeMomentFormat(timestamp, format, '--:--');
};

/**
 * React hook for time formatting with reactive clock format updates
 * Automatically uses the current clock format preference from settings
 */
export const useTimeFormatting = () => {
  const clockFormat = useSettingsStore((state) => state.clockFormat);

  return {
    formatTime: (timestamp: number): string => {
      return formatTime(timestamp, clockFormat);
    },
    formatSunTime: (timestamp: number): string => {
      return formatSunTime(timestamp, clockFormat);
    }
  };
};

/**
 * Formats the current date in "Month Day, Year" format using the current locale
 * Uses moment's built-in LL format which automatically adapts to locale
 * @param momentDate Optional moment object, defaults to current date
 */
export const formatCurrentDate = (momentDate?: moment.Moment): string => {
  try {
    const date = momentDate || moment();

    // Use 'LL' format which automatically adapts to locale (e.g., "January 3, 2026" in English, "3 ינואר 2026" in Hebrew)
    const formatted = date.format('LL');

    logger.debug('Formatted current date:', {
      locale: moment.locale(),
      formatted,
    });

    return formatted;
  } catch (error) {
    logger.error('Error formatting current date:', error);
    return '';
  }
};

/**
 * Creates a moment object with current locale
 * Safely handles locale initialization
 */
export const createLocalizedMoment = (): moment.Moment => {
  try {
    return moment();
  } catch (error) {
    logger.error('Error creating localized moment:', error);
    // Return a valid moment object even if there's an error
    return moment();
  }
};

/**
 * Validates that moment locale matches expected locale
 * For debugging and verification purposes
 */
export const validateLocale = (expectedLocale: string): boolean => {
  try {
    const currentLocale = moment.locale();
    const expectedMomentLocale = expectedLocale === 'zh' ? 'zh-cn' : expectedLocale;
    const isValid = currentLocale === expectedMomentLocale;
    
    if (!isValid) {
      logger.warn('Locale mismatch detected:', {
        expected: expectedMomentLocale,
        actual: currentLocale
      });
    }
    
    return isValid;
  } catch (error) {
    logger.error('Error validating locale:', error);
    return false;
  }
};

/**
 * Comprehensive locale health check
 * Validates i18n and moment locales are in sync
 */
export const performLocaleHealthCheck = (i18nLocale: string): {
  isHealthy: boolean;
  i18nLocale: string;
  momentLocale: string;
  issues: string[];
} => {
  const issues: string[] = [];
  const momentLocale = moment.locale();
  
  // Check if i18n and moment locales match
  const expectedMomentLocale = i18nLocale === 'zh' ? 'zh-cn' : i18nLocale;
  if (momentLocale !== expectedMomentLocale) {
    issues.push(`Moment locale (${momentLocale}) doesn't match i18n locale (${i18nLocale})`);
  }
  
  // Check if moment is properly initialized
  try {
    moment().format('dddd'); // Test basic formatting
  } catch (error) {
    issues.push(`Moment formatting failed: ${error}`);
  }
  
  const isHealthy = issues.length === 0;
  
  if (!isHealthy) {
    logger.error('Locale health check failed:', {
      i18nLocale,
      momentLocale,
      expectedMomentLocale,
      issues
    });
  } else {
    logger.debug('Locale health check passed:', {
      i18nLocale,
      momentLocale
    });
  }
  
  return {
    isHealthy,
    i18nLocale,
    momentLocale,
    issues
  };
};