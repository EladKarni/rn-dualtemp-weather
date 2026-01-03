import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLocale, createCurrentDate } from '../utils/fetchLocale';
import { useLanguageStore } from '../store/useLanguageStore';
import { logger } from '../utils/logger';
import type { Moment } from 'moment';

interface LocaleQueryResult {
  fetchedLocaleSuccessfully: boolean;
  localeData: { locale: string } | undefined;
  localeError: Error | null;
  isLocaleLoading: boolean;
  date: Moment;
}

/**
 * Custom hook to manage locale query and date creation
 *
 * NOTE: The actual locale setting is handled by useLanguageStore
 * This hook just tracks the state for React Query compatibility
 * and creates date objects when locale changes
 *
 * @returns Locale query state and current date moment object
 */
export const useLocaleQuery = (): LocaleQueryResult => {
  // Subscribe to store changes to trigger re-renders
  const currentLocale = useLanguageStore((state) => state.currentLocale);
  const isInitialized = useLanguageStore((state) => state.isInitialized);

  const {
    isSuccess: fetchedLocaleSuccessfully,
    data: localeData,
    error: localeError,
    isLoading: isLocaleLoading
  } = useQuery({
    queryKey: ['locale', currentLocale],
    queryFn: fetchLocale,
    retry: 2,
    staleTime: 0, // Always refetch to ensure locale sync
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: isInitialized, // Wait for store to initialize
  });

  // Create a fresh moment object for the current date
  // Re-create whenever locale changes to ensure the moment object uses the correct global locale
  const date = React.useMemo(
    () => {
      logger.debug('useLocaleQuery: Creating new date object', {
        currentLocale,
        localeDataLocale: localeData?.locale,
        isInitialized,
      });
      return createCurrentDate();
    },
    [currentLocale, localeData?.locale, isInitialized]
  );

  // Log locale initialization for debugging
  React.useEffect(() => {
    if (localeData) {
      logger.info('Locale query completed:', localeData);
    }
    if (localeError) {
      logger.error('Locale query error:', localeError);
    }
  }, [localeData, localeError]);

  return {
    fetchedLocaleSuccessfully,
    localeData,
    localeError,
    isLocaleLoading,
    date,
  };
};
