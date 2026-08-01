/**
 * iOS Widget Data Storage Utility
 * Uses @bacons/apple-targets ExtensionStorage to share data with iOS widgets via App Groups
 */
import { Platform } from 'react-native';
import { Weather } from '../../types/WeatherTypes';
import { useSettingsStore } from '../../store/useSettingsStore';
import { convertWindSpeed } from '../../utils/temperature';
import { i18n, translations } from '../../localization/i18n';
import { logger } from '../../utils/logger';
import {
  DEFAULT_WIDGET_THEME,
  WIDGET_THEMES,
  resolveWidgetTheme,
} from '../../styles/widgetThemes';
import { toHexColor } from './hexColor';

// Only import ExtensionStorage on iOS
let ExtensionStorage: any = null;
if (Platform.OS === 'ios') {
  try {
    ExtensionStorage = require('@bacons/apple-targets').ExtensionStorage;
  } catch {
    // Expected on a build without the apple-targets native module; the iOS
    // widget simply never receives data. Not an error worth reporting.
    logger.debug('ExtensionStorage not available');
  }
}

const APP_GROUP_ID = 'group.com.ekarni.rndualtempweatherapp.widget';

/**
 * Localized widget-chrome strings, resolved by the app's i18n at write time so
 * the Swift widget never needs its own translation tables. The age strings are
 * raw i18n templates — the "%{count}" placeholder is substituted in Swift,
 * because data age must be computed at widget render time, not write time.
 */
interface IOSWidgetChrome {
  today: string;
  hi: string;
  lo: string;
  ageMinutes: string;
  ageHours: string;
  ageDays: string;
}

interface IOSWeatherData {
  /**
   * Payload contract version. v2 adds locale/is24Hour/chrome and changes
   * hourlyForecast.windSpeed from m/s to the display unit matching windUnit.
   * v3 adds elementColor. The Swift side treats a missing value as v1 and falls
   * back to English.
   */
  schemaVersion: number;
  temp: number;
  tempScale: string;
  weatherId: number;
  description: string;
  humidity: number;
  windSpeed: number;
  windUnit: string;
  locationName: string;
  lastUpdated: string;  // Display string for backward compatibility
  lastUpdatedTimestamp: number;  // Unix timestamp in seconds for age calculation
  locale: string;       // Resolved app language (en/es/fr/ar/he/zh) for date formatting
  is24Hour: boolean;    // Resolved clock-format preference ("auto" already applied)
  chrome: IOSWidgetChrome;
  /**
   * v3: the user's chosen widget-element fill, as opaque #RRGGBB.
   *
   * Sent as a resolved COLOUR rather than a theme id on purpose. An id would
   * oblige widgets.swift to carry its own copy of the preset table, and the two
   * copies would then be free to disagree — which is precisely the class of bug
   * iosWidgetParity.test.ts exists to catch. Sending the colour keeps
   * src/styles/widgetThemes.ts the single source, so adding or retiring a
   * preset needs no Swift change at all.
   */
  elementColor: string;
  hourlyForecast: Array<{
    dt: number;
    temp: number;
    weatherId: number;
    pop: number;
    windSpeed: number;  // v2: already converted to the display unit (km/h or mph)
  }>;
  dailyForecast: Array<{
    dt: number;
    tempMax: number;
    tempMin: number;
    weatherId: number;
  }>;
}

/**
 * The active app locale, guarded to the set of shipped translation tables so a
 * surprising i18n.locale value (e.g. "en-US") can never produce an undefined
 * chrome payload.
 */
function resolveWidgetLocale(): keyof typeof translations {
  return i18n.locale in translations
    ? (i18n.locale as keyof typeof translations)
    : 'en';
}

/**
 * The user's widget-element fill as opaque #RRGGBB.
 *
 * resolveWidgetTheme already falls back to the default for an unrecognised
 * persisted id, so the only way toHexColor returns null here is a malformed
 * entry in WIDGET_THEMES itself — a developer error, not a user state. Falling
 * back to the default theme's colour keeps a widget render from ever depending
 * on that being true, which matters more here than elsewhere: this runs in the
 * headless task where a throw is invisible.
 */
