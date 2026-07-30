import * as Network from "expo-network";
import { Weather } from "../types/WeatherTypes";
import { logger } from "./logger";
import { fetchWithTimeout } from "./httpClient";
import {
  ApiError,
  AuthenticationError,
  BadRequestError,
  NoConnectionError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TimeoutError,
} from "./errors";

/**
 * Default weather proxy used when EXPO_PUBLIC_WEATHER_API_URL is unset or blank.
 * (Infra endpoint, not ours to rename — see plan decision D1.)
 */
const DEFAULT_WEATHER_API_URL =
  "https://open-weather-proxy-pi.vercel.app/api/v1/";

/**
 * Normalize the configured weather-API base URL (finding 7). Pure & exported so
 * it is unit-testable:
 * - trim surrounding whitespace,
 * - treat empty / whitespace-only as unset (fall back to the default proxy),
 * - guarantee exactly one trailing slash so `${base_url}get-weather` is valid.
 */
export const normalizeBaseUrl = (raw: string | undefined | null): string => {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") {
    return DEFAULT_WEATHER_API_URL;
  }
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

export const base_url = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_WEATHER_API_URL
);

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

/**
 * Round a coordinate to ~1 decimal place (~11 km, city level) so error reports
 * keep a coarse "which region failed" signal without exporting the user's
 * precise GPS position to a third party (Sentry). See audit issue S2.
 */
const coarsenCoord = (n: number): number => Math.round(n * 10) / 10;

/**
 * Sanitize a response-body preview before it leaves the device for Sentry
 * (part of finding 1). Two passes:
 *  1. strip query strings from any URL-looking token (the request URL carries
 *     lat/long), and
 *  2. redact coordinate-like decimals (>=3 dp) adjacent to lat/lon-ish markers.
 * Worker B's event scrubber is the backstop; this is the primary source-side
 * pass. Exported for unit tests.
 */
