# Plan: Add Automated Tests for PR #27 Features

## Overview
Add comprehensive unit and integration tests for the new features introduced in PR #27 (settings, location management, swipe functionality, and localization).

## Priority
**Critical** - No tests currently exist for 1997 lines of new code

## Risk Assessment
- **High Risk Areas**: Animation state transitions, location store logic, API interactions
- **Testing Gap**: Core functionality untested - duplicate detection, max location limits, GPS fallback
- **Regression Risk**: Future changes could break swipe gestures or state management without detection

## Testing Strategy

### 1. Test Infrastructure Setup

#### Install Dependencies
```bash
# Install testing libraries
yarn add -D @testing-library/react-native @testing-library/jest-native jest-expo
yarn add -D @testing-library/react-hooks
yarn add -D react-test-renderer

# Install mocking utilities
yarn add -D @react-native-async-storage/async-storage/jest/async-storage-mock
```

#### Configure Jest
- Update `package.json` with test script
- Create `jest.config.js` with React Native preset
- Configure mock for AsyncStorage, expo-location, react-native-localization-settings
- Set up test setup file for global mocks

### 2. Store Tests (High Priority)

#### `src/store/__tests__/useLocationStore.test.ts`
Test cases:
- **Adding locations**
  - ✓ Should add location successfully
  - ✓ Should generate unique ID and timestamp
  - ✓ Should reject duplicate within 1km radius
  - ✓ Should reject when max 5 locations reached
  - ✓ Should not count GPS location toward max limit

- **Removing locations**
  - ✓ Should remove non-GPS location
  - ✓ Should prevent GPS location removal
  - ✓ Should switch to GPS when removing active location
  - ✓ Should preserve other locations when removing one

- **Active location management**
  - ✓ Should set active location by ID
  - ✓ Should return active location with getActiveLocation()
  - ✓ Should handle null activeLocationId gracefully

- **GPS location updates**
  - ✓ Should create GPS location on first update
  - ✓ Should update existing GPS location
  - ✓ Should preserve GPS addedAt timestamp on update
  - ✓ Should always use GPS_LOCATION_ID constant

- **Persistence**
  - ✓ Should persist to AsyncStorage
  - ✓ Should restore from AsyncStorage on init
  - ✓ Should use correct storage key "@saved_locations"

#### `src/store/__tests__/useSettingsStore.test.ts`
Test cases:
- ✓ Should default to Celsius
- ✓ Should toggle between C and F
- ✓ Should persist temperature preference
- ✓ Should set hydration state on rehydrate

#### `src/store/__tests__/useLanguageStore.test.ts`
Test cases:
- ✓ Should default to null (auto-detect)
- ✓ Should set language code
- ✓ Should persist language selection
- ✓ Should allow null to reset to auto-detect

#### `src/store/__tests__/useModalStore.test.ts`
Test cases:
- ✓ Should start with no active modal
- ✓ Should open each modal type
- ✓ Should close modal and clear data
- ✓ Should not persist (ephemeral state)

### 3. Utility Function Tests

#### `src/utils/__tests__/geocoding.test.ts`
Test cases:
- **searchCities**
  - ✓ Should return empty array for queries < 3 chars
  - ✓ Should encode special characters in query
  - ✓ Should limit to 5 results
  - ✓ Should throw error on API failure
  - ✓ Should handle network errors gracefully

- **formatLocationName**
  - ✓ Should format with state: "City, State, Country"
  - ✓ Should format without state: "City, Country"
  - ✓ Should handle undefined state

- **getCityCoordinates**
  - ✓ Should return first result coordinates
  - ✓ Should return null for no results
  - ✓ Should handle API errors

### 4. Component Tests

#### `src/components/__tests__/CurrentWeatherCard.test.tsx`
Test cases:
- **Rendering**
  - ✓ Should render temperature and weather icon
  - ✓ Should show location indicator when multiple locations
  - ✓ Should hide indicator with single location
  - ✓ Should display correct current index (e.g., "2 / 3")

- **Swipe Gestures**
  - ✓ Should trigger next location on swipe left
  - ✓ Should trigger previous location on swipe right
  - ✓ Should show bounce animation with single location
  - ✓ Should prevent swipe during transition
  - ✓ Should wrap around (last → first, first → last)
  - ✓ Should not swipe if dx < 50px threshold

- **Animation State**
  - ✓ Should reset pan position on location change
  - ✓ Should set isTransitioning during animation
  - ✓ Should clear isTransitioning after completion

#### `src/screens/__tests__/SettingsScreen.test.tsx`
Test cases:
- ✓ Should render all sections (Units, Language, Locations)
- ✓ Should display GPS location with pin emoji
- ✓ Should show delete button only for non-GPS locations
- ✓ Should disable add button when max locations reached
- ✓ Should show location count "(5/5)" when maxed
- ✓ Should call onClose when backdrop tapped
- ✓ Should animate slide in/out

