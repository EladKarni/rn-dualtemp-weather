# Plan: Remove Production Console Logs

## Overview
Remove debug console.log statements from production code or wrap them in `__DEV__` checks to improve performance and reduce app size.

## Priority
**Medium** - Console logs in production are unprofessional and can leak sensitive info

## Current State

### Console Logs Found

#### 1. Location Store Debug Logs
**File**: `src/store/useLocationStore.ts`
- **Lines 94-97**: Active location change debugging
  ```typescript
  console.log('[LocationStore] setActiveLocation called with id:', id);
  console.log('[LocationStore] Current activeLocationId before set:', get().activeLocationId);
  // ... set operation ...
  console.log('[LocationStore] activeLocationId after set:', get().activeLocationId);
  ```

#### 2. CurrentWeather Component Debug Logs
**File**: `src/components/CurrentWeatherCard/CurrentWeatherCard.tsx`
- **Line 33**: Location ID change tracking
  ```typescript
  console.log('[CurrentWeather] activeLocationId changed to:', activeLocationId);
  ```
- **Lines 51-57**: Swipe gesture debugging (in handleSwipe)
  ```typescript
  console.log('handleSwipe called:', direction);
  console.log('savedLocations count:', freshLocations.length);
  console.log('currentIndex:', freshCurrentIndex);
  console.log('Current activeLocationId (FRESH):', freshActiveId);
  console.log('Only one location - showing bounce animation');
  console.log('nextIndex:', nextIndex);
  console.log('nextLocation:', nextLocation);
  console.log('Animation complete - changing location to:', nextLocation.id);
  console.log('Slide in complete');
  ```

#### 3. Error Handling Logs (Keep These)
**Files**: Various
- `src/screens/AddLocationScreen.tsx:94` - `console.error("Search error:", err)` ✅ Keep
- `src/utils/geocoding.ts:29` - `console.error("Error searching cities:", error)` ✅ Keep
- `src/utils/geocoding.ts:63` - `console.error("Error getting city coordinates:", error)` ✅ Keep
- `App.tsx:95` - `console.error("Error fetching GPS location:", error)` ✅ Keep

**Note**: `console.error` and `console.warn` should be kept as they indicate actual problems.

## Solution

### Approach 1: Remove Entirely (Recommended)
Remove debug logs that were used during development but provide no value in production.

### Approach 2: Conditional Logging
For logs that might be useful for debugging during development, wrap in `__DEV__` checks:
```typescript
if (__DEV__) {
  console.log('[Debug]', ...);
}
```

### Approach 3: Custom Logger Utility
Create a debug logger that respects environment:
```typescript
// src/utils/logger.ts
export const debug = (...args: any[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};
```

## Implementation Plan

### Step 1: Create Logger Utility (Approach 3 - Best Practice)

**File**: `src/utils/logger.ts`

```typescript
/**
 * Custom logger that only outputs in development mode.
 * Use this instead of console.log for debugging.
 */

const PREFIX = '[RN-Weather]';

export const logger = {
  /**
   * Debug-level logging (only in dev)
   * Use for verbose debugging info
   */
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.log(PREFIX, '[DEBUG]', ...args);
    }
  },

  /**
   * Info-level logging (only in dev)
   * Use for general information
   */
  info: (...args: any[]) => {
    if (__DEV__) {
      console.info(PREFIX, '[INFO]', ...args);
    }
  },

  /**
   * Warning-level logging (always shown)
   * Use for recoverable issues
   */
  warn: (...args: any[]) => {
    console.warn(PREFIX, '[WARN]', ...args);
  },

  /**
   * Error-level logging (always shown)
   * Use for exceptions and failures
   */
  error: (...args: any[]) => {
    console.error(PREFIX, '[ERROR]', ...args);
  },

  /**
   * Trace function execution (only in dev)
   * Useful for tracking function calls
   */
  trace: (functionName: string, ...args: any[]) => {
    if (__DEV__) {
      console.log(PREFIX, `[TRACE] ${functionName}`, ...args);
    }
  },

  /**
   * Group logs together (only in dev)
   */
  group: (label: string) => {
    if (__DEV__) {
      console.group(PREFIX, label);
    }
  },

  groupEnd: () => {
    if (__DEV__) {
      console.groupEnd();
    }
  },
};

// Export individual functions for convenience
export const { debug, info, warn, error, trace } = logger;
```

