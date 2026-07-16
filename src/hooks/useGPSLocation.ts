import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { useLocationStore, GPS_LOCATION_ID } from '../store/useLocationStore';
import { logger } from '../utils/logger';
import {
  PermissionDeniedError,
  LocationUnavailableError,
  PositionTimeoutError,
  toAppError,
  AppError,
} from '../utils/errors';
import { useLanguageStore } from '../store/useLanguageStore';
import { useModalStore } from '../store/useModalStore';
import { showErrorAlert, openDeviceSettings } from '../components/ErrorAlert/ErrorAlert';
import { getDistanceKm } from '../utils/geocoding';

const GPS_DISTANCE_THRESHOLD_KM = 1.6; // ~1 mile
const GPS_RESOLVE_TIMEOUT_MS = 15000; // escape hatch if the position fetch hangs
const HYDRATION_WAIT_TIMEOUT_MS = 3000;

/**
 * Waits (bounded) for the persisted location store to finish rehydrating so
 * alert decisions are made against real data, not the initial empty state.
 */
const waitForLocationHydration = async (): Promise<void> => {
  if (useLocationStore.persist.hasHydrated()) return;
  await new Promise<void>((resolve) => {
    let unsubscribe: (() => void) | undefined;
    const timer = setTimeout(() => {
      unsubscribe?.();
      resolve();
    }, HYDRATION_WAIT_TIMEOUT_MS);
    unsubscribe = useLocationStore.persist.onFinishHydration(() => {
      clearTimeout(timer);
      unsubscribe?.();
      resolve();
    });
    // Hydration may have finished between the check above and subscribing
    if (useLocationStore.persist.hasHydrated()) {
      clearTimeout(timer);
      unsubscribe();
      resolve();
    }
  });
};

/**
 * GPS failure alerts are only worth an interruption when the user has no
 * manually saved city to fall back on. GPS-only users still get alerted —
 * their only data source just broke.
 */
const shouldShowGpsAlert = async (): Promise<boolean> => {
  await waitForLocationHydration();
  return !useLocationStore
    .getState()
    .savedLocations.some((loc) => !loc.isGPS);
};

/**
 * Custom hook to handle GPS location fetching, permissions, and reverse geocoding.
 *
 * Split into two effects:
 * - Effect 1: Fetches device GPS position and only updates the store if the user
 *   has moved more than ~1 mile from the last stored position.
 * - Effect 2: Re-localizes the GPS location name when the app language changes,
 *   without re-fetching the device position.
 *
 * @returns Object containing GPS error state and whether the initial GPS
 *   attempt has settled (granted, denied, failed, or timed out)
 */