function resolveElementColor(): string {
  const chosen = resolveWidgetTheme(useSettingsStore.getState().widgetTheme);
  return (
    toHexColor(chosen.element) ??
    toHexColor(WIDGET_THEMES[DEFAULT_WIDGET_THEME].element) ??
    '#1C1B4D'
  );
}

/**
 * Transform Weather data to iOS widget format
 */
function transformWeatherForIOS(
  weather: Weather,
  locationName: string,
  tempScale: 'C' | 'F'
): IOSWeatherData {
  const windData = convertWindSpeed(weather.current.wind_speed, tempScale);
  const locale = resolveWidgetLocale();
  const table = translations[locale];

  return {
    schemaVersion: 3,
    // Rounded, unlike the forecast temperatures below, because Android's
    // compact widget rounds this one too: processWeatherData does
    // `Math.round(current.temp)` (widgetDataUtils.ts) and WeatherCompact
    // derives BOTH scales from that rounded value. Sending the raw reading
    // instead makes 21.6°C render "22°C / 71°F" on iPhone against Android's
    // "22°C / 72°F", because Swift would convert from 21.6 rather than 22.
    //
    // Android is genuinely inconsistent between its own widgets here; matching
    // it per-widget is what keeps the two phones showing the same numbers,
    // which is the property that matters.
    temp: Math.round(weather.current.temp),
    tempScale,
    weatherId: weather.current.weather[0].id,
    description: weather.current.weather[0].description,
    humidity: weather.current.humidity,
    windSpeed: windData.value,
    windUnit: windData.unit,
    locationName,
    lastUpdated: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    lastUpdatedTimestamp: Math.floor(Date.now() / 1000),  // Unix timestamp in seconds
    locale,
    is24Hour: useSettingsStore.getState().getEffectiveClockFormat() === '24hour',
    elementColor: resolveElementColor(),
    chrome: {
      today: table.Today,
      hi: table.WidgetHi,
      lo: table.WidgetLo,
      ageMinutes: table.WidgetAgeMinutes,
      ageHours: table.WidgetAgeHours,
      ageDays: table.WidgetAgeDays,
    },
    // Forecast temperatures cross UNROUNDED, matching Android, whose hourly and
    // daily widgets pass the raw reading straight to DualTemperatureDisplay and
    // derive each scale from it independently. Pre-rounding here would make the
    // Fahrenheit drift: 23.4°C sent as 23 renders 73°F where Android shows 74°F.
    hourlyForecast: weather.hourly.slice(0, 6).map((hour) => ({
      dt: hour.dt,
      temp: hour.temp,
      weatherId: hour.weather[0].id,
      pop: hour.pop,
      windSpeed: convertWindSpeed(hour.wind_speed, tempScale).value,
    })),
    dailyForecast: weather.daily.slice(0, 7).map((day) => ({
      dt: day.dt,
      tempMax: day.temp.max,
      tempMin: day.temp.min,
      weatherId: day.weather[0].id,
    })),
  };
}

/**
 * Update iOS widget data via App Groups
 * This stores weather data in shared UserDefaults accessible by the widget extension
 */
export async function updateIOSWidgetData(
  weather: Weather,
  locationName: string
): Promise<void> {
  if (Platform.OS !== 'ios' || !ExtensionStorage) {
    return;
  }

  try {
    const tempScale = useSettingsStore.getState().tempScale;
    const widgetData = transformWeatherForIOS(weather, locationName, tempScale);

    const storage = new ExtensionStorage(APP_GROUP_ID);
    storage.set('weatherData', JSON.stringify(widgetData));

    // Trigger widget refresh
    ExtensionStorage.reloadWidget();

    logger.debug('iOS widget data updated successfully');
  } catch (error) {
    logger.error('Failed to update iOS widget data:', error);
  }
}

/**
 * Reload all iOS widgets without updating data
 * Useful when user changes settings like temperature scale
 */
export function reloadIOSWidgets(): void {
  if (Platform.OS !== 'ios' || !ExtensionStorage) {
    return;
  }

  try {
    ExtensionStorage.reloadWidget();
    logger.debug('iOS widgets reloaded');
  } catch (error) {
    logger.error('Failed to reload iOS widgets:', error);
  }
}

/**
 * Check if iOS widget storage is available
 */
export function isIOSWidgetStorageAvailable(): boolean {
  return Platform.OS === 'ios' && ExtensionStorage !== null;
}
