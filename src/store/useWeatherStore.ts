import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "../utils/logger";
import { fetchForecast } from "../utils/fetchWeather";
import type { Weather } from "../types/WeatherTypes";

interface WeatherState {
  // Core weather data storage
  weatherData: Map<string, Weather>; // locationId -> Weather
  lastUpdated: Map<string, Date>;   // locationId -> timestamp
  isRefreshing: Set<string>;        // Currently refreshing locationIds
  
  // Actions
  setWeatherData: (locationId: string, weather: Weather) => void;
  getWeatherData: (locationId: string) => Weather | undefined;
  getLastUpdated: (locationId: string) => Date | undefined;
  
  // Refresh weather data (used by both app and widgets)
  refreshWeather: (
    locationId: string, 
    locale: string, 
    lat: number, 
    lon: number
  ) => Promise<Weather>;
  
  // Cleanup old data
  clearOldData: (maxAge?: number) => void;
  isLocationDataFresh: (locationId: string, maxAge?: number) => boolean;
}

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      weatherData: new Map(),
      lastUpdated: new Map(),
      isRefreshing: new Set(),

      setWeatherData: (locationId: string, weather: Weather) => {
        set(state => {
          const newWeatherData = new Map(state.weatherData);
          const newLastUpdated = new Map(state.lastUpdated);
          const newRefreshing = new Set(state.isRefreshing);
          
          newWeatherData.set(locationId, weather);
          newLastUpdated.set(locationId, new Date());
          newRefreshing.delete(locationId);
          
          return {
            weatherData: newWeatherData,
            lastUpdated: newLastUpdated,
            isRefreshing: newRefreshing
          };
        });
      },

      getWeatherData: (locationId: string) => {
        return get().weatherData.get(locationId);
      },

      getLastUpdated: (locationId: string) => {
        return get().lastUpdated.get(locationId);
      },

      refreshWeather: async (locationId: string, locale: string, lat: number, lon: number) => {
        const state = get();
        
        // Prevent duplicate refreshes
        if (state.isRefreshing.has(locationId)) {
          const existingData = state.weatherData.get(locationId);
          if (existingData) return existingData;
        }
        
        // Mark as refreshing
        set(state => ({
          isRefreshing: new Set([...state.isRefreshing, locationId])
        }));

        try {
          logger.debug('Refreshing weather data:', { locationId, locale, lat, lon });
          const weather = await fetchForecast(locale, lat, lon);
          
          // Store data
          get().setWeatherData(locationId, weather);
          return weather;
        } catch (error) {
          // Remove from refreshing set on error
          set(state => {
            const newRefreshing = new Set(state.isRefreshing);
            newRefreshing.delete(locationId);
            return { isRefreshing: newRefreshing };
          });
          throw error;
        }
      },

      clearOldData: (maxAge: number = 1000 * 60 * 60 * 24) => { // 24 hours default
        const state = get();
        const now = new Date();
        const newWeatherData = new Map<string, Weather>();
        const newLastUpdated = new Map<string, Date>();
        
        state.lastUpdated.forEach((lastUpdated, locationId) => {
          if (now.getTime() - lastUpdated.getTime() < maxAge) {
            const weather = state.weatherData.get(locationId);
            if (weather) {
              newWeatherData.set(locationId, weather);
              newLastUpdated.set(locationId, lastUpdated);
            }
          }
        });
        
        set({ weatherData: newWeatherData, lastUpdated: newLastUpdated });
      },

      isLocationDataFresh: (locationId: string, maxAge: number = 1000 * 60 * 60) => { // 60 minutes now
        const lastUpdated = get().lastUpdated.get(locationId);
        if (!lastUpdated) return false;
        
        return new Date().getTime() - lastUpdated.getTime() < maxAge;
      }
    }),
    {
      name: "@weather_data",
      storage: createJSONStorage(() => AsyncStorage),
      // Convert Maps to Arrays for AsyncStorage
      partialize: (state) => ({
        weatherData: Array.from(state.weatherData.entries()),
        lastUpdated: Array.from(state.lastUpdated.entries())
      }),
      onRehydrateStorage: () => (state) => {
        // Convert Arrays back to Maps
        if (state?.weatherData) {
          state.weatherData = new Map(state.weatherData);
        }
        if (state?.lastUpdated) {
          state.lastUpdated = new Map(state.lastUpdated);
        }
        if (state) {
          state.isRefreshing = new Set(); // Reset refreshing state
        }
      }
    }
  )
);