# Plan: Add Testing to Weather App

## Goal
Add minimal, maintainable test coverage for critical paths. Start simple, expand later.

## Phase 1: Setup Jest & Testing Infrastructure (Day 1)

### 1.1 Install Dependencies
```bash
yarn add -D jest @testing-library/react-native @testing-library/jest-native
yarn add -D @types/jest ts-jest
```

### 1.2 Create Jest Configuration
**File**: `jest.config.js`

```js
module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@sentry)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.styles.ts',
    '!src/**/*.d.ts',
  ],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
};
```

### 1.3 Create Setup File
**File**: `jest.setup.js`

```js
import '@testing-library/jest-native/extend-expect';

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (component) => component,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      sentryDsn: null,
    },
  },
}));
```

### 1.4 Add Scripts to package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Estimated Time**: 1 hour

## Phase 2: Utility Function Tests (Day 1-2)

### 2.1 Test Custom Error Classes
**File**: `src/utils/__tests__/errors.test.ts`

```typescript
import {
  AuthenticationError,
  RateLimitError,
  ServerError,
  toAppError,
} from '../errors';

describe('Custom Errors', () => {
  it('creates AuthenticationError with correct message', () => {
    const error = new AuthenticationError();
    expect(error.name).toBe('AuthenticationError');
    expect(error.userMessage).toContain('API');
  });

  it('creates RateLimitError with retry info', () => {
    const error = new RateLimitError(60);
    expect(error.retryAfter).toBe(60);
  });

  it('creates ServerError with status code', () => {
    const error = new ServerError(503);
    expect(error.statusCode).toBe(503);
  });

  it('converts generic errors to AppError', () => {
    const error = new Error('Network failed');
    const appError = toAppError(error);
    expect(appError.userMessage).toBeDefined();
  });
});
```

**Estimated Time**: 30 minutes

### 2.2 Test Logger (without Sentry calls)
**File**: `src/utils/__tests__/logger.test.ts`

```typescript
import { logger } from '../logger';
import * as Sentry from '@sentry/react-native';

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs debug messages in dev mode', () => {
    const spy = jest.spyOn(console, 'log');
    logger.debug('test message');
    expect(spy).toHaveBeenCalledWith(
      '[RN-Weather]',
      '[DEBUG]',
      'test message'
    );
  });

  it('sends exceptions to Sentry', () => {
    const error = new Error('Test error');
    logger.exception(error, { tags: { test: 'tag' } });

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: expect.objectContaining({ test: 'tag' }),
      })
    );
  });
});
```

**Estimated Time**: 30 minutes

### 2.3 Test Location Name Parser
**File**: `src/utils/__tests__/locationNameParser.test.ts`

```typescript
import { parseLocationName } from '../locationNameParser';

describe('Location Name Parser', () => {
  it('parses city name correctly', () => {
    const result = parseLocationName({
      name: 'New York',
      local_names: { en: 'New York' },
      country: 'US',
      state: 'New York',
    });
    expect(result).toBe('New York');
  });

  it('handles missing data gracefully', () => {
    const result = parseLocationName({
      name: 'Unknown',
      country: 'XX',
    });
    expect(result).toBe('Unknown');
  });

  it('prefers local name over default', () => {
    const result = parseLocationName({
      name: 'Moskva',
      local_names: { en: 'Moscow' },
      country: 'RU',
    });
    expect(result).toBe('Moscow');
  });
});
```

**Estimated Time**: 30 minutes

## Phase 3: Store Tests (Day 2)

### 3.1 Test Location Store
**File**: `src/store/__tests__/useLocationStore.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useLocationStore } from '../useLocationStore';

describe('useLocationStore', () => {
  beforeEach(() => {
    // Reset store
    useLocationStore.setState({
      savedLocations: [],
      activeLocationId: null,
    });
  });

  it('adds a location', () => {
    const { result } = renderHook(() => useLocationStore());

    act(() => {
      result.current.addLocation({
        id: '1',
        name: 'New York',
        latitude: 40.7128,
        longitude: -74.006,
        isGPS: false,
      });
    });

    expect(result.current.savedLocations).toHaveLength(1);
    expect(result.current.savedLocations[0].name).toBe('New York');
  });

  it('removes a location', () => {
    const { result } = renderHook(() => useLocationStore());

    act(() => {
      result.current.addLocation({
        id: '1',
        name: 'New York',
        latitude: 40.7128,
        longitude: -74.006,
        isGPS: false,
      });
      result.current.removeLocation('1');
    });

    expect(result.current.savedLocations).toHaveLength(0);
  });

  it('enforces max 5 locations limit', () => {
    const { result } = renderHook(() => useLocationStore());

    // Add 5 locations
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.addLocation({
          id: `${i}`,
          name: `City ${i}`,
          latitude: 0,
          longitude: 0,
          isGPS: false,
        });
      });
    }

    expect(result.current.canAddMoreLocations()).toBe(false);
  });
});
```

