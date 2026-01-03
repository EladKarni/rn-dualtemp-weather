import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader/AppHeader';
import { palette } from '../Styles/Palette';
import type { SavedLocation } from '../store/useLocationStore';
import type { LocationWeatherState } from '../hooks/useMultiLocationWeather';

interface LoadingScreenProps {
  locationName: string;
  onSettingsPress: () => void;
  savedLocations: SavedLocation[];
  activeLocationId: string | null;
  onLocationSelect: (id: string) => void;
  locationLoadingStates: Map<string, LocationWeatherState>;
}

export default function LoadingScreen({
  locationName,
  onSettingsPress,
  savedLocations,
  activeLocationId,
  onLocationSelect,
  locationLoadingStates,
}: LoadingScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.errorContainer}>
        <AppHeader
          onSettingsPress={onSettingsPress}
          savedLocations={savedLocations}
          activeLocationId={activeLocationId}
          onLocationSelect={onLocationSelect}
          locationLoadingStates={locationLoadingStates}
        />
        <View style={styles.errorContent}>
          <Text style={styles.loadingTitle}>Loading Weather...</Text>
          <Text style={styles.loadingMessage}>
            Fetching forecast for {locationName}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryDark,
  },
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.textColor,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingMessage: {
    fontSize: 14,
    color: palette.highlightColor,
    textAlign: 'center',
  },
});
