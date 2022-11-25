import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { fetchForecast } from './src/utils/fetchWeather';
import CurrentWeatherCard from './src/components/CurrentWeatherCard/CurrentWeatherCard';
import { Weather } from './src/types/WeatherTypes';
import { palette } from './src/Styles/Palette';
import { typography } from './src/Styles/Typography';
import HourlyForecast from './src/components/HourlyForecast/HourlyForecast';
import moment from 'moment';

import {
  useFonts,
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_500Medium_Italic,
  DMSans_700Bold,
  DMSans_700Bold_Italic,
} from '@expo-google-fonts/dm-sans';
import DailyForecast from './src/components/DailyForecast/DailyForecast';
import { AppStateContext } from './src/utils/AppStateContext';
import { WeatherIconStyles } from './src/components/WeatherIcon/WeatherIcon.Styles';

export default function App() {
  const [forecast, setForecast] = useState<Weather>();
  const [suburb, setSuburb] = useState<string>('');
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

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();
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
    setRefreshing(true)
    const fetched = await fetchForecast()
    setForecast(fetched?.data);
    setSuburb(fetched?.location.suburb ?? fetched?.location.city);
    setDate(moment())
    setRefreshing(false)
  }

  const onRefresh = React.useCallback(async () => {
    loadForecast()
  }, []);

  if (!fontsLoaded || !appIsReady || !forecast) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View onLayout={onLayoutRootView}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <AppStateContext.Provider value={{ forecast, date }}>
            <Text style={[typography.headerText, styles.containerHeaderText]}>Weather Forecast</Text>
            <View style={styles.locationHeader}>
              <Text style={[typography.headerText, styles.locationText]}>{suburb}</Text>
              <Image source={require('./assets/Images/locationIcon.png')} style={WeatherIconStyles.iconTiny} />
            </View>
            <CurrentWeatherCard temp={forecast.current.temp} weather={forecast.current.weather[0]} />
            <HourlyForecast hourlyForecast={forecast.hourly?.slice(0, 24)} />
            <DailyForecast dailyForecast={forecast.daily} />
          </AppStateContext.Provider>
        </ScrollView>
      </View>
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
    fontSize: 20,
    textAlign: 'center',
  },
  locationText: {
    paddingRight: 5
  },
  locationHeader: {
    margin: 'auto',
    height: 30,
    paddingBottom: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  }
});