export function useGPSLocation() {
  const updateGPSLocation = useLocationStore((state) => state.updateGPSLocation);
  const updateGPSLocationName = useLocationStore((state) => state.updateGPSLocationName);
  const [gpsError, setGpsError] = useState<AppError | null>(null);
  const [gpsResolved, setGpsResolved] = useState(false);
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const initialLanguageRef = useRef(selectedLanguage);

  // Effect 1: GPS position fetch with distance-based freshness check
  useEffect(() => {
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchGPS = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        // Permission has settled; from here only a hung position fetch can
        // keep the app in limbo, so bound it. Armed after the permission
        // request so time spent on the OS dialog doesn't eat the window
        // (getCurrentPositionAsync has no timeout of its own).
        safetyTimer = setTimeout(
          () => setGpsResolved(true),
          GPS_RESOLVE_TIMEOUT_MS,
        );

        if (status !== 'granted') {
          const error = new PermissionDeniedError();
          setGpsError(error);

          if (Platform.OS === 'web') {
            // Web: a denied permission means the persisted GPS position can
            // never update again — drop it so the app doesn't keep showing
            // weather for a location the user never shared this session
            await waitForLocationHydration();
            useLocationStore.getState().removeGPSLocation();
          }

          if (await shouldShowGpsAlert()) {
            showErrorAlert({
              error,
              onOpenSettings: openDeviceSettings,
              onDismiss: () => setGpsError(null),
              // Web: OK re-requests the browser permission, Cancel falls
              // back to manual city entry
              onEnableLocation: () => {
                setGpsError(null);
                fetchGPS();
              },
              onAddManually: () => {
                setGpsError(null);
                useModalStore.getState().openAddLocation();
              },
            });
          }

          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;

        // Check if user has moved significantly from stored position
        const storedGPS = useLocationStore.getState().savedLocations.find(
          (loc) => loc.id === GPS_LOCATION_ID
        );

        if (storedGPS) {
          const distance = getDistanceKm(
            latitude, longitude,
            storedGPS.latitude, storedGPS.longitude
          );

          if (distance < GPS_DISTANCE_THRESHOLD_KM) {
            logger.debug('GPS distance below threshold, skipping update:', {
              distanceKm: distance.toFixed(2),
              thresholdKm: GPS_DISTANCE_THRESHOLD_KM,
            });
            setGpsError(null);
            return;
          }

          logger.debug('GPS moved beyond threshold, updating:', {
            distanceKm: distance.toFixed(2),
          });
        }

        // Position is new or has moved — reverse geocode and update store
        let name: string;
        try {
          const locationInfo = await Location.reverseGeocodeAsync(location.coords);
          name = locationInfo[0]?.city || locationInfo[0]?.name || 'Current Location';
          logger.debug('Location name from Expo reverse geocoding:', name);
        } catch (geocodeError) {
          logger.warn('Reverse geocoding failed, using fallback:', geocodeError);
          name = 'Current Location';
        }

        updateGPSLocation(latitude, longitude, name);

        logger.debug('GPS location updated:', { lat: latitude, lon: longitude, name });
        setGpsError(null);
      } catch (error: any) {
        let appError: AppError;

        if (error.code === 'E_LOCATION_UNAVAILABLE') {
          appError = new LocationUnavailableError();
        } else if (error.code === 'E_LOCATION_TIMEOUT') {
          appError = new PositionTimeoutError();
        } else {
          appError = toAppError(error);
        }

        setGpsError(appError);
        logger.error('Error fetching GPS location:', error);

        if (await shouldShowGpsAlert()) {
          showErrorAlert({
            error: appError,
            onRetry: fetchGPS,
            onDismiss: () => setGpsError(null),
            // A GPS timeout/unavailable failure strands a no-location user just
            // like a denied permission does — offer the same manual escape.
            onAddManually: () => {
              setGpsError(null);
              useModalStore.getState().openAddLocation();
            },
          });
        }
      }
    };

    fetchGPS().finally(() => {
      if (safetyTimer) clearTimeout(safetyTimer);
      setGpsResolved(true);
    });

    return () => {
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [updateGPSLocation]);

  // Effect 2: Re-localize GPS name when language changes (no device GPS fetch)
  useEffect(() => {
    // Skip on initial mount — Effect 1 handles the first geocode
    if (selectedLanguage === initialLanguageRef.current) {
      return;
    }

    const relocalizeGPSName = async () => {
      const storedGPS = useLocationStore.getState().savedLocations.find(
        (loc) => loc.id === GPS_LOCATION_ID
      );

      if (!storedGPS) {
        return; // No GPS location yet — Effect 1 will handle it
      }

      try {
        const locationInfo = await Location.reverseGeocodeAsync({
          latitude: storedGPS.latitude,
          longitude: storedGPS.longitude,
        });
        const name = locationInfo[0]?.city || locationInfo[0]?.name || 'Current Location';
        updateGPSLocationName(name);
        logger.debug('GPS location name re-localized for language change:', name);
      } catch (error) {
        logger.warn('Failed to re-localize GPS name:', error);
      }
    };

    relocalizeGPSName();
  }, [selectedLanguage, updateGPSLocationName]);

  return { gpsError, gpsResolved };
}
