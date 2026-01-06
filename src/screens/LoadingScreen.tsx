import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader/AppHeader";
import type { SavedLocation } from "../store/useLocationStore";
import type { LocationWeatherState } from "../hooks/useMultiLocationWeather";
import { loadingScreenStyles } from "../Styles/screens/LoadingScreen.styles";

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
    <SafeAreaView style={loadingScreenStyles.container}>
      <View style={loadingScreenStyles.errorContainer}>
        <AppHeader
          onSettingsPress={onSettingsPress}
          savedLocations={savedLocations}
          activeLocationId={activeLocationId}
          onLocationSelect={onLocationSelect}
          locationLoadingStates={locationLoadingStates}
        />
        <View style={loadingScreenStyles.errorContent}>
          <Text style={loadingScreenStyles.loadingTitle}>
            Loading Weather...
          </Text>
          <Text style={loadingScreenStyles.loadingMessage}>
            Fetching forecast for {locationName}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
