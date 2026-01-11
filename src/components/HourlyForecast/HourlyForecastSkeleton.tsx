import React from "react";
import { View, StyleSheet } from "react-native";
import Subtitle from "../Subtitle/Subtitle";
import { HourlyForecastStyles } from "./HourlyForecast.Styles";
import { palette } from "../../styles/Palette";
import { i18n } from "../../localization/i18n";

/**
 * Skeleton placeholder for HourlyForecast
 * Shows while hourly forecast data is loading
 */
const HourlyForecastSkeleton = () => {
  // Show 6 skeleton items (typical number visible)
  const skeletonItems = Array.from({ length: 6 }, (_, i) => i);

  return (
    <View style={HourlyForecastStyles.container}>
      <Subtitle text={i18n.t("HourlyTitle")} />
      <View style={styles.scrollContainer}>
        {skeletonItems.map((_, index) => (
          <View key={index} style={styles.skeletonItem}>
            <View style={styles.skeletonBox} />
            <View style={[styles.skeletonBox, styles.skeletonIcon]} />
            <View style={styles.skeletonBox} />
            <View style={styles.skeletonBox} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexDirection: "row",
    gap: 10,
  },
  skeletonItem: {
    justifyContent: "space-between",
    alignItems: "center",
    height: 120,
    width: 60,
    gap: 8,
  },
  skeletonBox: {
    backgroundColor: palette.textColor,
    opacity: 0.15,
    borderRadius: 4,
    height: 16,
    width: 40,
  },
  skeletonIcon: {
    height: 40,
    width: 40,
    borderRadius: 20,
  },
});

export default HourlyForecastSkeleton;
