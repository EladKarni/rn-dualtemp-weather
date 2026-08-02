/**
 * Device language detection utility
 * Centralizes device language extraction and normalization
 */

import { getLocales } from 'expo-localization';
import { logger } from './logger';

/**
 * Gets the device's language code, normalized to 2-letter ISO code
 * expo-localization already exposes the base language code (e.g. 'en' from
 * 'en-US') via getLocales()[0].languageCode, and works on web and native alike.
 * @returns Normalized 2-letter language code (e.g., 'en', 'zh', 'ar')
 */
export const getDeviceLanguage = (): string => {
  try {
    const languageCode = (getLocales()[0]?.languageCode ?? 'en').toLowerCase();

    logger.debug('Device language detected:', { languageCode });

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
    return getLocales()[0]?.languageTag ?? 'en-US';
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
