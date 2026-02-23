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
 * Converts precipitation amount from mm to the specified unit
 */
export const convertPrecipitation = (
  mm: number,
  unit: 'mm' | 'in'
): { value: number; unit: string } => {
  if (unit === 'in') {
    return { value: mm / 25.4, unit: 'in' };
  }
  return { value: mm, unit: 'mm' };
};

/**
 * Extracts precipitation amount from rain/snow fields
 * Handles both hourly format (object with "1h" key) and daily format (direct number)
 */
export const getPrecipitationAmount = (
  rain: { "1h": number } | number | undefined,
  snow: { "1h": number } | number | undefined,
  isHourly: boolean
): number => {
  if (isHourly) {
    const rainAmount = rain && typeof rain === 'object' ? rain["1h"] : 0;
    const snowAmount = snow && typeof snow === 'object' ? snow["1h"] : 0;
    return rainAmount + snowAmount;
  }
  const rainAmount = typeof rain === 'number' ? rain : 0;
  const snowAmount = typeof snow === 'number' ? snow : 0;
  return rainAmount + snowAmount;
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
