import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader/AppHeader';
import { palette } from '../Styles/Palette';

interface LoadingScreenProps {
  locationName: string;
  onLocationPress: () => void;
  hasMultipleLocations: boolean;
  onSettingsPress: () => void;
}

export default function LoadingScreen({
  locationName,
  onLocationPress,
  hasMultipleLocations,
  onSettingsPress,
}: LoadingScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.errorContainer}>
        <AppHeader
          location={locationName}
          onLocationPress={onLocationPress}
          hasMultipleLocations={hasMultipleLocations}
          onSettingsPress={onSettingsPress}
        />
        <View style={styles.errorContent}>
          <Text style={styles.loadingTitle}>Loading Weather...</Text>
          <Text style={styles.loadingMessage}>
            Fetching forecast for {locationName}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryDark,
  },
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.textColor,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingMessage: {
    fontSize: 14,
    color: palette.highlightColor,
    textAlign: 'center',
  },
});
