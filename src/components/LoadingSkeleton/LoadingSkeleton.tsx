import React from "react";
import { View, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { palette } from "../../styles/Palette";
import { SkeletonBox } from "./SkeletonBox";

interface SkeletonCardProps {
  height?: number;
  width?: number | string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 120,
  width = "100%",
}) => (
  <SkeletonBox style={[styles.skeletonCard, { height, width } as ViewStyle]} />
);

export const WeatherSkeletonCard: React.FC = () => (
  <View style={styles.weatherCardContainer}>
    <SkeletonCard height={180} />
  </View>
);

export const LoadingSpinner: React.FC = () => (
  <ActivityIndicator
    size="large"
    color={palette.highlightColor}
    style={styles.spinner}
  />
);

const styles = StyleSheet.create({
  skeletonCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  weatherCardContainer: {
    marginBottom: 16,
  },
  spinner: {
    marginBottom: 20,
  },
});
