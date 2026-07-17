import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchForecast } from '../utils/fetchWeather';
import { i18n } from '../localization/i18n';
import { logger } from '../utils/logger';
import type { SavedLocation } from '../store/useLocationStore';
import type { Weather } from '../types/WeatherTypes';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useForecastStore, initializeForecastStore } from '../store/useForecastStore';

export interface LocationWeatherState {
  hasCurrentWeather: boolean;
  hasFullForecast: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

const EMPTY_LOCATION_STATE: LocationWeatherState = {
  hasCurrentWeather: false,
  hasFullForecast: false,
  isLoading: false,
  isFetching: false,
  error: null,
};

/**
 * Rounded-coordinate precision baked into the forecast query key (finding 4a,
 * decision D9). 2 decimals ≈ 1.1 km: small GPS jitter keeps the same key (cache
 * hit, no refetch), while a real move past the rounding boundary changes the key
 * and triggers a background refetch. The SQLite `placeholderData` still paints
 * instantly, so the one-time persisted-cache invalidation has no visible cost.
 */
export const COORD_KEY_DECIMALS = 2;

/** Rounded `lat,lon` fragment used inside the forecast query key. Pure — unit tested. */
export function buildCoordKey(latitude?: number, longitude?: number): string {
  return `${(latitude ?? 0).toFixed(COORD_KEY_DECIMALS)},${(longitude ?? 0).toFixed(
    COORD_KEY_DECIMALS
  )}`;
}

/** Full forecast query key: locale + location id + rounded coords. Pure — unit tested. */
export function buildForecastQueryKey(
  locale: string,
  locationId: string | undefined,
  latitude?: number,
  longitude?: number
): (string | undefined)[] {
  return ['forecast', locale, locationId, buildCoordKey(latitude, longitude)];
}

/**
 * Location-switch race guard (finding 9). SQLite-cached weather is tagged with the
 * location it belongs to; it is only valid for display/placeholder when that tag
 * matches the currently active location. Pure — unit tested.
 */
export function selectCachedWeather(
  cached: { locationId: string; weather: Weather } | null,
  activeLocationId: string | null
): Weather | null {
  return cached && cached.locationId === activeLocationId ? cached.weather : null;
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
  const setLastUpdated = useSettingsStore(state => state.setLastUpdated);

  // Initialize forecast store on first use
  useEffect(() => {
    initializeForecastStore().catch(error => {
      logger.error('Failed to initialize forecast store:', error);
    });
  }, []);

  // SQLite-cached weather for the active location, tagged with its locationId so a
  // slow read from a previously-active location can never paint under the new one
  // (finding 9). Read via the `selectCachedWeather` guard below.
  const [cachedActive, setCachedActive] = useState<{
    locationId: string;
    weather: Weather;
  } | null>(null);

  useEffect(() => {
    if (!activeLocationId || !fetchedLocaleSuccessfully) {
      return;
    }

    // Clear synchronously on switch: drop any cache that isn't for this location so
    // the fallback shows nothing (not the old location) until this read lands.
    setCachedActive(prev =>
      prev && prev.locationId === activeLocationId ? prev : null
    );

    // Cancelled flag: a slow SQLite read that resolves after a switch must not
    // resurrect the previous location's weather.
    let cancelled = false;
    useForecastStore
      .getState()
      .getWeatherData(activeLocationId)
      .then(weather => {
        if (cancelled || !weather) {
          return;
        }
        setCachedActive({ locationId: activeLocationId, weather });
      })
      .catch(error => {
        logger.error('Failed to get cached weather data:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [activeLocationId, fetchedLocaleSuccessfully]);

  // Only surface the cache when it belongs to the active location.
  const cachedActiveWeather = selectCachedWeather(cachedActive, activeLocationId);

  // Active location: fetch with high priority. refetchOnWindowFocus stays at its
  // default (true) so a stale-on-resume active query refetches when the app
  // returns to the foreground (finding 4b — focusManager is wired in
  // useAppLifecycle.ts). buildCoordKey is called inline so the raw lat/lon appear
  // in the key (satisfies @tanstack/query/exhaustive-deps) while the key value
  // stays rounded (decision D9).
  const activeQuery = useQuery({
    queryKey: [
      'forecast',
      i18n.locale,
      activeLocation?.id,
      buildCoordKey(activeLocation?.latitude, activeLocation?.longitude),
    ],
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

      // Persist to store for widgets and offline use
      if (result && activeLocation?.id) {
        try {
          await useForecastStore.getState().setWeatherData(activeLocation.id, result);
        } catch (error) {
          logger.error('Failed to persist weather data to store:', error);
        }
      }

      return result;
    },
    enabled: !!activeLocation && fetchedLocaleSuccessfully,
    placeholderData: cachedActiveWeather, // Use cached data as placeholder
    staleTime: 1000 * 60 * 30, // 30 minutes - data is considered fresh for this long
    gcTime: 1000 * 60 * 60, // 1 hour - keep unused data in cache for this long
    retry: 1, // Only retry once instead of 3 times (faster error display)
  });

  const {
    data: activeData,
    isLoading: activeIsLoading,
    isFetching: activeIsFetching,
    isFetched: activeIsFetched,
    isSuccess: activeIsSuccess,
    isError: activeIsError,
    error: activeError,
    refetch: activeRefetch,
  } = activeQuery;

  // Background pre-fetch: all other locations (lower priority). Memoized so the
  // queries array and everything derived from it stay stable across unrelated
  // renders.
  const otherLocations = useMemo(
    () => savedLocations.filter(loc => loc.id !== activeLocationId),
    [savedLocations, activeLocationId]
  );

  // `combine` folds the unstable useQueries result into structurally-shared,
  // referentially-stable slices. Consuming those (never the raw result) keeps the
  // tanstack no-unstable-deps rule satisfied and lets LocationPill's React.memo
  // actually hold.
  const {
    locationStates: prefetchStates,
    weatherData: prefetchData,
    allLoaded: prefetchAllLoaded,
  } = useQueries({
    queries: otherLocations.map(location => ({
      queryKey: [
        'forecast',
        i18n.locale,
        location.id,
        buildCoordKey(location.latitude, location.longitude),
      ],
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

        // Persist to store for widgets and offline use
        if (result) {
          try {
            await useForecastStore.getState().setWeatherData(location.id, result);
          } catch (error) {
            logger.error('Failed to persist prefetched weather data to store:', error);
          }
        }

        return result;
      },
      enabled: !!activeLocation && fetchedLocaleSuccessfully && activeIsSuccess,
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 1,
      // Lower priority settings to avoid blocking active location
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })),
    combine: results => ({
      locationStates: results.map(
        (query): LocationWeatherState => ({
          hasCurrentWeather: !!query.data?.current,
          hasFullForecast: !!query.data,
          isLoading: query.isLoading,
          isFetching: query.isFetching,
          error: (query.error as Error | null) ?? null,
        })
      ),
      weatherData: results.map(query => query.data),
      allLoaded: results.every(query => query.isSuccess),
    }),
  });

  // Track loading states per location. Rebuilt only when the active-query flags or
  // the (structurally-shared) prefetch states change, so the Map identity is stable
  // across unrelated renders.
  const locationLoadingStates = useMemo(() => {
    const states = new Map<string, LocationWeatherState>();

    savedLocations.forEach(loc => {
      if (loc.id === activeLocationId) {
        // Active location state
        states.set(loc.id, {
          hasCurrentWeather: !!activeData?.current,
          hasFullForecast: !!activeData,
          isLoading: activeIsLoading,
          isFetching: activeIsFetching,
          error: (activeError as Error | null) ?? null,
        });
      } else {
        // Pre-fetched location state
        const prefetchIndex = otherLocations.findIndex(l => l.id === loc.id);
        states.set(loc.id, prefetchStates[prefetchIndex] ?? EMPTY_LOCATION_STATE);
      }
    });

    return states;
  }, [
    savedLocations,
    activeLocationId,
    otherLocations,
    activeData,
    activeIsLoading,
    activeIsFetching,
    activeError,
    prefetchStates,
  ]);

  // Get weather data for a specific location. Stable across renders so consumers
  // that memoize on it are not needlessly invalidated.
  const getLocationWeather = useCallback(
    (locationId: string): Weather | undefined => {
      if (locationId === activeLocationId) {
        return activeData;
      }

      const prefetchIndex = otherLocations.findIndex(l => l.id === locationId);
      if (prefetchIndex >= 0) {
        return prefetchData[prefetchIndex];
      }

      return undefined;
    },
    [activeLocationId, activeData, otherLocations, prefetchData]
  );

  // Update lastUpdated timestamp when data is successfully fetched. Written as an
  // ISO string (coordinates with Worker F's lastUpdated store-type change).
  useEffect(() => {
    if (activeIsSuccess && activeData) {
      setLastUpdated(new Date().toISOString());
    }
  }, [activeIsSuccess, activeData, setLastUpdated]);

  return {
    // Active location data (enhanced with store integration)
    activeWeather: activeData ?? cachedActiveWeather,
    isFetched: activeIsFetched || !!cachedActiveWeather,
    isFetching: activeIsFetching,
    refetch: activeRefetch,
    error: activeError,
    isError: activeIsError,

    // Multi-location state
    locationLoadingStates,
    getLocationWeather,
    allLocationsLoaded: prefetchAllLoaded,

    // Store state
    cachedActiveWeather,

    // For debugging
    activeQuery,
  };
}
