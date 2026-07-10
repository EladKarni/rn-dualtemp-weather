import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "../utils/logger";

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

  addLocation: (
    location: Omit<SavedLocation, "id" | "addedAt" | "isGPS">,
  ) => void;
  removeLocation: (id: string) => void;
  setActiveLocation: (id: string) => void;
  updateGPSLocation: (
    latitude: number,
    longitude: number,
    name: string,
  ) => void;
  updateGPSLocationName: (name: string) => void;
  getActiveLocation: () => SavedLocation | null;
  canAddMoreLocations: () => boolean;
}

export const GPS_LOCATION_ID = "gps-location";
const MAX_SAVED_LOCATIONS = 25;

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      savedLocations: [],
      activeLocationId: GPS_LOCATION_ID,

      addLocation: (location) => {
        const state = get();

        // Check for duplicate locations (within ~1km radius) before the cap
        // check — re-picking a saved city should activate it, not error out
        const existing = state.savedLocations.find((loc) => {
          const latDiff = Math.abs(loc.latitude - location.latitude);
          const lonDiff = Math.abs(loc.longitude - location.longitude);
          return latDiff < 0.01 && lonDiff < 0.01; // Roughly 1km
        });

        if (existing) {
          logger.warn("Location already saved");
          set({ activeLocationId: existing.id });
          return;
        }

        // Check if we've reached the limit (excluding GPS location)
        const nonGPSLocations = state.savedLocations.filter(
          (loc) => !loc.isGPS,
        );
        if (nonGPSLocations.length >= MAX_SAVED_LOCATIONS) {
          logger.warn("Maximum locations reached");
          return;
        }

        const newLocation: SavedLocation = {
          ...location,
          id: `location-${Date.now()}`,
          addedAt: Date.now(),
          isGPS: false,
        };

        // Adding is an explicit user choice — make it the active location
        set({
          savedLocations: [...state.savedLocations, newLocation],
          activeLocationId: newLocation.id,
        });
      },

      removeLocation: (id) => {
        const state = get();

        // Prevent removing GPS location
        if (id === GPS_LOCATION_ID) {
          logger.warn("Cannot remove GPS location");
          return;
        }

        const filteredLocations = state.savedLocations.filter(
          (loc) => loc.id !== id,
        );

        // If removing the active location, fall back to GPS if it exists,
        // else the first remaining location, else none. Never point at an
        // id that isn't actually in the list.
        const newActiveId =
          state.activeLocationId === id
            ? (filteredLocations.find((loc) => loc.isGPS)?.id ??
              filteredLocations[0]?.id ??
              null)
            : state.activeLocationId;

        set({
          savedLocations: filteredLocations,
          activeLocationId: newActiveId,
        });
      },

      setActiveLocation: (id) => {
        logger.trace("LocationStore.setActiveLocation", {
          newId: id,
          currentId: get().activeLocationId,
        });
        set({ activeLocationId: id });
      },

      updateGPSLocation: (latitude, longitude, name) => {
        const state = get();
        const existingGPS = state.savedLocations.find(
          (loc) => loc.id === GPS_LOCATION_ID,
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
              loc.id === GPS_LOCATION_ID ? gpsLocation : loc,
            ),
          });
        } else {
          // Add GPS location for the first time. Only take over activation
          // when the current active id doesn't resolve to a saved location
          // (first run's placeholder id) — a manually chosen city stays active
          const activeExists = state.savedLocations.some(
            (loc) => loc.id === state.activeLocationId,
          );
          set({
            savedLocations: [gpsLocation, ...state.savedLocations],
            activeLocationId: activeExists
              ? state.activeLocationId
              : GPS_LOCATION_ID,
          });
        }
      },

      updateGPSLocationName: (name) => {
        const state = get();
        const existingGPS = state.savedLocations.find(
          (loc) => loc.id === GPS_LOCATION_ID
        );

        if (!existingGPS) {
          logger.warn("Cannot update GPS location name: no GPS location exists");
          return;
        }

        set({
          savedLocations: state.savedLocations.map((loc) =>
            loc.id === GPS_LOCATION_ID ? { ...loc, name } : loc
          ),
        });
      },

      getActiveLocation: () => {
        const state = get();
        return (
          state.savedLocations.find(
            (loc) => loc.id === state.activeLocationId,
          ) || null
        );
      },

      canAddMoreLocations: () => {
        const state = get();
        const nonGPSLocations = state.savedLocations.filter(
          (loc) => !loc.isGPS,
        );
        return nonGPSLocations.length < MAX_SAVED_LOCATIONS;
      },
    }),
    {
      name: "@saved_locations",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Self-heal installs whose persisted activeLocationId points at a
        // location that no longer exists (e.g. the old phantom GPS id left
        // behind when locations were saved without GPS ever granting)
        if (
          !state ||
          !Array.isArray(state.savedLocations) ||
          state.savedLocations.length === 0
        )
          return;
        const resolves = state.savedLocations.some(
          (loc) => loc.id === state.activeLocationId,
        );
        if (!resolves) {
          useLocationStore.setState({
            activeLocationId:
              state.savedLocations.find((loc) => loc.isGPS)?.id ??
              state.savedLocations[0].id,
          });
        }
      },
    },
  ),
);
