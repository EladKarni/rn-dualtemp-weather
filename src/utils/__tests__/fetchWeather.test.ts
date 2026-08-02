import * as Network from "expo-network";
import {
  fetchForecast,
  normalizeBaseUrl,
  sanitizeBodyPreview,
} from "../fetchWeather";
import { logger } from "../logger";
import {
  ApiError,
  AuthenticationError,
  BadRequestError,
  NoConnectionError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TimeoutError,
} from "../errors";

jest.mock("expo-network");
jest.mock("../logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    exception: jest.fn(),
  },
}));

const DEFAULT_URL = "https://open-weather-proxy-pi.vercel.app/api/v1/";

const mockedNetwork = Network.getNetworkStateAsync as jest.Mock;
const mockedException = logger.exception as jest.Mock;

/** Build a minimal, shape-valid Weather JSON body. */
const validWeatherBody = () =>
  JSON.stringify({
    lat: 32,
    lon: 34,
    timezone: "x",
    timezone_offset: 0,
    current: { temp: 20.5 },
    minutely: [],
    hourly: [],
    daily: [],
  });

/** Install a fetch mock resolving to a Response-like object. */
const mockFetch = (opts: {
  ok: boolean;
  status: number;
  body: string;
  contentType?: string;
}) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: opts.ok,
    status: opts.status,
    text: jest.fn().mockResolvedValue(opts.body),
    headers: {
      get: jest.fn().mockReturnValue(opts.contentType ?? "application/json"),
    },
  }) as unknown as typeof fetch;
};

/** Run fetchForecast and return the thrown error (or null on success). */
const catchError = async (): Promise<any> => {
  try {
    await fetchForecast("en", 32.0853421, 34.7817676);
    return null;
  } catch (e) {
    return e;
  }
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default: device online.
  mockedNetwork.mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  });
});

describe("normalizeBaseUrl", () => {
  it("appends a trailing slash when missing", () => {
    expect(normalizeBaseUrl("https://example.com/api/v1")).toBe(
      "https://example.com/api/v1/"
    );
  });

  it("leaves an already-correct URL unchanged", () => {
    expect(normalizeBaseUrl("https://example.com/api/v1/")).toBe(
      "https://example.com/api/v1/"
    );
  });

  it("falls back to the default on empty string", () => {
    expect(normalizeBaseUrl("")).toBe(DEFAULT_URL);
  });

  it("falls back to the default on whitespace-only", () => {
    expect(normalizeBaseUrl("   ")).toBe(DEFAULT_URL);
  });

  it("falls back to the default on undefined / null", () => {
    expect(normalizeBaseUrl(undefined)).toBe(DEFAULT_URL);
    expect(normalizeBaseUrl(null)).toBe(DEFAULT_URL);
  });

  it("trims surrounding whitespace before normalizing", () => {
    expect(normalizeBaseUrl("  https://example.com/api/  ")).toBe(
      "https://example.com/api/"
    );
  });
});

describe("sanitizeBodyPreview", () => {
  it("strips query strings", () => {
    const out = sanitizeBodyPreview(
      "Cannot GET /api/v1/get-weather?lat=32.0853421&long=34.7817676&lang=en"
    );
    expect(out).not.toContain("?");
    expect(out).not.toContain("32.0853421");
    expect(out).not.toContain("34.7817676");
  });

  it("redacts coordinate markers with high-precision decimals in JSON", () => {
    const out = sanitizeBodyPreview(
      '{"lat": 32.0853421, "long": 34.7817676}'
    );
    expect(out).not.toContain("32.0853421");
    expect(out).not.toContain("34.7817676");
    expect(out.toLowerCase()).toContain("[redacted]");
  });
});

