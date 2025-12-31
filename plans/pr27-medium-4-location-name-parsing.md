# Plan: Improve Location Name Parsing Reliability

## Overview
Replace fragile GPS location name parsing with more robust geocoding service to ensure consistent location names across devices and locales.

## Priority
**Medium** - Current implementation may produce inconsistent results

## Current Issue

**File**: `App.tsx:68-99`

```typescript
const locationInfo = await Location.reverseGeocodeAsync(location.coords);

// Extract clean city/town name, avoiding full address strings
const info = locationInfo[0];
let name = info?.city || info?.subregion || info?.district ||
           info?.region || info?.country || "Current Location";

// If the city name contains commas, extract just the first part
if (name.includes(',')) {
  name = name.split(',')[0].trim();
}

updateGPSLocation(
  location.coords.latitude,
  location.coords.longitude,
  name
);
```

### Problems

1. **Inconsistent Priority**
   - `city` might be empty but `subregion` contains the actual city
   - Different locales return different field priorities
   - Examples:
     - US: `city` = "New York", `subregion` = "New York County"
     - Europe: `city` = "", `subregion` = "Paris"
     - Rural areas: `city` = "", `district` = "County Name"

2. **Comma Splitting is Naive**
   - Doesn't handle all cases: "Washington, D.C." → "Washington"
   - Some places have commas in name: "Sutton-on-Sea, Lincolnshire" → "Sutton-on-Sea"

3. **Locale Dependence**
   - Field names vary by device language
   - Example: Arabic/Hebrew might return transliterated or native names
   - Not consistent with geocoding search results

4. **Fallback Chain Issues**
   - Region/country are too broad ("California", "United States")
   - "Current Location" is not helpful
   - No retry mechanism if geocoding fails

## Solution Architecture

### Approach 1: Use Geocoding Service (Recommended)
Use the same geocoding API for reverse geocoding to ensure consistency.

### Approach 2: Smarter Parsing (Fallback)
Improve parsing logic with better heuristics if API unavailable.

## Implementation Plan

### Step 1: Add Reverse Geocoding to API

**File**: `src/utils/geocoding.ts`

```typescript
export interface ReverseGeocodeResult {
  name: string;          // City/town name
  displayName: string;   // Full formatted name
  city: string;
  state?: string;
  country: string;
  countryCode: string;
}

/**
 * Reverse geocode coordinates to get location name
 * Uses the same API as search for consistency
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Formatted location name and details
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> => {
  try {
    const response = await fetch(
      `${base_url}reverse-geocode?lat=${latitude}&lon=${longitude}`
    );

    if (!response.ok) {
      throw new ApiError(
        `Reverse geocode failed: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();

    // API returns array with closest match first
    if (!data || data.length === 0) {
      throw new Error('No results from reverse geocoding');
    }

    const result = data[0];

    // Construct clean name
    const cityName = result.name || result.city || 'Unknown Location';
    const stateName = result.state;
    const countryName = result.country;

    return {
      name: cityName,
      displayName: formatLocationName(cityName, stateName, countryName),
      city: cityName,
      state: stateName,
      country: countryName,
      countryCode: result.country_code || '',
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
};

/**
 * Get a clean, short location name from coordinates
 * Falls back gracefully if API fails
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param fallbackName - Name to use if geocoding fails
 * @returns Clean location name (e.g., "Paris", "Tokyo", "New York")
 */
export const getLocationName = async (
  latitude: number,
  longitude: number,
  fallbackName: string = 'Current Location'
): Promise<string> => {
  try {
    const result = await reverseGeocode(latitude, longitude);
    return result.name;
  } catch (error) {
    console.warn('Reverse geocoding failed, using fallback:', fallbackName);
    return fallbackName;
  }
};
```

### Step 2: Update App.tsx GPS Fetching

**File**: `App.tsx`

**Before**:
```typescript
const location = await Location.getCurrentPositionAsync({});
const locationInfo = await Location.reverseGeocodeAsync(location.coords);

