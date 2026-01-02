import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_500Medium_Italic,
  DMSans_700Bold,
  DMSans_700Bold_Italic,
} from "@expo-google-fonts/dm-sans";

import { fetchLocale } from "./src/utils/fetchLocale";
import { logger } from "./src/utils/logger";
import { toAppError } from "./src/utils/errors";

// Stores
import { useSettingsStore } from "./src/store/useSettingsStore";
import { useLocationStore } from "./src/store/useLocationStore";
import { useLanguageStore } from "./src/store/useLanguageStore";
import { useModalStore } from "./src/store/useModalStore";

// Custom hooks
import { useGPSLocation } from "./src/hooks/useGPSLocation";
import { useForecastQuery } from "./src/hooks/useForecastQuery";
import { useAppLifecycle } from "./src/hooks/useAppLifecycle";
import { useSplashScreen } from "./src/hooks/useSplashScreen";
import { useWeatherLoadingState } from "./src/hooks/useWeatherLoadingState";

// Screens
import LoadingScreen from "./src/screens/LoadingScreen";
import ErrorScreen from "./src/screens/ErrorScreen";
import SkeletonScreen from "./src/screens/SkeletonScreen";
import CachedWeatherErrorScreen from "./src/screens/CachedWeatherErrorScreen";
import MainWeatherWithModals from "./src/screens/MainWeatherWithModals";


export default function App() {
  // Store state
  const tempScale = useSettingsStore((state) => state.tempScale);
  const savedLocations = useLocationStore((state) => state.savedLocations);
  const activeLocationId = useLocationStore((state) => state.activeLocationId);
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const activeModal = useModalStore((state) => state.activeModal);
  const openLocationDropdown = useModalStore((state) => state.openLocationDropdown);
  const openSettings = useModalStore((state) => state.openSettings);
  const openAddLocation = useModalStore((state) => state.openAddLocation);

  const activeLocation = savedLocations.find(loc => loc.id === activeLocationId);

  // Locale/date query
  const { data: date, isSuccess: fetchedLocaleSuccessfully } = useQuery({
    queryKey: ["locale", selectedLanguage],
    queryFn: fetchLocale,
  });

  // Custom hooks
  useGPSLocation();
  useAppLifecycle();

  const {
    data: forecast,
    isFetched,
    isFetching: refreshing,
    refetch,
    error: forecastError,
    isError: hasForecastError,
  } = useForecastQuery(activeLocation, fetchedLocaleSuccessfully);

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
      enabled: !!activeLocation && fetchedLocaleSuccessfully,
      hasActiveLocation: !!activeLocation,
      fetchedLocaleSuccessfully,
      hasForecast: !!forecast,
      isFetching: refreshing,
      hasForecastError,
    });
  }, [activeLocation, fetchedLocaleSuccessfully, forecast, refreshing, hasForecastError]);

  if (hasForecastError) {
    logger.error('Forecast query error:', forecastError);
  }

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  // Common props for screens
  const screenProps = {
    locationName: activeLocation?.name || "Loading...",
    location: activeLocation?.name || "Loading...",
    onLocationPress: openLocationDropdown,
    hasMultipleLocations: savedLocations.length > 0,
    onSettingsPress: openSettings,
  };

  const essentialResourcesLoading = !activeLocation || !date;

  // Block on splash screen if timeout hasn't expired AND resources not ready
  if (!splashTimeoutExpired && essentialResourcesLoading) {
    logger.debug('Waiting for essential resources (max 3s):', {
      fontsLoaded,
      hasActiveLocation: !!activeLocation,
      hasDate: !!date,
    });
    return null;
  }

  // Log warnings for missing resources after timeout
  if (splashTimeoutExpired && !activeLocation) {
    logger.warn('Location not available after 3s timeout, showing error UI');
  }

  if (splashTimeoutExpired && !date) {
    logger.warn('Date/locale not available after 3s timeout, continuing anyway');
  }

  if (!fontsLoaded) {
    logger.debug('Fonts still loading, but continuing to render...');
  }

  // Debug: Log render decision
  logger.debug('Render decision point:', {
    splashTimeoutExpired,
    activeLocation: !!activeLocation,
    date: !!date,
    forecast: !!forecast,
    refreshing,
    hasForecastError,
    showSkeleton,
    showErrorScreen,
    fontsLoaded,
    essentialResourcesLoading,
  });

  // ============================================================================
  // RENDER DECISION TREE
  // After 3-second splash timeout, we always render one of the screens below
  // ============================================================================

  // CRITICAL SAFETY CHECK: Timeout expired but essential resources still loading
  // Prevents indefinite splash screen by showing skeleton after 3 seconds
  if (splashTimeoutExpired && essentialResourcesLoading) {
    logger.warn('Splash timeout expired but resources still loading - showing skeleton');
    return <SkeletonScreen {...screenProps} />;
  }

  // LOADING STATE: Initial fetch in progress (before timeout expires)
  // Shows loading spinner when actively fetching forecast data
  if (refreshing && !forecast && !hasForecastError) {
    logger.debug('Rendering: LoadingScreen (refreshing, no forecast, no error)');
    return <LoadingScreen {...screenProps} />;
  }

  // LOADING STATE: Post-timeout loading (skeleton with placeholder UI)
  // Shows skeleton placeholders when data is still loading after splash timeout
  if (showSkeleton && !showErrorScreen) {
    logger.debug('Rendering: SkeletonScreen (showSkeleton=true)');
    return <SkeletonScreen {...screenProps} />;
  }

  // ERROR STATE: Network/API error with no cached data
  // Shows full error screen with retry button when forecast fetch fails
  if (showErrorScreen && hasForecastError && !forecast) {
    logger.debug('Rendering: ErrorScreen (showErrorScreen=true, has error)');
    const appError = forecastError ? toAppError(forecastError) : null;
    return (
      <ErrorScreen
        {...screenProps}
        errorMessage={appError?.userMessage}
        onRetry={() => refetch()}
      />
    );
  }

  // ERROR STATE: Network/API error with cached data available
  // Shows cached weather data with error banner overlay - best user experience
  if (hasForecastError && forecast && !dismissedError) {
    logger.debug('Rendering: CachedWeatherDisplay (has error but also has cached forecast)');

    const appError = forecastError ? toAppError(forecastError) : null;
    return (
      <CachedWeatherErrorScreen
        forecast={forecast}
        date={date}
        tempScale={tempScale}
        appError={appError}
        onRetry={() => refetch()}
        onDismissError={() => setDismissedError('dismissed')}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={onRefresh}
        {...screenProps}
      />
    );
  }

  // FALLBACK STATE: Safety net for missing data (should rarely execute)
  // Shows skeleton screen if forecast or date is unexpectedly missing
  if (!forecast || !date) {
    logger.warn('Rendering: Fallback SkeletonScreen (missing forecast or date)', {
      activeLocation: !!activeLocation,
      date: !!date,
      forecast: !!forecast,
      hasForecastError,
    });
    return <SkeletonScreen {...screenProps} />;
  }

  // SUCCESS STATE: All data loaded successfully
  // Shows full weather screen with location/settings/add location modals
  logger.debug('Rendering: WeatherScreen (success - have forecast and date)');
  return (
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
      {...screenProps}
    />
  );
}
