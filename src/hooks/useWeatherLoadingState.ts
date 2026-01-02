import { useEffect, useState } from 'react';
import { logger } from '../utils/logger';

/**
 * Custom hook to manage progressive loading states with timeouts
 * @param splashTimeoutExpired - Whether the 3-second splash timeout has expired
 * @param refreshing - Whether the forecast query is currently fetching
 * @param forecast - The current forecast data (if any)
 * @param hasForecastError - Whether there's an error in the forecast query
 * @returns Object containing loading state flags and setters
 */
export function useWeatherLoadingState(
  splashTimeoutExpired: boolean,
  refreshing: boolean,
  forecast: any,
  hasForecastError: boolean
) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showErrorScreen, setShowErrorScreen] = useState(false);
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();

  // Show skeleton immediately after timeout if still loading
  useEffect(() => {
    if (splashTimeoutExpired && refreshing && !forecast && !hasForecastError) {
      logger.debug('Setting showSkeleton to true (still loading after splash timeout)');
      setShowSkeleton(true);
    } else {
      // Reset skeleton state if conditions change
      setShowSkeleton(false);
    }
  }, [splashTimeoutExpired, refreshing, forecast, hasForecastError]);

  // Show error screen if error persists after splash timeout
  useEffect(() => {
    if (splashTimeoutExpired && hasForecastError && !forecast) {
      // Show error screen immediately after splash timeout expires
      logger.debug('Setting showErrorScreen to true (error detected after splash timeout)');
      setShowErrorScreen(true);
    } else {
      // Reset error screen state if conditions change
      setShowErrorScreen(false);
    }
  }, [splashTimeoutExpired, hasForecastError, forecast]);

  return {
    showSkeleton,
    showErrorScreen,
    dismissedError,
    setDismissedError,
    lastUpdated,
    setLastUpdated,
  };
}
