import React from "react";
import { SafeAreaView, ScrollView, RefreshControl, StyleSheet } from "react-native";
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

import { palette } from "./src/Styles/Palette";
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
import WeatherScreen from "./src/screens/WeatherScreen";
import LocationDropdown from "./src/components/LocationDropdown/LocationDropdown";
import AddLocationScreen from "./src/screens/AddLocationScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

// Components
import AppHeader from "./src/components/AppHeader/AppHeader";
import { CachedWeatherDisplay } from "./src/components/CachedWeatherDisplay/CachedWeatherDisplay";
import { AppStateContext } from "./src/utils/AppStateContext";
import AppFooter from "./src/components/AppFooter/AppFooter";

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

  // CRITICAL: After splash timeout, ALWAYS show something
  if (splashTimeoutExpired && essentialResourcesLoading) {
    logger.warn('Splash timeout expired but resources still loading - showing skeleton');
    return <SkeletonScreen {...screenProps} />;
  }

  // Render: Loading (still fetching, no error)
  if (refreshing && !forecast && !hasForecastError) {
    logger.debug('Rendering: LoadingScreen (refreshing, no forecast, no error)');
    return <LoadingScreen {...screenProps} />;
  }

  // Render: Skeleton (after timeout, still loading or error without screen flag)
  if (showSkeleton && !showErrorScreen) {
    logger.debug('Rendering: SkeletonScreen (showSkeleton=true)');
    return <SkeletonScreen {...screenProps} />;
  }

  // Render: Error screen (after timeout with error)
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

  // Render: Cached data with error overlay
  if (hasForecastError && forecast && !dismissedError) {
    logger.debug('Rendering: CachedWeatherDisplay (has error but also has cached forecast)');

    const appError = forecastError ? toAppError(forecastError) : null;
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <AppStateContext.Provider value={{ forecast, date, tempScale }}>
            <AppHeader {...screenProps} />
            <CachedWeatherDisplay
              forecast={forecast}
              error={appError}
              onRetry={() => refetch()}
              onDismissError={() => setDismissedError('dismissed')}
              lastUpdated={lastUpdated}
              tempScale={tempScale}
            />
          </AppStateContext.Provider>
          <AppFooter />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Fallback: Missing forecast or date
  if (!forecast || !date) {
    logger.warn('Rendering: Fallback SkeletonScreen (missing forecast or date)', {
      activeLocation: !!activeLocation,
      date: !!date,
      forecast: !!forecast,
      hasForecastError,
    });
    return <SkeletonScreen {...screenProps} />;
  }

  // Render: Success - Main weather screen
  logger.debug('Rendering: WeatherScreen (success - have forecast and date)');
  return (
    <>
      <WeatherScreen
        forecast={forecast}
        date={date}
        tempScale={tempScale}
        {...screenProps}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onLayoutRootView={onLayoutRootView}
      />

      <LocationDropdown
        visible={activeModal === 'location'}
        onClose={() => useModalStore.getState().closeModal()}
        onAddLocation={openAddLocation}
      />

      <SettingsScreen
        visible={activeModal === 'settings'}
        onClose={() => useModalStore.getState().closeModal()}
        onAddLocationPress={openAddLocation}
      />

      <AddLocationScreen
        visible={activeModal === 'addLocation'}
        onClose={() => useModalStore.getState().closeModal()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryDark,
  },
});
