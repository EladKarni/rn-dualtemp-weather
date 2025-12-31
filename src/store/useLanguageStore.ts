import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LanguageState {
  selectedLanguage: string | null; // null = auto-detect
  setLanguage: (language: string | null) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguage: null, // Default to auto-detect

      setLanguage: (language: string | null) => {
        set({ selectedLanguage: language });
      },
    }),
    {
      name: "@selected_language",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