export const sanitizeBodyPreview = (raw: string): string => {
  return raw
    // Plain query-string strip: "?lat=..&long=.." → "" wherever it appears,
    // stopping at whitespace or a quote/angle-bracket delimiter.
    .replace(/\?[^\s"'<>]*/g, "")
    // Coordinate redaction: a lat/lon marker followed by a high-precision
    // decimal (JSON style: `"lat": 32.0853421`, or `lat=..`, `lat:..`).
    .replace(
      /\b(lat|latitude|lon|long|lng|longitude)\b["'\s]*[=:]["'\s]*-?\d+\.\d{3,}/gi,
      "$1=[redacted]"
    );
};

/**
 * Build and report (exactly once) the invalid-response ApiError shared by the
 * non-JSON and wrong-shape 2xx paths. A 200 that isn't a valid Weather object
 * must never be persisted into SQLite as fresh truth (finding 7b). Always
 * throws (return type `never`).
 */
const throwInvalidResponse = (opts: {
  message: string;
  status: number;
  contentType: string;
  rawBody: string;
  latitude: number;
  longitude: number;
  locale: string;
}): never => {
  const error = new ApiError(
    opts.message,
    opts.status,
    "Weather service returned an unexpected response. Please try again later."
  );
  // Its own userMessage says "try again", so keep the Retry button (finding 8).
  error.recoverable = true;

  logger.exception(error, {
    tags: {
      error_type: "weather_api_invalid_response",
    },
    extra: {
      api_path: "get-weather",
      api_status: opts.status,
      content_type: opts.contentType,
      body_preview: sanitizeBodyPreview(opts.rawBody).slice(0, 200),
      lat_approx: coarsenCoord(opts.latitude),
      lon_approx: coarsenCoord(opts.longitude),
      locale: opts.locale,
    },
  });

  throw error;
};

const runFetchForecast = async (
  locale: string,
  latitude: number,
  longitude: number
): Promise<Weather> => {
  try {
    const url = `${base_url}get-weather?lat=${latitude}&long=${longitude}&lang=${locale}`;
    logger.debug("Fetching weather data");

    // Skip the fetch when the device is known to be offline. The Android widget
    // update runs on an OS schedule (~every 30 min) regardless of connectivity,
    // so without this guard an offline device throws a raw "TypeError: Network
    // request failed" that ends up in Sentry as noise. NoConnectionError is an
    // expected/recoverable state (we fall back to cached data) and is excluded
    // from Sentry reporting in the catch below.
    const networkState = await Network.getNetworkStateAsync();
    if (
      networkState.isConnected === false ||
      networkState.isInternetReachable === false
    ) {
      throw new NoConnectionError();
    }

    // 10s timeout leaves room for the cached-fallback path to run before the
    // widget headless task is killed at 30s (finding 6b). A timed-out fetch
    // rejects with an AbortError, mapped to TimeoutError in the catch below.
    const response = await fetchWithTimeout(url, 10_000);

    // Read the body as text first so a non-JSON response (e.g. an HTML error
    // page from a misconfigured URL) doesn't blow up with an opaque
    // "JSON Parse error: Unexpected character: <".
    const rawBody = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const data = parseJsonSafely(rawBody);

    if (!response.ok) {
      // Convert HTTP status codes to appropriate error types.
      // Check for 401 in message (proxy might return 500 but message contains
      // 401 info).
      const message = data?.message as string | undefined;
      const isAuthError =
        response.status === 401 ||
        message?.includes("401") === true ||
        message?.includes("Unauthorized") === true;

      let error: Error;
      if (isAuthError) {
        error = new AuthenticationError();
      } else if (response.status === 429) {
        error = new RateLimitError(data?.retryAfter);
      } else if (response.status >= 500) {
        error = new ServerError(response.status);
      } else if (response.status === 404) {
        // Keep the Retry button — a proxy 404 is usually transient (finding 8).
        error = new NotFoundError("Weather data", true);
      } else if (response.status === 400) {
        // Server text stays internal (message + api_message extra), not in the
        // user-facing message; keep Retry (finding 8).
        error = new BadRequestError(message, true);
      } else {
        // Generic error for other status codes
        error = new ApiError(
          message || `Weather API returned ${response.status}`,
          response.status
        );
      }

      // Exactly one Sentry event per failure (finding 3a): report here, and the
      // catch block excludes every ApiError subtype so it is never re-reported.
      logger.exception(error, {
        tags: {
          error_type: "weather_api_error",
        },
        extra: {
          api_path: "get-weather",
          api_status: response.status,
          api_message: message,
          lat_approx: coarsenCoord(latitude),
          lon_approx: coarsenCoord(longitude),
          locale,
        },
      });

      throw error;
    }

    // Response was 2xx but the body wasn't valid JSON — typically means the URL
    // is pointing at the wrong host (returning HTML) rather than the API.
    if (data === null) {
      throwInvalidResponse({
        message: `Weather API returned a non-JSON response (content-type: ${
          contentType || "unknown"
        })`,
        status: response.status,
        contentType,
        rawBody,
        latitude,
        longitude,
        locale,
      });
    }

    // Response was 2xx and valid JSON, but the wrong shape — reject it so a
    // malformed body can never be persisted into SQLite as fresh truth (7b).
    const hasValidShape =
      typeof data?.current?.temp === "number" &&
      Array.isArray(data?.daily) &&
      Array.isArray(data?.hourly);
    if (!hasValidShape) {
      throwInvalidResponse({
        message: "Weather API returned JSON with an unexpected shape",
        status: response.status,
        contentType,
        rawBody,
        latitude,
        longitude,
        locale,
      });
    }

    logger.debug("Weather data received successfully");
    return data as Weather;
  } catch (e: any) {
    // A timed-out fetch rejects with an AbortError from fetchWithTimeout's
    // AbortController; surface it as the taxonomy's TimeoutError (finding 6b).
    const error = e?.name === "AbortError" ? new TimeoutError() : e;

    // Single-report policy (finding 3a): every API subtype extends ApiError and
    // was already reported above; an offline NoConnectionError is expected (we
    // fall back to cached data). Everything else — including TimeoutError, an
    // unexpected anomaly — is reported here exactly once.
    if (!(error instanceof ApiError || error instanceof NoConnectionError)) {
      logger.exception(error, {
        tags: {
          error_type: "weather_fetch_network_error",
        },
        extra: {
          lat_approx: coarsenCoord(latitude),
          lon_approx: coarsenCoord(longitude),
          locale,
        },
      });
    }

    // Re-throw so React Query marks this as an error state.
    throw error;
  }
};

/**
 * Identical requests in flight right now, keyed by request identity
 * (coords + locale). See fetchForecast.
 */
const inFlightForecasts = new Map<string, Promise<Weather>>();

/**
 * Fetch the forecast, collapsing concurrent identical requests into one.
 *
 * Android delivers a separate WIDGET_UPDATE broadcast per widget provider, so a
 * device with the Compact, Standard and Extended widgets installed runs three
 * headless tasks at essentially the same moment. Each checks
 * isLocationDataFresh, all three see the same stale cache because none has
 * written yet, and all three hit the network — three requests for one payload
 * that already contains everything all three render. The SQLite cache only
 * deduplicates callers that arrive *after* a write lands, which is exactly the
 * case that doesn't happen here.
 *
 * Joining the in-flight promise also means a failure is reported once rather
 * than three times, preserving the single-report policy above.
 *
 * Keyed on coords + locale rather than location id: that is the real request
 * identity, so two saved locations at the same point still share one call.
 */
export const fetchForecast = (
  locale: string,
  latitude: number,
  longitude: number
): Promise<Weather> => {
  const key = `${latitude}|${longitude}|${locale}`;
  const existing = inFlightForecasts.get(key);
  if (existing) {
    logger.debug("Joining in-flight weather request");
    return existing;
  }

  // The slot is released inside this chain rather than from a detached
  // .finally(), so cleanup completes BEFORE an awaiting caller resumes. A
  // detached chain releases two microtasks late, which is long enough for a
  // sequential `await fetch(); await fetch();` to join the already-resolved
  // promise and silently skip the second request. try/finally also releases on
  // failure, so a failed attempt can't poison later retries.
  // Unconditional delete is safe: a second request for this key can only be
  // created once the entry is gone, and nothing else removes it — so when this
  // finally runs, the slot holds this request or nothing.
  const request = (async () => {
    try {
      return await runFetchForecast(locale, latitude, longitude);
    } finally {
      inFlightForecasts.delete(key);
    }
  })();

  inFlightForecasts.set(key, request);
  return request;
};
