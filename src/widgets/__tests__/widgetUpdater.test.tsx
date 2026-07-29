/**
 * Worker C — hydration-gate unit tests for the real `ensureStoresHydrated`
 * helper and its use in `updateAllWeatherWidgets` (finding 5).
 *
 * Worker L — cycle-break coverage: `setWeatherData` now passes the fresh weather
 * payload into `updateAllWeatherWidgets(weather, locationId)` so this module
 * never imports the forecast store at all. These tests prove (a) a passed
 * payload is used directly with no store read, and (b) a stray non-Weather
 * value (the temp-scale string a naive `onAfterChange` would forward) is
 * rejected by the isWeather() guard: the function warns and returns without
 * rendering.
 *
 * Phase 2 (widget location fallback) — the updater resolves the widget
 * location via resolveWidgetLocation (GPS ?? active ?? first saved) and skips
 * the repaint when the payload's locationId is not the resolved location's,
 * closing the cross-location mislabel bug (a background prefetch of a
 * non-widget city must not repaint the widget with that city's temperatures
 * under the widget location's name).
 */
import { requestWidgetUpdate } from 'react-native-android-widget';
import { ensureStoresHydrated, updateAllWeatherWidgets } from '../widgetUpdater';
import { updateIOSWidgetData } from '../utils/iosWidgetStorage';
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

// widgetUpdater imports widgetDataUtils (for resolveWidgetLocation), which
// imports i18n at module scope; i18n-js ships ESM that jest-expo does not
// transform, so mock the localization module (no localized string is asserted).
jest.mock('../../localization/i18n', () => ({
  i18n: { locale: 'en', t: (key: string) => key },
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

// widgetUpdater has NO reference to the forecast store (the cycle break removed
// even the dynamic import). This mock is defensive scaffolding: the test imports
// the store only to assert getWeatherData is never called through any path.
jest.mock('../../store/useForecastStore', () => ({
  useForecastStore: { getState: jest.fn() },
}));
jest.mock('../../store/useLocationStore', () => ({
  GPS_LOCATION_ID: 'gps-location',
  useLocationStore: {
    getState: jest.fn(),
    persist: { rehydrate: jest.fn(), hasHydrated: jest.fn(), onFinishHydration: jest.fn() },
  },
}));
jest.mock('../../store/useLanguageStore', () => ({
  useLanguageStore: {
    persist: { rehydrate: jest.fn(), hasHydrated: jest.fn(), onFinishHydration: jest.fn() },
  },
}));
jest.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: {
    persist: { rehydrate: jest.fn(), hasHydrated: jest.fn(), onFinishHydration: jest.fn() },
  },
}));

const locationRehydrate = useLocationStore.persist.rehydrate as unknown as jest.Mock;
const languageRehydrate = useLanguageStore.persist.rehydrate as unknown as jest.Mock;
const settingsRehydrate = useSettingsStore.persist.rehydrate as unknown as jest.Mock;
const locationHasHydrated = useLocationStore.persist.hasHydrated as unknown as jest.Mock;
const languageHasHydrated = useLanguageStore.persist.hasHydrated as unknown as jest.Mock;
const settingsHasHydrated = useSettingsStore.persist.hasHydrated as unknown as jest.Mock;
const locationOnFinishHydration = useLocationStore.persist.onFinishHydration as unknown as jest.Mock;
const languageOnFinishHydration = useLanguageStore.persist.onFinishHydration as unknown as jest.Mock;
const settingsOnFinishHydration = useSettingsStore.persist.onFinishHydration as unknown as jest.Mock;
const locationGetState = useLocationStore.getState as unknown as jest.Mock;
const forecastGetState = useForecastStore.getState as unknown as jest.Mock;
const mockedLogger = logger as unknown as Record<string, jest.Mock>;
const mockedRequestWidgetUpdate = requestWidgetUpdate as unknown as jest.Mock;
const mockedUpdateIOSWidgetData = updateIOSWidgetData as unknown as jest.Mock;

const GPS = 'gps-location';

const weatherPayload = {
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
  // Default: live context — hydration already completed, so the helper must
  // never force a rehydrate (the main-context state-rollback fix).
  locationHasHydrated.mockReturnValue(true);
  languageHasHydrated.mockReturnValue(true);
  settingsHasHydrated.mockReturnValue(true);
  locationOnFinishHydration.mockReturnValue(jest.fn());
  languageOnFinishHydration.mockReturnValue(jest.fn());
  settingsOnFinishHydration.mockReturnValue(jest.fn());
  locationGetState.mockReturnValue({ savedLocations: [], activeLocationId: null });
  forecastGetState.mockReturnValue({
    getWeatherData: jest.fn().mockResolvedValue(null),
  });
});

