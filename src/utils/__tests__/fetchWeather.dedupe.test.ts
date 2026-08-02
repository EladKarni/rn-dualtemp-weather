/**
 * Concurrent identical forecast requests collapse into one network call.
 *
 * Android delivers a separate WIDGET_UPDATE broadcast per widget provider, so a
 * device carrying the Compact, Standard and Extended widgets runs three headless
 * tasks at essentially the same moment. Each checks isLocationDataFresh, all
 * three see the same stale cache because none has written yet, and all three hit
 * the network — three requests for one payload that already contains everything
 * all three render. The SQLite cache only deduplicates callers arriving after a
 * write lands, which is precisely what does not happen here.
 */
import * as Network from "expo-network";
import { fetchForecast } from "../fetchWeather";

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

const mockedNetwork = Network.getNetworkStateAsync as jest.Mock;

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

const okResponse = () => ({
  ok: true,
  status: 200,
  text: jest.fn().mockResolvedValue(validWeatherBody()),
  headers: { get: jest.fn().mockReturnValue("application/json") },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedNetwork.mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  });
});

describe("fetchForecast — in-flight deduplication", () => {
  it("collapses three simultaneous identical requests into one fetch", async () => {
    // Hold the response open so all three callers genuinely overlap.
    let release: (value: any) => void = () => {};
    global.fetch = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    ) as unknown as typeof fetch;

    const a = fetchForecast("en", 32.08, 34.78);
    const b = fetchForecast("en", 32.08, 34.78);
    const c = fetchForecast("en", 32.08, 34.78);

    release(okResponse());
    const results = await Promise.all([a, b, c]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    // Every caller gets the same resolved payload.
    results.forEach((r) => expect(r.current.temp).toBe(20.5));
  });

  it("does not collapse requests for different coordinates", async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse()) as unknown as typeof fetch;

    await Promise.all([
      fetchForecast("en", 32.08, 34.78),
      fetchForecast("en", 48.85, 2.35),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("does not collapse requests for different locales", async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse()) as unknown as typeof fetch;

    await Promise.all([
      fetchForecast("en", 32.08, 34.78),
      fetchForecast("fr", 32.08, 34.78),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("releases the slot so a later request fetches again", async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse()) as unknown as typeof fetch;

    await fetchForecast("en", 32.08, 34.78);
    await fetchForecast("en", 32.08, 34.78);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("shares one failure with every joined caller, then allows a retry", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const a = fetchForecast("en", 32.08, 34.78);
    const b = fetchForecast("en", 32.08, 34.78);

    await expect(a).rejects.toThrow("network down");
    await expect(b).rejects.toThrow("network down");
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // A poisoned slot would make this resolve from the dead promise instead.
    global.fetch = jest.fn().mockResolvedValue(okResponse()) as unknown as typeof fetch;
    await expect(fetchForecast("en", 32.08, 34.78)).resolves.toMatchObject({
      current: { temp: 20.5 },
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
