import { useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { logger } from '../utils/logger';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

/**
 * Custom hook to manage splash screen visibility and timeout
 * @param isFetched - Whether the initial data fetch is complete
 * @returns Object containing splash timeout state and layout callback
 */
export function useSplashScreen(isFetched: boolean) {
  const [splashTimeoutExpired, setSplashTimeoutExpired] = useState(false);

  // 3-second timeout to prevent splash screen from being stuck forever
  useEffect(() => {
    const timer = setTimeout(async () => {
      logger.debug('Splash timeout expired (3s), hiding splash screen and showing app UI');
      setSplashTimeoutExpired(true);
      // Hide splash screen after timeout, regardless of what we're rendering
      await SplashScreen.hideAsync();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Callback to hide splash screen when root view is laid out
  const onLayoutRootView = useCallback(async () => {
    if (isFetched) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [isFetched]);

  return { splashTimeoutExpired, onLayoutRootView };
}
