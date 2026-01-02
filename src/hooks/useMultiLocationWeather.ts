import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchForecast } from '../utils/fetchWeather';
import { i18n } from '../localization/i18n';
import { logger } from '../utils/logger';
import type { SavedLocation } from '../store/useLocationStore';
import type { Weather } from '../types/WeatherTypes';
import { useMemo } from 'react';

export interface LocationWeatherState {
  hasCurrentWeather: boolean;
  hasFullForecast: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

/**
 * Custom hook to manage weather forecast data fetching for multiple locations
 *
 * Strategy:
 * 1. Fetch active location FIRST with high priority
 * 2. Pre-fetch all other locations in background after active loads
 * 3. Track which locations have full forecast data loaded
 *
 * @param savedLocations - All saved locations
 * @param activeLocationId - Currently active location ID
 * @param fetchedLocaleSuccessfully - Whether locale data has been fetched
 * @returns Active weather data, query state, and loading states per location
 */
export function useMultiLocationWeather(
  savedLocations: SavedLocation[],
  activeLocationId: string | null,
  fetchedLocaleSuccessfully: boolean
) {
  const activeLocation = savedLocations.find(loc => loc.id === activeLocationId);

  // Active location: fetch with high priority
  const activeQuery = useQuery({
    queryKey: ['forecast', i18n.locale, activeLocation?.id],
    queryFn: async () => {
      logger.debug('Fetching forecast for active location:', {
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
      logger.debug('Active forecast fetched:', !!result);
      return result;
    },
    enabled: !!activeLocation && fetchedLocaleSuccessfully,
    placeholderData: (previousData) => previousData, // Keeps old data visible during location switch
    staleTime: 1000 * 60 * 30, // 30 minutes - data is considered fresh for this long
    gcTime: 1000 * 60 * 60, // 1 hour - keep unused data in cache for this long
    retry: 1, // Only retry once instead of 3 times (faster error display)
  });

  // Background pre-fetch: all other locations (lower priority)
  // Only start pre-fetching after active location succeeds
  const otherLocations = savedLocations.filter(loc => loc.id !== activeLocationId);

  const prefetchQueries = useQueries({
    queries: otherLocations.map(location => ({
      queryKey: ['forecast', i18n.locale, location.id],
      queryFn: async () => {
        logger.debug('Pre-fetching forecast for:', {
          locale: i18n.locale,
          lat: location.latitude,
          lon: location.longitude,
          locationId: location.id,
        });
        const result = await fetchForecast(
          i18n.locale,
          location.latitude,
          location.longitude
        );
        logger.debug('Pre-fetched forecast:', location.name, !!result);
        return result;
      },
      enabled: !!activeLocation && fetchedLocaleSuccessfully && activeQuery.isSuccess,
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 1,
      // Lower priority settings to avoid blocking active location
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })),
  });

  // Track loading states per location
  const locationLoadingStates = useMemo(() => {
    const states = new Map<string, LocationWeatherState>();

    savedLocations.forEach((loc) => {
      if (loc.id === activeLocationId) {
        // Active location state
        states.set(loc.id, {
          hasCurrentWeather: !!activeQuery.data?.current,
          hasFullForecast: !!activeQuery.data,
          isLoading: activeQuery.isLoading,
          isFetching: activeQuery.isFetching,
          error: activeQuery.error as Error | null,
        });
      } else {
        // Pre-fetched location state
        const prefetchIndex = otherLocations.findIndex(l => l.id === loc.id);
        const query = prefetchQueries[prefetchIndex];

        states.set(loc.id, {
          hasCurrentWeather: !!query?.data?.current,
          hasFullForecast: !!query?.data,
          isLoading: query?.isLoading || false,
          isFetching: query?.isFetching || false,
          error: query?.error as Error | null || null,
        });
      }
    });

    return states;
  }, [savedLocations, activeLocationId, activeQuery, prefetchQueries, otherLocations]);

  // Get weather data for a specific location
  const getLocationWeather = useMemo(() => {
    return (locationId: string): Weather | undefined => {
      if (locationId === activeLocationId) {
        return activeQuery.data;
      }

      const prefetchIndex = otherLocations.findIndex(l => l.id === locationId);
      if (prefetchIndex >= 0) {
        return prefetchQueries[prefetchIndex]?.data;
      }

      return undefined;
    };
  }, [activeLocationId, activeQuery.data, otherLocations, prefetchQueries]);

  return {
    // Active location data (for backwards compatibility with existing code)
    activeWeather: activeQuery.data,
    isFetched: activeQuery.isFetched,
    isFetching: activeQuery.isFetching,
    refetch: activeQuery.refetch,
    error: activeQuery.error,
    isError: activeQuery.isError,

    // Multi-location state
    locationLoadingStates,
    getLocationWeather,
    allLocationsLoaded: prefetchQueries.every(q => q.isSuccess),

    // For debugging
    activeQuery,
    prefetchQueries,
  };
}