#### `src/screens/__tests__/AddLocationScreen.test.tsx`
Test cases:
- ✓ Should show "Start typing" message initially
- ✓ Should debounce search by 300ms
- ✓ Should show loading indicator while searching
- ✓ Should display search results
- ✓ Should show "No results" message
- ✓ Should call addLocation on city select
- ✓ Should show error when max locations reached
- ✓ Should clear search state on close

#### `src/components/__tests__/LanguageSelector.test.tsx`
Test cases:
- ✓ Should render current language
- ✓ Should expand dropdown on press
- ✓ Should show checkmark for selected language
- ✓ Should call setLanguage on selection
- ✓ Should collapse dropdown after selection

### 5. Integration Tests

#### `src/__tests__/App.integration.test.tsx`
Test cases:
- **Location Flow**
  - ✓ Should fetch GPS location on mount
  - ✓ Should update GPS location in store
  - ✓ Should extract clean city name from geocode
  - ✓ Should handle GPS permission denied

- **Modal Management**
  - ✓ Should open settings modal
  - ✓ Should open location dropdown
  - ✓ Should open add location from settings
  - ✓ Should close all modals on app background

- **Weather Data Fetching**
  - ✓ Should fetch weather for active location
  - ✓ Should use React Query cache for 30 min
  - ✓ Should refetch on active location change
  - ✓ Should show placeholder data during switch

### 6. Mock Implementations

#### Required Mocks
```typescript
// __mocks__/expo-location.ts
// Mock Location.requestForegroundPermissionsAsync
// Mock Location.getCurrentPositionAsync
// Mock Location.reverseGeocodeAsync

// __mocks__/@react-native-async-storage/async-storage.ts
// Use official jest mock

// __mocks__/react-native-localization-settings.ts
// Mock getLocales() for language detection

// __mocks__/react-native-reanimated.ts
// Use official reanimated mock
```

### 7. Test Utilities

#### Create Test Helpers
```typescript
// src/utils/test-utils.tsx
// - Custom render function with providers
// - Mock Zustand stores
// - Mock React Query client
// - Wait for async updates helper
```

## Implementation Steps

1. **Phase 1: Infrastructure** (1-2 hours)
   - Install dependencies
   - Configure Jest
   - Set up mocks for native modules
   - Create test utilities

2. **Phase 2: Store Tests** (2-3 hours)
   - Test all 4 Zustand stores
   - Focus on business logic and persistence
   - Achieve 100% coverage for stores

3. **Phase 3: Utility Tests** (1-2 hours)
   - Test geocoding functions
   - Mock fetch calls
   - Test edge cases (empty results, errors)

4. **Phase 4: Component Tests** (3-4 hours)
   - Test critical components (CurrentWeatherCard, Settings, AddLocation)
   - Mock gestures and animations
   - Test user interactions

5. **Phase 5: Integration Tests** (2-3 hours)
   - Test full user flows
   - Test modal navigation
   - Test GPS + weather fetching

6. **Phase 6: CI/CD Integration** (1 hour)
   - Add GitHub Actions workflow
   - Run tests on PR
   - Add coverage reporting

## Coverage Goals

| Area | Target Coverage |
|------|----------------|
| Stores | 100% |
| Utilities | 95% |
| Components | 80% |
| Screens | 75% |
| Integration | Key flows covered |

## Success Criteria

- [ ] All store actions have unit tests
- [ ] Swipe gesture logic is tested
- [ ] Duplicate location detection is validated
- [ ] Max location limit is enforced in tests
- [ ] GPS fallback behavior is tested
- [ ] API error handling is verified
- [ ] Tests run in CI/CD pipeline
- [ ] Coverage report generated
- [ ] All tests pass on first run

## Estimated Effort
**10-15 hours** total across all phases

## Files to Create
- `jest.config.js`
- `src/setupTests.ts`
- `src/utils/test-utils.tsx`
- `src/store/__tests__/useLocationStore.test.ts`
- `src/store/__tests__/useSettingsStore.test.ts`
- `src/store/__tests__/useLanguageStore.test.ts`
- `src/store/__tests__/useModalStore.test.ts`
- `src/utils/__tests__/geocoding.test.ts`
- `src/components/__tests__/CurrentWeatherCard.test.tsx`
- `src/screens/__tests__/SettingsScreen.test.tsx`
- `src/screens/__tests__/AddLocationScreen.test.tsx`
- `src/components/__tests__/LanguageSelector.test.tsx`
- `src/__tests__/App.integration.test.tsx`
- `__mocks__/expo-location.ts`
- `__mocks__/react-native-localization-settings.ts`
- `.github/workflows/test.yml` (if CI/CD needed)

## Dependencies
- None - can be implemented immediately after PR #27 merges

## References
- [React Native Testing Library Docs](https://callstack.github.io/react-native-testing-library/)
- [Jest Expo Guide](https://docs.expo.dev/develop/unit-testing/)
- [Zustand Testing Guide](https://docs.pmnd.rs/zustand/guides/testing)
