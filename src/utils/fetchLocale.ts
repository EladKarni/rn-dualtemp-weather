import { uses24HourClock } from "react-native-localize";
import { useLanguageStore } from "../store/useLanguageStore";
import { logger } from "./logger";
import moment from "moment";
import { i18n } from "../localization/i18n";

/**
 * Fetches current locale settings
 * NOTE: Actual locale setting is handled by useLanguageStore
 * This function just returns the current state for React Query
 */
export const fetchLocale = () => {
  try {
    const clockStyle = uses24HourClock() ? "HH:mm" : "h:mm a";
    const store = useLanguageStore.getState();

    // Ensure locale is initialized
    if (!store.isInitialized) {
      logger.warn('fetchLocale called before store initialization, initializing now');
      store.initializeLocale();
    }

    logger.debug('fetchLocale returning current state:', {
      locale: store.currentLocale,
      momentLocale: store.momentLocale,
      i18nLocale: i18n.locale,
      momentGlobalLocale: moment.locale(),
    });

    return {
      success: true,
      locale: store.currentLocale,
      momentLocale: store.momentLocale,
      clockStyle
    };
  } catch (error) {
    logger.error('Error in fetchLocale:', error);
    return {
      success: false,
      locale: 'en',
      momentLocale: 'en',
      clockStyle: uses24HourClock() ? "HH:mm" : "h:mm a"
    };
  }
};

/**
 * Creates a moment object for the current date
 * Uses the global moment locale set by useLanguageStore
 */
export const createCurrentDate = () => {
  try {
    // The global moment locale is set by useLanguageStore.applyLocale()
    // Just create a new moment instance which will use the global locale
    const date = moment();

    // Validate that the moment object has the required methods
    if (typeof date.format !== 'function') {
      throw new Error('Moment object is missing format method');
    }

    logger.debug('Created date with locale:', {
      momentLocale: moment.locale(),
      i18nLocale: i18n.locale,
      formatted: date.format('MMMM D, YYYY')
    });

    return date;
  } catch (error) {
    logger.error('Error creating current date:', error);
    // Fallback to a basic moment object
    return moment();
  }
};
