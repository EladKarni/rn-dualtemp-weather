import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uses24HourClock } from "react-native-localize";

interface SettingsState {
  tempScale: "C" | "F";
  clockFormat: "12hour" | "24hour" | "auto";
  setTempScale: (scale: "C" | "F") => void;
  setClockFormat: (format: "12hour" | "24hour" | "auto") => void;
  getEffectiveClockFormat: () => "12hour" | "24hour";
  isHydrated: boolean;
  setHydrated: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      tempScale: "C",
      clockFormat: "auto",
      isHydrated: false,
      setTempScale: (scale: "C" | "F") => set({ tempScale: scale }),
      setClockFormat: (format: "12hour" | "24hour" | "auto") => set({ clockFormat: format }),
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
        clockFormat: state.clockFormat
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
