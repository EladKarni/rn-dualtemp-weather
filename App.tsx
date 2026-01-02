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
import { useMultiLocationWeather } from "./src/hooks/useMultiLocationWeather";
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
    activeWeather: forecast,
    isFetched,
    isFetching: refreshing,
    refetch,
    error: forecastError,
    isError: hasForecastError,
    locationLoadingStates,
  } = useMultiLocationWeather(savedLocations, activeLocationId, fetchedLocaleSuccessfully);

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

  // Common props for all screen components
  const screenProps = {
    locationName: activeLocation?.name || "Loading...",
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

  // Log render decision state and any warnings for missing resources
  const logLevel = (splashTimeoutExpired && essentialResourcesLoading) ? 'warn' : 'debug';
  logger[logLevel]('Render decision point:', {
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
    return <SkeletonScreen {...screenProps} />;
  }

  // LOADING STATE: Initial fetch in progress (before timeout expires)
  // Shows loading spinner when actively fetching forecast data
  if (refreshing && !forecast && !hasForecastError) {
    return <LoadingScreen {...screenProps} />;
  }

  // LOADING STATE: Post-timeout loading (skeleton with placeholder UI)
  // Shows skeleton placeholders when data is still loading after splash timeout
  if (showSkeleton && !showErrorScreen) {
    return <SkeletonScreen {...screenProps} />;
  }

  // ERROR STATE: Network/API error with no cached data
  // Shows full error screen with retry button when forecast fetch fails
  if (showErrorScreen && hasForecastError && !forecast) {
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
    return <SkeletonScreen {...screenProps} />;
  }

  // SUCCESS STATE: All data loaded successfully
  // Shows full weather screen with location/settings/add location modals
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
      fetchedLocaleSuccessfully={fetchedLocaleSuccessfully}
      savedLocations={savedLocations}
      activeLocationId={activeLocationId}
      locationLoadingStates={locationLoadingStates}
      onLocationSelect={handleLocationSelect}
      {...screenProps}
    />
  );
}
