/**
 * Forecast-store initialization and the deferred cache eviction.
 *
 * Two things are pinned here, both of which contributed to a "database is
 * locked" failure observed on device at cold start:
 *
 *  - The init guard has to be the PROMISE, not a boolean set after an await.
 *    Two call sites (App.tsx and useMultiLocationWeather) both fire on mount,
 *    both read the flag in the same tick, and a boolean lets both through.
 *  - The 24-hour eviction must not run on the startup path. Its DELETE raced
 *    the headless widget task's connection at the one moment the app has the
 *    least slack, and nothing needs it finished before the first render.
 */
import { initializeForecastStore, scheduleForecastCleanup, useForecastStore } from "../useForecastStore";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("../../utils/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), exception: jest.fn() },
}));

jest.mock("../../localization/i18n", () => ({ i18n: { locale: "en", t: (k: string) => k } }));

jest.mock("../../services/db/database", () => ({
  weatherDatabase: {
    initialize: jest.fn(),
    cleanupOldData: jest.fn(),
    getWeatherData: jest.fn(),
    saveWeatherData: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { weatherDatabase } = require("../../services/db/database");

/**
 * Force the module-level init guard back to its unused state.
 *
 * Returns the database mock alongside the module: resetModules gives the
 * freshly-required store a freshly-required mock too, so the instance captured
 * at file scope is no longer the one it talks to.
 */
const freshModule = () => {
  jest.resetModules();
  const mod = require("../useForecastStore");
  const { weatherDatabase: db } = require("../../services/db/database");
  db.initialize.mockResolvedValue(undefined);
  db.cleanupOldData.mockResolvedValue(undefined);
  return { mod, db };
};

beforeEach(() => {
  jest.clearAllMocks();
  weatherDatabase.initialize.mockResolvedValue(undefined);
  weatherDatabase.cleanupOldData.mockResolvedValue(undefined);
});

describe("initializeForecastStore", () => {
  it("initializes the database exactly once when both call sites fire together", async () => {
    const { mod, db } = freshModule();
    let release: () => void = () => {};
    db.initialize.mockImplementation(
      () => new Promise<void>((resolve) => { release = resolve; })
    );

    // Both mount effects run in the same tick — this is the real scenario, not
    // a contrived one: App.tsx and useMultiLocationWeather both call this.
    const a = mod.initializeForecastStore();
    const b = mod.initializeForecastStore();
    release();
    await Promise.all([a, b]);

    expect(db.initialize).toHaveBeenCalledTimes(1);
  });

  it("does NOT evict old data as part of initialization", async () => {
    const { mod, db } = freshModule();
    await mod.initializeForecastStore();

    // The eviction is a DELETE. Running it here is what raced the widget
    // task's connection and produced "database is locked".
    expect(db.cleanupOldData).not.toHaveBeenCalled();
  });

  it("lets a later caller retry after a failure instead of caching it forever", async () => {
    const { mod, db } = freshModule();
    db.initialize.mockRejectedValueOnce(new Error("disk full"));

    await expect(mod.initializeForecastStore()).rejects.toThrow("disk full");

    db.initialize.mockResolvedValue(undefined);
    await expect(mod.initializeForecastStore()).resolves.toBeUndefined();
    expect(db.initialize).toHaveBeenCalledTimes(2);
  });
});

describe("scheduleForecastCleanup", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("waits before evicting, so the cold start is over first", () => {
    scheduleForecastCleanup(10_000);

    expect(weatherDatabase.cleanupOldData).not.toHaveBeenCalled();
    jest.advanceTimersByTime(10_000);
    expect(weatherDatabase.cleanupOldData).toHaveBeenCalledTimes(1);
  });

  it("can be cancelled, so unmounting mid-delay does not fire it", () => {
    const cancel = scheduleForecastCleanup(10_000);
    cancel();

    jest.advanceTimersByTime(60_000);
    expect(weatherDatabase.cleanupOldData).not.toHaveBeenCalled();
  });

  it("does not reject when the eviction fails", async () => {
    // cleanupOldData swallows its own errors; this guards the fire-and-forget
    // call site from ever producing an unhandled rejection.
    weatherDatabase.cleanupOldData.mockRejectedValueOnce(new Error("locked"));
    scheduleForecastCleanup(0);

    expect(() => jest.advanceTimersByTime(1)).not.toThrow();
    await Promise.resolve();
  });
});

describe("the store still exposes cleanup for callers that want it", () => {
  it("delegates to the database", async () => {
    await useForecastStore.getState().cleanupOldData();
    expect(weatherDatabase.cleanupOldData).toHaveBeenCalledTimes(1);
  });
});