const info = locationInfo[0];
let name = info?.city || info?.subregion || info?.district ||
           info?.region || info?.country || "Current Location";

if (name.includes(',')) {
  name = name.split(',')[0].trim();
}

updateGPSLocation(
  location.coords.latitude,
  location.coords.longitude,
  name
);
```

**After**:
```typescript
import { getLocationName } from './src/utils/geocoding';

const location = await Location.getCurrentPositionAsync({});

// Use expo-location as fallback only
const locationInfo = await Location.reverseGeocodeAsync(location.coords);
const fallbackName = locationInfo[0]?.city ||
                     locationInfo[0]?.subregion ||
                     'Current Location';

// Get clean name from geocoding API (consistent with search)
const name = await getLocationName(
  location.coords.latitude,
  location.coords.longitude,
  fallbackName
);

updateGPSLocation(
  location.coords.latitude,
  location.coords.longitude,
  name
);
```

### Step 3: Add Smart Fallback Parser

**File**: `src/utils/locationNameParser.ts` (new file)

For cases where API is unavailable, provide robust parsing:

```typescript
import type { LocationGeocodedAddress } from 'expo-location';

/**
 * Intelligently extract the best location name from reverse geocode data
 * Handles edge cases and locale variations
 */
export function parseLocationName(
  geocodeData: LocationGeocodedAddress[]
): string {
  if (!geocodeData || geocodeData.length === 0) {
    return 'Unknown Location';
  }

  const info = geocodeData[0];

  // Priority order with validation
  const candidates = [
    info.city,
    info.subregion,
    info.district,
    info.region,
  ].filter(isValidCityName);

  if (candidates.length > 0) {
    return cleanLocationName(candidates[0]);
  }

  // Last resort: use country, but flag it
  return info.country || 'Unknown Location';
}

/**
 * Validate that a name is actually a city/town, not a broad region
 */
