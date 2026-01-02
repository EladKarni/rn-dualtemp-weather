import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader/AppHeader';
import { WeatherLoadingSkeleton } from '../components/LoadingSkeleton/LoadingSkeleton';
import { palette } from '../Styles/Palette';
import type { SavedLocation } from '../store/useLocationStore';
import type { LocationWeatherState } from '../hooks/useMultiLocationWeather';

interface SkeletonScreenProps {
  locationName: string;
  onLocationPress: () => void;
  hasMultipleLocations: boolean;
  onSettingsPress: () => void;
  savedLocations: SavedLocation[];
  activeLocationId: string | null;
  onLocationSelect: (id: string) => void;
  locationLoadingStates: Map<string, LocationWeatherState>;
}

export default function SkeletonScreen({
  locationName,
  onLocationPress,
  hasMultipleLocations,
  onSettingsPress,
  savedLocations,
  activeLocationId,
  onLocationSelect,
  locationLoadingStates,
}: SkeletonScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <AppHeader
          location={locationName}
          onLocationPress={onLocationPress}
          hasMultipleLocations={hasMultipleLocations}
          onSettingsPress={onSettingsPress}
          savedLocations={savedLocations}
          activeLocationId={activeLocationId}
          onLocationSelect={onLocationSelect}
          locationLoadingStates={locationLoadingStates}
        />
        <WeatherLoadingSkeleton />
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
