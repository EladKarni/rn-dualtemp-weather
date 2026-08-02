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
  locationsHydrated: boolean;
  gpsResolved: boolean;
  hasSavedLocations: boolean;
}

/**
 * The single, mutually-exclusive screen the app renders after the splash gate.
 * Exactly one of these is active at any time — this replaces the old set of
 * independent boolean JSX guards that could mount two screens at once (e.g. a
 * double SkeletonScreen, or a SkeletonScreen alongside a LoadingScreen).
 */
export type ScreenState = 'loading' | 'skeleton' | 'error' | 'content' | 'empty';

interface ScreenStateInputs {
  splashTimeoutExpired: boolean;
  forecast: unknown;
  refreshing: boolean;
  hasForecastError: boolean;
  locationsHydrated: boolean;
  gpsResolved: boolean;
  hasSavedLocations: boolean;
}

/**
 * Pure resolver for the active screen state, with an explicit precedence:
 * empty > error > content > loading > skeleton. Because the branches are
 * ordered and `return` early, exactly one state is ever produced for any input.
 *
 * - empty:   no saved location at all (e.g. GPS denied on first run) — show a
 *            reachable "add a city" screen instead of an endless skeleton.
 *            Waits for store rehydration and the initial GPS attempt to settle
 *            so it can't flash during normal startup, and wins over every other
 *            state so a stale forecast can never mask it.
 * - error:   post-splash-timeout, query errored, and no forecast to show.
 * - content: forecast data is present (an error banner may still overlay it).
 * - loading: an initial fetch is in flight with no forecast and no error yet.
 * - skeleton: the catch-all fallback (post-timeout resources still resolving).
 */
export function computeScreenState({
  splashTimeoutExpired,
  forecast,
  refreshing,
  hasForecastError,
  locationsHydrated,
  gpsResolved,
  hasSavedLocations,
}: ScreenStateInputs): ScreenState {
  if (
    splashTimeoutExpired &&
    locationsHydrated &&
    gpsResolved &&
    !refreshing &&
    !hasSavedLocations
  ) {
    return 'empty';
  }
  if (splashTimeoutExpired && hasForecastError && !forecast) {
    return 'error';
  }
  if (forecast) {
    return 'content';
  }
  if (refreshing && !hasForecastError) {
    return 'loading';
  }
  return 'skeleton';
}

interface RenderDecisionResult {
  essentialResourcesLoading: boolean;
  shouldBlockOnSplash: boolean;
  screenState: ScreenState;
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
  locationsHydrated,
  gpsResolved,
  hasSavedLocations,
}: RenderDecisionParams): RenderDecisionResult => {
  const essentialResourcesLoading = !activeLocation || isLocaleLoading || !fetchedLocaleSuccessfully;

  // Block on splash screen if timeout hasn't expired AND resources not ready
  const shouldBlockOnSplash = !splashTimeoutExpired && essentialResourcesLoading;

  // The single screen to render post-splash (mutually exclusive by construction).
  const screenState = computeScreenState({
    splashTimeoutExpired,
    forecast,
    refreshing,
    hasForecastError,
    locationsHydrated,
    gpsResolved,
    hasSavedLocations,
  });

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
      locationsHydrated,
      gpsResolved,
      hasSavedLocations,
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
    locationsHydrated,
    gpsResolved,
    hasSavedLocations,
  ]);

  return {
    essentialResourcesLoading,
    shouldBlockOnSplash,
    screenState,
  };
};
