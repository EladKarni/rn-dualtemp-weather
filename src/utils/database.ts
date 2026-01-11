import * as SQLite from 'expo-sqlite';
import type { Weather } from '../types/WeatherTypes';
import { logger } from './logger';

export interface WeatherData {
  weather: Weather;
  lastUpdated: number;
  locale: string;
  latitude: number;
  longitude: number;
}

// SQLite row types for type-safe queries
interface WeatherCacheRow {
  location_id: string;
  weather_data: string;
  last_updated: number;
  locale: string;
  latitude: number;
  longitude: number;
  created_at: number;
}

interface LastUpdatedRow {
  last_updated: number;
}

interface CountRow {
  count: number;
}

interface OldestRow {
  oldest: number | null;
}

interface NewestRow {
  newest: number | null;
}

export class WeatherDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly DB_NAME = 'weather_forecasts.db';
  private readonly FRESHNESS_THRESHOLD = 30 * 60 * 1000; // 30 minutes
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    // If already initializing, wait for that to complete
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.db) {
      // Database already initialized
      logger.debug('Weather database already initialized');
      return;
    }

    // Store the initialization promise to prevent concurrent initializations
    this.initPromise = (async () => {
      try {
        this.db = await SQLite.openDatabaseAsync(this.DB_NAME);

        // Create tables
        await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS weather_cache (
          location_id TEXT PRIMARY KEY,
          weather_data TEXT NOT NULL,
          last_updated INTEGER NOT NULL,
          locale TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'unixepoch'))
        );

        CREATE TABLE IF NOT EXISTS weather_errors (
          location_id TEXT PRIMARY KEY,
          error_data TEXT NOT NULL,
          occurred_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_weather_last_updated
        ON weather_cache(last_updated);

        CREATE INDEX IF NOT EXISTS idx_weather_location_id
        ON weather_cache(location_id);
      `);

        logger.debug('Weather database initialized successfully');
      } catch (error) {
        this.db = null;
        this.initPromise = null;
        logger.error('Failed to initialize weather database:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Gets the database instance, throwing if not initialized
   */
  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  async saveWeatherData(
    locationId: string,
    weather: Weather,
    locale: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    await this.ensureInitialized();

    try {
      const db = this.getDb();
      const now = Date.now();
      const weatherJson = JSON.stringify(weather);

      await db.runAsync(
        `INSERT OR REPLACE INTO weather_cache
         (location_id, weather_data, last_updated, locale, latitude, longitude, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [locationId, weatherJson, now, locale, latitude, longitude, now]
      );

      logger.debug(`Weather data saved for location: ${locationId}`);
    } catch (error) {
      logger.error(`Failed to save weather data for ${locationId}:`, error);
      throw error;
    }
  }

  async getWeatherData(locationId: string): Promise<WeatherData | null> {
    await this.ensureInitialized();

    try {
      const db = this.getDb();
      const result = await db.getFirstAsync<WeatherCacheRow>(
        `SELECT weather_data, last_updated, locale, latitude, longitude
         FROM weather_cache
         WHERE location_id = ?`,
        [locationId]
      );

      if (!result) {
        return null;
      }

      const weather = JSON.parse(result.weather_data) as Weather;

      return {
        weather,
        lastUpdated: result.last_updated,
        locale: result.locale,
        latitude: result.latitude,
        longitude: result.longitude,
      };
    } catch (error) {
      logger.error(`Failed to get weather data for ${locationId}:`, error);
      return null;
    }
  }

  async isLocationDataFresh(locationId: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const db = this.getDb();
      const result = await db.getFirstAsync<LastUpdatedRow>(
        `SELECT last_updated FROM weather_cache WHERE location_id = ?`,
        [locationId]
      );

      if (!result) {
        return false;
      }

      const lastUpdated = result.last_updated;
      const age = Date.now() - lastUpdated;

      return age < this.FRESHNESS_THRESHOLD;
    } catch (error) {
      logger.error(`Failed to check freshness for ${locationId}:`, error);
      return false;
    }
  }

  async getAllFreshData(): Promise<Map<string, WeatherData>> {
    await this.ensureInitialized();

    try {
      const db = this.getDb();
      const cutoffTime = Date.now() - this.FRESHNESS_THRESHOLD;
      const results = await db.getAllAsync<WeatherCacheRow>(
        `SELECT location_id, weather_data, last_updated, locale, latitude, longitude
         FROM weather_cache
         WHERE last_updated > ?
         ORDER BY last_updated DESC`,
        [cutoffTime]
      );

      const weatherMap = new Map<string, WeatherData>();

      for (const row of results) {
        try {
          const weather = JSON.parse(row.weather_data) as Weather;
          const locationId = row.location_id;

          weatherMap.set(locationId, {
            weather,
            lastUpdated: row.last_updated,
            locale: row.locale,
            latitude: row.latitude,
            longitude: row.longitude,
          });
        } catch (parseError) {
          logger.warn(`Failed to parse weather data for location:`, parseError);
        }
      }

      logger.debug(`Loaded ${weatherMap.size} fresh weather entries from database`);
      return weatherMap;
    } catch (error) {
      logger.error('Failed to get all fresh weather data:', error);
      return new Map();
    }
  }

  async deleteLocationData(locationId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const db = this.getDb();
      await db.runAsync(
        'DELETE FROM weather_cache WHERE location_id = ?',
        [locationId]
      );

      await db.runAsync(
        'DELETE FROM weather_errors WHERE location_id = ?',
        [locationId]
      );

      logger.debug(`Weather data deleted for location: ${locationId}`);
    } catch (error) {
      logger.error(`Failed to delete weather data for ${locationId}:`, error);
      throw error;
    }
  }

  async cleanupOldData(): Promise<void> {
    await this.ensureInitialized();

    try {
      const db = this.getDb();
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

      const result = await db.runAsync(
        'DELETE FROM weather_cache WHERE last_updated < ?',
        [cutoffTime]
      );

      logger.debug(`Cleaned up ${result.changes} old weather entries`);
    } catch (error) {
      logger.error('Failed to cleanup old weather data:', error);
    }
  }

  async getDatabaseStats(): Promise<{
    totalEntries: number;
    freshEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    await this.ensureInitialized();

    try {
      const db = this.getDb();
      const cutoffTime = Date.now() - this.FRESHNESS_THRESHOLD;

      const totalResult = await db.getFirstAsync<CountRow>(
        'SELECT COUNT(*) as count FROM weather_cache'
      );

      const freshResult = await db.getFirstAsync<CountRow>(
        'SELECT COUNT(*) as count FROM weather_cache WHERE last_updated > ?',
        [cutoffTime]
      );

      const oldestResult = await db.getFirstAsync<OldestRow>(
        'SELECT MIN(last_updated) as oldest FROM weather_cache'
      );

      const newestResult = await db.getFirstAsync<NewestRow>(
        'SELECT MAX(last_updated) as newest FROM weather_cache'
      );

      return {
        totalEntries: totalResult?.count ?? 0,
        freshEntries: freshResult?.count ?? 0,
        oldestEntry: oldestResult?.oldest ?? null,
        newestEntry: newestResult?.newest ?? null,
      };
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      return {
        totalEntries: 0,
        freshEntries: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.closeAsync();
        this.db = null;
        logger.debug('Weather database closed');
      } catch (error) {
        logger.error('Failed to close weather database:', error);
      }
    }
  }
}

// Singleton instance
export const weatherDatabase = new WeatherDatabase();
