import React from "react";
import { View, Text, StyleSheet, Linking, Image } from "react-native";
import { palette } from "../../styles/Palette";
import { i18n } from "../../localization/i18n";

const AppFooter = () => {
  return (
    <View style={styles.footerContainer}>
      <Text style={styles.versionNumber}>Version: 2.1.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    alignItems: "center",
    paddingVertical: 5,
  },
  geoapifyText: {
    color: palette.highlightColor,
    textAlign: "center",
  },
  openweatherText: {
    color: palette.highlightColor,
    textAlign: "center",
  },
  linkText: {
    color: palette.primaryLight,
    textAlign: "center",
  },
  weatherLogo: {
    width: 150,
    height: 100,
  },
  versionNumber: {
    color: "#777",
    textAlign: "center",
    fontSize: 10,
    marginTop: 5,
  },
});

export default AppFooter;
