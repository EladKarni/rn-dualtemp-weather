import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Constants from "expo-constants";

const AppFooter = () => {
  // Read the version from app config (single source of truth); fall back to the
  // current shipped version if the manifest is unavailable.
  const version = Constants.expoConfig?.version ?? "2.2.0";

  return (
    <View style={styles.footerContainer}>
      <Text style={styles.versionNumber}>Version: {version}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    alignItems: "center",
    paddingVertical: 5,
  },
  versionNumber: {
    color: "#777",
    textAlign: "center",
    fontSize: 10,
    marginTop: 5,
  },
});

export default AppFooter;
