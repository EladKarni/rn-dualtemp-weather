/**
 * A read that arrives while the database is still initializing must wait for
 * the TABLES, not merely for the handle.
 *
 * openDatabaseAsync resolving does not mean the schema exists: initialize()
 * assigns `this.db` as soon as the file is open, then issues the concurrency
 * pragmas (b3f0860) and only then CREATE TABLE. Anything that gated on
 * `this.db` alone therefore had a window — several async round-trips wide —
 * in which a second caller saw a handle, skipped the wait, and queried an
 * empty database.
 *
 * It fired on a real emulator during the 2.2.0 smoke run:
 *
 *   E ReactNativeJS: 'Failed to get weather data for gps-location:'
 *   → Caused by: Error code : no such table: weather_cache
 *
 * Cold start is exactly where the store's hydration and the widget's read land
 * together, and the consequence is quiet: the cache read fails, so a user with
 * no network sees nothing instead of their last forecast.
 *
 * The test drives the real ordering rather than asserting on internals — it
 * holds the pragma step open, starts a read in that window, and checks the read
 * cannot observe a schema-less database.
 */
import * as SQLite from "expo-sqlite";
import { WeatherDatabase } from "../database";

jest.mock("../../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    exception: jest.fn(),
    setTag: jest.fn(),
  },
}));

jest.mock("expo-sqlite", () => ({ openDatabaseAsync: jest.fn() }));

const openDatabaseAsync = SQLite.openDatabaseAsync as unknown as jest.Mock;

// Call counts carry between tests otherwise, and the second case asserts on one.
beforeEach(() => {
  jest.clearAllMocks();
});

describe("initialization race", () => {
  it("makes a concurrent read wait for CREATE TABLE, not just for the handle", async () => {
    let tablesExist = false;
    let releasePragma: () => void = () => {};
    const pragmaHeld = new Promise<void>((resolve) => {
      releasePragma = resolve;
    });

    const execAsync = jest.fn(async (sql: string) => {
      if (/CREATE TABLE/i.test(sql)) {
        tablesExist = true;
      }
    });

    // Records the ordering rather than only throwing. getWeatherData catches
    // its own errors and returns null, so asserting on the resolved value
    // cannot distinguish "waited correctly and found no row" from "queried an
    // empty database and swallowed the failure" — the first draft of this test
    // asserted exactly that and passed against the bug.
    let readBeforeTables = false;
    const getFirstAsync = jest.fn(async (sql: string) => {
      if (/PRAGMA/i.test(sql)) {
        // Hold initialize() open here, mid-way between assigning the handle and
        // creating the tables — the exact window the bug lived in.
        await pragmaHeld;
        return { journal_mode: "wal" };
      }
      if (!tablesExist) {
        readBeforeTables = true;
        throw new Error(
          "Call to function 'NativeDatabase.prepareAsync' has failed → " +
            "Caused by: Error code : no such table: weather_cache"
        );
      }
      return null;
    });

    openDatabaseAsync.mockResolvedValue({
      execAsync,
      getFirstAsync,
      runAsync: jest.fn(),
    });

    const db = new WeatherDatabase();

    // Caller A opens the database and parks on the pragma. A full macrotask,
    // not a microtask tick: initialize() has to get PAST `this.db = await
    // openDatabaseAsync(...)` and into the held pragma, because the whole point
    // is a reader arriving when the handle is live and the schema is not. Stop
    // any earlier and the reader takes the safe path and the test proves
    // nothing — which is exactly what the first draft of it did.
    const initializing = db.initialize();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Caller B arrives in that window — the handle is live, the schema is not.
    const reading = db.getWeatherData("gps-location");

    releasePragma();
    await initializing;
    await reading;

    // The assertion that matters: no query reached the driver while the
    // database was open but schema-less.
    expect(readBeforeTables).toBe(false);
    expect(tablesExist).toBe(true);
  });

  it("opens the database only once when several readers arrive together", async () => {
    const execAsync = jest.fn().mockResolvedValue(undefined);
    const getFirstAsync = jest
      .fn()
      .mockImplementation(async (sql: string) =>
        /PRAGMA/i.test(sql) ? { journal_mode: "wal" } : null
      );
    openDatabaseAsync.mockResolvedValue({
      execAsync,
      getFirstAsync,
      runAsync: jest.fn(),
    });

    const db = new WeatherDatabase();
    await Promise.all([
      db.getWeatherData("a"),
      db.getWeatherData("b"),
      db.getWeatherData("c"),
    ]);

    expect(openDatabaseAsync).toHaveBeenCalledTimes(1);
  });
});
