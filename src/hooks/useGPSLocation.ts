import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { useLocationStore, GPS_LOCATION_ID, type SavedLocation } from '../store/useLocationStore';
import { logger } from '../utils/logger';
import {
  PermissionDeniedError,
  LocationUnavailableError,
  PositionTimeoutError,
  toAppError,
  AppError,
} from '../utils/errors';
import { useLanguageStore } from '../store/useLanguageStore';
import { useModalStore, type ModalType } from '../store/useModalStore';
import { i18n } from '../localization/i18n';
import { showErrorAlert, openDeviceSettings } from '../components/ErrorAlert/ErrorAlert';
import { getDistanceKm } from '../utils/geocoding';

const GPS_DISTANCE_THRESHOLD_KM = 1.6; // ~1 mile
const GPS_RESOLVE_TIMEOUT_MS = 15000; // escape hatch if the position fetch hangs
// The permission request itself can also hang: expo-location's web
// implementation resolves the prompt-state request only from a
// navigator.geolocation callback, and Firefox invokes neither callback when
// the user dismisses the prompt. Coarser than the position bound because time
// spent looking at a (real) permission dialog counts toward it.
const GPS_PERMISSION_TIMEOUT_MS = 30000;
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
 * Pure decision for whether a GPS failure is worth an app-modal alert.
 * Exported for unit tests.
 *
 * - A manually saved city means the app works without GPS — no interruption.
 * - The Add Location modal being open means the user is ALREADY performing the
 *   alert's own recovery action; RN's Alert is app-modal and would land on top
 *   of the city search and swallow taps (observed on-device 2026-07-28) — no
 *   interruption. The empty-location screen behind the modal remains the
 *   fallback surface if they cancel out.
 * - Settings being open deliberately still alerts: the permission alert's
 *   "Open Settings" action is meaningful there.
 */
export const shouldInterruptWithGpsAlert = (
  savedLocations: SavedLocation[],
  activeModal: ModalType,
): boolean => {
  if (activeModal === 'addLocation') {
    return false;
  }
  return !savedLocations.some((loc) => !loc.isGPS);
};

/**
 * Async gate used by the failure paths: waits (bounded) for store hydration so
 * the decision sees real data, then applies shouldInterruptWithGpsAlert.
 */
const shouldShowGpsAlert = async (): Promise<boolean> => {
  await waitForLocationHydration();
  return shouldInterruptWithGpsAlert(
    useLocationStore.getState().savedLocations,
    useModalStore.getState().activeModal,
  );
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
  // Web can hard-block geolocation, in which case a re-request resolves
  // 'denied' instantly with no prompt — offering "Enable Location" again would
  // just re-open the same dialog in a tight loop. One re-request, then the
  // alert degrades to the manual-entry path only.
  const webRepromptAttemptedRef = useRef(false);

  // Effect 1: GPS position fetch with distance-based freshness check
  useEffect(() => {
    let permissionTimer: ReturnType<typeof setTimeout> | null = null;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchGPS = async () => {
      // Bound the permission request itself (see GPS_PERMISSION_TIMEOUT_MS):
      // a dismissed-but-unsettled browser prompt must not strand a
      // zero-location user on the skeleton with no path to the empty state.
      permissionTimer = setTimeout(
        () => setGpsResolved(true),
        GPS_PERMISSION_TIMEOUT_MS,
      );

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (permissionTimer) clearTimeout(permissionTimer);

        // Permission has settled; a hung position fetch can still keep the
        // app in limbo, so bound that too — tighter, since no dialog time is
        // included (getCurrentPositionAsync has no timeout of its own).
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
              // Web: OK re-requests the browser permission (once — see
              // webRepromptAttemptedRef), Cancel falls back to manual entry
              onEnableLocation: webRepromptAttemptedRef.current
                ? undefined
                : () => {
                    webRepromptAttemptedRef.current = true;
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

        // Prefer a fresh fix, but fall back to the last known position when the
        // provider can't produce one — a slightly stale location is more useful
        // for a weather app than an error alert. Both failure codes are expected
        // user-environment states (location services off, no fix indoors), so
        // they become warn breadcrumbs rather than Sentry error events — the
        // same treatment the permission-denied branch above gets.
        let location: Location.LocationObject;
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (positionError: any) {
          if (
            positionError?.code !== 'E_LOCATION_UNAVAILABLE' &&
            positionError?.code !== 'E_LOCATION_TIMEOUT'
          ) {
            throw positionError;
          }

          const lastKnown = await Location.getLastKnownPositionAsync();

          if (!lastKnown) {
            const appError =
              positionError.code === 'E_LOCATION_UNAVAILABLE'
                ? new LocationUnavailableError()
                : new PositionTimeoutError();

            setGpsError(appError);
            logger.warn('GPS position unavailable, no last-known fallback:', positionError);

            if (await shouldShowGpsAlert()) {
              showErrorAlert({
                error: appError,
                onRetry: fetchGPS,
                onDismiss: () => setGpsError(null),
                // A dead GPS strands a no-location user just like a denied
                // permission does — offer the same manual escape.
                onAddManually: () => {
                  setGpsError(null);
                  useModalStore.getState().openAddLocation();
                },
              });
            }

            return;
          }

          logger.warn('Current GPS fix unavailable, using last-known position:', positionError);
          location = lastKnown;
        }

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
          // Localized fallback: Effect 2 re-geocodes on language change, so a
          // stored fallback name doesn't go stale in the old language.
          name = locationInfo[0]?.city || locationInfo[0]?.name || i18n.t('CurrentLocation');
          logger.debug('Location name from Expo reverse geocoding:', name);
        } catch (geocodeError) {
          logger.warn('Reverse geocoding failed, using fallback:', geocodeError);
          name = i18n.t('CurrentLocation');
        }

        updateGPSLocation(latitude, longitude, name);

        logger.debug('GPS location updated:', { lat: latitude, lon: longitude, name });
        setGpsError(null);
      } catch (error: any) {
        // Only genuinely unexpected failures reach here — the expected
        // location-provider codes are absorbed by the fallback above.
        const appError = toAppError(error);

        setGpsError(appError);
        logger.error('Error fetching GPS location:', error);

        if (await shouldShowGpsAlert()) {
          showErrorAlert({
            error: appError,
            onRetry: fetchGPS,
            onDismiss: () => setGpsError(null),
            // Even an unexpected failure strands a no-location user — keep
            // the manual escape here too.
            onAddManually: () => {
              setGpsError(null);
              useModalStore.getState().openAddLocation();
            },
          });
        }
      }
    };

    fetchGPS().finally(() => {
      if (permissionTimer) clearTimeout(permissionTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
      setGpsResolved(true);
    });

    return () => {
      if (permissionTimer) clearTimeout(permissionTimer);
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
        const name = locationInfo[0]?.city || locationInfo[0]?.name || i18n.t('CurrentLocation');
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
