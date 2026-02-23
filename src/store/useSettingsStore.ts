import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uses24HourClock } from "react-native-localize";
import { Moment } from "moment";

interface SettingsState {
  tempScale: "C" | "F";
  clockFormat: "12hour" | "24hour" | "auto";
  precipUnit: "auto" | "mm" | "in";
  showSunriseSunset: boolean;
  lastUpdated: Moment | null;
  setLastUpdated: (time: Moment) => void;
  setTempScale: (scale: "C" | "F") => void;
  setClockFormat: (format: "12hour" | "24hour" | "auto") => void;
  setPrecipUnit: (unit: "auto" | "mm" | "in") => void;
  setShowSunriseSunset: (show: boolean) => void;
  getEffectiveClockFormat: () => "12hour" | "24hour";
  getEffectivePrecipUnit: () => "mm" | "in";
  isHydrated: boolean;
  setHydrated: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      tempScale: "C",
      clockFormat: "auto",
      precipUnit: "auto",
      showSunriseSunset: true,
      isHydrated: false,
      lastUpdated: null,
      setLastUpdated: (time: Moment) => set({ lastUpdated: time }),
      setTempScale: (scale: "C" | "F") => set({ tempScale: scale }),
      setClockFormat: (format: "12hour" | "24hour" | "auto") =>
        set({ clockFormat: format }),
      setPrecipUnit: (unit: "auto" | "mm" | "in") =>
        set({ precipUnit: unit }),
      setShowSunriseSunset: (show: boolean) => set({ showSunriseSunset: show }),
      getEffectiveClockFormat: () => {
        const clockFormat = get().clockFormat;
        if (clockFormat === "auto") {
          return uses24HourClock() ? "24hour" : "12hour";
        }
        return clockFormat;
      },
      getEffectivePrecipUnit: () => {
        const precipUnit = get().precipUnit;
        if (precipUnit === "auto") {
          return get().tempScale === "F" ? "in" : "mm";
        }
        return precipUnit;
      },
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "@settings_preferences",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tempScale: state.tempScale,
        clockFormat: state.clockFormat,
        precipUnit: state.precipUnit,
        showSunriseSunset: state.showSunriseSunset,
        lastUpdated: state.lastUpdated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
