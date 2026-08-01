import React, { useEffect, useState } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";

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

import { logger } from "./src/utils/logger";
import { toAppError, NoConnectionError } from "./src/utils/errors";

// Sentry is initialized by src/config/sentryBootstrap, imported first in
// index.js so it runs before the rest of the module graph. Sentry.wrap below is
// the only Sentry usage left in this file.

// Stores
import { useSettingsStore } from "./src/store/useSettingsStore";
import { useLocationStore } from "./src/store/useLocationStore";
import { useModalStore } from "./src/store/useModalStore";

// Widget sync
import { startWidgetLocationSync } from "./src/widgets/widgetLocationSync";

// Custom hooks
import { useGPSLocation } from "./src/hooks/useGPSLocation";
import { useMultiLocationWeather } from "./src/hooks/useMultiLocationWeather";
import { useAppLifecycle } from "./src/hooks/useAppLifecycle";
import { useSplashScreen } from "./src/hooks/useSplashScreen";
import { useWeatherLoadingState } from "./src/hooks/useWeatherLoadingState";
import { useLocaleQuery } from "./src/hooks/useLocaleQuery";
import { useScreenProps } from "./src/hooks/useScreenProps";
import { useRenderDecision } from "./src/hooks/useRenderDecision";
import {
  initializeForecastStore,
  scheduleForecastCleanup,
} from "./src/store/useForecastStore";

// Screens
import LoadingScreen from "./src/screens/LoadingScreen";
import ErrorScreen from "./src/screens/ErrorScreen";
import SkeletonScreen from "./src/screens/SkeletonScreen";
import MainWeatherWithModals from "./src/screens/MainWeatherWithModals";
import EmptyLocationScreen from "./src/screens/EmptyLocationScreen";
import AddLocationScreen from "./src/screens/AddLocationScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

// Error Boundary
import ErrorBoundary from "./src/components/ErrorBoundary/ErrorBoundary";

function App() {
  // Initialize forecast store, then evict stale cache entries once the app has
  // settled. The eviction is deliberately deferred rather than chained onto
  // initialization: as a startup step its DELETE raced the widget task's
  // connection and failed with "database is locked", and nothing needs a
  // 24-hour eviction to have finished before the first render.
  useEffect(() => {
    let cancelCleanup: (() => void) | undefined;

    initializeForecastStore()
      .then(() => {
        cancelCleanup = scheduleForecastCleanup();
      })
      .catch((error) => {
        console.error("Failed to initialize forecast store:", error);
      });

    return () => cancelCleanup?.();
  }, []);

  // Repaint widgets when the location they resolve to changes (returns its
  // unsubscribe for cleanup).
  useEffect(() => startWidgetLocationSync(), []);

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
  const { gpsResolved } = useGPSLocation();
  useAppLifecycle();

  // Track persisted-store rehydration reactively — persist finishing with an
  // empty store doesn't trigger a re-render on its own, so a bare
  // hasHydrated() call in render could stay false forever
  const [locationsHydrated, setLocationsHydrated] = useState(() =>
    useLocationStore.persist.hasHydrated(),
  );
  useEffect(() => {
    const unsubscribe = useLocationStore.persist.onFinishHydration(() =>
      setLocationsHydrated(true),
    );
    // Hydration may have finished between first render and this effect
    if (useLocationStore.persist.hasHydrated()) {
      // Not replaceable with useSyncExternalStore, which the no-initialize-state
      // rule suggests: that is a pure subscription, and this effect also needs
      // the bounded timeout below — a failed hydration never fires
      // onFinishHydration, and the empty state must not stay locked behind it.
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-initialize-state
      setLocationsHydrated(true);
    }
    // Bounded wait: a failed hydration never fires onFinishHydration, and
    // the empty state must not stay locked behind it forever
    const timer = setTimeout(() => setLocationsHydrated(true), 3000);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

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

  const closeModal = React.useCallback(
    () => useModalStore.getState().closeModal(),
    [],
  );

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
    locationsHydrated,
    gpsResolved,
    hasSavedLocations: savedLocations.length > 0,
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
    <>
      {/* Light glyphs, because every screen sits on the #1C1B4D surface. The
          Info.plist carries UIStatusBarStyleLightContent for the pre-JS window
          (splash), but React Native takes the status bar over once it mounts
          and would otherwise restore the dark default — so both are needed,
          not either. Rendered outside QueryErrorResetBoundary so it survives
          the ErrorBoundary fallback path too. */}
      <StatusBar style="light" />
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
              // EMPTY STATE: no saved locations (e.g. GPS denied on first
              // run) — a reachable manual-add screen instead of an endless
              // skeleton
              case "empty":
                return (
                  <EmptyLocationScreen
                    onAddLocation={openAddLocation}
                    {...screenProps}
                  />
                );

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
                    closeModal={closeModal}
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

          {/* GLOBAL MODALS: mounted outside the screenState switch so
              settings and manual city add stay reachable from every screen
              state, including the empty state. RN Modal renders nothing
              while visible is false. */}
          <SettingsScreen
            visible={activeModal === "settings"}
            onClose={closeModal}
            onAddLocationPress={openAddLocation}
          />
          <AddLocationScreen
            visible={activeModal === "addLocation"}
            onClose={closeModal}
          />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </>
  );
}

export default Sentry.wrap(App);
