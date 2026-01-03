import type { SavedLocation } from '../store/useLocationStore';
import type { LocationWeatherState } from './useMultiLocationWeather';

interface ScreenPropsParams {
  activeLocation: SavedLocation | undefined;
  savedLocations: SavedLocation[];
  openLocationDropdown: () => void;
  openSettings: () => void;
  setActiveLocation: (id: string) => void;
  locationLoadingStates: Map<string, LocationWeatherState>;
}

interface ScreenProps {
  locationName: string;
  onLocationPress: () => void;
  hasMultipleLocations: boolean;
  onSettingsPress: () => void;
  savedLocations: SavedLocation[];
  activeLocationId: string | null;
  onLocationSelect: (id: string) => void;
  locationLoadingStates: Map<string, LocationWeatherState>;
}

/**
 * Custom hook to build common screen props
 * Extracts screen props construction logic from App.tsx
 *
 * @param params - Parameters needed to construct screen props
 * @returns Common props shared across all screen components
 */
export const useScreenProps = ({
  activeLocation,
  savedLocations,
  openLocationDropdown,
  openSettings,
  setActiveLocation,
  locationLoadingStates,
}: ScreenPropsParams): ScreenProps => {
  return {
    locationName: activeLocation?.name || 'Loading...',
    onLocationPress: openLocationDropdown,
    hasMultipleLocations: savedLocations.length > 0,
    onSettingsPress: openSettings,
    savedLocations,
    activeLocationId: activeLocation?.id || null,
    onLocationSelect: setActiveLocation,
    locationLoadingStates,
  };
};
