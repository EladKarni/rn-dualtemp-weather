import React from 'react';
import { Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { palette } from '../../Styles/Palette';
import type { SavedLocation } from '../../store/useLocationStore';

interface LocationPillProps {
  location: SavedLocation;
  isActive: boolean;
  hasData: boolean;
  onPress: () => void;
}

/**
 * Individual location pill button
 * Shows location name with active/inactive styling
 */
const LocationPill = ({ location, isActive, hasData, onPress }: LocationPillProps) => {
  // Display location name with "(GPS)" appended for GPS location
  const displayName = location.isGPS ? `${location.name} (GPS)` : location.name.split(',')[0];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.pill,
        isActive && styles.pillActive,
        pressed && styles.pillPressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
        {displayName}
      </Text>
      {!hasData && (
        <ActivityIndicator
          size="small"
          color={isActive ? palette.primaryDark : palette.textColor}
          style={styles.loader}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: palette.textColor + '60', // 60% opacity border
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: palette.highlightColor,
    borderColor: palette.highlightColor,
  },
  pillPressed: {
    opacity: 0.7,
  },
  pillText: {
    color: palette.textColor,
    fontSize: 14,
  },
  pillTextActive: {
    fontWeight: 'bold',
    color: palette.primaryDark, // Contrast with highlight color
  },
  loader: {
    marginLeft: 6,
  },
});

export default LocationPill;
