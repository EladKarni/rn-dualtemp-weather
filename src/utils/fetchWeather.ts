import { Weather } from "../types/WeatherTypes";
import { logger } from "./logger";
import {
  ApiError,
  AuthenticationError,
  BadRequestError,
  NotFoundError,
  RateLimitError,
  ServerError,
} from "./errors";

export const base_url =
  process.env.EXPO_PUBLIC_WEATHER_API_URL ??
  "https://open-weather-proxy-pi.vercel.app/api/v1/";

/**
 * Parse a response body as JSON, returning null instead of throwing when the
 * body isn't valid JSON (e.g. an HTML error page).
 */
const parseJsonSafely = (body: string): any | null => {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

export const fetchForecast = async (
  locale: string,
  latitude: number,
  longitude: number
): Promise<Weather> => {
  try {
    const url = `${base_url}get-weather?lat=${latitude}&long=${longitude}&lang=${locale}`;
    logger.debug("Fetching weather data");

    const response = await fetch(url);

    // Read the body as text first so a non-JSON response (e.g. an HTML error
    // page from a misconfigured URL) doesn't blow up with an opaque
    // "JSON Parse error: Unexpected character: <".
    const rawBody = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const data = parseJsonSafely(rawBody);

    if (!response.ok) {
      logger.error("Weather API error:", {
        status: response.status,
      });

      // Convert HTTP status codes to appropriate error types
      // Check for 401 in message (proxy might return 500 but message contains 401 info)
      const message = data?.message as string | undefined;
      const isAuthError =
        response.status === 401 ||
        (message && message.includes("401")) ||
        (message && message.includes("Unauthorized"));

      let error: Error;
      if (isAuthError) {
        error = new AuthenticationError();
      } else if (response.status === 429) {
        error = new RateLimitError(data?.retryAfter);
      } else if (response.status >= 500) {
        error = new ServerError(response.status);
      } else if (response.status === 404) {
        error = new NotFoundError("Weather data");
      } else if (response.status === 400) {
        error = new BadRequestError(message);
      } else {
        // Generic error for other status codes
        error = new ApiError(
          message || `Weather API returned ${response.status}`,
          response.status
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
          api_message: message,
          latitude,
          longitude,
          locale,
        },
      });

      throw error;
    }

    // Response was 2xx but the body wasn't valid JSON — typically means the URL
    // is pointing at the wrong host (returning HTML) rather than the API.
    if (data === null) {
      const error = new ApiError(
        `Weather API returned a non-JSON response (content-type: ${contentType || "unknown"})`,
        response.status,
        "Weather service returned an unexpected response. Please try again later."
      );
      logger.exception(error, {
        tags: {
          error_type: 'weather_api_invalid_response',
        },
        extra: {
          api_url: url,
          api_status: response.status,
          content_type: contentType,
          body_preview: rawBody.slice(0, 200),
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
