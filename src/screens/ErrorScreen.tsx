import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader/AppHeader';
import { palette } from '../Styles/Palette';
import type { SavedLocation } from '../store/useLocationStore';
import type { LocationWeatherState } from '../hooks/useMultiLocationWeather';

interface ErrorScreenProps {
  onSettingsPress: () => void;
  errorMessage?: string;
  onRetry: () => void;
  savedLocations: SavedLocation[];
  activeLocationId: string | null;
  onLocationSelect: (id: string) => void;
  locationLoadingStates: Map<string, LocationWeatherState>;
}

export default function ErrorScreen({
  onSettingsPress,
  errorMessage = 'Unable to fetch weather data. Please check your connection and try again.',
  onRetry,
  savedLocations,
  activeLocationId,
  onLocationSelect,
  locationLoadingStates,
}: ErrorScreenProps) {
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
          <Text style={styles.errorTitle}>Unable to Load Weather</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <Text style={styles.supportText}>
            If this happens often, please contact support at{'\n'}
            <Text style={styles.supportEmail}>{process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@eladkarni.solutions'}</Text>
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
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: palette.textColor,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: palette.highlightColor,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: palette.primaryColor,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: palette.textColor,
    fontSize: 16,
    fontWeight: '600',
  },
  supportText: {
    fontSize: 12,
    color: palette.highlightColor,
    textAlign: 'center',
    marginTop: 32,
    opacity: 0.7,
  },
  supportEmail: {
    color: palette.primaryColor,
    fontWeight: '500',
  },
});
