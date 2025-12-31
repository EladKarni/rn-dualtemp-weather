import { base_url } from "./fetchWeather";

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
    const response = await fetch(
      `${base_url}search-cities?q=${encodeURIComponent(query.trim())}&limit=5`
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return data as CityResult[];
  } catch (error) {
    console.error("Error searching cities:", error);
    throw error;
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
    console.error("Error getting city coordinates:", error);
    return null;
  }
};
