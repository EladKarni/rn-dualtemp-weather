import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { WeatherIconStyles } from "../WeatherIcon/WeatherIcon.Styles";
import { typography } from "../../Styles/Typography";
import { palette } from "../../Styles/Palette";
import { i18n } from "../../localization/i18n";
import GearIcon from "../GearIcon/GearIcon";
import SettingsScreen from "../../screens/SettingsScreen";

type AppHeaderPropTypes = {
  location: string;
};

const AppHeader = ({ location }: AppHeaderPropTypes) => {
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.mainHeaderTitle}>
        <Text style={[typography.headerText, styles.containerHeaderText]}>
          {i18n.t("Title")}
        </Text>
        <View style={[styles.locationHeader]}>
          <Text style={[typography.headerText, styles.locationText]}>
            {location}
          </Text>
          <Image
            source={require("../../../assets/Images/locationIcon.png")}
            style={WeatherIconStyles.iconTiny}
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={() => setSettingsVisible(true)}
        style={styles.settingsButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <GearIcon size={28} color={palette.primaryLight} />
      </TouchableOpacity>
      <SettingsScreen
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
  },
  mainHeaderTitle: {
    position: "relative",
  },
  containerHeaderText: {
    fontSize: 20,
    textAlign: "center",
  },
  locationText: {
    paddingHorizontal: 5,
  },
  locationHeader: {
    display: "flex",
    flexDirection: "row",
    margin: "auto",
    height: 30,
    marginBottom: 15,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsButton: {
    position: "absolute",
    top: 4,
    right: 20,
    padding: 8,
  },
});

export default AppHeader;
