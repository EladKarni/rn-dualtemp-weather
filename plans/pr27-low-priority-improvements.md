# Plan: Low Priority Improvements for PR #27

## Overview
Address minor code quality improvements including magic numbers, accessibility, and bundle size optimization.

## Priority
**Low** - Nice-to-have improvements that enhance maintainability and user experience

## Improvements

### 1. Extract Magic Numbers to Constants

#### Current Issues
Magic numbers scattered throughout animation code, making it hard to maintain consistency.

#### Solution

**File**: `src/constants/animations.ts` (new file)

```typescript
/**
 * Animation timing constants
 * Centralized values for consistent animations throughout the app
 */

export const ANIMATION_DURATION = {
  /** Quick animations (buttons, toggles) */
  FAST: 150,

  /** Standard animations (most UI transitions) */
  NORMAL: 200,

  /** Smooth slide animations */
  SLIDE: 250,

  /** Long animations (complex transitions) */
  SLOW: 300,
} as const;

export const SPRING_CONFIG = {
  /** Default spring animation */
  DEFAULT: {
    tension: 65,
    friction: 10,
  },

  /** Smooth spring for modals */
  MODAL: {
    tension: 65,
    friction: 11,
  },

  /** Bouncy spring for emphasis */
  BOUNCY: {
    tension: 80,
    friction: 8,
  },
} as const;

export const GESTURE_THRESHOLDS = {
  /** Minimum swipe distance in pixels */
  SWIPE: 50,

  /** Minimum drag distance to trigger action */
  DRAG: 20,

  /** Velocity threshold for fling gestures */
  FLING_VELOCITY: 0.5,
} as const;

export const TIMING = {
  /** Search input debounce delay */
  SEARCH_DEBOUNCE: 300,

  /** Minimum query length for search */
  MIN_QUERY_LENGTH: 3,

  /** GPS location timeout */
  GPS_TIMEOUT: 10000,

  /** API request timeout */
  API_TIMEOUT: 10000,
} as const;
```

**File**: `src/constants/limits.ts` (new file)

```typescript
/**
 * Business logic constants
 */

export const LOCATION_LIMITS = {
  /** Maximum saved locations (excluding GPS) */
  MAX_SAVED: 5,

  /** GPS location ID constant */
  GPS_ID: 'gps-location',

  /** Duplicate detection radius (in degrees, ~1km) */
  DUPLICATE_THRESHOLD: 0.01,
} as const;

export const CACHE_CONFIG = {
  /** Weather data stale time (30 minutes) */
  WEATHER_STALE_TIME: 1000 * 60 * 30,

  /** Weather data garbage collection time (1 hour) */
  WEATHER_GC_TIME: 1000 * 60 * 60,

  /** Search results cache TTL (5 minutes) */
  SEARCH_CACHE_TTL: 1000 * 60 * 5,

  /** Reverse geocoding cache TTL (1 hour) */
  REVERSE_GEOCODE_TTL: 1000 * 60 * 60,
} as const;

export const API_CONFIG = {
  /** Search results limit */
  SEARCH_LIMIT: 5,
} as const;
```

#### Update Files to Use Constants

**File**: `src/components/CurrentWeatherCard/CurrentWeatherCard.tsx`

**Before**:
```typescript
const SWIPE_THRESHOLD = 50;

Animated.timing(pan, {
  toValue: { x: direction === 'next' ? -400 : 400, y: 0 },
  duration: 250,
  useNativeDriver: true,
})

Animated.spring(pan, {
  toValue: { x: 0, y: 0 },
  tension: 65,
  friction: 10,
  useNativeDriver: true,
})
```

