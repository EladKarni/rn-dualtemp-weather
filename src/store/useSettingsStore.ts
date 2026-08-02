import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCalendars } from "expo-localization";
import {
  DEFAULT_WIDGET_THEME,
  isWidgetThemeId,
  type WidgetThemeId,
} from "../styles/widgetThemes";

/**
 * Whether the device is configured for a 24-hour clock. expo-localization's
 * uses24hourClock is nullable; default to 12-hour (false) when absent.
 */
const uses24HourClock = (): boolean => getCalendars()[0]?.uses24hourClock ?? false;

interface SettingsState {
  tempScale: "C" | "F";
  clockFormat: "12hour" | "24hour" | "auto";
  showSunriseSunset: boolean;
  /** Which preset fills the home-screen widgets' element cards. */
  widgetTheme: WidgetThemeId;
  // ISO-8601 string (e.g. "2026-07-16T12:34:56.000Z"). Written by the weather
  // fetch hook via new Date().toISOString(); consumers parse it with moment at
  // render. Legacy 2.0.x installs may hold a serialized moment/Date — the merge
  // below coerces any non-string shape to null so rehydration never throws.
  lastUpdated: string | null;
  setLastUpdated: (time: string) => void;
  setTempScale: (scale: "C" | "F") => void;
  setClockFormat: (format: "12hour" | "24hour" | "auto") => void;
  setShowSunriseSunset: (show: boolean) => void;
  setWidgetTheme: (theme: WidgetThemeId) => void;
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
      widgetTheme: DEFAULT_WIDGET_THEME,
      isHydrated: false,
      lastUpdated: null as string | null,
      setLastUpdated: (time: string) => set({ lastUpdated: time }),
      setTempScale: (scale: "C" | "F") => set({ tempScale: scale }),
      setClockFormat: (format: "12hour" | "24hour" | "auto") =>
        set({ clockFormat: format }),
      setShowSunriseSunset: (show: boolean) => set({ showSunriseSunset: show }),
      setWidgetTheme: (theme: WidgetThemeId) => set({ widgetTheme: theme }),
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
        showSunriseSunset: state.showSunriseSunset,
        // MUST be listed here. partialize is an allow-list, and the widget reads
        // this from storage in a headless task — omit it and the app would show
        // the user's choice while the widget rendered the default forever.
        widgetTheme: state.widgetTheme,
        lastUpdated: state.lastUpdated,
      }),
      // Tolerate stale/legacy persisted shapes from 2.0.x. `lastUpdated` used to
      // be a persisted moment/Date; treat anything that isn't a plain string as
      // absent (null) rather than letting a non-ISO value reach moment(). Never
      // throw during rehydration.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...saved,
          lastUpdated:
            typeof saved.lastUpdated === "string" ? saved.lastUpdated : null,
          // Installs from before the picker existed have no value; one from a
          // build offering a preset since removed has an unknown one.
          widgetTheme: isWidgetThemeId(saved.widgetTheme)
            ? saved.widgetTheme
            : DEFAULT_WIDGET_THEME,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
