import React from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

import {
  useFonts,
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_500Medium_Italic,
  DMSans_700Bold,
  DMSans_700Bold_Italic,
} from "@expo-google-fonts/dm-sans";
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

import { logger } from "./src/utils/logger";
import { toAppError } from "./src/utils/errors";

// Initialize Sentry - only if DSN is provided
const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    debug: __DEV__, // Enable debug mode in development
    enabled: !__DEV__, // Only send events in production builds
  });
  if (__DEV__) {
    logger.info('Sentry initialized (dev mode - events disabled)');
  }
} else if (__DEV__) {
  logger.info('Sentry not initialized: No DSN provided. Set EXPO_PUBLIC_SENTRY_DSN environment variable to enable.');
}

// Stores
import { useSettingsStore } from "./src/store/useSettingsStore";
import { useLocationStore } from "./src/store/useLocationStore";
import { useModalStore } from "./src/store/useModalStore";

// Custom hooks
import { useGPSLocation } from "./src/hooks/useGPSLocation";
import { useMultiLocationWeather } from "./src/hooks/useMultiLocationWeather";
import { useAppLifecycle } from "./src/hooks/useAppLifecycle";
import { useSplashScreen } from "./src/hooks/useSplashScreen";
import { useWeatherLoadingState } from "./src/hooks/useWeatherLoadingState";
import { useLocaleQuery } from "./src/hooks/useLocaleQuery";
import { useScreenProps } from "./src/hooks/useScreenProps";
import { useRenderDecision } from "./src/hooks/useRenderDecision";

// Screens
import LoadingScreen from "./src/screens/LoadingScreen";
import ErrorScreen from "./src/screens/ErrorScreen";
import SkeletonScreen from "./src/screens/SkeletonScreen";
import MainWeatherWithModals from "./src/screens/MainWeatherWithModals";

// Error Boundary
import ErrorBoundary from "./src/components/ErrorBoundary/ErrorBoundary";