**After**:
```typescript
import { GESTURE_THRESHOLDS, ANIMATION_DURATION, SPRING_CONFIG } from '../../constants/animations';

// In panResponder
if (gestureState.dx > GESTURE_THRESHOLDS.SWIPE) {
  handleSwipe('prev');
}

// In animations
Animated.timing(pan, {
  toValue: { x: direction === 'next' ? -400 : 400, y: 0 },
  duration: ANIMATION_DURATION.SLIDE,
  useNativeDriver: true,
})

Animated.spring(pan, {
  toValue: { x: 0, y: 0 },
  ...SPRING_CONFIG.DEFAULT,
  useNativeDriver: true,
})
```

**File**: `src/screens/SettingsScreen.tsx`

**Before**:
```typescript
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 200,
  useNativeDriver: true,
}),
Animated.spring(slideAnim, {
  toValue: 0,
  tension: 65,
  friction: 11,
  useNativeDriver: true,
}),
```

**After**:
```typescript
import { ANIMATION_DURATION, SPRING_CONFIG } from '../constants/animations';

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: ANIMATION_DURATION.NORMAL,
  useNativeDriver: true,
}),
Animated.spring(slideAnim, {
  toValue: 0,
  ...SPRING_CONFIG.MODAL,
  useNativeDriver: true,
}),
```

**File**: `src/screens/AddLocationScreen.tsx`

**Before**:
```typescript
if (searchQuery.trim().length < 3) {
  setSearchResults([]);
  return;
}

searchTimeoutRef.current = setTimeout(async () => {
  // ...
}, 300);
```

**After**:
```typescript
import { TIMING } from '../constants/animations';

if (searchQuery.trim().length < TIMING.MIN_QUERY_LENGTH) {
  setSearchResults([]);
  return;
}

searchTimeoutRef.current = setTimeout(async () => {
  // ...
}, TIMING.SEARCH_DEBOUNCE);
```

**File**: `src/store/useLocationStore.ts`

**Before**:
```typescript
const GPS_LOCATION_ID = "gps-location";
const MAX_SAVED_LOCATIONS = 5;

// Later in code
if (nonGPSLocations.length >= MAX_SAVED_LOCATIONS) {
  // ...
}

const latDiff = Math.abs(loc.latitude - location.latitude);
const lonDiff = Math.abs(loc.longitude - location.longitude);
return latDiff < 0.01 && lonDiff < 0.01; // Roughly 1km
```

**After**:
```typescript
import { LOCATION_LIMITS } from '../constants/limits';

const { MAX_SAVED, GPS_ID, DUPLICATE_THRESHOLD } = LOCATION_LIMITS;

// Later in code
if (nonGPSLocations.length >= MAX_SAVED) {
  // ...
}

const latDiff = Math.abs(loc.latitude - location.latitude);
const lonDiff = Math.abs(loc.longitude - location.longitude);
return latDiff < DUPLICATE_THRESHOLD && lonDiff < DUPLICATE_THRESHOLD;
```

**File**: `App.tsx`

**Before**:
```typescript
queryKey: ["forecast", i18n.locale, activeLocation?.id],
queryFn: () => fetchForecast(...),
enabled: !!activeLocation && fetchedLocaleSuccessfully,
placeholderData: (previousData) => previousData,
staleTime: 1000 * 60 * 30, // 30 minutes
gcTime: 1000 * 60 * 60, // 1 hour
```

**After**:
```typescript
import { CACHE_CONFIG } from './src/constants/limits';

queryKey: ["forecast", i18n.locale, activeLocation?.id],
queryFn: () => fetchForecast(...),
enabled: !!activeLocation && fetchedLocaleSuccessfully,
placeholderData: (previousData) => previousData,
staleTime: CACHE_CONFIG.WEATHER_STALE_TIME,
gcTime: CACHE_CONFIG.WEATHER_GC_TIME,
```

---

### 2. Add Accessibility Labels

#### Current Issues
Interactive elements lack accessibility labels for screen readers.

#### Solution

**File**: `src/components/AppHeader/AppHeader.tsx`

**Before**:
```typescript
<TouchableOpacity
  onPress={onLocationPress}
  style={[styles.locationHeader]}
  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
>
  <Text style={[typography.headerText, styles.locationText]}>
    {location}
  </Text>
  {/* ... */}
</TouchableOpacity>
```

