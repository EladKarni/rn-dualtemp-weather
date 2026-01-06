import React from "react";
import { View, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { palette } from "../../styles/Palette";

interface SkeletonCardProps {
  height?: number;
  width?: number | string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 120,
  width = "100%",
}) => <View style={[styles.skeleton, { height, width } as ViewStyle]} />;

export const WeatherSkeletonCard: React.FC = () => (
  <View style={styles.weatherCardContainer}>
    <SkeletonCard height={180} />
  </View>
);

export const HourlyForecastSkeleton: React.FC = () => (
  <View style={styles.hourlyContainer}>
    <SkeletonCard height={80} width={60} />
    <SkeletonCard height={80} width={60} />
    <SkeletonCard height={80} width={60} />
    <SkeletonCard height={80} width={60} />
    <SkeletonCard height={80} width={60} />
  </View>
);

export const DailyForecastSkeleton: React.FC = () => (
  <View style={styles.dailyContainer}>
    <SkeletonCard height={50} />
    <SkeletonCard height={50} />
    <SkeletonCard height={50} />
    <SkeletonCard height={50} />
    <SkeletonCard height={50} />
  </View>
);

export const LoadingSpinner: React.FC = () => (
  <ActivityIndicator
    size="large"
    color={palette.highlightColor}
    style={styles.spinner}
  />
);

export const WeatherLoadingSkeleton: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.spinnerContainer}>
      <LoadingSpinner />
    </View>
    <WeatherSkeletonCard />
    <HourlyForecastSkeleton />
    <DailyForecastSkeleton />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  skeleton: {
    backgroundColor: "#e0e0e0",
    borderRadius: 12,
    marginBottom: 16,
  },
  weatherCardContainer: {
    marginBottom: 16,
  },
  hourlyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  dailyContainer: {
    marginBottom: 16,
  },
  spinnerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  spinner: {
    marginBottom: 20,
  },
});
