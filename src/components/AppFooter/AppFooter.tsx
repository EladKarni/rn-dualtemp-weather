import React from "react";
import { View, Text, StyleSheet } from "react-native";

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
  versionNumber: {
    color: "#777",
    textAlign: "center",
    fontSize: 10,
    marginTop: 5,
  },
});

export default AppFooter;
