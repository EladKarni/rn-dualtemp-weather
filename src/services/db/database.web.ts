import type { Weather } from '../../types/WeatherTypes';
import { logger } from '../../utils/logger';

export interface WeatherData {
  weather: Weather;
  lastUpdated: number;
  locale: string;
  latitude: number;
  longitude: number;
}

/**
 * Web-only in-memory implementation of WeatherDatabase.
 * expo-sqlite uses a .wasm file that Metro can't bundle for web,
 * so we provide a simple Map-based cache instead.
 */
export class WeatherDatabase {
  private cache = new Map<string, WeatherData & { createdAt: number }>();
  private readonly FRESHNESS_THRESHOLD = 30 * 60 * 1000; // 30 minutes

  async initialize(): Promise<void> {
    logger.debug('Weather database initialized (web in-memory mode)');
  }

  async saveWeatherData(
    locationId: string,
    weather: Weather,
    locale: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    const now = Date.now();
    this.cache.set(locationId, {
      weather,
      lastUpdated: now,
      locale,
      latitude,
      longitude,
      createdAt: now,
    });
    logger.debug(`Weather data saved for location: ${locationId} (web)`);
  }

  async getWeatherData(locationId: string): Promise<WeatherData | null> {
    const entry = this.cache.get(locationId);
    if (!entry) return null;
    return {
      weather: entry.weather,
      lastUpdated: entry.lastUpdated,
      locale: entry.locale,
      latitude: entry.latitude,
      longitude: entry.longitude,
    };
  }

  async isLocationDataFresh(locationId: string): Promise<boolean> {
    const entry = this.cache.get(locationId);
    if (!entry) return false;
    return Date.now() - entry.lastUpdated < this.FRESHNESS_THRESHOLD;
  }

  async getWeatherDataWithAge(locationId: string): Promise<{
    weatherData: WeatherData | null;
    ageMinutes: number | null;
  }> {
    const entry = this.cache.get(locationId);
    if (!entry) return { weatherData: null, ageMinutes: null };
    return {
      weatherData: {
        weather: entry.weather,
        lastUpdated: entry.lastUpdated,
        locale: entry.locale,
        latitude: entry.latitude,
        longitude: entry.longitude,
      },
      ageMinutes: (Date.now() - entry.lastUpdated) / 60000,
    };
  }

  async getAllFreshData(): Promise<Map<string, WeatherData>> {
    const cutoff = Date.now() - this.FRESHNESS_THRESHOLD;
    const result = new Map<string, WeatherData>();
    for (const [id, entry] of this.cache) {
      if (entry.lastUpdated > cutoff) {
        result.set(id, {
          weather: entry.weather,
          lastUpdated: entry.lastUpdated,
          locale: entry.locale,
          latitude: entry.latitude,
          longitude: entry.longitude,
        });
      }
    }
    return result;
  }

  async deleteLocationData(locationId: string): Promise<void> {
    this.cache.delete(locationId);
    logger.debug(`Weather data deleted for location: ${locationId} (web)`);
  }

  async cleanupOldData(): Promise<void> {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [id, entry] of this.cache) {
      if (entry.lastUpdated < cutoff) {
        this.cache.delete(id);
      }
    }
  }

  async getDatabaseStats(): Promise<{
    totalEntries: number;
    freshEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    const cutoff = Date.now() - this.FRESHNESS_THRESHOLD;
    let freshCount = 0;
    let oldest: number | null = null;
    let newest: number | null = null;
    for (const entry of this.cache.values()) {
      if (entry.lastUpdated > cutoff) freshCount++;
      if (oldest === null || entry.lastUpdated < oldest) oldest = entry.lastUpdated;
      if (newest === null || entry.lastUpdated > newest) newest = entry.lastUpdated;
    }
    return {
      totalEntries: this.cache.size,
      freshEntries: freshCount,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }

  async close(): Promise<void> {
    this.cache.clear();
    logger.debug('Weather database closed (web)');
  }
}

// Singleton instance
export const weatherDatabase = new WeatherDatabase();
