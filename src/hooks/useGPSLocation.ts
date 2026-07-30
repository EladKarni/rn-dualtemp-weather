import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
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

/** Outcome of reading the device position and persisting it. */
export type GpsAcquireOutcome =
  | { status: 'stored' }
  | { status: 'unchanged' } // below the distance threshold; nothing to write
  | { status: 'failed'; error: AppError };

/**
 * Read the device position and persist it as the GPS location, assuming the
 * foreground permission is already granted.
 *
 * Never throws: every failure comes back as `{ status: 'failed' }` so each
 * caller decides on its own whether it is worth interrupting the user over —
 * the startup effect alerts (subject to shouldInterruptWithGpsAlert), the
 * foreground re-check stays silent, the Settings button always speaks up.
 *
 * Deliberately module-level rather than a member of useGPSLocation: the
 * Settings affordance and the foreground re-check both need it, and mounting a
 * second copy of the hook to reach it would fire a duplicate permission
 * request on startup.
 */
const runGPSAcquisition =
  async (): Promise<GpsAcquireOutcome> => {
    try {
      // Prefer a fresh fix, but fall back to the last known position when the
      // provider can't produce one — a slightly stale location is more useful
      // for a weather app than an error alert. Both failure codes are expected
      // user-environment states (location services off, no fix indoors), so
      // they become warn breadcrumbs rather than Sentry error events.
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
          logger.warn(
            'GPS position unavailable, no last-known fallback:',
            positionError,
          );
          return {
            status: 'failed',
            error:
              positionError.code === 'E_LOCATION_UNAVAILABLE'
                ? new LocationUnavailableError()
                : new PositionTimeoutError(),
          };
        }

        logger.warn(
          'Current GPS fix unavailable, using last-known position:',
          positionError,
        );
        location = lastKnown;
      }

      const { latitude, longitude } = location.coords;

      // Check if user has moved significantly from stored position
      const storedGPS = useLocationStore
        .getState()
        .savedLocations.find((loc) => loc.id === GPS_LOCATION_ID);

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
          return { status: 'unchanged' };
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

      useLocationStore.getState().updateGPSLocation(latitude, longitude, name);

      logger.debug('GPS location updated:', { lat: latitude, lon: longitude, name });
      return { status: 'stored' };
    } catch (error: any) {
      // Only genuinely unexpected failures reach here — the expected
      // location-provider codes are absorbed by the fallback above.
      logger.error('Error fetching GPS location:', error);
      return { status: 'failed', error: toAppError(error) };
    }
  };

/** The acquisition currently running, if any. See acquireAndStoreGPSPosition. */
let inFlightAcquisition: Promise<GpsAcquireOutcome> | null = null;

/**
 * Serialized entry point for the three callers (startup effect, foreground
 * re-check, Settings button): a concurrent caller joins the running attempt
 * instead of starting a second one.
 *
 * Not just an optimization. updateGPSLocation reads the store with get() and
 * *prepends* when it finds no existing GPS entry, so two acquisitions that both
 * observe the empty state write two entries sharing the gps-location id —
 * duplicate React keys, and a find(id) that silently picks one of them. The
 * realistic trigger is startup on Android: dismissing the OS permission dialog
 * fires an AppState 'active' transition, so Effect 3 can begin while Effect 1's
 * own acquisition is still in flight.
 */
export const acquireAndStoreGPSPosition = (): Promise<GpsAcquireOutcome> => {
  if (inFlightAcquisition) {
    return inFlightAcquisition;
  }

  const attempt = runGPSAcquisition();
  inFlightAcquisition = attempt;
  // runGPSAcquisition never rejects, so this only ever clears the slot.
  void attempt.finally(() => {
    if (inFlightAcquisition === attempt) {
      inFlightAcquisition = null;
    }
  });

  return attempt;
};

/**
 * Pure decision for whether returning to the foreground should try to acquire a
 * GPS position. Exported for unit tests.
 *
 * True only when the permission is now granted AND no GPS entry exists — i.e.
 * the user granted access outside the app (system Settings) after the startup
 * request had already been answered. An existing entry is left alone: the
 * startup effect owns keeping it fresh, and re-fetching on every foreground
 * would cost battery for a location that has a 1-mile update threshold anyway.
 */
export const shouldRecoverGpsOnForeground = (
  permissionStatus: string,
  savedLocations: SavedLocation[],
): boolean =>
  permissionStatus === 'granted' && !savedLocations.some((loc) => loc.isGPS);

/** What a user-initiated "use my current location" attempt ended up doing. */
export type GpsRequestResult =
  | 'stored'
  | 'unchanged'
  | 'denied' // the OS prompt was shown and declined; it can be shown again
  | 'blocked' // the OS will not prompt again — device settings is the only route
  | 'failed';

