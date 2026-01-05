import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uses24HourClock } from "react-native-localize";

interface SettingsState {
  tempScale: "C" | "F";
  clockFormat: "12hour" | "24hour" | "auto";
  showSunriseSunset: boolean;
  setTempScale: (scale: "C" | "F") => void;
  setClockFormat: (format: "12hour" | "24hour" | "auto") => void;
  setShowSunriseSunset: (show: boolean) => void;
  getEffectiveClockFormat: () => "12hour" | "24hour";
  isHydrated: boolean;
  setHydrated: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      tempScale: "C",
      clockFormat: "auto",
      showSunriseSunset: true,
      isHydrated: false,
      setTempScale: (scale: "C" | "F") => set({ tempScale: scale }),
      setClockFormat: (format: "12hour" | "24hour" | "auto") => set({ clockFormat: format }),
      setShowSunriseSunset: (show: boolean) => set({ showSunriseSunset: show }),
      getEffectiveClockFormat: () => {
        const clockFormat = get().clockFormat;
        if (clockFormat === "auto") {
          return uses24HourClock() ? "24hour" : "12hour";
        }
        return clockFormat;
      },
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "@settings_preferences",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tempScale: state.tempScale,
        clockFormat: state.clockFormat,
        showSunriseSunset: state.showSunriseSunset
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
