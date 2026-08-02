/**
 * Store/database coverage (plan §5 Worker H item 3) — replaces the deleted
 * `test/store.test.js` + `test/testForecastStore.ts` intent.
 *
 * Covers: forecast store INIT STATE, `updateLastUpdated`/`updateWeather`
 * round-trips, `getDatabaseStats`, a save->read round-trip, and
 * `deleteLocationData` succeeding on a FRESH database.
 *
 * SQLite is mocked (no real DB). The mock is deliberately *table-aware*: it
 * registers tables from the actual `CREATE TABLE` statements executed by
 * database.ts and throws SQLite's real "no such table: X" error for any
 * INSERT/DELETE/SELECT against an unregistered table.
 *
 * WHY table-aware: it guards Worker I's Phase-3 change that removes the
 * `weather_errors` table. Because the mock parses database.ts's real SQL, this
 * suite:
 *   - passes today (weather_errors CREATE + DELETE both present),
 *   - passes after Worker I removes BOTH the CREATE and the DELETE together,
 *   - FAILS on the exact broken intermediate the plan warns about (removing the
 *     CREATE but leaving `DELETE FROM weather_errors`, which would throw
 *     "no such table" on a fresh install).
 * It never asserts on weather_errors internals — only that deleteLocationData
 * resolves — so it is robust with OR without the table existing.
 */

import * as SQLite from 'expo-sqlite';
import { useForecastStore } from '../useForecastStore';
import type { Weather } from '../../types/WeatherTypes';

// --- Mocks -----------------------------------------------------------------
// jest.mock() calls are hoisted above the imports above by babel-plugin-jest-hoist,
// so the imports resolve to these mocks at runtime.

