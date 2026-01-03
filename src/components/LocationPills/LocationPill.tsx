import React from 'react';
import { Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { palette } from '../../Styles/Palette';
import type { SavedLocation } from '../../store/useLocationStore';
import { useLanguageStore } from '../../store/useLanguageStore';

interface LocationPillProps {
  location: SavedLocation;
  isActive: boolean;
  hasData: boolean;
  onPress: () => void;
  opacity?: number;
}

/**
 * Individual location pill button
 * Shows location name with active/inactive styling
 * Memoized to prevent unnecessary re-renders
 */
const LocationPill = React.memo(({ location, isActive, hasData, onPress, opacity = 1 }: LocationPillProps) => {
  const isRTL = useLanguageStore((state) => state.isRTL);

  // Display location name with "(GPS)" appended for GPS location
  const displayName = location.isGPS ? `${location.name} (GPS)` : location.name.split(',')[0];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.pill,
        isRTL && styles.pillRTL,
        isActive && styles.pillActive,
        pressed && styles.pillPressed,
        { opacity },
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
          style={[styles.loader, isRTL && styles.loaderRTL]}
        />
      )}
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (component should NOT re-render)
  return (
    prevProps.location.id === nextProps.location.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.hasData === nextProps.hasData &&
    prevProps.opacity === nextProps.opacity
  );
});

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
  pillRTL: {
    flexDirection: 'row-reverse',
    marginRight: 0,
    marginLeft: 8,
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
  loaderRTL: {
    marginLeft: 0,
    marginRight: 6,
  },
});

export default LocationPill;
