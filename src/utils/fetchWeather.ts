import { Weather } from "../types/WeatherTypes";
import { logger } from "./logger";
import {
  AuthenticationError,
  RateLimitError,
  ServerError,
  toAppError,
} from "./errors";

export const base_url = `https://open-weather-proxy-pi.vercel.app/api/v1/`;

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

      let error: Error;
      if (isAuthError) {
        error = new AuthenticationError();
      } else if (response.status === 429) {
        error = new RateLimitError(data.retryAfter);
      } else if (response.status >= 500) {
        error = new ServerError(response.status);
      } else {
        // Generic error for other status codes
        error = toAppError(
          new Error(data.message || `Weather API returned ${response.status}`)
        );
      }

      // Send to Sentry via centralized logger
      logger.exception(error, {
        tags: {
          error_type: 'weather_api_error',
        },
        extra: {
          api_url: url,
          api_status: response.status,
          api_message: data.message,
          latitude,
          longitude,
          locale,
        },
      });

      throw error;
    }

    logger.debug("Weather data received successfully");
    return data as Weather;
  } catch (e: any) {
    logger.error("Error fetching weather data:", e);

    // Send network/unexpected errors to Sentry (API errors already sent above)
    if (!(e instanceof AuthenticationError || e instanceof RateLimitError || e instanceof ServerError)) {
      logger.exception(e, {
        tags: {
          error_type: 'weather_fetch_network_error',
        },
        extra: {
          latitude,
          longitude,
          locale,
        },
      });
    }

    // Re-throw so React Query marks this as an error state
    throw e;
  }
};
