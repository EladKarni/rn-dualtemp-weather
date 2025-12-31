import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  addedAt: number;
  isGPS: boolean;
}

interface LocationState {
  savedLocations: SavedLocation[];
  activeLocationId: string | null;

  addLocation: (location: Omit<SavedLocation, "id" | "addedAt" | "isGPS">) => void;
  removeLocation: (id: string) => void;
  setActiveLocation: (id: string) => void;
  updateGPSLocation: (latitude: number, longitude: number, name: string) => void;
  getActiveLocation: () => SavedLocation | null;
  canAddMoreLocations: () => boolean;
}

const GPS_LOCATION_ID = "gps-location";
const MAX_SAVED_LOCATIONS = 5;

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      savedLocations: [],
      activeLocationId: GPS_LOCATION_ID,

      addLocation: (location) => {
        const state = get();

        // Check if we've reached the limit (excluding GPS location)
        const nonGPSLocations = state.savedLocations.filter(loc => !loc.isGPS);
        if (nonGPSLocations.length >= MAX_SAVED_LOCATIONS) {
          console.warn("Maximum locations reached");
          return;
        }

        // Check for duplicate locations (within ~1km radius)
        const isDuplicate = state.savedLocations.some((loc) => {
          const latDiff = Math.abs(loc.latitude - location.latitude);
          const lonDiff = Math.abs(loc.longitude - location.longitude);
          return latDiff < 0.01 && lonDiff < 0.01; // Roughly 1km
        });

        if (isDuplicate) {
          console.warn("Location already saved");
          return;
        }

        const newLocation: SavedLocation = {
          ...location,
          id: `location-${Date.now()}`,
          addedAt: Date.now(),
          isGPS: false,
        };

        set({
          savedLocations: [...state.savedLocations, newLocation],
        });
      },

      removeLocation: (id) => {
        const state = get();

        // Prevent removing GPS location
        if (id === GPS_LOCATION_ID) {
          console.warn("Cannot remove GPS location");
          return;
        }

        const filteredLocations = state.savedLocations.filter(
          (loc) => loc.id !== id
        );

        // If removing the active location, switch to GPS
        const newActiveId = state.activeLocationId === id
          ? GPS_LOCATION_ID
          : state.activeLocationId;

        set({
          savedLocations: filteredLocations,
          activeLocationId: newActiveId,
        });
      },

      setActiveLocation: (id) => {
        console.log('[LocationStore] setActiveLocation called with id:', id);
        console.log('[LocationStore] Current activeLocationId before set:', get().activeLocationId);
        set({ activeLocationId: id });
        console.log('[LocationStore] activeLocationId after set:', get().activeLocationId);
      },

      updateGPSLocation: (latitude, longitude, name) => {
        const state = get();
        const existingGPS = state.savedLocations.find(
          (loc) => loc.id === GPS_LOCATION_ID
        );

        const gpsLocation: SavedLocation = {
          id: GPS_LOCATION_ID,
          name,
          latitude,
          longitude,
          addedAt: existingGPS?.addedAt || Date.now(),
          isGPS: true,
        };

        if (existingGPS) {
          // Update existing GPS location
          set({
            savedLocations: state.savedLocations.map((loc) =>
              loc.id === GPS_LOCATION_ID ? gpsLocation : loc
            ),
          });
        } else {
          // Add GPS location for the first time
          set({
            savedLocations: [gpsLocation, ...state.savedLocations],
            activeLocationId: GPS_LOCATION_ID,
          });
        }
      },

      getActiveLocation: () => {
        const state = get();
        return (
          state.savedLocations.find((loc) => loc.id === state.activeLocationId) ||
          null
        );
      },

      canAddMoreLocations: () => {
        const state = get();
        const nonGPSLocations = state.savedLocations.filter(loc => !loc.isGPS);
        return nonGPSLocations.length < MAX_SAVED_LOCATIONS;
      },
    }),
    {
      name: "@saved_locations",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
