import React from "react";
import { View, StyleSheet } from "react-native";
import Subtitle from "../Subtitle/Subtitle";
import { SkeletonBox } from "../LoadingSkeleton/SkeletonBox";
import { DailyForecastStyles } from "./DailyForecast.styles";
import { palette } from "../../styles/Palette";
import { i18n } from "../../localization/i18n";

/**
 * Skeleton placeholder for DailyForecast
 * Shows while daily forecast data is loading
 */
const DailyForecastSkeleton = () => {
  // Show 7 skeleton items (typical number of days)
  const skeletonItems = Array.from({ length: 7 }, (_, i) => i);

  return (
    <View style={DailyForecastStyles.container}>
      <Subtitle text={i18n.t("DailyTitle")} />
      {skeletonItems.map((_, index) => (
        <View key={index}>
          <View style={styles.skeletonItem}>
            <SkeletonBox style={styles.day} />
            <View style={styles.itemRight}>
              <SkeletonBox style={styles.icon} />
              <SkeletonBox style={styles.temp} />
            </View>
          </View>
          {index < skeletonItems.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    alignItems: "center",
    height: 50,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  day: {
    height: 18,
    width: 80,
  },
  icon: {
    borderRadius: 15,
    height: 30,
    width: 30,
  },
  temp: {
    height: 18,
    width: 60,
  },
  divider: {
    borderBottomColor: palette.textColor,
    borderBottomWidth: 1,
    paddingVertical: 2,
    marginHorizontal: 15,
    opacity: 0.2,
  },
});

export default DailyForecastSkeleton;
