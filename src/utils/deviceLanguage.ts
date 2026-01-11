/**
 * Device language detection utility
 * Centralizes device language extraction and normalization
 */

import { getLanguage } from 'react-native-localization-settings';
import { logger } from './logger';

/**
 * Gets the device's language code, normalized to 2-letter ISO code
 * Handles locale strings like 'en-US', 'zh-CN', etc. and extracts base language
 * @returns Normalized 2-letter language code (e.g., 'en', 'zh', 'ar')
 */
export const getDeviceLanguage = (): string => {
  try {
    const deviceLocale = getLanguage();

    // Extract base language code before hyphen (e.g., 'en-US' -> 'en')
    const languageCode = deviceLocale.split('-')[0].toLowerCase();

    logger.debug('Device language detected:', { deviceLocale, languageCode });

    return languageCode;
  } catch (error) {
    logger.error('Error detecting device language:', error);
    // Fallback to English if detection fails
    return 'en';
  }
};

/**
 * Gets the full device locale string (e.g., 'en-US', 'zh-CN')
 * @returns Full locale string
 */
export const getDeviceLocale = (): string => {
  try {
    return getLanguage();
  } catch (error) {
    logger.error('Error getting device locale:', error);
    return 'en-US';
  }
};

/**
 * Checks if device language matches a specific language code
 * @param languageCode Language code to check (e.g., 'en', 'ar')
 * @returns True if device language matches
 */
export const isDeviceLanguage = (languageCode: string): boolean => {
  const deviceLang = getDeviceLanguage();
  return deviceLang === languageCode.toLowerCase();
};