jest.mock('expo-sqlite', () => {
  const makeFakeDb = () => {
    const tables = new Set<string>();
    const rows = new Map<string, any[]>();

    const rowsOf = (name: string): any[] => {
      if (!rows.has(name)) rows.set(name, []);
      return rows.get(name)!;
    };
    const ensureTable = (name: string) => {
      if (!tables.has(name)) {
        // Mirror SQLite's actual error text.
        throw new Error(`no such table: ${name}`);
      }
    };
    const tableOf = (sql: string, kw: RegExp): string | null => {
      const m = kw.exec(sql);
      return m ? m[1] : null;
    };

    return {
      // Test-only helpers.
      __clearRows() {
        for (const t of tables) rows.set(t, []);
      },
      __tables: tables,

      async execAsync(sql: string) {
        const createRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?["'`]?(\w+)/gi;
        let m: RegExpExecArray | null;
        while ((m = createRe.exec(sql)) !== null) {
          tables.add(m[1]);
          rowsOf(m[1]);
        }
        const dropRe = /drop\s+table\s+(?:if\s+exists\s+)?["'`]?(\w+)/gi;
        while ((m = dropRe.exec(sql)) !== null) {
          tables.delete(m[1]);
          rows.delete(m[1]);
        }
      },

      async runAsync(sql: string, params: any[] = []) {
        const s = sql.trim();

        const insertT = tableOf(s, /insert\s+(?:or\s+replace\s+)?into\s+["'`]?(\w+)/i);
        if (insertT) {
          ensureTable(insertT);
          if (insertT === 'weather_cache') {
            const [location_id, weather_data, last_updated, locale, latitude, longitude, created_at] = params;
            const arr = rowsOf(insertT);
            const row = { location_id, weather_data, last_updated, locale, latitude, longitude, created_at };
            const idx = arr.findIndex((r) => r.location_id === location_id);
            if (idx >= 0) arr[idx] = row;
            else arr.push(row);
          }
          return { changes: 1, lastInsertRowId: 0 };
        }

        const deleteT = tableOf(s, /delete\s+from\s+["'`]?(\w+)/i);
        if (deleteT) {
          ensureTable(deleteT); // <-- the weather_errors guard lives here
          const arr = rowsOf(deleteT);
          let changes = 0;
          if (/where\s+location_id\s*=\s*\?/i.test(s)) {
            const id = params[0];
            const kept = arr.filter((r) => r.location_id !== id);
            changes = arr.length - kept.length;
            rows.set(deleteT, kept);
          } else if (/where\s+last_updated\s*<\s*\?/i.test(s)) {
            const cutoff = params[0];
            const kept = arr.filter((r) => r.last_updated >= cutoff);
            changes = arr.length - kept.length;
            rows.set(deleteT, kept);
          } else {
            changes = arr.length;
            rows.set(deleteT, []);
          }
          return { changes, lastInsertRowId: 0 };
        }

        const updateT = tableOf(s, /update\s+["'`]?(\w+)/i);
        if (updateT) {
          ensureTable(updateT);
          return { changes: 0, lastInsertRowId: 0 };
        }

        return { changes: 0, lastInsertRowId: 0 };
      },

      async getFirstAsync(sql: string, params: any[] = []) {
        const s = sql.trim();
        const t = tableOf(s, /from\s+["'`]?(\w+)/i);
        if (t) ensureTable(t);
        const arr = t ? rowsOf(t) : [];

        if (/count\(\*\)/i.test(s)) {
          if (/last_updated\s*>\s*\?/i.test(s)) {
            const cutoff = params[0];
            return { count: arr.filter((r) => r.last_updated > cutoff).length };
          }
          return { count: arr.length };
        }
        if (/min\(last_updated\)/i.test(s)) {
          return { oldest: arr.length ? Math.min(...arr.map((r) => r.last_updated)) : null };
        }
        if (/max\(last_updated\)/i.test(s)) {
          return { newest: arr.length ? Math.max(...arr.map((r) => r.last_updated)) : null };
        }
        if (/where\s+location_id\s*=\s*\?/i.test(s)) {
          return arr.find((r) => r.location_id === params[0]) ?? null;
        }
        return arr[0] ?? null;
      },

      async getAllAsync(sql: string, params: any[] = []) {
        const s = sql.trim();
        const t = tableOf(s, /from\s+["'`]?(\w+)/i);
        if (t) ensureTable(t);
        let arr = t ? [...rowsOf(t)] : [];
        if (/last_updated\s*>\s*\?/i.test(s)) {
          const cutoff = params[0];
          arr = arr.filter((r) => r.last_updated > cutoff);
        }
        if (/order\s+by\s+last_updated\s+desc/i.test(s)) {
          arr.sort((a, b) => b.last_updated - a.last_updated);
        }
        return arr;
      },

      async closeAsync() {
        /* no-op */
      },
    };
  };

  const db = makeFakeDb();
  return {
    openDatabaseAsync: jest.fn(async () => db),
    __getDb: () => db,
  };
});

jest.mock('../../widgets/widgetUpdater', () => ({
  updateAllWeatherWidgets: jest.fn().mockResolvedValue(undefined),
  ensureStoresHydrated: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    exception: jest.fn(),
  },
}));

// i18n pulls in the ESM-only `i18n-js` package, which jest-expo does not
// transform; the store only reads `i18n.locale`, so stub it out.
jest.mock('../../localization/i18n', () => ({
  i18n: { locale: 'en', t: (key: string) => key },
}));

// Capture the store's INITIAL state by value at import time, before any test
// mutates the singleton — this documents the true init state independent of
// test execution order.
const INITIAL_FORECAST = useForecastStore.getState().forecast;
const INITIAL_LAST_UPDATED = useForecastStore.getState().lastUpdated;

const fakeDb = (SQLite as any).__getDb();

/** Minimal shape-valid Weather; only lat/lon are read by the store directly. */
const makeWeather = (lat: number, lon: number): Weather =>
  ({
    lat,
    lon,
    timezone: 'x',
    timezone_offset: 0,
    current: { temp: 21, weather: [{ id: 800, description: 'clear' }] },
    hourly: [],
    daily: [],
  }) as unknown as Weather;

beforeAll(async () => {
  // Runs the real CREATE TABLE statements through the table-aware mock.
  await useForecastStore.getState().initializeDatabase();
});

beforeEach(() => {
  jest.clearAllMocks();
  fakeDb.__clearRows(); // fresh rows, tables intact
  useForecastStore.setState({ forecast: null, lastUpdated: '' });
});

describe('useForecastStore — initial state', () => {
  it('starts with forecast null and empty lastUpdated', () => {
    expect(INITIAL_FORECAST).toBeNull();
    expect(INITIAL_LAST_UPDATED).toBe('');
  });
});

describe('useForecastStore — runtime state actions', () => {
  it('updateLastUpdated round-trips the timestamp string', () => {
    const ts = '2026-07-16T12:00:00.000Z';
    useForecastStore.getState().updateLastUpdated(ts);
    expect(useForecastStore.getState().lastUpdated).toBe(ts);
  });

  it('updateWeather sets the forecast and stamps an ISO lastUpdated', () => {
    const weather = makeWeather(32, 34);
    useForecastStore.getState().updateWeather(weather);
    const state = useForecastStore.getState();
    expect(state.forecast).toBe(weather);
    // ISO-8601 with millisecond precision + trailing Z.
    expect(state.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Number.isNaN(Date.parse(state.lastUpdated))).toBe(false);
  });
});

describe('useForecastStore — database initialization', () => {
  it('opened the database exactly once (singleton)', () => {
    // openDatabaseAsync is cleared each beforeEach; the singleton keeps the same
    // handle, so re-init does NOT reopen.
    expect((SQLite as any).openDatabaseAsync).not.toHaveBeenCalled();
  });

  it('registered the weather_cache table via CREATE statements', () => {
    expect(fakeDb.__tables.has('weather_cache')).toBe(true);
  });
});

describe('useForecastStore — getDatabaseStats', () => {
  it('returns all-zero/null stats on a fresh database', async () => {
    const stats = await useForecastStore.getState().getDatabaseStats();
    expect(stats).toEqual({
      totalEntries: 0,
      freshEntries: 0,
      oldestEntry: null,
      newestEntry: null,
    });
  });

  it('reflects a saved entry as total + fresh', async () => {
    await useForecastStore.getState().setWeatherData('loc-1', makeWeather(10, 20));
    const stats = await useForecastStore.getState().getDatabaseStats();
    expect(stats.totalEntries).toBe(1);
    expect(stats.freshEntries).toBe(1);
    expect(typeof stats.oldestEntry).toBe('number');
    expect(stats.oldestEntry).toBe(stats.newestEntry);
  });
});

describe('useForecastStore — save/read round-trip', () => {
  it('persists then reads back the weather payload', async () => {
    const weather = makeWeather(48.85, 2.35);
    await useForecastStore.getState().setWeatherData('paris', weather);
    const read = await useForecastStore.getState().getWeatherData('paris');
    expect(read).toEqual(weather);
  });

  it('returns null for an unknown location', async () => {
    const read = await useForecastStore.getState().getWeatherData('does-not-exist');
    expect(read).toBeNull();
  });
});

describe('useForecastStore — deleteLocationData', () => {
  it('succeeds on a fresh database (guards weather_errors removal)', async () => {
    await expect(
      useForecastStore.getState().deleteLocationData('never-saved')
    ).resolves.toBeUndefined();
  });

  it('removes a previously-saved location', async () => {
    await useForecastStore.getState().setWeatherData('tokyo', makeWeather(35.6, 139.7));
    expect(await useForecastStore.getState().getWeatherData('tokyo')).not.toBeNull();

    await useForecastStore.getState().deleteLocationData('tokyo');
    expect(await useForecastStore.getState().getWeatherData('tokyo')).toBeNull();
  });
});
