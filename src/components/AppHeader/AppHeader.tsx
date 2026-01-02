import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { palette } from "../../Styles/Palette";
import GearIcon from "../GearIcon/GearIcon";
import LocationPills from "../LocationPills/LocationPills";
import type { SavedLocation } from "../../store/useLocationStore";
import type { LocationWeatherState } from "../../hooks/useMultiLocationWeather";

type AppHeaderPropTypes = {
  location: string;
  onLocationPress: () => void;
  hasMultipleLocations?: boolean;
  onSettingsPress: () => void;
  savedLocations: SavedLocation[];
  activeLocationId: string | null;
  locationLoadingStates: Map<string, LocationWeatherState>;
  onLocationSelect: (id: string) => void;
};

const AppHeader = ({
  onSettingsPress,
  savedLocations,
  activeLocationId,
  locationLoadingStates,
  onLocationSelect,
}: AppHeaderPropTypes) => {
  return (
    <View style={styles.headerContainer}>
      {/* Location pills centered */}
      <View style={styles.locationPillsWrapper}>
        <LocationPills
          savedLocations={savedLocations}
          activeLocationId={activeLocationId}
          onLocationSelect={onLocationSelect}
          locationLoadingStates={locationLoadingStates}
        />
      </View>

      {/* Settings gear icon on the right */}
      <TouchableOpacity
        onPress={onSettingsPress}
        style={styles.settingsButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <GearIcon size={28} color={palette.primaryLight} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 15,
  },
  locationPillsWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsButton: {
    position: "absolute",
    right: 20,
    padding: 8,
  },
});

export default AppHeader;
