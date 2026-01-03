import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  tempScale: "C" | "F";
  setTempScale: (scale: "C" | "F") => void;
  isHydrated: boolean;
  setHydrated: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      tempScale: "C",
      isHydrated: false,
      setTempScale: (scale: "C" | "F") => set({ tempScale: scale }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "@selected_temp_scale",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ tempScale: state.tempScale }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
