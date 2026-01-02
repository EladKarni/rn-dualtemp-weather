import React from 'react';
import WeatherScreen from './WeatherScreen';
import LocationDropdown from '../components/LocationDropdown/LocationDropdown';
import SettingsScreen from './SettingsScreen';
import AddLocationScreen from './AddLocationScreen';
import type { Weather } from '../types/WeatherTypes';
import type { Moment } from 'moment';

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
  locationName: string;
  onLocationPress: () => void;
  hasMultipleLocations: boolean;
  onSettingsPress: () => void;
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
  locationName,
  onLocationPress,
  hasMultipleLocations,
  onSettingsPress,
}: MainWeatherWithModalsProps) {
  return (
    <>
      <WeatherScreen
        forecast={forecast}
        date={date}
        tempScale={tempScale}
        locationName={locationName}
        onLocationPress={onLocationPress}
        hasMultipleLocations={hasMultipleLocations}
        onSettingsPress={onSettingsPress}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onLayoutRootView={onLayoutRootView}
      />

      <LocationDropdown
        visible={activeModal === 'location'}
        onClose={closeModal}
        onAddLocation={openAddLocation}
      />

      <SettingsScreen
        visible={activeModal === 'settings'}
        onClose={closeModal}
        onAddLocationPress={openAddLocation}
      />

      <AddLocationScreen
        visible={activeModal === 'addLocation'}
        onClose={closeModal}
      />
    </>
  );
}
