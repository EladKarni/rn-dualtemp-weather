import React from 'react';
import { SafeAreaView, ScrollView, View, RefreshControl, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader/AppHeader';
import LocationPills from '../components/LocationPills/LocationPills';
import CurrentWeatherDisplay from '../components/CurrentWeatherCard/CurrentWeatherDisplay';
import HourlyForecast from '../components/HourlyForecast/HourlyForecast';
import DailyForecast from '../components/DailyForecast/DailyForecast';
import HourlyForecastSkeleton from '../components/HourlyForecast/HourlyForecastSkeleton';
import DailyForecastSkeleton from '../components/DailyForecast/DailyForecastSkeleton';
import AppFooter from '../components/AppFooter/AppFooter';
import { AppStateContext } from '../utils/AppStateContext';
import { palette } from '../Styles/Palette';
import type { Weather } from '../types/WeatherTypes';
import type { Moment } from 'moment';
import type { SavedLocation } from '../store/useLocationStore';
import type { LocationWeatherState } from '../hooks/useMultiLocationWeather';

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
  fetchedLocaleSuccessfully: boolean;
  savedLocations: SavedLocation[];
  activeLocationId: string | null;
  locationLoadingStates: Map<string, LocationWeatherState>;
  onLocationSelect: (id: string) => void;
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
  fetchedLocaleSuccessfully,
  savedLocations,
  activeLocationId,
  locationLoadingStates,
  onLocationSelect,
}: WeatherScreenProps) {
  // Determine if we should show skeleton for hourly/daily forecasts
  // Show skeleton if forecast is still loading (initial load)
  const showForecastSkeleton = refreshing && !forecast?.hourly && !forecast?.daily;

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

            {/* Horizontal scrollable location pills */}
            <LocationPills
              savedLocations={savedLocations}
              activeLocationId={activeLocationId}
              onLocationSelect={onLocationSelect}
              locationLoadingStates={locationLoadingStates}
            />

            {/* Current weather card for active location */}
            <CurrentWeatherDisplay
              temp={forecast.current.temp}
              weather={forecast.current.weather[0]}
            />

            {/* Hourly forecast for active location */}
            {showForecastSkeleton ? (
              <HourlyForecastSkeleton />
            ) : (
              <HourlyForecast hourlyForecast={forecast.hourly?.slice(0, 24)} />
            )}

            {/* Daily forecast for active location */}
            {showForecastSkeleton ? (
              <DailyForecastSkeleton />
            ) : (
              <DailyForecast dailyForecast={forecast.daily} />
            )}
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
