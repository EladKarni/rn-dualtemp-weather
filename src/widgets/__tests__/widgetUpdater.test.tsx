/**
 * Worker C — hydration-gate unit tests for the real `ensureStoresHydrated`
 * helper and its use in `updateAllWeatherWidgets` (finding 5).
 *
 * Worker L — cycle-break coverage: `setWeatherData` now passes the fresh weather
 * payload into `updateAllWeatherWidgets(weather)` so this module never imports
 * the forecast store at all. These tests prove (a) a passed payload is used
 * directly with no store read, and (b) a stray non-Weather value (the temp-scale
 * string a naive `onAfterChange` would forward) is rejected by the isWeather()
 * guard: the function warns and returns without rendering.
 */
import { ensureStoresHydrated, updateAllWeatherWidgets } from '../widgetUpdater';
import { useLocationStore } from '../../store/useLocationStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useForecastStore } from '../../store/useForecastStore';
import { logger } from '../../utils/logger';
import type { Weather } from '../../types/WeatherTypes';

// jest.mock() calls are hoisted above the imports by babel-plugin-jest-hoist,
// so the imports above resolve to these mocks at runtime.
jest.mock('react-native-android-widget', () => ({ requestWidgetUpdate: jest.fn() }));
jest.mock('../WeatherCompact', () => ({ WeatherCompact: 'WeatherCompact' }));
jest.mock('../WeatherStandard', () => ({ WeatherStandard: 'WeatherStandard' }));
jest.mock('../WeatherExtended', () => ({ WeatherExtended: 'WeatherExtended' }));
jest.mock('../utils/iosWidgetStorage', () => ({ updateIOSWidgetData: jest.fn() }));

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    exception: jest.fn(),
  },
}));

// widgetUpdater has NO reference to the forecast store (the cycle break removed
// even the dynamic import). This mock is defensive scaffolding: the test imports
// the store only to assert getWeatherData is never called through any path.
jest.mock('../../store/useForecastStore', () => ({
  useForecastStore: { getState: jest.fn() },
}));
jest.mock('../../store/useLocationStore', () => ({
  GPS_LOCATION_ID: 'gps-location',
  useLocationStore: { getState: jest.fn(), persist: { rehydrate: jest.fn() } },
}));
jest.mock('../../store/useLanguageStore', () => ({
  useLanguageStore: { persist: { rehydrate: jest.fn() } },
}));
jest.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: { persist: { rehydrate: jest.fn() } },
}));

const locationRehydrate = useLocationStore.persist.rehydrate as unknown as jest.Mock;
const languageRehydrate = useLanguageStore.persist.rehydrate as unknown as jest.Mock;
const settingsRehydrate = useSettingsStore.persist.rehydrate as unknown as jest.Mock;
const locationGetState = useLocationStore.getState as unknown as jest.Mock;
const forecastGetState = useForecastStore.getState as unknown as jest.Mock;
const mockedLogger = logger as unknown as Record<string, jest.Mock>;

const gpsWeather = {
  current: { temp: 20 },
  daily: [],
  hourly: [],
  lat: 1,
  lon: 2,
} as unknown as Weather;

beforeEach(() => {
  jest.clearAllMocks();
  locationRehydrate.mockResolvedValue(undefined);
  languageRehydrate.mockResolvedValue(undefined);
  settingsRehydrate.mockResolvedValue(undefined);
  locationGetState.mockReturnValue({ savedLocations: [] });
  forecastGetState.mockReturnValue({
    getWeatherData: jest.fn().mockResolvedValue(null),
  });
});

describe('ensureStoresHydrated', () => {
  it('rehydrates all three persisted stores', async () => {
    await ensureStoresHydrated();

    expect(locationRehydrate).toHaveBeenCalledTimes(1);
    expect(languageRehydrate).toHaveBeenCalledTimes(1);
    expect(settingsRehydrate).toHaveBeenCalledTimes(1);
  });

  it('does not depend on a `.persist` API for the non-persisted forecast store', async () => {
    // useForecastStore (SQLite-backed) has no `.persist` — calling it would throw.
    const forecastPersist = (useForecastStore as unknown as { persist?: unknown }).persist;
    expect(forecastPersist).toBeUndefined();
    await expect(ensureStoresHydrated()).resolves.toBeUndefined();
  });
});

describe('updateAllWeatherWidgets', () => {
  it('hydrates the persisted stores before reading savedLocations', async () => {
    await updateAllWeatherWidgets();

    expect(locationRehydrate).toHaveBeenCalled();
    expect(languageRehydrate).toHaveBeenCalled();
    expect(settingsRehydrate).toHaveBeenCalled();

    // savedLocations is read (getState) only after rehydration ran.
    expect(locationRehydrate.mock.invocationCallOrder[0]).toBeLessThan(
      locationGetState.mock.invocationCallOrder[0]
    );

    // Empty freshly-hydrated store → warn + early return (no widget update).
    expect(mockedLogger.warn).toHaveBeenCalledWith(
      'No GPS location found for widget update'
    );
  });

  it('uses the passed weather payload and never reads the forecast store (cycle break)', async () => {
    const getWeatherData = jest.fn().mockResolvedValue(null);
    forecastGetState.mockReturnValue({ getWeatherData });
    locationGetState.mockReturnValue({
      savedLocations: [{ id: 'gps-location', name: 'Here' }],
    });

    await updateAllWeatherWidgets(gpsWeather);

    // widgetUpdater must not consult the forecast store at all — the payload is
    // passed in by the caller. The weather-missing warning never fires.
    expect(getWeatherData).not.toHaveBeenCalled();
    expect(mockedLogger.warn).not.toHaveBeenCalledWith(
      'No weather data found for widget update'
    );
  });

  it('ignores a non-Weather argument (the temp-scale string a naive callback would forward)', async () => {
    const getWeatherData = jest.fn().mockResolvedValue(null);
    forecastGetState.mockReturnValue({ getWeatherData });
    locationGetState.mockReturnValue({
      savedLocations: [{ id: 'gps-location', name: 'Here' }],
    });

    // Simulate the runtime bug: a temp-scale string forwarded as "weather".
    await updateAllWeatherWidgets('F' as unknown as Weather);

    // The guard rejects the string, so no widget is rendered with a bogus payload
    // and the store is never touched (widgetUpdater has no store dependency).
    expect(getWeatherData).not.toHaveBeenCalled();
    expect(mockedLogger.warn).toHaveBeenCalledWith(
      'No weather data found for widget update'
    );
  });
});
