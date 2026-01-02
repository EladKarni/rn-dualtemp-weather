import React from 'react';
import { SafeAreaView, ScrollView, View, RefreshControl, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader/AppHeader';
import CurrentWeatherCard from '../components/CurrentWeatherCard/CurrentWeatherCard';
import HourlyForecast from '../components/HourlyForecast/HourlyForecast';
import DailyForecast from '../components/DailyForecast/DailyForecast';
import AppFooter from '../components/AppFooter/AppFooter';
import { AppStateContext } from '../utils/AppStateContext';
import { palette } from '../Styles/Palette';
import type { Weather } from '../types/WeatherTypes';
import type { Moment } from 'moment';

interface WeatherScreenProps {
  forecast: Weather;
  date: Moment;
  tempScale: 'C' | 'F';
  locationName: string;
  onLocationPress: () => void;
  hasMultipleLocations: boolean;
  onSettingsPress: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  onLayoutRootView?: () => void;
}

export default function WeatherScreen({
  forecast,
  date,
  tempScale,
  locationName,
  onLocationPress,
  hasMultipleLocations,
  onSettingsPress,
  refreshing,
  onRefresh,
  onLayoutRootView,
}: WeatherScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View onLayout={onLayoutRootView}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <AppStateContext.Provider value={{ forecast, date, tempScale }}>
            <AppHeader
              location={locationName}
              onLocationPress={onLocationPress}
              hasMultipleLocations={hasMultipleLocations}
              onSettingsPress={onSettingsPress}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryDark,
  },
});