function isValidCityName(name: string | null | undefined): name is string {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();

  // Reject if empty
  if (trimmed.length === 0) {
    return false;
  }

  // Reject if it's a full address (contains multiple commas)
  if ((trimmed.match(/,/g) || []).length > 1) {
    return false;
  }

  // Reject if it's just a postal code
  if (/^\d{4,6}$/.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Clean up location name:
 * - Remove country suffix if present
 * - Handle special cases (D.C., etc.)
 * - Trim whitespace
 */
function cleanLocationName(name: string): string {
  let cleaned = name.trim();

  // Handle "City, Country" format - keep only city
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(p => p.trim());

    // Special case: "Washington, D.C." - keep both parts
    if (parts[1] && parts[1].match(/^D\.?C\.?$/i)) {
      return `${parts[0]}, D.C.`;
    }

    // Special case: "City, State Abbreviation" (US format) - keep city only
    if (parts[1] && parts[1].length === 2) {
      return parts[0];
    }

    // Default: keep first part
    return parts[0];
  }

  return cleaned;
}

/**
 * Format location name consistently
 * Ensures first letter capitalized, proper spacing
 */
export function formatLocationNameDisplay(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
```

### Step 4: Update Location Store Validation

**File**: `src/store/useLocationStore.ts`

Add validation when updating GPS location:

```typescript
import { parseLocationName, formatLocationNameDisplay } from '../utils/locationNameParser';

updateGPSLocation: (latitude, longitude, name) => {
  const state = get();
  const existingGPS = state.savedLocations.find(
    (loc) => loc.id === GPS_LOCATION_ID
  );

  // Validate and clean the name
  const cleanName = name.trim() || 'Current Location';
  const displayName = formatLocationNameDisplay(cleanName);

  const gpsLocation: SavedLocation = {
    id: GPS_LOCATION_ID,
    name: displayName,
    latitude,
    longitude,
    addedAt: existingGPS?.addedAt || Date.now(),
    isGPS: true,
  };

  // ... rest of implementation
},
```

### Step 5: Add Caching for Reverse Geocoding

**File**: `src/utils/geocoding.ts`

Prevent duplicate reverse geocoding calls:

```typescript
// Simple in-memory cache for reverse geocoding
const reverseGeocodeCache = new Map<string, {
  result: ReverseGeocodeResult;
  timestamp: number;
}>();

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Get cache key from coordinates (rounded to ~100m precision)
 */
function getCacheKey(lat: number, lon: number): string {
  // Round to 3 decimal places (~100m precision)
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLon = Math.round(lon * 1000) / 1000;
  return `${roundedLat},${roundedLon}`;
}

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> => {
  const cacheKey = getCacheKey(latitude, longitude);
  const cached = reverseGeocodeCache.get(cacheKey);

  // Return cached result if fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  try {
    // ... fetch logic from Step 1 ...

    // Cache the result
    reverseGeocodeCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
};
```

### Step 6: Add Retry Logic

**File**: `App.tsx`

Handle reverse geocoding failures gracefully:

```typescript
const fetchGPS = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      // ... permission handling ...
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: 10000,
    });

    // First attempt: API reverse geocoding
    let name: string;
    try {
      name = await getLocationName(
        location.coords.latitude,
        location.coords.longitude
      );
    } catch (apiError) {
      console.warn('API reverse geocoding failed, using expo-location fallback');

      // Second attempt: Expo reverse geocoding with smart parsing
      try {
        const locationInfo = await Location.reverseGeocodeAsync(location.coords);
        name = parseLocationName(locationInfo);
      } catch (expoError) {
        console.warn('Expo reverse geocoding also failed');
        // Ultimate fallback: coordinates
        name = `Location (${location.coords.latitude.toFixed(2)}, ${location.coords.longitude.toFixed(2)})`;
      }
    }

    updateGPSLocation(
      location.coords.latitude,
      location.coords.longitude,
      name
    );
  } catch (error) {
    // ... error handling from previous plan ...
  }
};
```

### Step 7: Add Unit Tests

**File**: `src/utils/__tests__/locationNameParser.test.ts`

```typescript
import { parseLocationName, cleanLocationName, formatLocationNameDisplay } from '../locationNameParser';

describe('parseLocationName', () => {
  it('should prioritize city over subregion', () => {
    const data = [{
      city: 'Paris',
      subregion: 'Île-de-France',
      district: null,
      region: 'Île-de-France',
      country: 'France',
    }] as any;

    expect(parseLocationName(data)).toBe('Paris');
  });

  it('should use subregion if city is empty', () => {
    const data = [{
      city: null,
      subregion: 'Manhattan',
      district: 'New York County',
      region: 'New York',
      country: 'United States',
    }] as any;

    expect(parseLocationName(data)).toBe('Manhattan');
  });

  it('should handle Washington, D.C. correctly', () => {
    expect(cleanLocationName('Washington, D.C.')).toBe('Washington, D.C.');
    expect(cleanLocationName('Washington, DC')).toBe('Washington, D.C.');
  });

  it('should remove country from "City, Country" format', () => {
    expect(cleanLocationName('Tokyo, Japan')).toBe('Tokyo');
    expect(cleanLocationName('London, UK')).toBe('London');
  });

  it('should keep city only for "City, ST" format', () => {
    expect(cleanLocationName('Seattle, WA')).toBe('Seattle');
    expect(cleanLocationName('Austin, TX')).toBe('Austin');
  });

  it('should reject postal codes', () => {
    const data = [{
      city: '10001',
      subregion: 'Manhattan',
      district: null,
      region: 'New York',
      country: 'United States',
    }] as any;

    expect(parseLocationName(data)).toBe('Manhattan');
  });

  it('should handle empty data gracefully', () => {
    expect(parseLocationName([])).toBe('Unknown Location');
    expect(parseLocationName(null as any)).toBe('Unknown Location');
  });
});

