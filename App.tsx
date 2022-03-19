import React, { createContext, useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { fetchForecast } from './src/utils/fetchWeather';
import CurrentWeatherCard from './src/components/CurrentWeatherCard/CurrentWeatherCard';
import { Weather } from './src/types/WeatherTypes';
import { palette } from './src/Styles/Palette';
import { headerText } from './src/Styles/Typography';
import HourlyForecast from './src/components/HourlyForecast/HourlyForecast';
import moment, { Moment } from 'moment';

import {
  useFonts,
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_500Medium_Italic,
  DMSans_700Bold,
  DMSans_700Bold_Italic,
} from '@expo-google-fonts/dm-sans';

export const AppStateContext = createContext<AppStateProviderPropTypes | null>(null);

type AppStateProviderPropTypes = {
  forecast: Weather | undefined;
  date: Moment;
}

export default function App() {
  const [forecast, setForecast] = useState<Weather>();
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(moment());

  let [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_400Regular_Italic,
    DMSans_500Medium,
    DMSans_500Medium_Italic,
    DMSans_700Bold,
    DMSans_700Bold_Italic,
  });

  useEffect(() => {
    loadForecast()
  }, [])

  const loadForecast = async () => {
    setRefreshing(true)
    setForecast(await fetchForecast())
    setDate(moment())
    setRefreshing(false)
  }

  const onRefresh = React.useCallback(async () => {
    loadForecast()
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <AppStateContext.Provider value={{ forecast, date }}>
          <Text style={styles.containerHeaderText}>Weather Forecast</Text>
          <CurrentWeatherCard temp={forecast?.current.temp} weather={forecast?.current.weather[0]} />
          <HourlyForecast hourlyForecast={forecast?.hourly?.slice(0, 24)} />
        </AppStateContext.Provider>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -25,
    backgroundColor: palette.blueDark
  },
  scrollView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerHeaderText: {
    paddingTop: 65,
    paddingBottom: 15,
    fontSize: 20,
    textAlign: 'center',
    ...headerText
  }
});