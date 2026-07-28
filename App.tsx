import React, { useEffect } from "react";
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
import { toAppError, NoConnectionError } from "./src/utils/errors";
import { scrubBreadcrumb, scrubEventValues } from "./src/utils/sentryScrubbing";

// Initialize Sentry - only if DSN is provided
const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;
// EXPO_PUBLIC_SENTRY_FORCE_ENABLE=true opts a dev build into actually sending
// events, so the pipeline can be smoke-tested without cutting a release build.
const sentryForceEnable = Constants.expoConfig?.extra?.sentryForceEnable === true;
// Which build produced this event. Without it every build — including the
// internal `preview` ones that generate most field traffic — lands in Sentry's
// default "production" environment and is indistinguishable from a real release.
// __DEV__ is checked first because `buildProfile` is derived from
// EAS_BUILD_PROFILE, which is unset outside EAS and falls back to "production" —
// so a force-enabled dev build would otherwise label itself as a real release.
const sentryEnvironment: string = __DEV__
  ? "development"
  : (Constants.expoConfig?.extra?.buildProfile ?? "production");
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    debug: __DEV__, // Enable debug mode in development
    enabled: !__DEV__ || sentryForceEnable, // Only send from release builds (or an explicit dev opt-in)
    environment: sentryEnvironment,
    sendDefaultPii: false, // don't let Sentry attach IP / default identifiers
    // Defense-in-depth scrubbing (S2): strip GPS query strings from the default
    // fetch/XHR breadcrumbs Sentry attaches automatically, and — before any
    // event leaves the device — delete precise-coordinate extras then value-scrub
    // every URL/coordinate at any depth. So location can't reach Sentry even if
    // a call site forgets to sanitize.
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend(event) {
      const extra = event.extra;
      if (extra) {
        for (const key of ["latitude", "longitude", "lat", "long", "lon", "lng"]) {
          delete extra[key];
        }
      }
      return scrubEventValues(event);
    },
  });
  if (__DEV__) {
    logger.info(
      sentryForceEnable
        ? `Sentry initialized (dev mode - events FORCE-ENABLED, environment: ${sentryEnvironment})`
        : "Sentry initialized (dev mode - events disabled)",
    );
  }
} else if (__DEV__) {
  logger.info(
    "Sentry not initialized: No DSN provided. Set EXPO_PUBLIC_SENTRY_DSN environment variable to enable.",
  );
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
import { initializeForecastStore } from "./src/store/useForecastStore";

// Screens
import LoadingScreen from "./src/screens/LoadingScreen";
import ErrorScreen from "./src/screens/ErrorScreen";
import SkeletonScreen from "./src/screens/SkeletonScreen";
import MainWeatherWithModals from "./src/screens/MainWeatherWithModals";

// Error Boundary
import ErrorBoundary from "./src/components/ErrorBoundary/ErrorBoundary";

function App() {
  // Initialize forecast store
  useEffect(() => {
    initializeForecastStore().catch((error) => {
      console.error("Failed to initialize forecast store:", error);
    });
  }, []);

  // Store state
  const tempScale = useSettingsStore((state) => state.tempScale);
  const savedLocations = useLocationStore((state) => state.savedLocations);
  const activeLocationId = useLocationStore((state) => state.activeLocationId);
  const activeModal = useModalStore((state) => state.activeModal);
  const openLocationDropdown = useModalStore(
    (state) => state.openLocationDropdown,
  );
  const openSettings = useModalStore((state) => state.openSettings);
  const openAddLocation = useModalStore((state) => state.openAddLocation);

  const activeLocation = savedLocations.find(
    (loc) => loc.id === activeLocationId,
  );

  // Locale/date query - fetch locale settings and create moment object
  // NOTE: Locale is now managed by useLanguageStore (single source of truth)
  const { fetchedLocaleSuccessfully, localeData, isLocaleLoading, date } =
    useLocaleQuery();

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
  } = useMultiLocationWeather(
    savedLocations,
    activeLocationId,
    fetchedLocaleSuccessfully && !isLocaleLoading,
  );

  const setActiveLocation = useLocationStore(
    (state) => state.setActiveLocation,
  );

  const handleLocationSelect = React.useCallback(
    (locationId: string) => {
      setActiveLocation(locationId);
    },
    [setActiveLocation],
  );

  const { splashTimeoutExpired, onLayoutRootView } = useSplashScreen(isFetched);

  const { isErrorDismissed, dismissError } = useWeatherLoadingState(
    hasForecastError,
    forecastError,
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
    logger.debug("Forecast query state:", {
      enabled:
        !!activeLocation && fetchedLocaleSuccessfully && !isLocaleLoading,
      hasActiveLocation: !!activeLocation,
      fetchedLocaleSuccessfully,
      isLocaleLoading,
      hasForecast: !!forecast,
      isFetching: refreshing,
      hasForecastError,
      localeData: localeData?.locale,
    });
  }, [
    activeLocation,
    fetchedLocaleSuccessfully,
    isLocaleLoading,
    forecast,
    refreshing,
    hasForecastError,
    localeData,
  ]);

  // Report forecast errors from an effect (never the render body — that would
  // fire on every re-render). Offline (NoConnectionError) is an expected,
  // user-visible state, not an anomaly worth a Sentry event.
  React.useEffect(() => {
    if (forecastError && !(forecastError instanceof NoConnectionError)) {
      logger.error("Forecast query error:", forecastError);
    }
  }, [forecastError]);

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

  // Render decision logic - determines when to block on splash and which single
  // screen to render (mutually-exclusive screenState replaces the old guards).
  const { shouldBlockOnSplash, screenState } = useRenderDecision({
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
  // After the 3-second splash timeout, we render exactly ONE screen, chosen by
  // the mutually-exclusive `screenState` (see useRenderDecision.computeScreenState).
  // This replaces the previous set of independent boolean guards, which could
  // mount two screens simultaneously (double SkeletonScreen / Skeleton+Loading).
  // All screens are wrapped with ErrorBoundary to catch render errors.
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
          {(() => {
            switch (screenState) {
              // ERROR STATE: Network/API error with no cached data
              case "error": {
                const appError = forecastError
                  ? toAppError(forecastError)
                  : null;
                return (
                  <ErrorScreen
                    {...screenProps}
                    errorMessage={appError?.userMessage}
                    onRetry={() => refetch()}
                  />
                );
              }

              // SUCCESS STATE: Data loaded (with optional error banner for cached data)
              case "content":
                return (
                  <MainWeatherWithModals
                    // `content` is only selected when forecast is present
                    // (useRenderDecision precedence), so it is non-null here.
                    forecast={forecast!}
                    date={date}
                    tempScale={tempScale}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    onLayoutRootView={onLayoutRootView}
                    activeModal={activeModal}
                    closeModal={() => useModalStore.getState().closeModal()}
                    openAddLocation={openAddLocation}
                    appError={
                      hasForecastError && !isErrorDismissed
                        ? toAppError(forecastError)
                        : null
                    }
                    onRetry={() => refetch()}
                    onDismissError={dismissError}
                    {...screenProps}
                  />
                );

              // LOADING STATE: Initial fetch in progress
              case "loading":
                return <LoadingScreen {...screenProps} />;

              // SKELETON STATE: Post-timeout fallback while resources resolve
              case "skeleton":
              default:
                return <SkeletonScreen {...screenProps} />;
            }
          })()}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export default Sentry.wrap(App);
