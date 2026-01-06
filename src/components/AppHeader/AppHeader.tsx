import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { palette } from "../../styles/Palette";
import GearIcon from "../GearIcon/GearIcon";
import LocationPills from "../LocationPills/LocationPills";
import type { SavedLocation } from "../../store/useLocationStore";
import type { LocationWeatherState } from "../../hooks/useMultiLocationWeather";
import { useLanguageStore } from "../../store/useLanguageStore";

type AppHeaderProps = {
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
}: AppHeaderProps) => {
  const isRTL = useLanguageStore((state) => state.isRTL);

  return (
    <View style={[styles.headerContainer, isRTL && styles.headerContainerRTL]}>
      <View
        style={[
          styles.locationPillsWrapper,
          isRTL && styles.locationPillsWrapperRTL,
        ]}
      >
        <LocationPills
          savedLocations={savedLocations}
          activeLocationId={activeLocationId}
          onLocationSelect={onLocationSelect}
          locationLoadingStates={locationLoadingStates}
        />
      </View>

      {/* Settings gear icon with dedicated space */}
      <TouchableOpacity
        onPress={onSettingsPress}
        style={[styles.settingsButton, isRTL && styles.settingsButtonRTL]}
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
    paddingBottom: 15,
    paddingLeft: 20, // Match app margins
  },
  headerContainerRTL: {
    flexDirection: "row-reverse",
    paddingLeft: 20, // Give space for gear icon on left in RTL
    paddingRight: 20, // Match app margins
  },
  locationPillsWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 60, // Give space for gear icon
  },
  locationPillsWrapperRTL: {
    paddingRight: 0,
    paddingLeft: 60, // Give space for gear icon on left in RTL
  },
  settingsButton: {
    position: "absolute",
    right: 20,
    paddingHorizontal: 8,
  },
  settingsButtonRTL: {
    right: undefined,
    left: 20,
  },
});

export default AppHeader;
