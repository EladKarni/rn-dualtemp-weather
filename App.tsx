import React, { useCallback, useEffect } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
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
import { useCurrentLocation } from "./src/hooks/useCurrentLocation";
import { useSettingsStore } from "./src/store/useSettingsStore";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { location, locationName, errorMsg } = useCurrentLocation();

  const tempScale = useSettingsStore((state) => state.tempScale);

  const { data: date, isSuccess: fetchedLocaleSuccessfully } = useQuery({
    queryKey: ["locale"],
    queryFn: fetchLocale,
  });

  const {
    data: forecast,
    isFetched,
    isFetching: refreshing,
    refetch,
  } = useQuery({
    queryKey: ["forecast", i18n.locale, location],
    queryFn: () => fetchForecast(i18n.locale, location),
    enabled: !!location && fetchedLocaleSuccessfully,
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

  if (!fontsLoaded || !forecast || !locationName) {
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
            <AppHeader location={locationName} />
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
