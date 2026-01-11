/**
 * Temperature conversion utilities
 * Centralizes temperature and wind speed conversion logic
 */

/**
 * Converts Celsius to Fahrenheit
 * @param celsius Temperature in Celsius
 * @returns Temperature in Fahrenheit
 */
export const celsiusToFahrenheit = (celsius: number): number => {
  return celsius * 1.8 + 32;
};

/**
 * Converts Fahrenheit to Celsius
 * @param fahrenheit Temperature in Fahrenheit
 * @returns Temperature in Celsius
 */
export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return (fahrenheit - 32) / 1.8;
};

/**
 * Formats temperature with the specified scale
 * @param temp Temperature value
 * @param scale Temperature scale ('C' or 'F')
 * @param precision Number of decimal places (default: 0)
 * @returns Formatted temperature string with degree symbol
 */
export const formatTemperature = (
  temp: number,
  scale: 'C' | 'F',
  precision: number = 0
): string => {
  const value = scale === 'F' ? celsiusToFahrenheit(temp) : temp;
  return `${value.toFixed(precision)}°`;
};

/**
 * Converts wind speed based on temperature scale
 * Wind speed is stored in m/s, converts to km/h for Celsius or mph for Fahrenheit
 * @param speedMs Wind speed in meters per second
 * @param scale Temperature scale ('C' for km/h, 'F' for mph)
 * @returns Object with converted value and unit
 */
export const convertWindSpeed = (
  speedMs: number,
  scale: 'C' | 'F'
): { value: number; unit: string } => {
  if (scale === 'C') {
    // Convert m/s to km/h
    return {
      value: speedMs * 3.6,
      unit: 'km/h'
    };
  } else {
    // Convert m/s to mph
    return {
      value: speedMs * 2.23694,
      unit: 'mph'
    };
  }
};

/**
 * Converts Celsius to Kelvin
 * @param celsius Temperature in Celsius
 * @returns Temperature in Kelvin
 */
export const celsiusToKelvin = (celsius: number): number => {
  return celsius + 273.15;
};

/**
 * Converts Kelvin to Celsius
 * @param kelvin Temperature in Kelvin
 * @returns Temperature in Celsius
 */
export const kelvinToCelsius = (kelvin: number): number => {
  return kelvin - 273.15;
};
