import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader/AppHeader";
import { i18n } from "../localization/i18n";
import type { SavedLocation } from "../store/useLocationStore";
import type { LocationWeatherState } from "../hooks/useMultiLocationWeather";
import { emptyLocationScreenStyles as styles } from "./EmptyLocationScreen.styles";

interface EmptyLocationScreenProps {
  onAddLocation: () => void;
  onSettingsPress: () => void;
  savedLocations: SavedLocation[];
  activeLocationId: string | null;
  onLocationSelect: (id: string) => void;
  locationLoadingStates: Map<string, LocationWeatherState>;
}

/**
 * Shown when there are no saved locations at all (e.g. GPS permission was
 * denied on first run). Gives the user a direct path to add a city manually
 * without ever granting location access.
 */
export default function EmptyLocationScreen({
  onAddLocation,
  onSettingsPress,
  savedLocations,
  activeLocationId,
  onLocationSelect,
  locationLoadingStates,
}: EmptyLocationScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppHeader
          onSettingsPress={onSettingsPress}
          savedLocations={savedLocations}
          activeLocationId={activeLocationId}
          onLocationSelect={onLocationSelect}
          locationLoadingStates={locationLoadingStates}
        />
        <View style={styles.content}>
          <Text style={styles.title}>{i18n.t("NoLocationTitle")}</Text>
          <Text style={styles.description}>
            {i18n.t("NoLocationDescription")}
          </Text>
          <TouchableOpacity
            onPress={onAddLocation}
            accessibilityRole="button"
            style={styles.addButton}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>{i18n.t("AddLocation")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
