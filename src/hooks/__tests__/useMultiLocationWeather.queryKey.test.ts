/**
 * Worker E — pure-logic tests for the forecast query-key builder and the
 * location-switch cache guard.
 *
 * The heavy store / native imports pulled in transitively by the hook module are
 * mocked out so the pure helpers can be imported without a running RN runtime.
 */
import type { Weather } from '../../types/WeatherTypes';
import {
  buildCoordKey,
  buildForecastQueryKey,
  selectCachedWeather,
  COORD_KEY_DECIMALS,
} from '../useMultiLocationWeather';

// jest.mock is hoisted above the imports, so the hook module's heavy store /
// native transitive imports resolve to these lightweight stand-ins at load time.
jest.mock('../../utils/fetchWeather', () => ({ fetchForecast: jest.fn() }));
jest.mock('../../localization/i18n', () => ({ i18n: { locale: 'en' } }));
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    exception: jest.fn(),
    trace: jest.fn(),
    setTag: jest.fn(),
  },
}));
jest.mock('../../store/useSettingsStore', () => ({ useSettingsStore: jest.fn() }));
jest.mock('../../store/useForecastStore', () => ({
  useForecastStore: { getState: jest.fn() },
  initializeForecastStore: jest.fn(),
}));

describe('buildCoordKey (decision D9 — rounded coords in the key)', () => {
  it('rounds to two decimals', () => {
    expect(COORD_KEY_DECIMALS).toBe(2);
    expect(buildCoordKey(40.712776, -74.005974)).toBe('40.71,-74.01');
  });

  it('defaults missing coordinates to 0', () => {
    expect(buildCoordKey(undefined, undefined)).toBe('0.00,0.00');
  });

  it('treats NaN coordinates as missing (a bad reading must not poison the key)', () => {
    // `?? 0` does not catch NaN, so guard explicitly: NaN collapses to the same
    // "0.00,0.00" fallback as undefined instead of baking a "NaN,NaN" key.
    expect(buildCoordKey(NaN, NaN)).toBe('0.00,0.00');
    expect(buildCoordKey(NaN, 34.781)).toBe('0.00,34.78');
    expect(buildCoordKey(32.081, NaN)).toBe('32.08,0.00');
  });

  it('keeps the SAME key for sub-rounding-threshold GPS jitter', () => {
    // ~30 m of jitter that does not cross the 2-decimal rounding boundary.
    expect(buildCoordKey(40.001, -74.001)).toBe(buildCoordKey(40.004, -74.004));
  });

  it('produces a NEW key once movement crosses the rounding boundary', () => {
    // A real move past the boundary -> different key -> background refetch.
    expect(buildCoordKey(40.001, -74.001)).not.toBe(buildCoordKey(40.009, -74.001));
  });
});

describe('buildForecastQueryKey', () => {
  it('assembles locale + id + rounded coords', () => {
    expect(buildForecastQueryKey('en', 'gps-location', 32.081, 34.781)).toEqual([
      'forecast',
      'en',
      'gps-location',
      '32.08,34.78',
    ]);
  });

  it('changes when locale changes, stable otherwise', () => {
    const en = buildForecastQueryKey('en', 'id', 1.234, 5.678);
    const fr = buildForecastQueryKey('fr', 'id', 1.234, 5.678);
    expect(en).not.toEqual(fr);
    expect(buildForecastQueryKey('en', 'id', 1.234, 5.678)).toEqual(en);
  });
});

describe('selectCachedWeather (finding 9 — location-switch guard)', () => {
  const weatherA = { lat: 1, lon: 1 } as unknown as Weather;

  it('returns the cached weather when its tag matches the active location', () => {
    expect(selectCachedWeather({ locationId: 'A', weather: weatherA }, 'A')).toBe(
      weatherA
    );
  });

  it('returns null when the cache belongs to a different location', () => {
    expect(selectCachedWeather({ locationId: 'A', weather: weatherA }, 'B')).toBeNull();
  });

  it('returns null when there is no cache', () => {
    expect(selectCachedWeather(null, 'A')).toBeNull();
  });

  it('returns null when there is no active location', () => {
    expect(selectCachedWeather({ locationId: 'A', weather: weatherA }, null)).toBeNull();
  });
});
