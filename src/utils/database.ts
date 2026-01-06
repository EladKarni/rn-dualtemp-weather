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

export class WeatherDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly DB_NAME = 'weather_forecasts.db';
  private readonly FRESHNESS_THRESHOLD = 30 * 60 * 1000; // 30 minutes

  async initialize(): Promise<void> {
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
      logger.error('Failed to initialize weather database:', error);
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
  }

  async saveWeatherData(
    locationId: string,
    weather: Weather,
    locale: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    this.ensureInitialized();
    
    try {
      const now = Date.now();
      const weatherJson = JSON.stringify(weather);
      
      await this.db!.runAsync(
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
    this.ensureInitialized();
    
    try {
      const result = await this.db!.getFirstAsync(
        `SELECT weather_data, last_updated, locale, latitude, longitude
         FROM weather_cache 
         WHERE location_id = ?`,
        [locationId]
      ) as any;
      
      if (!result) {
        return null;
      }
      
      const weather = JSON.parse(result.weather_data as string) as Weather;
      
      return {
        weather,
        lastUpdated: result.last_updated as number,
        locale: result.locale as string,
        latitude: result.latitude as number,
        longitude: result.longitude as number,
      };
    } catch (error) {
      logger.error(`Failed to get weather data for ${locationId}:`, error);
      return null;
    }
  }

  async isLocationDataFresh(locationId: string): Promise<boolean> {
    try {
      const result = await this.db!.getFirstAsync(
        `SELECT last_updated FROM weather_cache WHERE location_id = ?`,
        [locationId]
      ) as any;
      
      if (!result) {
        return false;
      }
      
      const lastUpdated = result.last_updated as number;
      const age = Date.now() - lastUpdated;
      
      return age < this.FRESHNESS_THRESHOLD;
    } catch (error) {
      logger.error(`Failed to check freshness for ${locationId}:`, error);
      return false;
    }
  }

  async getAllFreshData(): Promise<Map<string, WeatherData>> {
    this.ensureInitialized();
    
    try {
      const cutoffTime = Date.now() - this.FRESHNESS_THRESHOLD;
      const results = await this.db!.getAllAsync(
        `SELECT location_id, weather_data, last_updated, locale, latitude, longitude
         FROM weather_cache 
         WHERE last_updated > ?
         ORDER BY last_updated DESC`,
        [cutoffTime]
      );
      
      const weatherMap = new Map<string, WeatherData>();
      
      for (const row of results as any[]) {
        try {
          const weather = JSON.parse(row.weather_data as string) as Weather;
          const locationId = row.location_id as string;
          
          weatherMap.set(locationId, {
            weather,
            lastUpdated: row.last_updated as number,
            locale: row.locale as string,
            latitude: row.latitude as number,
            longitude: row.longitude as number,
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
    this.ensureInitialized();
    
    try {
      await this.db!.runAsync(
        'DELETE FROM weather_cache WHERE location_id = ?',
        [locationId]
      );
      
      await this.db!.runAsync(
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
    this.ensureInitialized();
    
    try {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      
      const result = await this.db!.runAsync(
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
    this.ensureInitialized();
    
    try {
      const cutoffTime = Date.now() - this.FRESHNESS_THRESHOLD;
      
      const totalResult = await this.db!.getFirstAsync(
        'SELECT COUNT(*) as count FROM weather_cache'
      ) as any;
      
      const freshResult = await this.db!.getFirstAsync(
        'SELECT COUNT(*) as count FROM weather_cache WHERE last_updated > ?',
        [cutoffTime]
      ) as any;
      
      const oldestResult = await this.db!.getFirstAsync(
        'SELECT MIN(last_updated) as oldest FROM weather_cache'
      ) as any;
      
      const newestResult = await this.db!.getFirstAsync(
        'SELECT MAX(last_updated) as newest FROM weather_cache'
      ) as any;
      
      return {
        totalEntries: totalResult?.count as number || 0,
        freshEntries: freshResult?.count as number || 0,
        oldestEntry: oldestResult?.oldest as number || null,
        newestEntry: newestResult?.newest as number || null,
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