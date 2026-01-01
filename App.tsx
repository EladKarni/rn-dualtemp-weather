import React, { useCallback, useEffect } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  AppState,
  Text,
  TouchableOpacity,
} from "react-native";

import * as SplashScreen from "expo-splash-screen";
import * as Location from "expo-location";
import { fetchForecast } from "./src/utils/fetchWeather";
import CurrentWeatherCard from "./src/components/CurrentWeatherCard/CurrentWeatherCard";
import { palette } from "./src/Styles/Palette";
import HourlyForecast from "./src/components/HourlyForecast/HourlyForecast";
import AppHeader from "./src/components/AppHeader/AppHeader";
import DailyForecast from "./src/components/DailyForecast/DailyForecast";
import { AppStateContext } from "./src/utils/AppStateContext";
import AppFooter from "./src/components/AppFooter/AppFooter";
import { i18n } from "./src/localization/i18n";
import { useQuery } from "@tanstack/react-query";
import { parseLocationName } from "./src/utils/locationNameParser";

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
import { useSettingsStore } from "./src/store/useSettingsStore";
import { useLocationStore } from "./src/store/useLocationStore";
import { useLanguageStore } from "./src/store/useLanguageStore";
import { useModalStore } from "./src/store/useModalStore";
import LocationDropdown from "./src/components/LocationDropdown/LocationDropdown";
import AddLocationScreen from "./src/screens/AddLocationScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { logger } from "./src/utils/logger";
import {
  PermissionDeniedError,
  LocationUnavailableError,
  PositionTimeoutError,
  toAppError,
  AppError
} from "./src/utils/errors";
import { showErrorAlert, openDeviceSettings } from "./src/components/ErrorAlert/ErrorAlert";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const tempScale = useSettingsStore((state) => state.tempScale);
  const savedLocations = useLocationStore((state) => state.savedLocations);
  const activeLocationId = useLocationStore((state) => state.activeLocationId);
  const updateGPSLocation = useLocationStore((state) => state.updateGPSLocation);
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);

  // Modal state management
  const activeModal = useModalStore((state) => state.activeModal);
  const openLocationDropdown = useModalStore((state) => state.openLocationDropdown);
  const openSettings = useModalStore((state) => state.openSettings);
  const openAddLocation = useModalStore((state) => state.openAddLocation);
  const closeModal = useModalStore((state) => state.closeModal);

  // Derive active location from savedLocations and activeLocationId
  const activeLocation = savedLocations.find(loc => loc.id === activeLocationId);

  // GPS error state
  const [gpsError, setGpsError] = React.useState<AppError | null>(null);

  const { data: date, isSuccess: fetchedLocaleSuccessfully } = useQuery({
    queryKey: ["locale", selectedLanguage],
    queryFn: fetchLocale,
  });

  // Fetch GPS location on mount and update store
  useEffect(() => {
    const fetchGPS = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          const error = new PermissionDeniedError();
          setGpsError(error);

          showErrorAlert({
            error,
            onOpenSettings: openDeviceSettings,
            onDismiss: () => setGpsError(null),
          });

          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Get clean location name using Expo's reverse geocoding with smart parsing
        let name = 'Current Location';
        try {
          const locationInfo = await Location.reverseGeocodeAsync(location.coords);
          name = parseLocationName(locationInfo);
          logger.debug('Location name parsed:', name);
        } catch (geocodeError) {
          // Fallback to generic name if reverse geocoding fails
          logger.warn('Reverse geocoding failed, using fallback:', geocodeError);
          name = 'Current Location';
        }

        updateGPSLocation(
          location.coords.latitude,
          location.coords.longitude,
          name
        );

        logger.debug('GPS location updated:', {
          lat: location.coords.latitude,
          lon: location.coords.longitude,
          name,
        });

        setGpsError(null); // Clear any previous errors

      } catch (error: any) {
        let appError: AppError;

        // Map specific location errors
        if (error.code === 'E_LOCATION_UNAVAILABLE') {
          appError = new LocationUnavailableError();
        } else if (error.code === 'E_LOCATION_TIMEOUT') {
          appError = new PositionTimeoutError();
        } else {
          appError = toAppError(error);
        }

        setGpsError(appError);
        logger.error("Error fetching GPS location:", error);

        showErrorAlert({
          error: appError,
          onRetry: fetchGPS,
          onDismiss: () => setGpsError(null),
        });
      }
    };

    fetchGPS();
  }, []);

  // Reset all modals on mount for clean state
  useEffect(() => {
    closeModal();
  }, []);

  // Close modals when app backgrounds
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        closeModal();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const {
    data: forecast,
    isFetched,
    isFetching: refreshing,
    refetch,
    error: forecastError,
    isError: hasForecastError,
    failureCount,
  } = useQuery({
    queryKey: ["forecast", i18n.locale, activeLocation?.id],
    queryFn: async () => {
      logger.debug('Fetching forecast for:', {
        locale: i18n.locale,
        lat: activeLocation?.latitude,
        lon: activeLocation?.longitude,
        locationId: activeLocation?.id,
      });
      const result = await fetchForecast(i18n.locale, activeLocation?.latitude || 0, activeLocation?.longitude || 0);
      logger.debug('Forecast fetched:', !!result);
      return result;
    },
    enabled: !!activeLocation && fetchedLocaleSuccessfully,
    placeholderData: (previousData) => previousData, // Keeps old data visible during location switch
    staleTime: 1000 * 60 * 30, // 30 minutes - data is considered fresh for this long
    gcTime: 1000 * 60 * 60, // 1 hour - keep unused data in cache for this long
    retry: 1, // Only retry once instead of 3 times (faster error display)
  });

  // Log forecast errors and query state
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

  let [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_400Regular_Italic,
    DMSans_500Medium,
    DMSans_500Medium_Italic,
    DMSans_700Bold,
    DMSans_700Bold_Italic,
  });

  const onLayoutRootView = useCallback(async () => {
    if (isFetched) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [isFetched]);

  const onRefresh = React.useCallback(async () => {
    refetch();
  }, []);

  // Show loading state while essential resources load (location and date only)
  // Fonts can load in the background - don't block on them
  const essentialResourcesLoading = !activeLocation || !date;

  if (essentialResourcesLoading) {
    logger.debug('Waiting for essential resources:', {
      fontsLoaded,
      hasActiveLocation: !!activeLocation,
      hasDate: !!date,
    });
    return null; // Keep splash screen for essential resources
  }

  // Log font loading status but don't block
  if (!fontsLoaded) {
    logger.debug('Fonts still loading, but continuing to render...');
  }

  // If weather is loading (first fetch or retry), show a loading screen
  if (refreshing && !forecast && !hasForecastError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AppHeader
            location={activeLocation?.name || "Loading..."}
            onLocationPress={openLocationDropdown}
            hasMultipleLocations={savedLocations.length > 0}
            onSettingsPress={openSettings}
          />
          <View style={styles.errorContent}>
            <Text style={styles.loadingTitle}>Loading Weather...</Text>
            <Text style={styles.loadingMessage}>
              Fetching forecast for {activeLocation?.name}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // If there's a forecast error and no cached data, show error screen
  if (hasForecastError && !forecast) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AppHeader
            location={activeLocation?.name || "Loading..."}
            onLocationPress={openLocationDropdown}
            hasMultipleLocations={savedLocations.length > 0}
            onSettingsPress={openSettings}
          />
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Unable to Load Weather</Text>
            <Text style={styles.errorMessage}>
              {forecastError?.message || 'Could not fetch weather data. Please try again.'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View onLayout={onLayoutRootView}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <AppStateContext.Provider
            value={{ forecast, date, tempScale }}
          >
            <AppHeader
              location={activeLocation?.name || "Loading..."}
              onLocationPress={openLocationDropdown}
              hasMultipleLocations={savedLocations.length > 0}
              onSettingsPress={openSettings}
            />
            <CurrentWeatherCard
              temp={forecast.current.temp}
              weather={forecast.current.weather[0]}
            />
            <HourlyForecast hourlyForecast={forecast.hourly?.slice(0, 24)} />
            <DailyForecast dailyForecast={forecast.daily} />
          </AppStateContext.Provider>
          <AppFooter />
        </ScrollView>
      </View>

      <LocationDropdown
        visible={activeModal === 'location'}
        onClose={closeModal}
        onAddLocation={openAddLocation}
      />

      <SettingsScreen
        visible={activeModal === 'settings'}
        onClose={closeModal}
        onAddLocationPress={openAddLocation}
      />

      <AddLocationScreen
        visible={activeModal === 'addLocation'}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryDark,
  },
  scrollView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: palette.textColor,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: palette.highlightColor,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: palette.primaryColor,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: palette.textColor,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.textColor,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingMessage: {
    fontSize: 14,
    color: palette.highlightColor,
    textAlign: 'center',
  },
});
