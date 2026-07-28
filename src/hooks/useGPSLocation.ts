import { useEffect, useRef, useState } from 'react';
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
import { showErrorAlert, openDeviceSettings } from '../components/ErrorAlert/ErrorAlert';
import { getDistanceKm } from '../utils/geocoding';

const GPS_DISTANCE_THRESHOLD_KM = 1.6; // ~1 mile

/**
 * Custom hook to handle GPS location fetching, permissions, and reverse geocoding.
 *
 * Split into two effects:
 * - Effect 1: Fetches device GPS position and only updates the store if the user
 *   has moved more than ~1 mile from the last stored position.
 * - Effect 2: Re-localizes the GPS location name when the app language changes,
 *   without re-fetching the device position.
 *
 * @returns Object containing GPS error state
 */
export function useGPSLocation() {
  const updateGPSLocation = useLocationStore((state) => state.updateGPSLocation);
  const updateGPSLocationName = useLocationStore((state) => state.updateGPSLocationName);
  const [gpsError, setGpsError] = useState<AppError | null>(null);
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const initialLanguageRef = useRef(selectedLanguage);

  // Effect 1: GPS position fetch with distance-based freshness check
  useEffect(() => {
    const fetchGPS = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          const error = new PermissionDeniedError();
          setGpsError(error);

          showErrorAlert({
            error,
            onOpenSettings: openDeviceSettings,
            onDismiss: () => setGpsError(null),
          });

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

            showErrorAlert({
              error: appError,
              onRetry: fetchGPS,
              onDismiss: () => setGpsError(null),
            });

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
        // Only genuinely unexpected failures reach here — the expected
        // location-provider codes are absorbed by the fallback above.
        const appError = toAppError(error);

        setGpsError(appError);
        logger.error('Error fetching GPS location:', error);

        showErrorAlert({
          error: appError,
          onRetry: fetchGPS,
          onDismiss: () => setGpsError(null),
        });
      }
    };

    fetchGPS();
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

  return { gpsError };
}
