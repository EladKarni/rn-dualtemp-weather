import { Alert } from "react-native";
import { Weather } from "../types/WeatherTypes";
import { logger } from "./logger";

export const base_url = `https://open-weather-proxy-pi.vercel.app/api/v1/`;

export const fetchForecast = async (
  locale: string,
  latitude: number,
  longitude: number
): Promise<Weather> => {
  try {
    const url = `${base_url}get-weather?lat=${latitude}&long=${longitude}&lang=${locale}`;
    logger.debug('Fetching weather from:', url);

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
      logger.error('Weather API error:', { status: response.status, message: data.message });

      // Throw error instead of returning null so React Query can handle it properly
      throw new Error(data.message || `Weather API returned ${response.status}`);
    }

    logger.debug('Weather data received successfully');
    return data as Weather;
  } catch (e: any) {
    logger.error("Error fetching weather data:", e);

    // Re-throw so React Query marks this as an error state
    throw e;
  }
};
