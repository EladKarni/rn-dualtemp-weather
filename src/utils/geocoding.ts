import { base_url } from "./fetchWeather";
import { logger } from "./logger";
import { ApiError } from "./errors";
import { fetchWithTimeout, handleFetchError, mapHttpError } from "./httpClient";
import { APP_TOKEN_HEADERS } from "./appToken";

export interface CityResult {
  name: string;
  local_names?: { [key: string]: string };
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @returns Distance in kilometers
 */
export function getDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// In-memory cache for city search results
const searchCitiesCache = new Map<string, {
  results: CityResult[];
  timestamp: number;
}>();

const SEARCH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const SEARCH_CACHE_MAX_SIZE = 50;

function getSearchCacheKey(query: string, locale: string): string {
  return `${query.trim().toLowerCase()}|${locale}`;
}

export const searchCities = async (query: string, locale: string = 'en'): Promise<CityResult[]> => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const cacheKey = getSearchCacheKey(query, locale);
  const cached = searchCitiesCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    logger.debug('City search cache hit for:', cacheKey);
    return cached.results;
  }

  try {
    const response = await fetchWithTimeout(
      `${base_url}search-cities?q=${encodeURIComponent(query.trim())}&limit=5&lang=${locale}`,
      10000,
      { headers: APP_TOKEN_HEADERS }
    );

    if (!response.ok) {
      throw mapHttpError(response.status, 'Invalid search query');
    }

    const data = await response.json();

    // The proxy is expected to return a JSON array of city matches. A non-array
    // body (error object, HTML error page parsed as JSON, null, etc.) is a
    // server/proxy fault — never a valid "no results" set. Surface it as a
    // recoverable invalid-response error so the AddLocationScreen caller renders
    // a retryable error banner instead of the misleading "No locations found"
    // empty state (mirrors fetchWeather's 200-but-wrong-shape handling: a
    // malformed body is never treated as truth).
    if (!Array.isArray(data)) {
      logger.warn(
        'searchCities: expected an array response, received:',
        typeof data
      );
      const invalidResponse = new ApiError(
        `Invalid search response: expected array, received ${typeof data}`,
        response.status,
        'Received invalid data from server. Please try again.'
      );
      invalidResponse.recoverable = true;
      throw invalidResponse;
    }

    const results = data as CityResult[];

    // Cache the results, evict oldest if at capacity
    if (searchCitiesCache.size >= SEARCH_CACHE_MAX_SIZE) {
      const oldestKey = searchCitiesCache.keys().next().value;
      if (oldestKey) searchCitiesCache.delete(oldestKey);
    }
    searchCitiesCache.set(cacheKey, { results, timestamp: Date.now() });

    return results;

  } catch (error) {
    logger.error("Error searching cities:", error);
    throw handleFetchError(error);
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
