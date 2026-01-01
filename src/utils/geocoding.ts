import { base_url } from "./fetchWeather";
import { logger } from "./logger";
import {
  ApiError,
  ServerError,
  BadRequestError,
  NetworkError,
  TimeoutError,
  toAppError
} from "./errors";

export interface CityResult {
  name: string;
  local_names?: { [key: string]: string };
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export const searchCities = async (query: string): Promise<CityResult[]> => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(
      `${base_url}search-cities?q=${encodeURIComponent(query.trim())}&limit=5`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Map HTTP status codes to specific errors
      if (response.status === 400) {
        throw new BadRequestError('Invalid search query');
      }
      if (response.status >= 500) {
        throw new ServerError(response.status);
      }

      throw new ApiError(`Search failed: ${response.status}`, response.status);
    }

    const data = await response.json();
    return data as CityResult[];

  } catch (error: any) {
    // Handle abort/timeout
    if (error.name === 'AbortError') {
      logger.error("Search timeout:", error);
      throw new TimeoutError();
    }

    // Handle network errors
    if (error instanceof TypeError) {
      logger.error("Network error searching cities:", error);
      throw new NetworkError('Network request failed');
    }

    // Re-throw AppErrors as-is
    if (error instanceof ApiError) {
      logger.error("API error searching cities:", error);
      throw error;
    }

    // Convert unknown errors
    logger.error("Unknown error searching cities:", error);
    throw toAppError(error);
  }
};

export const formatLocationName = (
  city: string,
  state: string | undefined,
  country: string
): string => {
  if (state) {
    return `${city}, ${state}, ${country}`;
  }
  return `${city}, ${country}`;
};

export const getCityCoordinates = async (
  cityName: string,
  country?: string
): Promise<{ lat: number; lon: number } | null> => {
  try {
    const query = country ? `${cityName},${country}` : cityName;
    const results = await searchCities(query);

    if (results.length === 0) {
      return null;
    }

    // Return the first (most relevant) result
    return {
      lat: results[0].lat,
      lon: results[0].lon,
    };
  } catch (error) {
    logger.error("Error getting city coordinates:", error);
    return null;
  }
};

export interface ReverseGeocodeResult {
  name: string;          // City/town name
  displayName: string;   // Full formatted name
  city: string;
  state?: string;
  country: string;
  countryCode: string;
}

// Simple in-memory cache for reverse geocoding
const reverseGeocodeCache = new Map<string, {
  result: ReverseGeocodeResult;
  timestamp: number;
}>();

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Get cache key from coordinates (rounded to ~100m precision)
 */
function getCacheKey(lat: number, lon: number): string {
  // Round to 3 decimal places (~100m precision)
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLon = Math.round(lon * 1000) / 1000;
  return `${roundedLat},${roundedLon}`;
}

/**
 * Reverse geocode coordinates to get location name
 * Uses the same API as search for consistency
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Formatted location name and details
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> => {
  const cacheKey = getCacheKey(latitude, longitude);
  const cached = reverseGeocodeCache.get(cacheKey);

  // Return cached result if fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('Reverse geocode cache hit for:', cacheKey);
    return cached.result;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(
      `${base_url}reverse-geocode?lat=${latitude}&lon=${longitude}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 400) {
        throw new BadRequestError('Invalid coordinates');
      }
      if (response.status >= 500) {
        throw new ServerError(response.status);
      }

      throw new ApiError(`Reverse geocode failed: ${response.status}`, response.status);
    }

    const data = await response.json();

    // API returns array with closest match first
    if (!data || data.length === 0) {
      throw new Error('No results from reverse geocoding');
    }

    const apiResult = data[0];

    // Construct clean name
    const cityName = apiResult.name || apiResult.city || 'Unknown Location';
    const stateName = apiResult.state;
    const countryName = apiResult.country;

    const result: ReverseGeocodeResult = {
      name: cityName,
      displayName: formatLocationName(cityName, stateName, countryName),
      city: cityName,
      state: stateName,
      country: countryName,
      countryCode: apiResult.country_code || '',
    };

    // Cache the result
    reverseGeocodeCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    logger.debug('Reverse geocode successful:', result.name);
    return result;

  } catch (error: any) {
    // Handle abort/timeout
    if (error.name === 'AbortError') {
      logger.error("Reverse geocode timeout:", error);
      throw new TimeoutError();
    }

    // Handle network errors
    if (error instanceof TypeError) {
      logger.error("Network error in reverse geocode:", error);
      throw new NetworkError('Network request failed');
    }

    // Re-throw AppErrors as-is
    if (error instanceof ApiError) {
      logger.error("API error in reverse geocode:", error);
      throw error;
    }

    // Convert unknown errors
    logger.error("Unknown error in reverse geocode:", error);
    throw toAppError(error);
  }
};

/**
 * Get a clean, short location name from coordinates
 * Falls back gracefully if API fails
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param fallbackName - Name to use if geocoding fails
 * @returns Clean location name (e.g., "Paris", "Tokyo", "New York")
 */
export const getLocationName = async (
  latitude: number,
  longitude: number,
  fallbackName: string = 'Current Location'
): Promise<string> => {
  try {
    const result = await reverseGeocode(latitude, longitude);
    return result.name;
  } catch (error) {
    logger.warn('Reverse geocoding failed, using fallback:', fallbackName);
    return fallbackName;
  }
};
