import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader/AppHeader';
import { errorScreenStyles } from '../styles/screens/ErrorScreen.styles';
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
    <SafeAreaView style={errorScreenStyles.container}>
      <View style={errorScreenStyles.errorContainer}>
        <AppHeader
          onSettingsPress={onSettingsPress}
          savedLocations={savedLocations}
          activeLocationId={activeLocationId}
          onLocationSelect={onLocationSelect}
          locationLoadingStates={locationLoadingStates}
        />
        <View style={errorScreenStyles.errorContent}>
          <Text style={errorScreenStyles.errorTitle}>Unable to Load Weather</Text>
          <Text style={errorScreenStyles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={errorScreenStyles.retryButton} onPress={onRetry}>
            <Text style={errorScreenStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <Text style={errorScreenStyles.supportText}>
            If this happens often, please contact support at{'\n'}
            <Text style={errorScreenStyles.supportEmail}>{process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@eladkarni.solutions'}</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}


