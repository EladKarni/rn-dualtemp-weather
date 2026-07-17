/**
 * Worker C — hydration-gate unit tests for the real `ensureStoresHydrated`
 * helper and its use in `updateAllWeatherWidgets` (finding 5).
 *
 * Proves the helper rehydrates ALL THREE persisted stores (location, language,
 * settings) and never touches the non-persisted forecast store's (absent)
 * `.persist` API, and that `updateAllWeatherWidgets` hydrates before it reads
 * `savedLocations`.
 */
import { ensureStoresHydrated, updateAllWeatherWidgets } from '../widgetUpdater';
import { useLocationStore } from '../../store/useLocationStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useForecastStore } from '../../store/useForecastStore';
import { logger } from '../logger';

// jest.mock() calls are hoisted above the imports by babel-plugin-jest-hoist,
// so the imports above resolve to these mocks at runtime.
jest.mock('react-native-android-widget', () => ({ requestWidgetUpdate: jest.fn() }));
jest.mock('../../widgets/WeatherCompact', () => ({ WeatherCompact: 'WeatherCompact' }));
jest.mock('../../widgets/WeatherStandard', () => ({ WeatherStandard: 'WeatherStandard' }));
jest.mock('../../widgets/WeatherExtended', () => ({ WeatherExtended: 'WeatherExtended' }));
jest.mock('../iosWidgetStorage', () => ({ updateIOSWidgetData: jest.fn() }));

jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    exception: jest.fn(),
  },
}));

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
});
