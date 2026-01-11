/**
 * Widget data processing utilities
 * Centralizes weather data processing for all widget types
 */
import { Weather, HourlyEntity, DailyEntity } from '../../types/WeatherTypes';
import { formatTemperature, convertWindSpeed } from '../../utils/temperature';

export interface ProcessedWeatherData {
  // Current weather
  temp: number;
  tempFormatted: string;
  description: string;
  humidity: number;
  windSpeed: { value: number; unit: string };
  pressure: number;
  uvi: number;
  
  // Time data
  sunrise: number;
  sunset: number;
  
  // Forecasts
  hourlyForecast: HourlyEntity[];
  dailyForecast: DailyEntity[];
  
  // Weather details
  weatherId: number;
  cloudCover: number;
}

/**
 * Process raw weather data for widget consumption
 * Uses user's temperature scale preference
 */
export const processWeatherData = (
  weather: Weather, 
  tempScale: 'C' | 'F' = 'C'
): ProcessedWeatherData => {
  const current = weather.current;
  
  // Process temperature
  const temp = Math.round(current.temp);
  const tempFormatted = formatTemperature(temp, tempScale);
  
  // Process wind speed based on temperature scale
  const windSpeed = convertWindSpeed(current.wind_speed, tempScale);
  
  return {
    // Current weather
    temp,
    tempFormatted,
    description: current.weather[0].description,
    humidity: current.humidity,
    windSpeed,
    pressure: current.pressure,
    uvi: current.uvi,
    
    // Time data
    sunrise: current.sunrise,
    sunset: current.sunset,
    
    // Forecasts (limited for widgets)
    hourlyForecast: weather.hourly.slice(0, 6), // Next 6 hours for extended widget
    dailyForecast: weather.daily.slice(0, 7),  // Up to 7 days for extended widget (widget will calculate how many fit)
    
    // Weather details
    weatherId: current.weather[0].id,
    cloudCover: current.clouds,
  };
};

/**
 * Get weather icon mapping based on weather ID
 */
export const getWeatherIcon = (weatherId: number): string => {
  // Simple mapping for now - can be expanded with proper icon set
  const iconMap: Record<number, string> = {
    // Clear sky
    800: '☀️',
    // Few clouds
    801: '⛅',
    // Scattered clouds
    802: '☁️',
    // Broken clouds
    803: '☁️',
    // Overcast clouds
    804: '☁️',
    // Rain
    500: '🌦️',
    501: '🌧️',
    502: '🌧️',
    503: '🌧️',
    504: '🌧️',
    // Drizzle
    300: '🌦️',
    301: '🌦️',
    302: '🌦️',
    313: '🌦️',
    314: '🌦️',
    321: '🌦️',
    // Thunderstorm
    200: '⛈️',
    201: '⛈️',
    202: '⛈️',
    210: '⛈️',
    211: '⛈️',
    212: '⛈️',
    221: '⛈️',
    230: '⛈️',
    231: '⛈️',
    232: '⛈️',
    // Snow
    600: '🌨️',
    601: '🌨️',
    602: '❄️',
    611: '🌨️',
    612: '🌨️',
    613: '🌨️',
    615: '❄️',
    616: '❄️',
    620: '🌨️',
    621: '🌨️',
    622: '❄️',
    // Atmosphere
    701: '🌫️',
    711: '🌫️',
    721: '🌫️',
    731: '🌪️',
    741: '🌫️',
    751: '🌫️',
    761: '🌪️',
    762: '🌪️',
    771: '🌪️',
  };
  
  // Get first digit for general category
  const category = Math.floor(weatherId / 100);
  
  return iconMap[weatherId] || iconMap[category * 100] || '🌤️';
};

/**
 * Format humidity with percentage symbol
 */
export const formatHumidity = (humidity: number): string => {
  return `${humidity}%`;
};

/**
 * Format pressure with unit
 */
export const formatPressure = (pressure: number): string => {
  return `${Math.round(pressure)} hPa`;
};

/**
 * Format UV index
 */
export const formatUVI = (uvi: number): string => {
  if (uvi <= 2) return `${uvi} (Low)`;
  if (uvi <= 5) return `${uvi} (Moderate)`;
  if (uvi <= 7) return `${uvi} (High)`;
  if (uvi <= 10) return `${uvi} (Very High)`;
  return `${uvi} (Extreme)`;
};