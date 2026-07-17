/**
 * Review-mandated test #7 — `temperature.ts` known-value table.
 *
 * Covers the pure conversion/formatting helpers with hand-computed expected
 * values, including `formatTemperature('F')` (the Celsius->Fahrenheit path) and
 * `convertWindSpeed` (m/s -> km/h for Celsius, m/s -> mph for Fahrenheit).
 */
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  formatTemperature,
  convertWindSpeed,
  celsiusToKelvin,
  kelvinToCelsius,
} from '../temperature';

describe('celsiusToFahrenheit — known values', () => {
  it.each<[number, number]>([
    [0, 32],
    [100, 212],
    [-40, -40], // the classic crossover point
    [37, 98.6],
    [20, 68],
  ])('celsiusToFahrenheit(%p) === %p', (c, f) => {
    expect(celsiusToFahrenheit(c)).toBeCloseTo(f, 5);
  });
});

describe('fahrenheitToCelsius — known values (inverse)', () => {
  it.each<[number, number]>([
    [32, 0],
    [212, 100],
    [-40, -40],
    [98.6, 37],
  ])('fahrenheitToCelsius(%p) === %p', (f, c) => {
    expect(fahrenheitToCelsius(f)).toBeCloseTo(c, 5);
  });

  it('round-trips C -> F -> C', () => {
    expect(fahrenheitToCelsius(celsiusToFahrenheit(21.5))).toBeCloseTo(21.5, 5);
  });
});

describe('formatTemperature', () => {
  describe("scale 'C' (no conversion)", () => {
    it.each<[number, number, string]>([
      [20, 0, '20°'],
      [0, 0, '0°'],
      [100, 0, '100°'],
      [-5, 0, '-5°'],
      [20.6, 1, '20.6°'], // precision honored
      [20.44, 1, '20.4°'], // toFixed rounds down
    ])('formatTemperature(%p, "C", %p) === %p', (temp, precision, expected) => {
      expect(formatTemperature(temp, 'C', precision)).toBe(expected);
    });
  });

  describe("scale 'F' (converts Celsius input to Fahrenheit)", () => {
    it.each<[number, string]>([
      [0, '32°'], // 0C -> 32F
      [100, '212°'], // 100C -> 212F
      [20, '68°'], // 20C -> 68F
      [-40, '-40°'], // -40C -> -40F
      [37, '99°'], // 37C -> 98.6F -> rounds to 99 at precision 0
    ])('formatTemperature(%p, "F") === %p', (tempC, expected) => {
      expect(formatTemperature(tempC, 'F')).toBe(expected);
    });

    it('honors precision on the Fahrenheit path', () => {
      // 37C -> 98.6F
      expect(formatTemperature(37, 'F', 1)).toBe('98.6°');
    });
  });

  it('defaults precision to 0', () => {
    expect(formatTemperature(20.9, 'C')).toBe('21°');
  });
});

describe('convertWindSpeed', () => {
  describe("scale 'C' -> km/h", () => {
    it.each<[number, number]>([
      [0, 0],
      [10, 36], // 10 m/s * 3.6
      [5, 18],
      [1, 3.6],
    ])('convertWindSpeed(%p, "C").value === %p km/h', (ms, kmh) => {
      const result = convertWindSpeed(ms, 'C');
      expect(result.value).toBeCloseTo(kmh, 5);
      expect(result.unit).toBe('km/h');
    });
  });

  describe("scale 'F' -> mph", () => {
    it.each<[number, number]>([
      [0, 0],
      [10, 22.3694], // 10 m/s * 2.23694
      [1, 2.23694],
    ])('convertWindSpeed(%p, "F").value === %p mph', (ms, mph) => {
      const result = convertWindSpeed(ms, 'F');
      expect(result.value).toBeCloseTo(mph, 5);
      expect(result.unit).toBe('mph');
    });
  });
});

describe('Kelvin conversions — known values', () => {
  it('celsiusToKelvin adds 273.15', () => {
    expect(celsiusToKelvin(0)).toBeCloseTo(273.15, 5);
    expect(celsiusToKelvin(100)).toBeCloseTo(373.15, 5);
    expect(celsiusToKelvin(-273.15)).toBeCloseTo(0, 5);
  });

  it('kelvinToCelsius subtracts 273.15 (inverse)', () => {
    expect(kelvinToCelsius(273.15)).toBeCloseTo(0, 5);
    expect(kelvinToCelsius(0)).toBeCloseTo(-273.15, 5);
    expect(kelvinToCelsius(celsiusToKelvin(42))).toBeCloseTo(42, 5);
  });
});