describe("fetchForecast — HTTP error mapping", () => {
  it("maps 401 status to AuthenticationError (reported once)", async () => {
    mockFetch({ ok: false, status: 401, body: JSON.stringify({ message: "no" }) });
    const err = await catchError();
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.recoverable).toBe(false);
    expect(mockedException).toHaveBeenCalledTimes(1);
    expect(mockedException.mock.calls[0][1].tags.error_type).toBe(
      "weather_api_error"
    );
  });

  it("maps a 500 whose message contains '401' to AuthenticationError", async () => {
    mockFetch({
      ok: false,
      status: 500,
      body: JSON.stringify({ message: "upstream 401 Unauthorized" }),
    });
    const err = await catchError();
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(mockedException).toHaveBeenCalledTimes(1);
  });

  it("maps 429 to RateLimitError carrying retryAfter", async () => {
    mockFetch({
      ok: false,
      status: 429,
      body: JSON.stringify({ retryAfter: 30 }),
    });
    const err = await catchError();
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.userMessage).toContain("30");
    expect(mockedException).toHaveBeenCalledTimes(1);
  });

  it("maps 5xx to ServerError (recoverable)", async () => {
    mockFetch({
      ok: false,
      status: 503,
      body: JSON.stringify({ message: "down" }),
    });
    const err = await catchError();
    expect(err).toBeInstanceOf(ServerError);
    expect(err.recoverable).toBe(true);
    expect(mockedException).toHaveBeenCalledTimes(1);
  });

  it("maps 404 to NotFoundError that stays recoverable (keeps Retry)", async () => {
    mockFetch({
      ok: false,
      status: 404,
      body: JSON.stringify({ message: "leaked server detail" }),
    });
    const err = await catchError();
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.recoverable).toBe(true);
    // Generic, no server text piped into the user-facing message.
    expect(err.userMessage).not.toContain("leaked server detail");
    expect(mockedException).toHaveBeenCalledTimes(1);
  });

  it("maps 400 to BadRequestError: recoverable, generic userMessage, server text internal only", async () => {
    mockFetch({
      ok: false,
      status: 400,
      body: JSON.stringify({ message: "invalid coords 32.0853421" }),
    });
    const err = await catchError();
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.recoverable).toBe(true);
    expect(err.userMessage).toBe(
      "Invalid request. Please check your input and try again."
    );
    expect(err.userMessage).not.toContain("32.0853421");
    // Server text is preserved internally for logs/Sentry.
    expect(err.message).toContain("invalid coords");
    // ...and forwarded to Sentry as api_message.
    expect(mockedException.mock.calls[0][1].extra.api_message).toContain(
      "invalid coords"
    );
  });
});

describe("fetchForecast — invalid 2xx responses", () => {
  it("maps a 200 HTML body to a recoverable invalid-response ApiError with sanitized body_preview", async () => {
    const html =
      "<html>Cannot GET /api/v1/get-weather?lat=32.0853421&long=34.7817676&lang=en</html>";
    mockFetch({ ok: true, status: 200, body: html, contentType: "text/html" });
    const err = await catchError();
    expect(err).toBeInstanceOf(ApiError);
    expect(err.recoverable).toBe(true);
    expect(mockedException).toHaveBeenCalledTimes(1);
    const ctx = mockedException.mock.calls[0][1];
    expect(ctx.tags.error_type).toBe("weather_api_invalid_response");
    expect(ctx.extra.body_preview).not.toContain("32.0853421");
    expect(ctx.extra.body_preview).not.toContain("34.7817676");
    expect(ctx.extra.body_preview).not.toContain("?lat");
  });

  it("maps a 200 wrong-shape JSON body to the same invalid-response ApiError", async () => {
    mockFetch({
      ok: true,
      status: 200,
      body: JSON.stringify({ foo: "bar", daily: [] }),
    });
    const err = await catchError();
    expect(err).toBeInstanceOf(ApiError);
    expect(err.recoverable).toBe(true);
    expect(mockedException).toHaveBeenCalledTimes(1);
    expect(mockedException.mock.calls[0][1].tags.error_type).toBe(
      "weather_api_invalid_response"
    );
  });
});

describe("fetchForecast — network conditions", () => {
  it("throws NoConnectionError when offline and emits ZERO Sentry events", async () => {
    mockedNetwork.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });
    global.fetch = jest.fn(); // must not be called
    const err = await catchError();
    expect(err).toBeInstanceOf(NoConnectionError);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockedException).not.toHaveBeenCalled();
  });

  it("maps a timed-out (AbortError) fetch to TimeoutError, reported exactly once", async () => {
    const abortError = Object.assign(new Error("Aborted"), {
      name: "AbortError",
    });
    global.fetch = jest
      .fn()
      .mockRejectedValue(abortError) as unknown as typeof fetch;
    const err = await catchError();
    expect(err).toBeInstanceOf(TimeoutError);
    expect(mockedException).toHaveBeenCalledTimes(1);
    expect(mockedException.mock.calls[0][1].tags.error_type).toBe(
      "weather_fetch_network_error"
    );
  });
});

describe("fetchForecast — success", () => {
  it("returns the parsed Weather and reports nothing", async () => {
    mockFetch({ ok: true, status: 200, body: validWeatherBody() });
    const result = await fetchForecast("en", 32, 34);
    expect(result.current.temp).toBe(20.5);
    expect(mockedException).not.toHaveBeenCalled();
  });
});
