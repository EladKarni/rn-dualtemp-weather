import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { SavedLocation } from "../../store/useLocationStore";
import { i18n } from "../../localization/i18n";
import { palette } from "../../styles/Palette";
import { spacing } from "../../styles/Spacing";
import { shadowProp } from "../../styles/BoxShadow";
import { DeleteButton } from "./DeleteButton";
import { styles } from "./LocationCard.styles";

interface LocationCardProps {
  location: SavedLocation;
  onDelete: (location: SavedLocation) => void;
  onPress?: (location: SavedLocation) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onDelete,
  onPress,
}) => {
  const handleDelete = () => {
    onDelete(location);
  };

  const handlePress = () => {
    onPress?.(location);
  };

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[palette.primaryLight, palette.primaryColor]}
        style={styles.gradientCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>
            {location.isGPS ? `📍 ${i18n.t("CurrentLocation")}` : location.name}
          </Text>
          {location.isGPS && (
            <Text style={styles.locationSubtitle}>{i18n.t("GPSLocation")}</Text>
          )}
        </View>

        {!location.isGPS && (
          <DeleteButton onPress={handleDelete} size="medium" />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};