function App() {


  // Store state
  const tempScale = useSettingsStore((state) => state.tempScale);
  const savedLocations = useLocationStore((state) => state.savedLocations);
  const activeLocationId = useLocationStore((state) => state.activeLocationId);
  const activeModal = useModalStore((state) => state.activeModal);
  const openLocationDropdown = useModalStore((state) => state.openLocationDropdown);
  const openSettings = useModalStore((state) => state.openSettings);
  const openAddLocation = useModalStore((state) => state.openAddLocation);

  const activeLocation = savedLocations.find(loc => loc.id === activeLocationId);

  // Locale/date query - fetch locale settings and create moment object
  // NOTE: Locale is now managed by useLanguageStore (single source of truth)
  const {
    fetchedLocaleSuccessfully,
    localeData,
    isLocaleLoading,
    date,
  } = useLocaleQuery();

  // Custom hooks
  useGPSLocation();
  useAppLifecycle();

  const {
    activeWeather: forecast,
    isFetched,
    isFetching: refreshing,
    refetch,
    error: forecastError,
    isError: hasForecastError,
    locationLoadingStates,
  } = useMultiLocationWeather(savedLocations, activeLocationId, fetchedLocaleSuccessfully && !isLocaleLoading);

  const setActiveLocation = useLocationStore((state) => state.setActiveLocation);

  const handleLocationSelect = React.useCallback((locationId: string) => {
    setActiveLocation(locationId);
  }, [setActiveLocation]);

  const { splashTimeoutExpired, onLayoutRootView } = useSplashScreen(isFetched);

  const {
    showSkeleton,
    showErrorScreen,
    dismissedError,
    setDismissedError,
    lastUpdated,
  } = useWeatherLoadingState(
    splashTimeoutExpired,
    refreshing,
    forecast,
    hasForecastError
  );

  // Font loading
  let [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_400Regular_Italic,
    DMSans_500Medium,
    DMSans_500Medium_Italic,
    DMSans_700Bold,
    DMSans_700Bold_Italic,
  });

  // Log query state for debugging
  React.useEffect(() => {
    logger.debug('Forecast query state:', {
      enabled: !!activeLocation && fetchedLocaleSuccessfully && !isLocaleLoading,
      hasActiveLocation: !!activeLocation,
      fetchedLocaleSuccessfully,
      isLocaleLoading,
      hasForecast: !!forecast,
      isFetching: refreshing,
      hasForecastError,
      localeData: localeData?.locale,
    });
  }, [activeLocation, fetchedLocaleSuccessfully, isLocaleLoading, forecast, refreshing, hasForecastError, localeData]);

  if (hasForecastError) {
    logger.error('Forecast query error:', forecastError);
  }

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  // Common props for all screen components
  const screenProps = useScreenProps({
    activeLocation,
    savedLocations,
    openLocationDropdown,
    openSettings,
    setActiveLocation,
    locationLoadingStates,
  });

  // Render decision logic - determines when to block on splash and logs state
  const { essentialResourcesLoading, shouldBlockOnSplash } = useRenderDecision({
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
  });

  // Block on splash screen if timeout hasn't expired AND resources not ready
  if (shouldBlockOnSplash) {
    return null;
  }

  // ============================================================================
  // RENDER DECISION TREE - WRAPPED WITH ERROR BOUNDARY
  // After 3-second splash timeout, we always render one of the screens below
  // All screens are wrapped with ErrorBoundary to catch render errors
  // ============================================================================

  // ============================================================================
  // RENDER DECISION TREE
  // All components are wrapped with ErrorBoundary to catch render errors
  // ============================================================================

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={(error, resetError) => (
            <ErrorScreen
              {...screenProps}
              errorMessage={error.message}
              onRetry={() => {
                reset(); // Reset React Query state
                resetError(); // Reset Error Boundary state
                refetch(); // Refetch weather data
              }}
            />
          )}
        >
          {/* CRITICAL SAFETY CHECK: Timeout expired but essential resources still loading */}
          {splashTimeoutExpired && essentialResourcesLoading && <SkeletonScreen {...screenProps} />}

          {/* LOADING STATE: Initial fetch in progress */}
          {refreshing && !forecast && !hasForecastError && <LoadingScreen {...screenProps} />}

          {/* LOADING STATE: Post-timeout loading */}
          {showSkeleton && !showErrorScreen && <SkeletonScreen {...screenProps} />}

          {/* ERROR STATE: Network/API error with no cached data */}
          {showErrorScreen && hasForecastError && !forecast && (
            (() => {
              const appError = forecastError ? toAppError(forecastError) : null;
              return (
                <ErrorScreen
                  {...screenProps}
                  errorMessage={appError?.userMessage}
                  onRetry={() => refetch()}
                />
              );
            })()
          )}

          {/* FALLBACK STATE: Safety net for missing data */}
          {!forecast && !showErrorScreen && !refreshing && <SkeletonScreen {...screenProps} />}

          {/* SUCCESS STATE: All data loaded successfully (with optional error banner for cached data) */}
          {forecast && (
            <MainWeatherWithModals
              forecast={forecast}
              date={date}
              tempScale={tempScale}
              refreshing={refreshing}
              onRefresh={onRefresh}
              onLayoutRootView={onLayoutRootView}
              activeModal={activeModal}
              closeModal={() => useModalStore.getState().closeModal()}
              openAddLocation={openAddLocation}
              savedLocations={savedLocations}
              activeLocationId={activeLocationId}
              locationLoadingStates={locationLoadingStates}
              onLocationSelect={handleLocationSelect}
              appError={hasForecastError && !dismissedError ? toAppError(forecastError) : null}
              onRetry={() => refetch()}
              onDismissError={() => setDismissedError('dismissed')}
              lastUpdated={lastUpdated}
              {...screenProps}
            />
          )}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export default Sentry.wrap(App);
