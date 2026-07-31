/**
 * SQLite concurrency configuration.
 *
 * There are always two connections to weather_forecasts.db. expo-sqlite caches
 * connections in a private INSTANCE field of its native SQLiteModule, so the
 * cache is scoped to a React context, not the process — and the headless widget
 * task runs in its own context inside the same OS process. Two connections
 * contend exactly like two processes.
 *
 * Left at expo-sqlite's defaults (rollback journal, busy_timeout = 0) a writer
 * that meets a held lock fails immediately. That was observed on device as
 * "database is locked" from the startup cleanup, 32ms after libexpo-sqlite.so
 * was first loaded into the process.
 *
 * These tests pin the two things that must not silently regress: that both
 * pragmas are issued, and — more importantly — that neither can take the
 * database down when it fails.
 */
import * as SQLite from "expo-sqlite";
import { WeatherDatabase } from "../database";
import { logger } from "../../../utils/logger";

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

const execAsync = jest.fn();
const getFirstAsync = jest.fn();
const runAsync = jest.fn();

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(),
}));

const openDatabaseAsync = SQLite.openDatabaseAsync as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  execAsync.mockResolvedValue(undefined);
  getFirstAsync.mockResolvedValue({ journal_mode: "wal" });
  runAsync.mockResolvedValue({ changes: 0 });
  openDatabaseAsync.mockResolvedValue({ execAsync, getFirstAsync, runAsync });
});

/** The pragma statements issued during initialize(), in order. */
const pragmasIssued = (): string[] => [
  ...execAsync.mock.calls.map((c) => String(c[0])),
  ...getFirstAsync.mock.calls.map((c) => String(c[0])),
].filter((sql) => /PRAGMA/i.test(sql));

describe("connection tuning", () => {
  it("sets a busy timeout so a blocked writer waits instead of failing", async () => {
    await new WeatherDatabase().initialize();

    const busy = pragmasIssued().find((sql) => /busy_timeout/i.test(sql));
    expect(busy).toBeDefined();
    // Any non-zero value beats the default of 0, but it has to comfortably
    // exceed a transaction: these are single-digit milliseconds, so a loser
    // that waits seconds wins on its first retry.
    const ms = Number(busy?.match(/busy_timeout\s*=\s*(\d+)/i)?.[1]);
    expect(ms).toBeGreaterThanOrEqual(1000);
  });

  it("enables WAL, so the widget's reads stop blocking the app's writes", async () => {
    await new WeatherDatabase().initialize();
    expect(pragmasIssued().some((sql) => /journal_mode\s*=\s*WAL/i.test(sql))).toBe(true);
  });

  it("tags the resulting journal mode so release builds can be checked at all", () => {
    // debug/info are stripped in release, so without this the only on-device
    // evidence that WAL took would be the absence of a warning — which is
    // identical to the code never having run.
    return new WeatherDatabase().initialize().then(() => {
      expect(logger.setTag).toHaveBeenCalledWith("sqlite.journal_mode", "wal");
    });
  });

  it("sets busy_timeout BEFORE attempting the WAL conversion", async () => {
    // The conversion can itself return SQLITE_BUSY. With a timeout already
    // installed it waits its turn; without one it gives up on first refusal.
    await new WeatherDatabase().initialize();

    const busyOrder = execAsync.mock.invocationCallOrder[0];
    const walOrder = getFirstAsync.mock.invocationCallOrder[0];
    expect(execAsync.mock.calls[0][0]).toMatch(/busy_timeout/i);
    expect(busyOrder).toBeLessThan(walOrder);
  });

  it("creates the schema after tuning, not before", async () => {
    await new WeatherDatabase().initialize();
    const createCall = execAsync.mock.calls.findIndex((c) =>
      /CREATE TABLE/i.test(String(c[0]))
    );
    expect(createCall).toBeGreaterThan(0);
  });
});

describe("a failed pragma never takes the database with it", () => {
  // This is the whole reason the pragmas are in their own try/catch rather than
  // folded into the CREATE TABLE block. Done naively, a BUSY during the WAL
  // conversion would throw inside initialize(), null the connection, and lose
  // the database entirely — trading a performance setting for a dead app.

  it("survives a WAL conversion that throws", async () => {
    getFirstAsync.mockRejectedValueOnce(new Error("database is locked"));

    const db = new WeatherDatabase();
    await expect(db.initialize()).resolves.toBeUndefined();

    // Schema still created, so the database is fully usable.
    expect(execAsync.mock.calls.some((c) => /CREATE TABLE/i.test(String(c[0])))).toBe(true);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("survives a busy_timeout that throws", async () => {
    execAsync.mockRejectedValueOnce(new Error("nope"));

    await expect(new WeatherDatabase().initialize()).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("warns when the conversion silently does not take", async () => {
    // PRAGMA journal_mode returns the mode ACTUALLY in force, which is not
    // always the one asked for — it stays on the rollback journal if another
    // connection is reading. That is not an error, and not a failure, but it
    // does mean readers can still block writers.
    getFirstAsync.mockResolvedValueOnce({ journal_mode: "delete" });

    await new WeatherDatabase().initialize();

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("delete"));
    expect(execAsync.mock.calls.some((c) => /CREATE TABLE/i.test(String(c[0])))).toBe(true);
  });

  it("tolerates a driver that returns nothing for the pragma", async () => {
    getFirstAsync.mockResolvedValueOnce(null);
    await expect(new WeatherDatabase().initialize()).resolves.toBeUndefined();
  });
});
