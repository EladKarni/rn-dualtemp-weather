import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import type { SavedLocation } from '../../store/useLocationStore';
import { i18n } from '../../localization/i18n';
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
    <>
      {savedLocations.map((location) => (
        <View key={location.id} style={styles.locationItem}>
          <View style={styles.locationItemInfo}>
            <Text style={styles.locationItemName}>
              {location.isGPS ? `📍 ${i18n.t("CurrentLocation")}` : location.name}
            </Text>
          </View>
          {!location.isGPS && (
            <TouchableOpacity
              onPress={() => handleDeleteLocation(location)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

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
      </TouchableOpacity>
    </>
  );
};
