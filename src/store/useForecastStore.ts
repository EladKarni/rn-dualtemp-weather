import { create } from 'zustand';
import { weatherDatabase, type WeatherData } from '../utils/database';
import type { Weather } from '../types/WeatherTypes';
import { fetchForecast } from '../utils/fetchWeather';
import { logger } from '../utils/logger';
import { i18n } from '../localization/i18n';

export interface ForecastStore {
  // Runtime state (what you originally requested)
  forecast: Weather | null;
  lastUpdated: string;
  
  // Core actions
  updateWeather: (weather: Weather) => void;
  updateLastUpdated: (timestamp: string) => void;
  
  // SQLite persistence methods for widget support
  setWeatherData: (locationId: string, weather: Weather) => Promise<void>;
  getWeatherData: (locationId: string) => Promise<Weather | null>;
  isLocationDataFresh: (locationId: string) => Promise<boolean>;
  refreshWeather: (locationId: string, locale: string, lat: number, lon: number) => Promise<void>;
  
  // Database management
  initializeDatabase: () => Promise<void>;
  cleanupOldData: () => Promise<void>;
  deleteLocationData: (locationId: string) => Promise<void>;
  
  // Batch operations
  setMultipleWeatherData: (entries: Array<[string, Weather]>) => Promise<void>;
  getAllFreshData: () => Promise<Map<string, Weather>>;
  
  // Utility methods
  getDatabaseStats: () => Promise<{
    totalEntries: number;
    freshEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }>;
}

export const useForecastStore = create<ForecastStore>((set, get) => ({
  // Initial state
  forecast: null,
  lastUpdated: '',

  // Core actions
  updateWeather: (weather: Weather) => {
    set({ 
      forecast: weather,
      lastUpdated: new Date().toISOString()
    });
  },

  updateLastUpdated: (timestamp: string) => {
    set({ lastUpdated: timestamp });
  },

  // Database management
  initializeDatabase: async () => {
    try {
      await weatherDatabase.initialize();
      logger.debug('ForecastStore database initialized');
    } catch (error) {
      logger.error('Failed to initialize ForecastStore database:', error);
      throw error;
    }
  },

  // SQLite persistence methods
  setWeatherData: async (locationId: string, weather: Weather) => {
    try {
      // Update runtime state if this is the active location
      const currentForecast = get().forecast;
      if (!currentForecast || currentForecast.lat === weather.lat && currentForecast.lon === weather.lon) {
        get().updateWeather(weather);
      }

      // Persist to SQLite
      await weatherDatabase.saveWeatherData(
        locationId,
        weather,
        i18n.locale,
        weather.lat,
        weather.lon
      );

      logger.debug(`Weather data persisted for location: ${locationId}`);
    } catch (error) {
      logger.error(`Failed to set weather data for ${locationId}:`, error);
      throw error;
    }
  },

  getWeatherData: async (locationId: string): Promise<Weather | null> => {
    try {
      const weatherData = await weatherDatabase.getWeatherData(locationId);
      return weatherData?.weather || null;
    } catch (error) {
      logger.error(`Failed to get weather data for ${locationId}:`, error);
      return null;
    }
  },

  isLocationDataFresh: async (locationId: string): Promise<boolean> => {
    try {
      return await weatherDatabase.isLocationDataFresh(locationId);
    } catch (error) {
      logger.error(`Failed to check freshness for ${locationId}:`, error);
      return false;
    }
  },

  refreshWeather: async (locationId: string, locale: string, lat: number, lon: number): Promise<void> => {
    try {
      logger.debug(`Refreshing weather data for location: ${locationId}`);
      
      const weather = await fetchForecast(locale, lat, lon);
      
      if (weather) {
        await get().setWeatherData(locationId, weather);
        logger.debug(`Weather data refreshed successfully for: ${locationId}`);
      } else {
        throw new Error('No weather data returned from fetch');
      }
    } catch (error) {
      logger.error(`Failed to refresh weather data for ${locationId}:`, error);
      throw error;
    }
  },

  // Batch operations
  setMultipleWeatherData: async (entries: Array<[string, Weather]>) => {
    try {
      const promises = entries.map(([locationId, weather]) => 
        get().setWeatherData(locationId, weather)
      );
      
      await Promise.all(promises);
      logger.debug(`Batch saved weather data for ${entries.length} locations`);
    } catch (error) {
      logger.error('Failed to batch save weather data:', error);
      throw error;
    }
  },

  getAllFreshData: async (): Promise<Map<string, Weather>> => {
    try {
      const weatherDataMap = await weatherDatabase.getAllFreshData();
      const weatherMap = new Map<string, Weather>();
      
      weatherDataMap.forEach((data, locationId) => {
        weatherMap.set(locationId, data.weather);
      });
      
      return weatherMap;
    } catch (error) {
      logger.error('Failed to get all fresh weather data:', error);
      return new Map();
    }
  },

  // Database maintenance
  cleanupOldData: async () => {
    try {
      await weatherDatabase.cleanupOldData();
      logger.debug('Old weather data cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup old weather data:', error);
    }
  },

  deleteLocationData: async (locationId: string) => {
    try {
      await weatherDatabase.deleteLocationData(locationId);
      logger.debug(`Weather data deleted for location: ${locationId}`);
    } catch (error) {
      logger.error(`Failed to delete weather data for ${locationId}:`, error);
      throw error;
    }
  },

  getDatabaseStats: async () => {
    try {
      return await weatherDatabase.getDatabaseStats();
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      return {
        totalEntries: 0,
        freshEntries: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  },
}));

// Initialize database when the store is first used
let databaseInitialized = false;

export const initializeForecastStore = async () => {
  if (!databaseInitialized) {
    try {
      await useForecastStore.getState().initializeDatabase();
      databaseInitialized = true;
      
      // Cleanup old data on initialization
      await useForecastStore.getState().cleanupOldData();
    } catch (error) {
      logger.error('Failed to initialize forecast store:', error);
      throw error;
    }
  }
};