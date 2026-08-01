/**
 * App-token header coverage (proxy warn-only rollout).
 *
 * The proxy accepts a shared-secret `x-app-token` header and, in warn-only
 * mode, counts token_ok / token_missing / token_bad without ever blocking a
 * request. Two invariants matter on the app side:
 *  - A build WITHOUT EXPO_PUBLIC_WEATHER_APP_TOKEN behaves exactly as it does
 *    today: no header at all — not an empty header, which the proxy would
 *    count as token_bad.
 *  - Both proxy call sites (get-weather in fetchWeather, search-cities in
 *    geocoding) actually attach the header, so token_ok climbs once builds
 *    carry the variable. fetchWithTimeout spreads its options into fetch, so
 *    asserting on global.fetch's second argument covers the whole chain.
 *
 * The env var is read once at module load, so every case requires its modules
 * fresh inside jest.isolateModules() with the variable explicitly set or
 * deleted — never relying on whatever the runner's environment contains.
 */
import type { CityResult } from "../geocoding";

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

const TEST_TOKEN = "test-token-value";
const originalToken = process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN;

afterEach(() => {
  if (originalToken === undefined) {
    delete process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN;
  } else {
    process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN = originalToken;
  }
});

/** Load a fresh APP_TOKEN_HEADERS under the current process.env. */
const loadHeaders = (): Record<string, string> => {
  let headers: Record<string, string> = { unassigned: "unassigned" };
  jest.isolateModules(() => {
    ({ APP_TOKEN_HEADERS: headers } = require("../appToken"));
  });
  return headers;
};

describe("APP_TOKEN_HEADERS", () => {
  it("is {} when the variable is unset, so no header is sent at all", () => {
    delete process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN;
    expect(loadHeaders()).toEqual({});
  });

  it("is {} when the variable is set but empty (an empty header would count as token_bad)", () => {
    process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN = "";
    expect(loadHeaders()).toEqual({});
  });

  it("is {} when the variable is whitespace-only (a stray space must not pollute token_bad)", () => {
    process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN = "   ";
    expect(loadHeaders()).toEqual({});
  });

  it("carries x-app-token when the variable is set", () => {
    process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN = TEST_TOKEN;
    expect(loadHeaders()).toEqual({ "x-app-token": TEST_TOKEN });
  });
});

/** Build a minimal, shape-valid Weather JSON body (mirrors fetchWeather.test). */
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

/** The options object the call site handed to fetch (via fetchWithTimeout). */
const fetchOptions = (): Record<string, any> =>
  (global.fetch as jest.Mock).mock.calls[0][1] ?? {};

/**
 * Require fetchWeather fresh (so it re-reads the env var) and run one
 * forecast fetch against a mocked, online network and a valid 200 body.
 */
const runForecastFetch = async (): Promise<void> => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: jest.fn().mockResolvedValue(validWeatherBody()),
    headers: { get: jest.fn().mockReturnValue("application/json") },
  }) as unknown as typeof fetch;

  let fetchForecast: (
    locale: string,
    latitude: number,
    longitude: number
  ) => Promise<unknown> = () => Promise.reject(new Error("not loaded"));
  jest.isolateModules(() => {
    const Network = require("expo-network");
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    ({ fetchForecast } = require("../fetchWeather"));
  });
  await fetchForecast("en", 32.08, 34.78);
};

/**
 * Require geocoding fresh (fresh in-memory search cache too) and run one
 * city search against a mocked 200 array body.
 */
const runCitySearch = async (query: string): Promise<void> => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue([]),
  }) as unknown as typeof fetch;

  let searchCities: (q: string) => Promise<CityResult[]> = () =>
    Promise.reject(new Error("not loaded"));
  jest.isolateModules(() => {
    ({ searchCities } = require("../geocoding"));
  });
  await searchCities(query);
};

describe("get-weather call site (fetchWeather)", () => {
  it("sends x-app-token when the variable is set", async () => {
    process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN = TEST_TOKEN;
    await runForecastFetch();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(fetchOptions().headers).toEqual({ "x-app-token": TEST_TOKEN });
  });

  it("sends no x-app-token when the variable is unset", async () => {
    delete process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN;
    await runForecastFetch();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(fetchOptions().headers ?? {}).not.toHaveProperty("x-app-token");
  });
});

describe("search-cities call site (geocoding)", () => {
  it("sends x-app-token when the variable is set", async () => {
    process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN = TEST_TOKEN;
    await runCitySearch("london");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(fetchOptions().headers).toEqual({ "x-app-token": TEST_TOKEN });
  });

  it("sends no x-app-token when the variable is unset", async () => {
    delete process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN;
    await runCitySearch("madrid");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(fetchOptions().headers ?? {}).not.toHaveProperty("x-app-token");
  });
});
