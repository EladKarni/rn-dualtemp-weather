/**
 * iOS Widget Data Storage Utility
 * Uses @bacons/apple-targets ExtensionStorage to share data with iOS widgets via App Groups
 */
import { Platform } from 'react-native';
import { Weather } from '../types/WeatherTypes';
import { useSettingsStore } from '../store/useSettingsStore';
import { convertWindSpeed } from './temperature';

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

interface IOSWeatherData {
  temp: number;
  tempScale: string;
  weatherId: number;
  description: string;
  humidity: number;
  windSpeed: number;
  windUnit: string;
  locationName: string;
  lastUpdated: string;
  hourlyForecast: Array<{
    dt: number;
    temp: number;
    weatherId: number;
    pop: number;
    windSpeed: number;
  }>;
  dailyForecast: Array<{
    dt: number;
    tempMax: number;
    tempMin: number;
    weatherId: number;
  }>;
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

  return {
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
    hourlyForecast: weather.hourly.slice(0, 6).map((hour) => ({
      dt: hour.dt,
      temp: Math.round(hour.temp),
      weatherId: hour.weather[0].id,
      pop: hour.pop,
      windSpeed: hour.wind_speed,
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
