import { useEffect, useRef } from 'react';
import { FlatList } from 'react-native';
import { useLanguageStore } from '../store/useLanguageStore';

/**
 * Custom hook to automatically reset scroll position when RTL direction changes
 *
 * @param data - The data array being displayed in the FlatList
 * @returns An object containing the FlatList ref and scroll-to-index failed handler
 *
 * @example
 * const { flatListRef, handleScrollToIndexFailed } = useScrollPositionReset(hourlyForecast);
 *
 * <FlatList
 *   ref={flatListRef}
 *   data={hourlyForecast}
 *   onScrollToIndexFailed={handleScrollToIndexFailed}
 *   ...
 * />
 */
export const useScrollPositionReset = <T>(data?: T[]) => {
  const isRTL = useLanguageStore((state) => state.isRTL);
  const flatListRef = useRef<FlatList>(null);

  // Reset scroll position when RTL changes
  useEffect(() => {
    if (flatListRef.current && data && data.length > 0) {
      flatListRef.current.scrollToIndex({
        index: 0,
        animated: false,
      });
    }
  }, [isRTL, data]);

  const handleScrollToIndexFailed = (info: { index: number; averageItemLength: number }) => {
    // Fallback: scroll to offset 0 if index fails
    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: false,
    });
  };

  return {
    flatListRef,
    handleScrollToIndexFailed,
  };
};
