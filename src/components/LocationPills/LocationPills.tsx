import React, { useCallback, useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, Dimensions } from 'react-native';
import LocationPill from './LocationPill';
import type { SavedLocation } from '../../store/useLocationStore';
import type { LocationWeatherState } from '../../hooks/useMultiLocationWeather';
import { useLanguageStore } from '../../store/useLanguageStore';

interface LocationPillsProps {
  savedLocations: SavedLocation[];
  activeLocationId: string | null;
  onLocationSelect: (locationId: string) => void;
  locationLoadingStates: Map<string, LocationWeatherState>;
}

/**
 * Horizontal scrollable list of location pills
 * Similar to hourly forecast - allows selecting between saved locations
 */
const LocationPills = ({
  savedLocations,
  activeLocationId,
  onLocationSelect,
  locationLoadingStates,
}: LocationPillsProps) => {
  const flatListRef = useRef<FlatList<SavedLocation>>(null);
  const isRTL = useLanguageStore((state) => state.isRTL);

  const renderPill = useCallback(
    ({ item, index }: { item: SavedLocation; index: number }) => {
      const loadingState = locationLoadingStates.get(item.id);
      const hasData = loadingState?.hasCurrentWeather || false;
      
      // RTL-aware fade effect
      const screenWidth = Dimensions.get('window').width;
      const fadeZone = 60;
      const fadeStart = screenWidth - fadeZone;

      const pillWidth = 100;
      const estimatedPosition = index * pillWidth + 40;

      let opacity = 1;
      // In RTL, fade pills on the LEFT side; in LTR, fade on RIGHT side
      const shouldFade = isRTL
        ? estimatedPosition < fadeZone
        : estimatedPosition > fadeStart;

      if (shouldFade) {
        opacity = isRTL
          ? Math.max(0.3, estimatedPosition / fadeZone)
          : Math.max(0.3, 1 - (estimatedPosition - fadeStart) / fadeZone);
      }

      return (
        <LocationPill
          location={item}
          isActive={item.id === activeLocationId}
          hasData={hasData}
          onPress={() => onLocationSelect(item.id)}
          opacity={opacity}
        />
      );
    },
    [activeLocationId, locationLoadingStates, onLocationSelect, isRTL]
  );

  const keyExtractor = useCallback((item: SavedLocation) => item.id, []);

  // Scroll to active location when it changes
  useEffect(() => {
    const activeIndex = savedLocations.findIndex(loc => loc.id === activeLocationId);
    if (activeIndex >= 0 && flatListRef.current) {
      // Small delay to ensure FlatList is ready
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: activeIndex,
          animated: true,
          viewPosition: 0.5, // Center the item
        });
      }, 100);
    }
  }, [activeLocationId, savedLocations]);

  // Don't show pills if no locations
  if (savedLocations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        horizontal
        inverted={isRTL}
        data={savedLocations}
        renderItem={renderPill}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsContainer}
        onScrollToIndexFailed={(info) => {
          // Fallback if scrollToIndex fails
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.5,
            });
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 8,
  },
  pillsContainer: {
    paddingVertical: 4,
  },
});

export default LocationPills;
