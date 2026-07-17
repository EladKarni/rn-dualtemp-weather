import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader/AppHeader";
import type { SavedLocation } from "../store/useLocationStore";
import type { LocationWeatherState } from "../hooks/useMultiLocationWeather";
import { errorScreenStyles } from "../styles/screens/ErrorScreen.styles";
import { i18n } from "../localization/i18n";

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
  // Default is localized at render (call time); a caller-supplied message wins.
  errorMessage = i18n.t("ErrorDefaultMessage"),
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
          <Text style={errorScreenStyles.errorTitle}>
            {i18n.t("ErrorTitle")}
          </Text>
          <Text style={errorScreenStyles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity
            style={errorScreenStyles.retryButton}
            onPress={onRetry}
          >
            <Text style={errorScreenStyles.retryButtonText}>{i18n.t("Retry")}</Text>
          </TouchableOpacity>
          <Text style={errorScreenStyles.supportText}>
            {i18n.t("ErrorSupport")}{"\n"}
            <Text style={errorScreenStyles.supportEmail}>
              {process.env.EXPO_PUBLIC_SUPPORT_EMAIL ||
                "support@eladkarni.solutions"}
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
