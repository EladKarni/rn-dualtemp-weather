import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { showAlert } from "../../utils/alert";
import type { SavedLocation } from "../../store/useLocationStore";
import { i18n } from "../../localization/i18n";
import { palette } from "../../styles/Palette";
import { requestCurrentLocation } from "../../hooks/useGPSLocation";
import { PermissionDeniedError } from "../../utils/errors";
import {
  showErrorAlert,
  openDeviceSettings,
} from "../ErrorAlert/ErrorAlert";
import { LocationCard } from "./LocationCard";
import { styles } from "./LocationList.styles";

interface LocationListProps {
  savedLocations: SavedLocation[];
  onRemoveLocation: (locationId: string) => void;
  canAddMoreLocations: boolean;
  onAddLocationPress: () => void;
}

export const LocationList: React.FC<LocationListProps> = ({
  savedLocations,
  onRemoveLocation,
  canAddMoreLocations,
  onAddLocationPress,
}) => {
  const [locating, setLocating] = useState(false);
  const hasGPSLocation = savedLocations.some((loc) => loc.isGPS);

  const handleDeleteLocation = (location: SavedLocation) => {
    showAlert(
      i18n.t("DeleteLocation"),
      `${i18n.t("DeleteLocationConfirm")} ${location.name}?`,
      [
        { text: i18n.t("Cancel"), style: "cancel" },
        {
          text: i18n.t("Delete"),
          style: "destructive",
          onPress: () => onRemoveLocation(location.id),
        },
      ]
    );
  };

  const handleUseCurrentLocation = async () => {
    if (locating) {
      return;
    }

    setLocating(true);
    try {
      const result = await requestCurrentLocation();

      // 'denied' needs no alert: the OS prompt was shown and the user answered
      // it, so they already know what happened. 'blocked' is the opposite —
      // nothing appears on screen at all — so it has to be explained.
      if (result === "blocked") {
        showErrorAlert({
          error: new PermissionDeniedError(),
          onOpenSettings: openDeviceSettings,
        });
      } else if (result === "failed") {
        showAlert(i18n.t("Error"), i18n.t("ErrLocationUnavailable"), [
          { text: i18n.t("OK"), style: "cancel" },
        ]);
      }
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.locationsContainer}>
        {savedLocations.map((location) => (
          <LocationCard
            key={location.id}
            location={location}
            onDelete={handleDeleteLocation}
          />
        ))}
      </View>

      {/* Only offered when there is no GPS entry to begin with. This is the
          sole in-app route to one: the startup permission request is a
          one-shot, and its alert stops appearing once any city is saved. */}
      {!hasGPSLocation && (
        <TouchableOpacity
          style={[
            styles.useCurrentLocationButton,
            locating && styles.useCurrentLocationButtonBusy,
          ]}
          onPress={handleUseCurrentLocation}
          disabled={locating}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: locating, busy: locating }}
          accessibilityLabel={i18n.t("UseCurrentLocation")}
        >
          {locating ? (
            <ActivityIndicator
              size="small"
              color={palette.highlightColor}
              accessibilityLabel={i18n.t("Locating")}
            />
          ) : (
            <Text style={styles.useCurrentLocationText}>
              📍 {i18n.t("UseCurrentLocation")}
            </Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.addLocationButton,
          !canAddMoreLocations && styles.addLocationButtonDisabled,
        ]}
        onPress={() => {
          if (canAddMoreLocations) {
            onAddLocationPress();
          }
        }}
        disabled={!canAddMoreLocations}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            canAddMoreLocations
              ? [palette.highlightColor, palette.textColorSecondary]
              : [palette.primaryDark, palette.primaryColor]
          }
          style={styles.addLocationButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text
            style={[
              styles.addLocationButtonText,
              !canAddMoreLocations && styles.addLocationButtonTextDisabled,
            ]}
          >
            + {i18n.t("AddLocation")}
            {!canAddMoreLocations &&
              ` (${savedLocations.filter((loc) => !loc.isGPS).length}/5)`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};
