import React, { useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { fetchForecast } from './src/utils/fetchWeather';
import CurrentWeatherCard from './src/components/CurrentWeatherCard/CurrentWeatherCard';
import { Weather } from './src/types/WeatherTypes';

import {
  useFonts,
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_500Medium_Italic,
  DMSans_700Bold,
  DMSans_700Bold_Italic,
} from '@expo-google-fonts/dm-sans';
import { palette } from './src/Styles/Palette';
import { headerText } from './src/Styles/Typography';

const wait = (timeout: number | undefined) => {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export default function App() {
  const [forecast, setForecast] = useState<Weather>();
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(new Date());

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
        <Text style={styles.containerHeaderText}>Weather Forecast</Text>
        <CurrentWeatherCard date={date} temp={forecast?.current.temp} weather={forecast?.current.weather[0]} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
    marginTop: -25,
    backgroundColor: palette.blueDark
  },
  scrollView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerHeaderText: {
    paddingTop: 75,
    paddingBottom: 50,
    fontSize: 20,
    textAlign: 'center',
    ...headerText
  }
});