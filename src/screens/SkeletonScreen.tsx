import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader/AppHeader';
import { WeatherLoadingSkeleton } from '../components/LoadingSkeleton/LoadingSkeleton';
import { skeletonScreenStyles } from '../styles/screens/SkeletonScreen.styles';
import type { SavedLocation } from '../store/useLocationStore';
import type { LocationWeatherState } from '../hooks/useMultiLocationWeather';

interface SkeletonScreenProps {
  onSettingsPress: () => void;
  savedLocations: SavedLocation[];
  activeLocationId: string | null;
  onLocationSelect: (id: string) => void;
  locationLoadingStates: Map<string, LocationWeatherState>;
}

export default function SkeletonScreen({
  onSettingsPress,
  savedLocations,
  activeLocationId,
  onLocationSelect,
  locationLoadingStates,
}: SkeletonScreenProps) {
  return (
    <SafeAreaView style={skeletonScreenStyles.container}>
      <ScrollView>
        <AppHeader
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


