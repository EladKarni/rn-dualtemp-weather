import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader/AppHeader';
import { WeatherLoadingSkeleton } from '../components/LoadingSkeleton/LoadingSkeleton';
import { palette } from '../Styles/Palette';

interface SkeletonScreenProps {
  locationName: string;
  onLocationPress: () => void;
  hasMultipleLocations: boolean;
  onSettingsPress: () => void;
}

export default function SkeletonScreen({
  locationName,
  onLocationPress,
  hasMultipleLocations,
  onSettingsPress,
}: SkeletonScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <AppHeader
          location={locationName}
          onLocationPress={onLocationPress}
          hasMultipleLocations={hasMultipleLocations}
          onSettingsPress={onSettingsPress}
        />
        <WeatherLoadingSkeleton />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryDark,
  },
});
