import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '../store/useLocationStore';
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

/**
 * Custom hook to handle GPS location fetching, permissions, and reverse geocoding
 * @returns Object containing GPS error state and refetch function
 */
export function useGPSLocation() {
  const updateGPSLocation = useLocationStore((state) => state.updateGPSLocation);
  const [gpsError, setGpsError] = useState<AppError | null>(null);
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);

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

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Get clean location name using Expo's reverse geocoding
        let name: string = 'Current Location';
        try {
          const locationInfo = await Location.reverseGeocodeAsync(location.coords);
          name = locationInfo[0]?.city || locationInfo[0]?.name || 'Current Location';
          logger.debug('Location name from Expo reverse geocoding:', name);
        } catch (geocodeError) {
          // Fallback to generic name if reverse geocoding fails
          logger.warn('Reverse geocoding failed, using fallback:', geocodeError);
          name = 'Current Location';
        }

        updateGPSLocation(
          location.coords.latitude,
          location.coords.longitude,
          name
        );

        logger.debug('GPS location updated:', {
          lat: location.coords.latitude,
          lon: location.coords.longitude,
          name,
        });

        setGpsError(null); // Clear any previous errors
      } catch (error: any) {
        let appError: AppError;

        // Map specific location errors
        if (error.code === 'E_LOCATION_UNAVAILABLE') {
          appError = new LocationUnavailableError();
        } else if (error.code === 'E_LOCATION_TIMEOUT') {
          appError = new PositionTimeoutError();
        } else {
          appError = toAppError(error);
        }

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
  }, [updateGPSLocation, selectedLanguage]);

  return { gpsError };
}