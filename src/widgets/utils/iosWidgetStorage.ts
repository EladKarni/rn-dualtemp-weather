/**
 * iOS Widget Data Storage Utility
 * Uses @bacons/apple-targets ExtensionStorage to share data with iOS widgets via App Groups
 */
import { Platform } from 'react-native';
import { Weather } from '../../types/WeatherTypes';
import { useSettingsStore } from '../../store/useSettingsStore';
import { convertWindSpeed } from '../../utils/temperature';
import { i18n, translations } from '../../localization/i18n';

// Only import ExtensionStorage on iOS
let ExtensionStorage: any = null;
if (Platform.OS === 'ios') {
  try {
    ExtensionStorage = require('@bacons/apple-targets').ExtensionStorage;
  } catch (e) {
    console.log('ExtensionStorage not available');
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
   * The Swift side treats a missing value as v1 and falls back to English.
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
    schemaVersion: 2,
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
    chrome: {
      today: table.Today,
      hi: table.WidgetHi,
      lo: table.WidgetLo,
      ageMinutes: table.WidgetAgeMinutes,
      ageHours: table.WidgetAgeHours,
      ageDays: table.WidgetAgeDays,
    },
    hourlyForecast: weather.hourly.slice(0, 6).map((hour) => ({
      dt: hour.dt,
      temp: Math.round(hour.temp),
      weatherId: hour.weather[0].id,
      pop: hour.pop,
      windSpeed: convertWindSpeed(hour.wind_speed, tempScale).value,
    })),
    dailyForecast: weather.daily.slice(0, 7).map((day) => ({
      dt: day.dt,
      tempMax: Math.round(day.temp.max),
      tempMin: Math.round(day.temp.min),
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

    console.log('iOS widget data updated successfully');
  } catch (error) {
    console.error('Failed to update iOS widget data:', error);
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
    console.log('iOS widgets reloaded');
  } catch (error) {
    console.error('Failed to reload iOS widgets:', error);
  }
}

/**
 * Check if iOS widget storage is available
 */
export function isIOSWidgetStorageAvailable(): boolean {
  return Platform.OS === 'ios' && ExtensionStorage !== null;
}
