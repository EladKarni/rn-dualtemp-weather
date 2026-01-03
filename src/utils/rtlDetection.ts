import { logger } from './logger';

/**
 * RTL (Right-to-Left) language detection utility
 * Determines text direction based on language code
 */

// List of RTL languages supported by the app
const RTL_LANGUAGES = [
  'ar', // Arabic
  'he', // Hebrew
  'fa', // Persian (Farsi)
  'ur', // Urdu
  'ku', // Kurdish
  'ps', // Pashto
  'sd', // Sindhi
  'yi', // Yiddish
];

/**
 * Checks if a language code represents an RTL language
 * @param languageCode - ISO language code (e.g., 'he', 'ar')
 * @returns true if the language is RTL, false otherwise
 */
export const isRTLLanguage = (languageCode: string): boolean => {
  if (!languageCode) {
    return false;
  }
  
  // Normalize the language code (handle cases like 'he-IL', 'ar-SA')
  const normalizedCode = languageCode.split('-')[0].toLowerCase();
  const isRTL = RTL_LANGUAGES.includes(normalizedCode);
  
  logger.debug('RTL language check:', {
    languageCode,
    normalizedCode,
    isRTL
  });
  
  return isRTL;
};

/**
 * Gets the text direction for a given language
 * @param languageCode - ISO language code
 * @returns 'rtl' for RTL languages, 'ltr' for LTR languages
 */
export const getTextDirection = (languageCode: string): 'rtl' | 'ltr' => {
  return isRTLLanguage(languageCode) ? 'rtl' : 'ltr';
};

/**
 * Checks if the current device locale is RTL
 * Useful for auto-detection scenarios
 */
export const isDeviceLocaleRTL = (): boolean => {
  try {
    const locale = require('expo-localization').getLocales()[0];
    const languageCode = locale.languageCode || locale.language;
    return isRTLLanguage(languageCode);
  } catch (error) {
    logger.error('Error detecting device locale RTL:', error);
    return false;
  }
};

/**
 * Gets the current text direction based on device settings
 * @returns 'rtl' or 'ltr' based on device locale
 */
export const getDeviceTextDirection = (): 'rtl' | 'ltr' => {
  return isDeviceLocaleRTL() ? 'rtl' : 'ltr';
};

/**
 * Validates RTL detection by comparing with expo-localization
 * Useful for debugging and verification
 */
export const validateRTLDetection = (languageCode: string): {
  detected: boolean;
  deviceLocale: string;
  deviceDirection: string;
  appDirection: string;
  isConsistent: boolean;
} => {
  try {
    const deviceLocale = require('expo-localization').getLocales()[0];
    const deviceLanguageCode = deviceLocale.languageCode || deviceLocale.language;
    const deviceDirection = deviceLocale.textDirection;
    const appDirection = getTextDirection(languageCode);
    
    const isConsistent = deviceDirection === appDirection;
    
    const result = {
      detected: isRTLLanguage(languageCode),
      deviceLocale: deviceLanguageCode,
      deviceDirection,
      appDirection,
      isConsistent
    };
    
    if (!isConsistent) {
      logger.warn('RTL detection inconsistency detected:', result);
    } else {
      logger.debug('RTL detection validation passed:', result);
    }
    
    return result;
  } catch (error) {
    logger.error('Error validating RTL detection:', error);
    return {
      detected: isRTLLanguage(languageCode),
      deviceLocale: 'unknown',
      deviceDirection: 'ltr',
      appDirection: getTextDirection(languageCode),
      isConsistent: false
    };
  }
};