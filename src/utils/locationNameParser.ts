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