**Type Definitions** (if using TypeScript strict mode):
```typescript
// Add to tsconfig.json compilerOptions
"types": ["react-native"]

// This provides __DEV__ type globally
```

### Step 2: Replace Console Logs in Location Store

**File**: `src/store/useLocationStore.ts`

**Before** (lines 93-98):
```typescript
setActiveLocation: (id) => {
  console.log('[LocationStore] setActiveLocation called with id:', id);
  console.log('[LocationStore] Current activeLocationId before set:', get().activeLocationId);
  set({ activeLocationId: id });
  console.log('[LocationStore] activeLocationId after set:', get().activeLocationId);
},
```

**After**:
```typescript
setActiveLocation: (id) => {
  logger.trace('LocationStore.setActiveLocation', {
    newId: id,
    currentId: get().activeLocationId
  });
  set({ activeLocationId: id });
},
```

### Step 3: Replace Console Logs in CurrentWeatherCard

**File**: `src/components/CurrentWeatherCard/CurrentWeatherCard.tsx`

**Import at top**:
```typescript
import { logger } from '../../utils/logger';
```

**Before** (line 33):
```typescript
console.log('[CurrentWeather] activeLocationId changed to:', activeLocationId);
```

**After**:
```typescript
logger.debug('CurrentWeather: activeLocationId changed to:', activeLocationId);
```

**Before** (lines 51-92):
```typescript
const handleSwipe = (direction: 'next' | 'prev') => {
  const { savedLocations: freshLocations, activeLocationId: freshActiveId, setActiveLocation: freshSetActive } = storeRef.current;

  console.log('handleSwipe called:', direction);
  console.log('savedLocations count:', freshLocations.length);
  // ... more logs ...
```

**After**:
```typescript
const handleSwipe = (direction: 'next' | 'prev') => {
  const { savedLocations: freshLocations, activeLocationId: freshActiveId, setActiveLocation: freshSetActive } = storeRef.current;

  logger.group(`CurrentWeather.handleSwipe(${direction})`);
  logger.debug('Locations count:', freshLocations.length);
  logger.debug('Current index:', freshCurrentIndex);
  logger.debug('Active location:', freshActiveId);

  // ... existing logic ...

  if (!freshHasMultiple) {
    logger.debug('Single location - showing bounce animation');
    // ... bounce animation ...
    logger.groupEnd();
    return;
  }

  logger.debug('Next index:', nextIndex);
  logger.debug('Next location:', nextLocation);

  // ... animation logic ...

  logger.groupEnd();
};
```

### Step 4: Update Error Logs to Use Logger

**Files**: Various (for consistency)

**Before**:
```typescript
console.error("Error searching cities:", error);
```

**After**:
```typescript
logger.error("Error searching cities:", error);
```

This ensures consistent formatting and makes it easier to add error tracking later.

### Step 5: Add ESLint Rule (Optional but Recommended)

**File**: `.eslintrc.js` or `eslintrc.json`

```json
{
  "rules": {
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error"]
      }
    ]
  }
}
```

This will:
- Warn on `console.log()` usage
- Allow `console.warn()` and `console.error()`
- Encourage use of logger utility

**Install ESLint if not present**:
```bash
yarn add -D eslint @react-native-community/eslint-config
```

### Step 6: Search for Any Other Console Logs

Run comprehensive search:
```bash
# Search for all console usage
grep -r "console\." src/ --include="*.ts" --include="*.tsx" -n

# Exclude node_modules and specific allowed patterns
grep -r "console\.log\|console\.info\|console\.debug" src/ --include="*.ts" --include="*.tsx" -n
```

Review each occurrence and decide:
- Remove if not needed
- Convert to `logger.debug()` if useful for dev
- Keep if it's `console.error()` or `console.warn()`

### Step 7: Update Tests (if logger is mocked)

**File**: `src/utils/__tests__/logger.test.ts` (new)