describe('formatLocationNameDisplay', () => {
  it('should capitalize first letter of each word', () => {
    expect(formatLocationNameDisplay('new york')).toBe('New York');
    expect(formatLocationNameDisplay('SAN FRANCISCO')).toBe('San Francisco');
    expect(formatLocationNameDisplay('los angeles')).toBe('Los Angeles');
  });
});
```

**File**: `src/utils/__tests__/geocoding.test.ts`

```typescript
import { reverseGeocode, getLocationName } from '../geocoding';

describe('reverseGeocode', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('should return location name from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        name: 'Tokyo',
        country: 'Japan',
        state: 'Tokyo',
        country_code: 'JP',
      }],
    });

    const result = await reverseGeocode(35.6762, 139.6503);

    expect(result.name).toBe('Tokyo');
    expect(result.country).toBe('Japan');
  });

  it('should cache results', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        name: 'Paris',
        country: 'France',
      }],
    });

    await reverseGeocode(48.8566, 2.3522);
    await reverseGeocode(48.8566, 2.3522); // Same coordinates

    // Should only call fetch once (second call uses cache)
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should use fallback name on error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    const result = await getLocationName(0, 0, 'My Fallback');

    expect(result).toBe('My Fallback');
  });
});
```

## Benefits

### Consistency
- Location names match between GPS and search
- Same formatting across all locations
- Predictable behavior regardless of device locale

### Reliability
- Multiple fallback layers (API → Expo → Coordinates)
- Caching prevents redundant API calls
- Handles edge cases (D.C., postal codes, etc.)

### User Experience
- Clean, readable location names
- No cryptic region names
- Consistent with manual location searches

## Testing Strategy

### Unit Tests
- Location name parsing logic
- Fallback chain behavior
- Caching mechanism

### Integration Tests
- GPS location fetch with reverse geocoding
- Fallback when API unavailable
- Cache hit/miss scenarios

### Manual Testing
- [ ] GPS location in major city (should show city name)
- [ ] GPS location in suburban area (should show town/district)
- [ ] GPS location in rural area (should show nearest locality)
- [ ] GPS with API offline (should use Expo fallback)
- [ ] Multiple GPS fetches in same area (should cache)
- [ ] Compare name with manual search for same coordinates

## Success Criteria

- [ ] GPS location names match geocoding search results
- [ ] No broad region names ("California", "United States")
- [ ] Special cases handled (D.C., hyphenated names)
- [ ] Fallback works when API unavailable
- [ ] Results cached to reduce API calls
- [ ] All tests passing
- [ ] No performance regression

## Estimated Effort
**3-4 hours**
- 1 hour: Add reverse geocoding to API/utils
- 1 hour: Create smart fallback parser
- 1 hour: Update App.tsx with retry logic
- 1 hour: Write tests

## Files to Create/Modify

**New Files**:
- `src/utils/locationNameParser.ts`
- `src/utils/__tests__/locationNameParser.test.ts`
- Update `src/utils/__tests__/geocoding.test.ts`

**Modified Files**:
- `src/utils/geocoding.ts`
- `App.tsx`
- `src/store/useLocationStore.ts`

## Dependencies
- None - uses existing geocoding API endpoint
- May require backend update if reverse geocoding endpoint doesn't exist

## Backward Compatibility
- Fully compatible
- Improves existing behavior
- No breaking changes

## Future Enhancements

### 1. Localized Names
Support showing location names in user's preferred language:
```typescript
const name = await getLocationName(lat, lon, {
  language: i18n.locale,
  fallback: 'en'
});
```

### 2. Administrative Levels
Allow choosing detail level:
```typescript
type LocationLevel = 'city' | 'district' | 'region' | 'country';

const name = await getLocationName(lat, lon, {
  level: 'city',
  includeState: true // "Seattle, WA" vs "Seattle"
});
```

### 3. Custom Formatting
```typescript
const formatted = formatLocation(result, {
  style: 'short' | 'long' | 'full',
  includeCountry: boolean,
});
// short: "Paris"
// long: "Paris, France"
// full: "Paris, Île-de-France, France"
```
