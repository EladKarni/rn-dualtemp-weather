import React from 'react';
import { logger } from '../utils/logger';
import type { SavedLocation } from '../store/useLocationStore';
import type { Moment } from 'moment';

interface RenderDecisionParams {
  splashTimeoutExpired: boolean;
  activeLocation: SavedLocation | undefined;
  date: Moment | undefined;
  forecast: any;
  refreshing: boolean;
  hasForecastError: boolean;
  isLocaleLoading: boolean;
  fetchedLocaleSuccessfully: boolean;
  localeData: { locale: string } | undefined;
  fontsLoaded: boolean;
}

interface RenderDecisionResult {
  essentialResourcesLoading: boolean;
  shouldBlockOnSplash: boolean;
}

/**
 * Custom hook to manage render decision logic
 * Extracts resource loading checks and logging from App.tsx
 *
 * @param params - Parameters needed to determine render state
 * @returns Essential resources loading state and splash blocking decision
 */
export const useRenderDecision = ({
  splashTimeoutExpired,
  activeLocation,
  date,
  forecast,
  refreshing,
  hasForecastError,
  isLocaleLoading,
  fetchedLocaleSuccessfully,
  localeData,
  fontsLoaded,
}: RenderDecisionParams): RenderDecisionResult => {
  const essentialResourcesLoading = !activeLocation || isLocaleLoading || !fetchedLocaleSuccessfully;

  // Block on splash screen if timeout hasn't expired AND resources not ready
  const shouldBlockOnSplash = !splashTimeoutExpired && essentialResourcesLoading;

  // Log resources during splash blocking
  React.useEffect(() => {
    if (shouldBlockOnSplash) {
      logger.debug('Waiting for essential resources (max 3s):', {
        fontsLoaded,
        hasActiveLocation: !!activeLocation,
        hasDate: !!date,
        isLocaleLoading,
        fetchedLocaleSuccessfully,
        hasLocaleData: !!localeData,
      });
    }
  }, [shouldBlockOnSplash, fontsLoaded, activeLocation, date, isLocaleLoading, fetchedLocaleSuccessfully, localeData]);

  // Log render decision state
  React.useEffect(() => {
    const logLevel = (splashTimeoutExpired && essentialResourcesLoading) ? 'warn' : 'debug';
    logger[logLevel]('Render decision point:', {
      splashTimeoutExpired,
      activeLocation: !!activeLocation,
      date: !!date,
      forecast: !!forecast,
      refreshing,
      hasForecastError,
      fontsLoaded,
      essentialResourcesLoading,
      isLocaleLoading,
      fetchedLocaleSuccessfully,
      locale: localeData?.locale,
    });
  }, [
    splashTimeoutExpired,
    activeLocation,
    date,
    forecast,
    refreshing,
    hasForecastError,
    fontsLoaded,
    essentialResourcesLoading,
    isLocaleLoading,
    fetchedLocaleSuccessfully,
    localeData,
  ]);

  return {
    essentialResourcesLoading,
    shouldBlockOnSplash,
  };
};
