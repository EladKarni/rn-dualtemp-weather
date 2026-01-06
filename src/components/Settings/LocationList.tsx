import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { SavedLocation } from '../../store/useLocationStore';
import { i18n } from '../../localization/i18n';
import { palette } from '../../Styles/Palette';
import { spacing } from '../../Styles/Spacing';
import { shadowProp } from '../../Styles/BoxShadow';
import { LocationCard } from './LocationCard';
import { styles } from './LocationList.styles';

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
  const handleDeleteLocation = (location: SavedLocation) => {
    Alert.alert(
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