**After**:
```typescript
<TouchableOpacity
  onPress={onLocationPress}
  style={[styles.locationHeader]}
  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`Current location: ${location}. Tap to change location.`}
  accessibilityHint="Opens location selector"
>
  <Text style={[typography.headerText, styles.locationText]}>
    {location}
  </Text>
  {/* ... */}
</TouchableOpacity>

<TouchableOpacity
  onPress={onSettingsPress}
  style={styles.settingsButton}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Open settings"
  accessibilityHint="Access temperature units, language, and location settings"
>
  <GearIcon size={28} color={palette.primaryLight} />
</TouchableOpacity>
```

**File**: `src/components/TempUnitSelector/TempUnitSelector.tsx`

```typescript
<TouchableOpacity
  onPress={() => setTempScale('C')}
  accessible={true}
  accessibilityRole="radio"
  accessibilityState={{ checked: tempScale === 'C' }}
  accessibilityLabel="Celsius"
>
  {/* ... */}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => setTempScale('F')}
  accessible={true}
  accessibilityRole="radio"
  accessibilityState={{ checked: tempScale === 'F' }}
  accessibilityLabel="Fahrenheit"
>
  {/* ... */}
</TouchableOpacity>
```

**File**: `src/screens/SettingsScreen.tsx`

```typescript
<TouchableOpacity
  style={styles.closeButton}
  onPress={onClose}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Close settings"
>
  <Text style={styles.closeButtonText}>×</Text>
</TouchableOpacity>

{/* Location items */}
<TouchableOpacity
  onPress={() => { /* delete */ }}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`Delete ${location.name}`}
  accessibilityHint="Double tap to delete this location"
>
  <Text style={styles.deleteIcon}>🗑️</Text>
</TouchableOpacity>
```

**File**: `src/screens/AddLocationScreen.tsx`

```typescript
<TextInput
  style={styles.searchInput}
  placeholder={i18n.t("SearchLocation")}
  placeholderTextColor="#999"
  value={searchQuery}
  onChangeText={setSearchQuery}
  autoCapitalize="words"
  autoCorrect={false}
  autoFocus={true}
  accessible={true}
  accessibilityLabel="Search for a city"
  accessibilityHint="Type to search for a location to add"
/>

{/* Search results */}
<TouchableOpacity
  style={styles.cityItem}
  onPress={() => handleSelectCity(item)}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`Add ${displayName}`}
  accessibilityHint="Double tap to add this location"
>
  {/* ... */}
</TouchableOpacity>
```

**File**: `src/components/CurrentWeatherCard/CurrentWeatherCard.tsx`

```typescript
<Animated.View
  style={{ /* ... */ }}
  {...(hasMultipleLocations ? panResponder.panHandlers : {})}
  accessible={true}
  accessibilityLabel={`Current weather card. ${hasMultipleLocations ? 'Swipe left or right to view other locations' : ''}`}
  accessibilityRole="summary"
>
  {/* ... */}
</Animated.View>
```

---

### 3. Bundle Size Optimization (Optional)

#### Analysis

Run bundle analyzer to check impact:

```bash
# For Expo projects
npx expo export --platform ios
npx expo export --platform android

# Check bundle sizes
ls -lh dist/bundles/

# Use source-map-explorer
npm install -g source-map-explorer
source-map-explorer dist/bundles/ios-*.js
```

#### Potential Optimizations

**1. Tree-shaking Check**

Ensure unused Zustand middleware is tree-shaken:

```typescript
// Good - only imports what's needed
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Bad - imports entire library
import * as zustand from 'zustand';
```

**2. Moment.js (if used)**

Check if moment locale files can be excluded:

**File**: `metro.config.js` (if not exists, create)

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude unnecessary moment locales (keep only needed ones)
config.resolver.blockList = [
  /node_modules\/moment\/locale\/((?!en|es|fr|ar|he|zh).)*\.js$/,
];

