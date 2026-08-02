import React from 'react';
import WeatherScreen from './WeatherScreen';
import LocationDropdown from '../components/LocationDropdown/LocationDropdown';
import type { Weather } from '../types/WeatherTypes';
import type { AppError } from '../utils/errors';
import type { Moment } from 'moment';
import type { SavedLocation } from '../store/useLocationStore';
import type { LocationWeatherState } from '../hooks/useMultiLocationWeather';

interface MainWeatherWithModalsProps {
  forecast: Weather;
  date: Moment;
  tempScale: 'C' | 'F';
  refreshing: boolean;
  onRefresh: () => void;
  onLayoutRootView: () => void;
  activeModal: 'location' | 'settings' | 'addLocation' | null;
  closeModal: () => void;
  openAddLocation: () => void;
  onSettingsPress: () => void;
  savedLocations: SavedLocation[];
  activeLocationId: string | null;
  locationLoadingStates: Map<string, LocationWeatherState>;
  onLocationSelect: (id: string) => void;
  appError?: AppError | null;
  onRetry?: () => void;
  onDismissError?: () => void;
}

/**
 * Main screen component that renders the weather display with modal overlays
 * Handles the success state when forecast data is available
 */
export default function MainWeatherWithModals({
  forecast,
  date,
  tempScale,
  refreshing,
  onRefresh,
  onLayoutRootView,
  activeModal,
  closeModal,
  openAddLocation,
  onSettingsPress,
  savedLocations,
  activeLocationId,
  locationLoadingStates,
  onLocationSelect,
  appError,
  onRetry,
  onDismissError,
}: MainWeatherWithModalsProps) {
  return (
    <>
      <WeatherScreen
        forecast={forecast}
        date={date}
        tempScale={tempScale}
        onSettingsPress={onSettingsPress}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onLayoutRootView={onLayoutRootView}
        savedLocations={savedLocations}
        activeLocationId={activeLocationId}
        locationLoadingStates={locationLoadingStates}
        onLocationSelect={onLocationSelect}
        appError={appError}
        onRetry={onRetry}
        onDismissError={onDismissError}
      />

      <LocationDropdown
        visible={activeModal === 'location'}
        onClose={closeModal}
        onAddLocation={openAddLocation}
      />

      {/* SettingsScreen and AddLocationScreen are mounted globally in
          App.tsx so they stay reachable when no forecast is loaded */}
    </>
  );
}
