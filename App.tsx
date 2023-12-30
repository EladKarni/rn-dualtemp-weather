import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { fetchForecast } from './src/utils/fetchWeather';
import CurrentWeatherCard from './src/components/CurrentWeatherCard/CurrentWeatherCard';
import { Weather } from './src/types/WeatherTypes';
import { palette } from './src/Styles/Palette';
import HourlyForecast from './src/components/HourlyForecast/HourlyForecast';
import AppHeader from './src/components/AppHeader/AppHeader';
import moment from "moment";
import "moment/locale/he";
import DailyForecast from "./src/components/DailyForecast/DailyForecast";
import { AppStateContext } from "./src/utils/AppStateContext";
import { getSelectedTempScale } from "./src/utils/AsyncStorageHelper";
import AppFooter from "./src/components/AppFooter/AppFooter";
import { i18n, translations } from "./src/localization/i18n";
import { getLocales } from "expo-localization";

import {
  useFonts,
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_500Medium_Italic,
  DMSans_700Bold,
  DMSans_700Bold_Italic,
} from "@expo-google-fonts/dm-sans";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [forecast, setForecast] = useState<Weather>();
  const [tempScale, setTempScale] = useState<"C" | "F">("F");
  const [location, setLocation] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [date, setDate] = useState(moment());
  const [appIsReady, setAppIsReady] = useState(false);

  let [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_400Regular_Italic,
    DMSans_500Medium,
    DMSans_500Medium_Italic,
    DMSans_700Bold,
    DMSans_700Bold_Italic,
  });

  const deviceLocal =
    getLocales()[0].languageCode === "iw" ? "he" : getLocales()[0].languageCode;
  i18n.locale = translations.hasOwnProperty(deviceLocal) ? deviceLocal : "en";
  moment.locale(i18n.locale);

  useEffect(() => {
    async function prepare() {
      try {
        //Load Forecast data
        await loadForecast();
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const loadForecast = async () => {
    setTempScale(await getSelectedTempScale());
    setRefreshing(true);
    const fetched = await fetchForecast(i18n.locale);
    setForecast(fetched?.data);
    setLocation(fetched?.location.city);
    setDate(moment());
    setRefreshing(false);
  };

  const onRefresh = React.useCallback(async () => {
    loadForecast();
  }, []);

  if (!fontsLoaded || !appIsReady || !forecast) {
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
            value={{ forecast, date, tempScale, setTempScale }}
          >
            <AppHeader location={location} />
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
    backgroundColor: palette.primaryDark
  },
  scrollView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
