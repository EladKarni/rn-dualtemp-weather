import { Alert } from "react-native";
import { Weather } from "../types/WeatherTypes";
import { logger } from "./logger";
import {
  AuthenticationError,
  RateLimitError,
  ServerError,
  toAppError,
} from "./errors";

export const base_url = `https://open-weather-proxy-pi.vercel.app/api/v2/`;

export const fetchForecast = async (
  locale: string,
  latitude: number,
  longitude: number
): Promise<Weather> => {
  try {
    const url = `${base_url}get-weather?lat=${latitude}&long=${longitude}&lang=${locale}`;
    logger.debug("Fetching weather data");

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
      logger.error("Weather API error:", {
        status: response.status,
      });

      // Convert HTTP status codes to appropriate error types
      // Check for 401 in message (proxy might return 500 but message contains 401 info)
      const isAuthError =
        response.status === 401 ||
        (data.message && data.message.includes("401")) ||
        (data.message && data.message.includes("Unauthorized"));

      if (isAuthError) {
        throw new AuthenticationError();
      } else if (response.status === 429) {
        throw new RateLimitError(data.retryAfter);
      } else if (response.status >= 500) {
        throw new ServerError(response.status);
      } else {
        // Generic error for other status codes
        throw toAppError(
          new Error(data.message || `Weather API returned ${response.status}`)
        );
      }
    }

    logger.debug("Weather data received successfully");
    return data as Weather;
  } catch (e: any) {
    logger.error("Error fetching weather data:", e);

    // Re-throw so React Query marks this as an error state
    throw e;
  }
};
