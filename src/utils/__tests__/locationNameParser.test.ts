/**
 * Review-mandated test #10 — `locationNameParser` display-name cases.
 *
 * Exercises `parseLocationName` (priority chain, validation, cleanup special
 * cases) and `formatLocationNameDisplay` (title-casing).
 */
import type { LocationGeocodedAddress } from 'expo-location';
import {
  parseLocationName,
  formatLocationNameDisplay,
} from '../locationNameParser';

// Minimal builder — only the fields parseLocationName reads matter; the rest are
// filled with nulls to satisfy the LocationGeocodedAddress shape.
const addr = (
  partial: Partial<LocationGeocodedAddress>
): LocationGeocodedAddress =>
  ({
    city: null,
    country: null,
    district: null,
    isoCountryCode: null,
    name: null,
    postalCode: null,
    region: null,
    street: null,
    streetNumber: null,
    subregion: null,
    timezone: null,
    formattedAddress: null,
    ...partial,
  }) as LocationGeocodedAddress;

describe('parseLocationName — empty / missing input', () => {
  it('returns "Unknown Location" for an empty array', () => {
    expect(parseLocationName([])).toBe('Unknown Location');
  });

  it('returns "Unknown Location" for null-ish input', () => {
    // Cast rather than @ts-expect-error: this repo's tsconfig has strictNullChecks
    // off, so `null` is assignable and a directive here would be "unused".
    expect(
      parseLocationName(null as unknown as LocationGeocodedAddress[])
    ).toBe('Unknown Location');
  });
});

describe('parseLocationName — priority chain', () => {
  it('prefers city when present and valid', () => {
    expect(parseLocationName([addr({ city: 'Paris', country: 'France' })])).toBe(
      'Paris'
    );
  });

  it('falls back to subregion when city is missing', () => {
    expect(
      parseLocationName([addr({ subregion: 'Brooklyn', country: 'USA' })])
    ).toBe('Brooklyn');
  });

  it('falls back to district when city + subregion missing', () => {
    expect(
      parseLocationName([addr({ district: 'Shibuya', country: 'Japan' })])
    ).toBe('Shibuya');
  });

  it('falls back to region when city/subregion/district missing', () => {
    expect(
      parseLocationName([addr({ region: 'Bavaria', country: 'Germany' })])
    ).toBe('Bavaria');
  });

  it('falls back to country when every candidate is invalid', () => {
    expect(parseLocationName([addr({ country: 'Iceland' })])).toBe('Iceland');
  });

  it('returns "Unknown Location" when even country is absent', () => {
    expect(parseLocationName([addr({})])).toBe('Unknown Location');
  });
});

describe('parseLocationName — validation rejects non-city values', () => {
  it('rejects a bare postal code and moves to the next candidate', () => {
    expect(
      parseLocationName([
        addr({ city: '75001', region: 'Ile-de-France', country: 'France' }),
      ])
    ).toBe('Ile-de-France');
  });

  it('rejects a full address (multiple commas) and moves on', () => {
    expect(
      parseLocationName([
        addr({
          city: '10 Rue de Rivoli, 1st Arr., Paris',
          region: 'Ile-de-France',
          country: 'France',
        }),
      ])
    ).toBe('Ile-de-France');
  });

  it('rejects whitespace-only names', () => {
    expect(
      parseLocationName([addr({ city: '   ', country: 'Nowhere' })])
    ).toBe('Nowhere');
  });
});

describe('parseLocationName — cleanup special cases', () => {
  it('keeps "Washington, D.C." intact', () => {
    expect(
      parseLocationName([addr({ city: 'Washington, D.C.', country: 'USA' })])
    ).toBe('Washington, D.C.');
  });

  it('drops a 2-letter US state suffix ("New York, NY" -> "New York")', () => {
    expect(
      parseLocationName([addr({ city: 'New York, NY', country: 'USA' })])
    ).toBe('New York');
  });

  it('keeps only the first part for "City, Country" ("Paris, France" -> "Paris")', () => {
    expect(
      parseLocationName([addr({ city: 'Paris, France', country: 'France' })])
    ).toBe('Paris');
  });
});

describe('formatLocationNameDisplay — title casing', () => {
  it.each<[string, string]>([
    ['new york', 'New York'],
    ['PARIS', 'Paris'],
    ['los angeles', 'Los Angeles'],
    ['tokyo', 'Tokyo'],
    ['SAN FRANCISCO', 'San Francisco'],
  ])('formatLocationNameDisplay(%p) === %p', (input, expected) => {
    expect(formatLocationNameDisplay(input)).toBe(expected);
  });
});
