import React from 'react';
import { SafeAreaView, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader/AppHeader';
import AppFooter from '../components/AppFooter/AppFooter';
import { CachedWeatherDisplay } from '../components/CachedWeatherDisplay/CachedWeatherDisplay';
import { AppStateContext } from '../utils/AppStateContext';
import { palette } from '../Styles/Palette';
import type { Weather } from '../types/WeatherTypes';
import type { AppError } from '../utils/errors';
import type { Moment } from 'moment';

interface CachedWeatherErrorScreenProps {
  forecast: Weather;
  date: Moment;
  tempScale: 'C' | 'F';
  appError: AppError | null;
  onRetry: () => void;
  onDismissError: () => void;
  lastUpdated: Date | undefined;
  refreshing: boolean;
  onRefresh: () => void;
  locationName: string;
  onLocationPress: () => void;
  hasMultipleLocations: boolean;
  onSettingsPress: () => void;
}

/**
 * Screen component that displays cached weather data with an error banner overlay
 * Used when there's a network error but we have cached forecast data to show
 */
export default function CachedWeatherErrorScreen({
  forecast,
  date,
  tempScale,
  appError,
  onRetry,
  onDismissError,
  lastUpdated,
  refreshing,
  onRefresh,
  locationName,
  onLocationPress,
  hasMultipleLocations,
  onSettingsPress,
}: CachedWeatherErrorScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
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
          <CachedWeatherDisplay
            forecast={forecast}
            error={appError}
            onRetry={onRetry}
            onDismissError={onDismissError}
            lastUpdated={lastUpdated}
            tempScale={tempScale}
          />
        </AppStateContext.Provider>
        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryDark,
  },
});
