import { base_url } from "./fetchWeather";
import { logger } from "./logger";
import { fetchWithTimeout, handleFetchError, mapHttpError } from "./httpClient";

export interface CityResult {
  name: string;
  local_names?: { [key: string]: string };
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export const searchCities = async (query: string, locale: string = 'en'): Promise<CityResult[]> => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await fetchWithTimeout(
      `${base_url}search-cities?q=${encodeURIComponent(query.trim())}&limit=5&lang=${locale}`,
      10000
    );

    if (!response.ok) {
      throw mapHttpError(response.status, 'Invalid search query');
    }

    const data = await response.json();
    return data as CityResult[];

  } catch (error) {
    logger.error("Error searching cities:", error);
    handleFetchError(error);
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
  longitude: number,
  locale: string = 'en'
): Promise<ReverseGeocodeResult> => {
  const cacheKey = getCacheKey(latitude, longitude);
  const cached = reverseGeocodeCache.get(cacheKey);

  // Return cached result if fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('Reverse geocode cache hit for:', cacheKey);
    return cached.result;
  }

  try {
    const response = await fetchWithTimeout(
      `${base_url}reverse-geocode?lat=${latitude}&lon=${longitude}&lang=${locale}`,
      10000
    );

    if (!response.ok) {
      throw mapHttpError(response.status, 'Invalid coordinates');
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

    logger.debug('Reverse geocode successful:', result.name, 'for locale:', locale);
    return result;

  } catch (error) {
    logger.error("Error in reverse geocode:", error);
    handleFetchError(error);
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