**Estimated Time**: 1 hour

## Phase 4: Component Tests (Day 3)

### 4.1 Test Simple Components
**File**: `src/components/__tests__/GearIcon.test.tsx`

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import GearIcon from '../GearIcon/GearIcon';

describe('GearIcon', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<GearIcon size={24} color="#fff" />);
    // Add testID to component for this to work
  });

  it('uses correct size prop', () => {
    const { getByTestId } = render(<GearIcon size={32} color="#fff" />);
    const svg = getByTestId('gear-icon');
    expect(svg.props.width).toBe(32);
    expect(svg.props.height).toBe(32);
  });
});
```

**Estimated Time**: 1 hour

### 4.2 Test Temperature Unit Selector
**File**: `src/components/__tests__/TempUnitSelector.test.tsx`

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TempUnitSelector } from '../TempUnitSelector/TempUnitSelector';
import { useSettingsStore } from '../../store/useSettingsStore';

describe('TempUnitSelector', () => {
  beforeEach(() => {
    useSettingsStore.setState({ tempScale: 'C' });
  });

  it('displays current temperature unit', () => {
    const { getByText } = render(<TempUnitSelector />);
    expect(getByText('C')).toBeDefined();
  });

  it('toggles temperature unit on press', () => {
    const { getByTestId } = render(<TempUnitSelector />);
    const button = getByTestId('temp-unit-button');

    fireEvent.press(button);

    const store = useSettingsStore.getState();
    expect(store.tempScale).toBe('F');
  });
});
```

**Estimated Time**: 1 hour

## Phase 5: Integration Tests (Day 4)

### 5.1 Test Weather Fetching Logic
**File**: `src/utils/__tests__/fetchWeather.test.ts`

```typescript
import { fetchForecast } from '../fetchWeather';
import { AuthenticationError, ServerError } from '../errors';

// Mock fetch
global.fetch = jest.fn();

describe('fetchForecast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches weather data successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current: { temp: 20 } }),
    });

    const result = await fetchForecast('en', 40.7128, -74.006);

    expect(result).toEqual({ current: { temp: 20 } });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('lat=40.7128')
    );
  });

  it('throws AuthenticationError on 401', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    await expect(
      fetchForecast('en', 40.7128, -74.006)
    ).rejects.toThrow(AuthenticationError);
  });

  it('throws ServerError on 500', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' }),
    });

    await expect(
      fetchForecast('en', 40.7128, -74.006)
    ).rejects.toThrow(ServerError);
  });
});
```

**Estimated Time**: 1 hour

## Testing Strategy

### What to Test (Priority Order)

**High Priority** (Week 1):
1. ✅ Custom error classes
2. ✅ Logger utility
3. ✅ Location stores
4. ✅ Weather fetching

**Medium Priority** (Week 2):
5. Simple components (GearIcon, SettingItem)
6. Settings store
7. Location name parser
8. Geocoding utility

**Low Priority** (Later):
9. Complex components (Settings screen)
10. Custom hooks
11. Screen integration tests

### What NOT to Test

❌ Third-party libraries (Sentry, React Query)
❌ Styling (Styles.ts files)
❌ Type definitions
❌ Constants

## Coverage Goals

- **Phase 1**: 20% coverage (utilities only)
- **Phase 2**: 40% coverage (+ stores)
- **Phase 3**: 60% coverage (+ components)
- **Phase 4**: 80% coverage (+ hooks)

## Quick Start Checklist

```bash
# 1. Install dependencies
yarn add -D jest @testing-library/react-native @testing-library/jest-native @types/jest ts-jest

# 2. Create config files
touch jest.config.js jest.setup.js

# 3. Create first test directory
mkdir -p src/utils/__tests__

# 4. Create first test
touch src/utils/__tests__/errors.test.ts

# 5. Run tests
yarn test
```

## Success Metrics

- ✅ Tests run in < 30 seconds
- ✅ Zero flaky tests
- ✅ All critical paths covered
- ✅ Tests document expected behavior
- ✅ Easy to add new tests

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module 'react-native'`
**Fix**: Add to `transformIgnorePatterns` in jest.config.js

**Issue**: `AsyncStorage not mocked`
**Fix**: Add mock to jest.setup.js

**Issue**: `Sentry errors in tests`
**Fix**: Mock Sentry in jest.setup.js

## Next Steps

1. Copy jest.config.js and jest.setup.js from above
2. Install dependencies: `yarn add -D jest @testing-library/react-native`
3. Create first test file: `src/utils/__tests__/errors.test.ts`
4. Run: `yarn test`
5. Add more tests incrementally

## Maintenance

- Run tests before every commit: `yarn test`
- Update snapshots carefully: `yarn test -u`
- Fix failing tests immediately
- Aim for 1 test per bug fix
- Review test coverage monthly: `yarn test:coverage`