module.exports = config;
```

**3. Code Splitting (Advanced)**

For very large apps, split code by screen:

```typescript
// Lazy load settings screen
const SettingsScreen = React.lazy(() => import('./src/screens/SettingsScreen'));

// In App.tsx
<Suspense fallback={<LoadingView />}>
  <SettingsScreen visible={...} onClose={...} />
</Suspense>
```

**Note**: React Native doesn't support code splitting natively. This would require additional setup with tools like Re.pack or Haul.

**4. Image Optimization**

Ensure icons are optimized:

```bash
# Optimize PNGs
npx imagemin assets/**/*.png --out-dir=assets-optimized

# Convert to WebP (smaller, better compression)
npx cwebp assets/icon.png -o assets/icon.webp
```

---

### 4. Create Constants Index File

**File**: `src/constants/index.ts`

```typescript
/**
 * Centralized exports for all constants
 */

export * from './animations';
export * from './limits';

// Re-export commonly used values for convenience
export { ANIMATION_DURATION, SPRING_CONFIG, GESTURE_THRESHOLDS } from './animations';
export { LOCATION_LIMITS, CACHE_CONFIG } from './limits';
```

Usage:
```typescript
// Before
import { SPRING_CONFIG } from '../../constants/animations';
import { LOCATION_LIMITS } from '../../constants/limits';

// After
import { SPRING_CONFIG, LOCATION_LIMITS } from '../../constants';
```

---

### 5. Add JSDoc Comments to Constants

**File**: `src/constants/animations.ts`

```typescript
/**
 * Animation timing constants
 * Centralized values for consistent animations throughout the app
 *
 * @example
 * ```typescript
 * Animated.timing(value, {
 *   duration: ANIMATION_DURATION.NORMAL,
 *   useNativeDriver: true,
 * });
 * ```
 */
export const ANIMATION_DURATION = {
  /**
   * Quick animations for instant feedback
   * Use for: button presses, toggle switches
   * Duration: 150ms
   */
  FAST: 150,

  /**
   * Standard animation timing
   * Use for: most UI transitions, fades, slides
   * Duration: 200ms
   */
  NORMAL: 200,

  /**
   * Smooth slide animations
   * Use for: modal enter/exit, screen transitions
   * Duration: 250ms
   */
  SLIDE: 250,

  /**
   * Longer animations for complex transitions
   * Use for: multi-step animations, complex gestures
   * Duration: 300ms
   */
  SLOW: 300,
} as const;

/**
 * Spring animation configurations
 * Tension: controls the speed (higher = faster)
 * Friction: controls the bounciness (lower = more bouncy)
 *
 * @example
 * ```typescript
 * Animated.spring(value, {
 *   toValue: 1,
 *   ...SPRING_CONFIG.DEFAULT,
 *   useNativeDriver: true,
 * });
 * ```
 */
export const SPRING_CONFIG = {
  /**
   * Default spring animation
   * Balanced between speed and smoothness
   * Tension: 65, Friction: 10
   */
  DEFAULT: {
    tension: 65,
    friction: 10,
  },

  /**
   * Smooth spring for modals and overlays
   * Slightly more controlled than default
   * Tension: 65, Friction: 11
   */
  MODAL: {
    tension: 65,
    friction: 11,
  },

  /**
   * Bouncy spring for playful interactions
   * More energetic feel
   * Tension: 80, Friction: 8
   */
  BOUNCY: {
    tension: 80,
    friction: 8,
  },
} as const;

/**
 * Gesture recognition thresholds
 * Fine-tune these values for better gesture detection
 */
