import React, { useCallback, useEffect } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  AppState,
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
          console.warn("Location permission not granted");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const locationInfo = await Location.reverseGeocodeAsync(location.coords);

        // Extract clean city/town name, avoiding full address strings
        const info = locationInfo[0];
        let name = info?.city || info?.subregion || info?.district || info?.region || info?.country || "Current Location";

        // If the city name contains commas, extract just the first part
        if (name.includes(',')) {
          name = name.split(',')[0].trim();
        }

        updateGPSLocation(
          location.coords.latitude,
          location.coords.longitude,
          name
        );
      } catch (error) {
        console.error("Error fetching GPS location:", error);
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
  } = useQuery({
    queryKey: ["forecast", i18n.locale, activeLocation?.id],
    queryFn: () => fetchForecast(i18n.locale, activeLocation?.latitude || 0, activeLocation?.longitude || 0),
    enabled: !!activeLocation && fetchedLocaleSuccessfully,
  });

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

  if (!fontsLoaded || !forecast || !activeLocation || !date) {
    return null;
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
});
