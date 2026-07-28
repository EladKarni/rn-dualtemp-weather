/**
 * iOS widget payload (schema v2) contract tests.
 *
 * The Swift widget (targets/widget/widgets.swift) decodes exactly this JSON out
 * of the App Group. These tests pin the v2 contract: localized chrome strings
 * resolved from the app's i18n at write time, the "%{count}" placeholder left
 * intact for Swift to fill at render time, the resolved clock format, and
 * hourly wind speeds converted to the display unit that matches `windUnit`.
 */
import { updateIOSWidgetData } from '../iosWidgetStorage';
import { i18n } from '../../../localization/i18n';
import { useSettingsStore } from '../../../store/useSettingsStore';
import type { Weather } from '../../../types/WeatherTypes';

// i18n-js ships ESM that jest-expo does not transform, so mock the localization
// module — backed by the REAL locale tables and a mutable locale, matching the
// widgetDataUtils.formatDataAge test's pattern. iosWidgetStorage reads only
// `i18n.locale` and the raw `translations` tables, both provided here.
jest.mock('../../../localization/i18n', () => {
  const { en } = jest.requireActual('../../../localization/en') as {
    en: Record<string, string>;
  };
  const { he } = jest.requireActual('../../../localization/he') as {
    he: Record<string, string>;
  };
  const state = { locale: 'en' };
  return {
    translations: { en, he },
    i18n: {
      get locale() {
        return state.locale;
      },
      set locale(next: string) {
        state.locale = next;
      },
    },
  };
});

jest.mock('@bacons/apple-targets', () => {
  const set = jest.fn();
  class MockExtensionStorage {
    set = set;
    static reloadWidget = jest.fn();
    static __setMock = set;
  }
  return { ExtensionStorage: MockExtensionStorage };
});

jest.mock('../../../store/useSettingsStore', () => ({
  useSettingsStore: { getState: jest.fn() },
}));

const { ExtensionStorage } = jest.requireMock('@bacons/apple-targets');
const setMock: jest.Mock = ExtensionStorage.__setMock;
const settingsGetState = useSettingsStore.getState as unknown as jest.Mock;

const weather = {
  current: {
    temp: 21.6,
    humidity: 65,
    wind_speed: 5, // m/s
    weather: [{ id: 800, description: 'clear sky' }],
  },
  hourly: [
    { dt: 1_753_700_000, temp: 22.4, pop: 0.1, wind_speed: 5, weather: [{ id: 800 }] },
    { dt: 1_753_703_600, temp: 24.2, pop: 0.2, wind_speed: 10, weather: [{ id: 801 }] },
  ],
  daily: [
    { dt: 1_753_700_000, temp: { max: 28.4, min: 17.6 }, weather: [{ id: 800 }] },
  ],
} as unknown as Weather;

/** The JSON written to the shared UserDefaults on the last set() call. */
const writtenPayload = () => {
  const [key, json] = setMock.mock.calls[setMock.mock.calls.length - 1];
  expect(key).toBe('weatherData');
  return JSON.parse(json);
};

const originalLocale = i18n.locale;

beforeEach(() => {
  jest.clearAllMocks();
  i18n.locale = 'en';
  settingsGetState.mockReturnValue({
    tempScale: 'C',
    getEffectiveClockFormat: () => '24hour',
  });
});

afterAll(() => {
  i18n.locale = originalLocale;
});

describe('updateIOSWidgetData payload (schema v2)', () => {
  it('writes schemaVersion 2 with resolved locale and clock format, then reloads widgets', async () => {
    await updateIOSWidgetData(weather, 'Tel Aviv');

    const payload = writtenPayload();
    expect(payload.schemaVersion).toBe(2);
    expect(payload.locale).toBe('en');
    expect(payload.is24Hour).toBe(true);
    expect(payload.locationName).toBe('Tel Aviv');
    expect(ExtensionStorage.reloadWidget).toHaveBeenCalledTimes(1);
  });

  it('resolves 12-hour clock preference', async () => {
    settingsGetState.mockReturnValue({
      tempScale: 'C',
      getEffectiveClockFormat: () => '12hour',
    });

    await updateIOSWidgetData(weather, 'Tel Aviv');

    expect(writtenPayload().is24Hour).toBe(false);
  });

  it('ships localized chrome with the %{count} placeholder intact for Swift', async () => {
    i18n.locale = 'he';

    await updateIOSWidgetData(weather, 'תל אביב');

    const { chrome, locale } = writtenPayload();
    expect(locale).toBe('he');
    expect(chrome.today).toBe('היום');
    expect(chrome.hi).toBe('מקס');
    expect(chrome.lo).toBe('מינ');
    // Age strings are templates — Swift substitutes %{count} at render time.
    expect(chrome.ageMinutes).toContain('%{count}');
    expect(chrome.ageHours).toContain('%{count}');
    expect(chrome.ageDays).toContain('%{count}');
  });

  it('falls back to English chrome for a locale without a translation table', async () => {
    i18n.locale = 'en-US';

    await updateIOSWidgetData(weather, 'Tel Aviv');

    const { chrome, locale } = writtenPayload();
    expect(locale).toBe('en');
    expect(chrome.today).toBe('Today');
  });

  it('converts hourly wind speed to the display unit matching windUnit (metric)', async () => {
    await updateIOSWidgetData(weather, 'Tel Aviv');

    const payload = writtenPayload();
    expect(payload.windUnit).toBe('km/h');
    // 5 m/s → 18 km/h, 10 m/s → 36 km/h
    expect(payload.hourlyForecast[0].windSpeed).toBeCloseTo(18);
    expect(payload.hourlyForecast[1].windSpeed).toBeCloseTo(36);
  });

  it('converts hourly wind speed to mph when the scale is Fahrenheit', async () => {
    settingsGetState.mockReturnValue({
      tempScale: 'F',
      getEffectiveClockFormat: () => '12hour',
    });

    await updateIOSWidgetData(weather, 'Tel Aviv');

    const payload = writtenPayload();
    expect(payload.windUnit).toBe('mph');
    expect(payload.hourlyForecast[0].windSpeed).toBeCloseTo(11.18, 1);
  });
});