export const GESTURE_THRESHOLDS = {
  /**
   * Minimum horizontal distance (in pixels) to recognize a swipe
   * Default: 50px
   * Increase for less sensitive swipes, decrease for more sensitive
   */
  SWIPE: 50,

  /**
   * Minimum drag distance to trigger drag gesture
   * Default: 20px
   */
  DRAG: 20,

  /**
   * Minimum velocity for fling gestures
   * Higher values require faster swipes
   * Default: 0.5
   */
  FLING_VELOCITY: 0.5,
} as const;
```

---

## Implementation Checklist

### Phase 1: Extract Constants (1-2 hours)
- [ ] Create `src/constants/animations.ts`
- [ ] Create `src/constants/limits.ts`
- [ ] Create `src/constants/index.ts`
- [ ] Add JSDoc comments
- [ ] Update CurrentWeatherCard to use constants
- [ ] Update SettingsScreen to use constants
- [ ] Update AddLocationScreen to use constants
- [ ] Update useLocationStore to use constants
- [ ] Update App.tsx to use constants

### Phase 2: Accessibility (1-2 hours)
- [ ] Add labels to AppHeader buttons
- [ ] Add labels to TempUnitSelector
- [ ] Add labels to LanguageSelector
- [ ] Add labels to SettingsScreen
- [ ] Add labels to AddLocationScreen
- [ ] Add labels to LocationDropdown
- [ ] Test with screen reader (TalkBack/VoiceOver)

### Phase 3: Bundle Optimization (Optional, 1-2 hours)
- [ ] Run bundle analyzer
- [ ] Check tree-shaking is working
- [ ] Exclude unused moment locales (if applicable)
- [ ] Optimize images
- [ ] Measure before/after bundle size

## Testing

### Constants
```typescript
// Quick verification test
import { ANIMATION_DURATION, SPRING_CONFIG } from '../constants';

describe('Constants', () => {
  it('should have expected animation durations', () => {
    expect(ANIMATION_DURATION.FAST).toBe(150);
    expect(ANIMATION_DURATION.NORMAL).toBe(200);
  });

  it('should freeze constants (prevent mutation)', () => {
    expect(() => {
      // @ts-expect-error
      ANIMATION_DURATION.FAST = 100;
    }).toThrow();
  });
});
```

### Accessibility
- [ ] Enable VoiceOver (iOS) or TalkBack (Android)
- [ ] Navigate through settings screen
- [ ] Add a location using screen reader
- [ ] Change temperature unit
- [ ] Verify all buttons are announced correctly
- [ ] Check focus order is logical

### Bundle Size
- [ ] Measure baseline bundle size
- [ ] Apply optimizations
- [ ] Measure new bundle size
- [ ] Verify <5% increase from Zustand addition

## Success Criteria

- [ ] All magic numbers replaced with named constants
- [ ] Constants are documented with JSDoc
- [ ] All interactive elements have accessibility labels
- [ ] Screen reader can navigate all features
- [ ] Bundle size impact documented
- [ ] No runtime errors from constant usage

## Estimated Effort
**3-5 hours total**
- Constants extraction: 1-2 hours
- Accessibility: 1-2 hours
- Bundle optimization: 1-2 hours (optional)
- Testing: 30 min

## Files to Create/Modify

**New Files**:
- `src/constants/animations.ts`
- `src/constants/limits.ts`
- `src/constants/index.ts`
- `src/constants/__tests__/constants.test.ts`

**Modified Files**:
- `src/components/CurrentWeatherCard/CurrentWeatherCard.tsx`
- `src/components/AppHeader/AppHeader.tsx`
- `src/components/TempUnitSelector/TempUnitSelector.tsx`
- `src/components/LanguageSelector/LanguageSelector.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/screens/AddLocationScreen.tsx`
- `src/components/LocationDropdown/LocationDropdown.tsx`
- `src/store/useLocationStore.ts`
- `App.tsx`
- `metro.config.js` (optional)

## Benefits

### Maintainability
- Easy to adjust animation timing globally
- Clear documentation of why values are chosen
- Prevents accidental inconsistencies

### Accessibility
- Better experience for visually impaired users
- Compliance with accessibility standards
- Improved app store rating

### Performance
- Smaller bundle size
- Faster initial load
- Better user experience

## Dependencies
None - uses built-in React Native features
