import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "../utils/logger";
import { DuplicateLocationError, MaxLocationsError } from "../utils/errors";

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

        // Check if we've reached the limit (excluding GPS location). Throw a
        // typed UserError so the caller can surface a localized message instead
        // of silently dropping the request (the translation was previously lost).
        const nonGPSLocations = state.savedLocations.filter(
          (loc) => !loc.isGPS,
        );
        if (nonGPSLocations.length >= MAX_SAVED_LOCATIONS) {
          logger.warn("Maximum locations reached");
          throw new MaxLocationsError();
        }

        // Check for duplicate locations (within ~1km radius). Throw a typed
        // UserError instead of silently no-op'ing so the user gets feedback.
        const isDuplicate = state.savedLocations.some((loc) => {
          const latDiff = Math.abs(loc.latitude - location.latitude);
          const lonDiff = Math.abs(loc.longitude - location.longitude);
          return latDiff < 0.01 && lonDiff < 0.01; // Roughly 1km
        });

        if (isDuplicate) {
          logger.warn("Location already saved");
          throw new DuplicateLocationError();
        }

        const newLocation: SavedLocation = {
          ...location,
          id: `location-${Date.now()}`,
          addedAt: Date.now(),
          isGPS: false,
        };

        // Self-heal a dangling active id: if the currently-active location no
        // longer resolves to a real entry (e.g. it was removed leaving nothing
        // to fall back to), adopt the newly-added location as active.
        const activeResolves = state.savedLocations.some(
          (loc) => loc.id === state.activeLocationId,
        );

        set({
          savedLocations: [...state.savedLocations, newLocation],
          ...(activeResolves ? {} : { activeLocationId: newLocation.id }),
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

        // If removing the active location, resolve a valid fallback instead of
        // blindly pointing at GPS (which may not exist): prefer the GPS entry if
        // present, else the first remaining location, else null (no active).
        let newActiveId = state.activeLocationId;
        if (state.activeLocationId === id) {
          const gps = filteredLocations.find(
            (loc) => loc.id === GPS_LOCATION_ID,
          );
          if (gps) {
            newActiveId = GPS_LOCATION_ID;
          } else if (filteredLocations.length > 0) {
            newActiveId = filteredLocations[0].id;
          } else {
            newActiveId = null;
          }
        }

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
          // Add GPS location for the first time
          set({
            savedLocations: [gpsLocation, ...state.savedLocations],
            activeLocationId: GPS_LOCATION_ID,
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
    },
  ),
);