/**
 * User-initiated "use my current location". Requests the foreground permission
 * (showing the OS prompt when the OS still allows one) and, on success,
 * acquires the position.
 *
 * The 'blocked' result is the case that motivated this whole path: once Android
 * records "don't ask again", requestForegroundPermissionsAsync resolves denied
 * *without* showing anything, so a caller that treats it as a plain refusal
 * leaves the user tapping a button that visibly does nothing.
 */
export const requestCurrentLocation = async (): Promise<GpsRequestResult> => {
  let permission: Location.LocationPermissionResponse;
  try {
    permission = await Location.requestForegroundPermissionsAsync();
  } catch (error) {
    logger.error('Location permission request failed:', error);
    return 'failed';
  }

  if (permission.status !== 'granted') {
    return permission.canAskAgain ? 'denied' : 'blocked';
  }

  const outcome = await acquireAndStoreGPSPosition();
  return outcome.status === 'failed' ? 'failed' : outcome.status;
};

/**
 * Custom hook to handle GPS location fetching, permissions, and reverse geocoding.
 *
 * Split into three effects:
 * - Effect 1: Requests the permission once per process, then fetches the device
 *   position and only updates the store if the user has moved more than ~1 mile
 *   from the last stored position.
 * - Effect 2: Re-localizes the GPS location name when the app language changes,
 *   without re-fetching the device position.
 * - Effect 3: On foreground, picks up a permission that was granted outside the
 *   app (system Settings) when no GPS entry exists yet.
 *
 * Mount this exactly once, at the app root — Effect 1 triggers the OS
 * permission prompt. UI that wants to start a GPS acquisition should call the
 * module-level requestCurrentLocation() instead of mounting the hook again.
 *
 * Failures surface to the user through showErrorAlert at the point they happen,
 * not through returned state — nothing downstream renders a GPS error.
 *
 * @returns Whether the initial GPS attempt has settled (granted, denied,
 *   failed, or timed out)
 */
export function useGPSLocation() {
  const updateGPSLocationName = useLocationStore((state) => state.updateGPSLocationName);
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
              // Web: OK re-requests the browser permission (once — see
              // webRepromptAttemptedRef), Cancel falls back to manual entry
              onEnableLocation: webRepromptAttemptedRef.current
                ? undefined
                : () => {
                    webRepromptAttemptedRef.current = true;
                    fetchGPS();
                  },
              onAddManually: () => {
                useModalStore.getState().openAddLocation();
              },
            });
          }

          return;
        }

        const outcome = await acquireAndStoreGPSPosition();

        if (outcome.status === 'failed') {
          if (await shouldShowGpsAlert()) {
            showErrorAlert({
              error: outcome.error,
              onRetry: fetchGPS,
              // A dead GPS strands a no-location user just like a denied
              // permission does — offer the same manual escape.
              onAddManually: () => {
                useModalStore.getState().openAddLocation();
              },
            });
          }

          return;
        }
      } catch (error: any) {
        // Only the permission request itself can still throw out here —
        // acquireAndStoreGPSPosition absorbs its own failures into `outcome`.
        const appError = toAppError(error);

        logger.error('Error requesting location permission:', error);

        if (await shouldShowGpsAlert()) {
          showErrorAlert({
            error: appError,
            onRetry: fetchGPS,
            // Even an unexpected failure strands a no-location user — keep
            // the manual escape here too.
            onAddManually: () => {
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
    // Runs once per process: the OS permission prompt is a one-shot, and every
    // later recovery route is Effect 3 or the Settings affordance.
  }, []);

  // Effect 3: recover when the permission is granted OUTSIDE the app.
  //
  // Effect 1 is the only thing that ever asks the OS, and it runs once per
  // process, so a user who declined at first launch and then granted access in
  // system Settings used to come back to an app that never looked again — with
  // no in-app way to add a current location (the "Enable Location" alert button
  // is web-only, and the alert itself stops appearing once any city is saved).
  // getForegroundPermissionsAsync only reads the current state — it never
  // prompts — so this is safe to run on every foreground.
  useEffect(() => {
    let cancelled = false;
    // Foregrounding can fire in bursts (permission dialog, settings round-trip);
    // one in-flight acquisition at a time is enough.
    let inFlight = false;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active' || inFlight) {
        return;
      }

      inFlight = true;
      void (async () => {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          await waitForLocationHydration();

          if (
            cancelled ||
            !shouldRecoverGpsOnForeground(
              status,
              useLocationStore.getState().savedLocations,
            )
          ) {
            return;
          }

          logger.debug('Location permission granted outside the app; acquiring position');

          // Store-only, and silent either way: the user did not ask for this
          // right now, so a failure must not interrupt them — they still have
          // whatever manual city they were already using. Subscribers re-render
          // off useLocationStore when the entry lands.
          await acquireAndStoreGPSPosition();
        } catch (error) {
          logger.warn('Foreground GPS permission re-check failed:', error);
        } finally {
          inFlight = false;
        }
      })();
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

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

  return { gpsResolved };
}
