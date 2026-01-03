import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLanguage } from "react-native-localization-settings";
import moment from "moment";
import "moment/locale/he";
import "moment/locale/es";
import "moment/locale/ar";
import "moment/locale/fr";
import "moment/locale/zh-cn";
import { i18n, translations } from "../localization/i18n";
import { isRTLLanguage, getTextDirection } from "../utils/rtlDetection";
import { logger } from "../utils/logger";

// CRITICAL: Reset moment to English after importing locales
// Some locale files (especially zh-cn) set themselves as the default global locale on import
moment.locale('en');

interface LanguageState {
  selectedLanguage: string | null; // null = auto-detect
  currentLocale: string; // The actual active locale (en, es, fr, etc.)
  momentLocale: string; // The moment locale (en, es, fr, zh-cn, etc.)
  isRTL: boolean; // Whether current locale is RTL
  textDirection: 'rtl' | 'ltr'; // Text direction for styling
  isInitialized: boolean; // Whether locale has been initialized
  setLanguage: (language: string | null) => void;
  initializeLocale: () => void;
  applyLocale: (locale: string) => void;
}

/**
 * Centralized locale management store
 * Single source of truth for language/locale state
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      selectedLanguage: null, // Default to auto-detect
      currentLocale: 'en',
      momentLocale: 'en',
      isRTL: false,
      textDirection: 'ltr',
      isInitialized: false,

      /**
       * Initialize locale on app startup
       * Determines locale from selectedLanguage or device language
       */
      initializeLocale: () => {
        try {
          const state = get();
          const deviceLanguage = getLanguage().split("-")[0];
          const userLocale = state.selectedLanguage || deviceLanguage;
          const locale = translations[userLocale] ? userLocale : "en";

          logger.info('Initializing locale:', {
            selectedLanguage: state.selectedLanguage,
            deviceLanguage,
            resolvedLocale: locale,
          });

          // Apply the locale
          get().applyLocale(locale);

          set({ isInitialized: true });
        } catch (error) {
          logger.error('Error initializing locale:', error);
          get().applyLocale('en');
          set({ isInitialized: true });
        }
      },

      /**
       * Apply a locale to i18n and moment
       * This is the single source of truth for setting locales
       */
      applyLocale: (locale: string) => {
        try {
          const momentLocale = locale === "zh" ? "zh-cn" : locale;

          // CRITICAL: Reset moment locale first to prevent carryover
          moment.locale('en');

          // Set both i18n and moment locales atomically
          i18n.locale = locale;
          moment.locale(momentLocale);

          // Determine RTL state
          const isRTL = isRTLLanguage(locale);
          const textDirection = getTextDirection(locale);

          // Verify locales were set correctly
          const i18nLocaleSet = i18n.locale === locale;
          const momentLocaleSet = moment.locale() === momentLocale;

          if (!i18nLocaleSet || !momentLocaleSet) {
            logger.error('Locale synchronization failed:', {
              requested: { i18n: locale, moment: momentLocale },
              actual: { i18n: i18n.locale, moment: moment.locale() }
            });
            throw new Error('Locale synchronization failed');
          }

          logger.info('Locale applied successfully:', {
            i18n: i18n.locale,
            moment: moment.locale(),
            isRTL,
            textDirection,
          });

          // Update store state with RTL info
          set({
            currentLocale: locale,
            momentLocale: momentLocale,
            isRTL,
            textDirection,
          });
        } catch (error) {
          logger.error('Error applying locale:', error);
          // Fallback to English
          i18n.locale = 'en';
          moment.locale('en');
          set({
            currentLocale: 'en',
            momentLocale: 'en',
            isRTL: false,
            textDirection: 'ltr',
          });
        }
      },

      /**
       * Change the user's selected language
       * Updates preference and applies new locale
       */
      setLanguage: (language: string | null) => {
        const previousLanguage = get().selectedLanguage;

        logger.info('Language changing:', {
          from: previousLanguage,
          to: language
        });

        // Update selected language preference
        set({ selectedLanguage: language });

        // Determine and apply the new locale
        const deviceLanguage = getLanguage().split("-")[0];
        const userLocale = language || deviceLanguage;
        const locale = translations[userLocale] ? userLocale : "en";

        // Apply locale immediately (synchronous)
        get().applyLocale(locale);
      },
    }),
    {
      name: "@selected_language",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          logger.debug('Language store rehydrated:', {
            selectedLanguage: state.selectedLanguage
          });
          // Initialize locale after rehydration
          state.initializeLocale();
        }
      },
    }
  )
);