```typescript
import { logger } from '../logger';

// Mock console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log debug messages only in DEV mode', () => {
    // @ts-ignore - Temporarily override __DEV__
    global.__DEV__ = true;
    logger.debug('test message');
    expect(consoleLogSpy).toHaveBeenCalled();

    jest.clearAllMocks();

    // @ts-ignore
    global.__DEV__ = false;
    logger.debug('test message');
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should always log errors', () => {
    // @ts-ignore
    global.__DEV__ = false;
    logger.error('error message');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should include prefix in logs', () => {
    // @ts-ignore
    global.__DEV__ = true;
    logger.debug('test');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[RN-Weather]',
      '[DEBUG]',
      'test'
    );
  });
});
```

## Verification Steps

### 1. Development Build
```bash
# Start dev server
yarn start

# In Metro console, you should see formatted debug logs with [RN-Weather] prefix
```

### 2. Production Build
```bash
# Create release build (Android)
cd android && ./gradlew assembleRelease

# Create release build (iOS)
cd ios && xcodebuild -scheme YourApp -configuration Release

# Debug logs should NOT appear in production builds
# Error logs should still appear
```

### 3. Bundle Size Check
```bash
# Analyze bundle (if using Expo)
npx expo export --platform ios --output-dir dist
npx expo export --platform android --output-dir dist

# Compare bundle size before/after
# Should see small reduction (~1-2KB from removed strings)
```

### 4. Manual Testing
- Run app in dev mode
- Check Metro logs show debug output
- Trigger error scenarios
- Verify errors still log correctly

## Benefits

### Performance
- **Reduced bundle size**: ~1-2KB smaller (string removal)
- **Runtime performance**: No string concatenation in production
- **Memory**: Fewer objects created for logging

### Developer Experience
- **Consistent formatting**: All logs have `[RN-Weather]` prefix
- **Easy filtering**: Can filter Metro logs by prefix
- **Searchable**: `logger.debug` easier to find than `console.log`
- **Type-safe**: Can add TypeScript interfaces for structured logging

### Production Quality
- **Professional**: No debug noise in release builds
- **Security**: No accidental data leaks in logs
- **Maintainable**: Single place to update logging behavior

## Future Enhancements

### 1. Remote Logging (Optional)
Add Sentry/Crashlytics integration:
```typescript
export const logger = {
  error: (...args: any[]) => {
    console.error(PREFIX, '[ERROR]', ...args);

    // Send to Sentry in production
    if (!__DEV__) {
      Sentry.captureException(new Error(args.join(' ')));
    }
  },
};
```

### 2. Log Levels Configuration
```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// Configure via AsyncStorage or config
const currentLogLevel = LogLevel.INFO;
```

### 3. Performance Logging
```typescript
export const performance = {
  mark: (label: string) => {
    if (__DEV__) {
      console.time(label);
    }
  },
  measure: (label: string) => {
    if (__DEV__) {
      console.timeEnd(label);
    }
  },
};
```

## Success Criteria

- [ ] All `console.log` replaced with `logger.debug`
- [ ] All `console.error` replaced with `logger.error`
- [ ] Logger utility created and tested
- [ ] ESLint rule added to prevent future console.log usage
- [ ] Dev mode shows all debug logs
- [ ] Production build has no debug logs
- [ ] Error logs still work in production
- [ ] Bundle size reduced (even if minimal)

## Estimated Effort
**2-3 hours**
- 1 hour: Create logger utility + tests
- 30 min: Replace all console.log instances
- 30 min: Add ESLint rule
- 30 min: Testing & verification

## Files to Create/Modify

**New Files**:
- `src/utils/logger.ts`
- `src/utils/__tests__/logger.test.ts`

**Modified Files**:
- `src/store/useLocationStore.ts`
- `src/components/CurrentWeatherCard/CurrentWeatherCard.tsx`
- `src/screens/AddLocationScreen.tsx` (if updating console.error)
- `src/utils/geocoding.ts` (if updating console.error)
- `App.tsx` (if updating console.error/warn)
- `.eslintrc.js` (or create if doesn't exist)

## Dependencies
- None - uses built-in JavaScript features
- Optional: ESLint for linting

## Backward Compatibility
- Fully compatible
- No breaking changes
- All existing logs continue to work in dev mode