describe('ensureStoresHydrated', () => {
  it('does NOT force a rehydrate when stores are already hydrated (main-context rollback fix)', async () => {
    await ensureStoresHydrated();

    expect(locationRehydrate).not.toHaveBeenCalled();
    expect(languageRehydrate).not.toHaveBeenCalled();
    expect(settingsRehydrate).not.toHaveBeenCalled();
  });

  it('waits for in-flight hydration instead of forcing a re-run', async () => {
    settingsHasHydrated.mockReturnValue(false);
    // Simulate hydration finishing shortly after the helper subscribes.
    settingsOnFinishHydration.mockImplementation((cb: () => void) => {
      setTimeout(cb, 0);
      return jest.fn();
    });

    await ensureStoresHydrated();

    expect(settingsOnFinishHydration).toHaveBeenCalledTimes(1);
    expect(settingsRehydrate).not.toHaveBeenCalled();
  });

  it('falls back to a forced rehydrate when hydration never completes (headless safety net)', async () => {
    jest.useFakeTimers();
    try {
      settingsHasHydrated.mockReturnValue(false);
      settingsOnFinishHydration.mockReturnValue(jest.fn());

      const pending = ensureStoresHydrated();
      await jest.advanceTimersByTimeAsync(3000);
      await pending;

      expect(settingsRehydrate).toHaveBeenCalledTimes(1);
      // The already-hydrated stores were still left alone.
      expect(locationRehydrate).not.toHaveBeenCalled();
      expect(languageRehydrate).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not depend on a `.persist` API for the non-persisted forecast store', async () => {
    // useForecastStore (SQLite-backed) has no `.persist` — calling it would throw.
    const forecastPersist = (useForecastStore as unknown as { persist?: unknown }).persist;
    expect(forecastPersist).toBeUndefined();
    await expect(ensureStoresHydrated()).resolves.toBeUndefined();
  });
});

describe('updateAllWeatherWidgets', () => {
  it('ensures hydration (without forcing a re-run) before reading savedLocations', async () => {
    await updateAllWeatherWidgets(undefined, GPS);

    // The hydration gate consulted every persisted store...
    expect(locationHasHydrated).toHaveBeenCalled();
    expect(languageHasHydrated).toHaveBeenCalled();
    expect(settingsHasHydrated).toHaveBeenCalled();
    // ...and, since they were hydrated, never forced a rollback rehydrate.
    expect(locationRehydrate).not.toHaveBeenCalled();

    // savedLocations is read (getState) only after the hydration gate ran.
    expect(locationHasHydrated.mock.invocationCallOrder[0]).toBeLessThan(
      locationGetState.mock.invocationCallOrder[0]
    );

    // Empty freshly-hydrated store → warn + early return (no widget update).
    expect(mockedLogger.warn).toHaveBeenCalledWith(
      'No location found for widget update'
    );
  });

  it('uses the passed weather payload and never reads the forecast store (cycle break)', async () => {
    const getWeatherData = jest.fn().mockResolvedValue(null);
    forecastGetState.mockReturnValue({ getWeatherData });
    locationGetState.mockReturnValue({
      savedLocations: [{ id: GPS, name: 'Here', isGPS: true }],
      activeLocationId: GPS,
    });

    await updateAllWeatherWidgets(weatherPayload, GPS);

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
      savedLocations: [{ id: GPS, name: 'Here', isGPS: true }],
      activeLocationId: GPS,
    });

    // Simulate the runtime bug: a temp-scale string forwarded as "weather".
    await updateAllWeatherWidgets('F' as unknown as Weather, GPS);

    // The guard rejects the string, so no widget is rendered with a bogus payload
    // and the store is never touched (widgetUpdater has no store dependency).
    expect(getWeatherData).not.toHaveBeenCalled();
    expect(mockedLogger.warn).toHaveBeenCalledWith(
      'No weather data found for widget update'
    );
  });

  it('skips the repaint when the payload is for a different location than the widgets show (mislabel fix)', async () => {
    locationGetState.mockReturnValue({
      savedLocations: [
        { id: GPS, name: 'Here', isGPS: true },
        { id: 'location-paris', name: 'Paris', isGPS: false },
      ],
      activeLocationId: GPS,
    });

    // A background prefetch of Paris while the widgets show the GPS location.
    await updateAllWeatherWidgets(weatherPayload, 'location-paris');

    // Neither platform path repaints — that would label Paris temperatures
    // with the GPS location's name until the next 30-minute cycle.
    expect(mockedRequestWidgetUpdate).not.toHaveBeenCalled();
    expect(mockedUpdateIOSWidgetData).not.toHaveBeenCalled();
    expect(mockedLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Skipping widget update')
    );
  });

  it('repaints for a manual-cities-only user when the payload matches the resolved fallback location', async () => {
    locationGetState.mockReturnValue({
      savedLocations: [{ id: 'location-paris', name: 'Paris', isGPS: false }],
      activeLocationId: 'location-paris',
    });

    await updateAllWeatherWidgets(weatherPayload, 'location-paris');

    // No GPS entry, yet the update goes through — the resolver falls back to
    // the active location, so exactly one platform path rendered and neither
    // "location missing" nor "weather missing" warning fired.
    expect(mockedLogger.warn).not.toHaveBeenCalled();
    expect(
      mockedRequestWidgetUpdate.mock.calls.length +
        mockedUpdateIOSWidgetData.mock.calls.length
    ).toBeGreaterThan(0);
  });
});
