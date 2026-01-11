import { useQuery } from '@tanstack/react-query';
import { fetchForecast } from '../utils/fetchWeather';
import { i18n } from '../localization/i18n';
import { logger } from '../utils/logger';
import type { SavedLocation } from '../store/useLocationStore';

/**
 * Custom hook to manage weather forecast data fetching with React Query
 * @param activeLocation - The currently active location
 * @param fetchedLocaleSuccessfully - Whether locale data has been fetched
 * @returns React Query result with forecast data and query state
 */
export function useForecastQuery(
  activeLocation: SavedLocation | undefined,
  fetchedLocaleSuccessfully: boolean
) {
  return useQuery({
    queryKey: ['forecast', i18n.locale, activeLocation?.id],
    queryFn: async () => {
      logger.debug('Fetching forecast for:', {
        locale: i18n.locale,
        lat: activeLocation?.latitude,
        lon: activeLocation?.longitude,
        locationId: activeLocation?.id,
      });
      const result = await fetchForecast(
        i18n.locale,
        activeLocation?.latitude || 0,
        activeLocation?.longitude || 0
      );
      logger.debug('Forecast fetched:', !!result);
      return result;
    },
    enabled: !!activeLocation && fetchedLocaleSuccessfully,
    placeholderData: (previousData) => previousData, // Keeps old data visible during location switch
    staleTime: 1000 * 60 * 30, // 30 minutes - data is considered fresh for this long
    gcTime: 1000 * 60 * 60, // 1 hour - keep unused data in cache for this long
    retry: 1, // Only retry once instead of 3 times (faster error display)
  });
}
