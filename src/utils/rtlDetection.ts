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