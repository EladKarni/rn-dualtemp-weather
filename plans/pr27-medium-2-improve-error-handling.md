# Plan: Improve Error Handling & User Feedback

## Overview
Enhance error handling for GPS location failures and geocoding API errors with proper user-facing messages and recovery options.

## Priority
**Medium** - Current implementation silently fails, leaving users confused

## Current Issues

### 1. GPS Location Failures
**File**: `App.tsx:68-99`

**Current Behavior**:
```typescript
try {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    console.warn("Location permission not granted");
    return;  // ❌ Silent failure - no user feedback
  }

  const location = await Location.getCurrentPositionAsync({});
  // ... process location ...
} catch (error) {
  console.error("Error fetching GPS location:", error);  // ❌ Only logs to console
}
```

**Problems**:
- User sees blank/stuck screen if GPS fails
- No prompt to retry
- No option to manually select location
- Permission denial is silent

### 2. Geocoding API Failures
**File**: `src/utils/geocoding.ts:17-31`

**Current Behavior**:
```typescript
try {
  const response = await fetch(...);

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);  // ❌ Generic message
  }

  const data = await response.json();
  return data as CityResult[];
} catch (error) {
  console.error("Error searching cities:", error);  // ❌ Silent failure
  throw error;  // Re-throws but no user-friendly message
}
```

**Problems**:
- Generic error messages
- No distinction between network errors vs API errors
- User doesn't know if they should retry

### 3. Search Error Display
**File**: `src/screens/AddLocationScreen.tsx:93-96`

**Current Behavior**:
```typescript
catch (err) {
  console.error("Search error:", err);
  setError(i18n.t("SearchError"));  // ❌ Always same generic message
  setSearchResults([]);
}
```

**Problems**:
- All errors show same message: "Failed to search. Try again."
- No guidance on what went wrong
- No distinction between user errors vs system errors

## Solution Architecture

### Error Types Hierarchy

```
AppError (base)
├── NetworkError
│   ├── NoConnectionError
│   └── TimeoutError
├── LocationError
│   ├── PermissionDeniedError
│   ├── LocationUnavailableError
│   └── PositionTimeoutError
├── ApiError
│   ├── RateLimitError (429)
│   ├── ServerError (500+)
│   ├── NotFoundError (404)
│   └── BadRequestError (400)
└── UserError
    ├── InvalidInputError
    └── DuplicateLocationError
```

## Implementation Plan

### Step 1: Create Error Classes

**File**: `src/utils/errors.ts`

```typescript
/**
 * Base error class for the application
 */
export class AppError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      userMessage || 'Unable to connect to the internet',
      'NETWORK_ERROR',
      true
    );
  }
}

export class NoConnectionError extends NetworkError {
  constructor() {
    super(
      'No internet connection',
      'No internet connection. Please check your network settings.'
    );
    this.code = 'NO_CONNECTION';
  }
}

export class TimeoutError extends NetworkError {
  constructor() {
    super(
      'Request timed out',
      'The request took too long. Please try again.'
    );
    this.code = 'TIMEOUT';
  }
}

/**
 * Location/GPS errors
 */
export class LocationError extends AppError {
  constructor(message: string, userMessage: string, code: string) {
    super(message, userMessage, code, true);
  }
}

export class PermissionDeniedError extends LocationError {
  constructor() {
    super(
      'Location permission denied',
      'Location access is required. Please enable it in your device settings.',
      'PERMISSION_DENIED'
    );
    this.recoverable = false; // Requires user action in settings
  }
}

export class LocationUnavailableError extends LocationError {
  constructor() {
    super(
      'Location unavailable',
      'Unable to determine your location. Make sure GPS is enabled.',
      'LOCATION_UNAVAILABLE'
    );
  }
}

export class PositionTimeoutError extends LocationError {
  constructor() {
    super(
      'Location timeout',
      'Finding your location is taking too long. Please try again.',
      'POSITION_TIMEOUT'
    );
  }
}

/**
 * API-related errors
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    public statusCode: number,
    userMessage?: string
  ) {
    super(
      message,
      userMessage || 'An error occurred while fetching data',
      `API_ERROR_${statusCode}`,
      statusCode >= 500 // Server errors are recoverable (retry)
    );
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    const message = retryAfter
      ? `Too many requests. Please wait ${retryAfter} seconds.`
      : 'Too many requests. Please slow down and try again.';

    super('Rate limit exceeded', 429, message);
    this.code = 'RATE_LIMIT';
  }
}

export class ServerError extends ApiError {
  constructor(statusCode: number) {
    super(
      `Server error: ${statusCode}`,
      statusCode,
      'Our servers are experiencing issues. Please try again in a moment.'
    );
    this.code = 'SERVER_ERROR';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(
      `${resource} not found`,
      404,
      `${resource} was not found. Please check and try again.`
    );
    this.code = 'NOT_FOUND';
    this.recoverable = false;
  }
}

export class BadRequestError extends ApiError {
  constructor(details?: string) {
    super(
      'Bad request',
      400,
      details || 'Invalid request. Please check your input and try again.'
    );
    this.code = 'BAD_REQUEST';
    this.recoverable = false;
  }
}

/**
 * User input errors
 */
export class UserError extends AppError {
  constructor(message: string, userMessage: string, code: string) {
    super(message, userMessage, code, false);
  }
}

export class InvalidInputError extends UserError {
  constructor(field: string) {
    super(
      `Invalid input: ${field}`,
      `Please enter a valid ${field}.`,
      'INVALID_INPUT'
    );
  }
}

export class DuplicateLocationError extends UserError {
  constructor() {
    super(
      'Duplicate location',
      'This location has already been added.',
      'DUPLICATE_LOCATION'
    );
  }
}

/**
 * Error factory to convert unknown errors to AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NoConnectionError();
  }

  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return new TimeoutError();
    }
    if (error.message.includes('network')) {
      return new NetworkError(error.message);
    }

    // Generic fallback
    return new AppError(
      error.message,
      'An unexpected error occurred. Please try again.',
      'UNKNOWN_ERROR',
      true
    );
  }

  return new AppError(
    'Unknown error',
    'Something went wrong. Please try again.',
    'UNKNOWN_ERROR',
    true
  );
}
```

### Step 2: Create Error Alert Component

**File**: `src/components/ErrorAlert/ErrorAlert.tsx`

```typescript
import React from 'react';
import { Alert, Platform } from 'react-native';
import { AppError } from '../../utils/errors';
import { i18n } from '../../localization/i18n';

interface ErrorAlertOptions {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  onOpenSettings?: () => void;
}

export const showErrorAlert = ({
  error,
  onRetry,
  onDismiss,
  onOpenSettings,
}: ErrorAlertOptions) => {
  const buttons: any[] = [];

  // Add retry button for recoverable errors
  if (error.recoverable && onRetry) {
    buttons.push({
      text: i18n.t('Retry'),
      onPress: onRetry,
      style: 'default',
    });
  }

  // Add settings button for permission errors
  if (error.code === 'PERMISSION_DENIED' && onOpenSettings) {
    buttons.push({
      text: i18n.t('OpenSettings'),
      onPress: onOpenSettings,
      style: 'default',
    });
  }

  // Always add dismiss/cancel button
  buttons.push({
    text: i18n.t(buttons.length > 0 ? 'Cancel' : 'OK'),
    onPress: onDismiss,
    style: 'cancel',
  });

  Alert.alert(
    i18n.t('Error'),
    error.userMessage,
    buttons,
    { cancelable: false }
  );
};

/**
 * Opens device settings (for permission errors)
 */
export const openDeviceSettings = async () => {
  const { Linking } = require('react-native');

  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else {
    await Linking.openSettings();
  }
};
```

**File**: `src/components/ErrorAlert/ErrorBanner.tsx` (inline errors)

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppError } from '../../utils/errors';
import { i18n } from '../../localization/i18n';
import { palette } from '../../Styles/Palette';

interface ErrorBannerProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.message}>{error.userMessage}</Text>
      </View>
      <View style={styles.actions}>
        {error.recoverable && onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>{i18n.t('Retry')}</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FF453A',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  message: {
    flex: 1,
    color: palette.textColor,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: palette.highlightColor,
    borderRadius: 6,
    marginRight: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dismissText: {
    color: palette.textColor,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
```

### Step 3: Update GPS Location Handling

**File**: `App.tsx` (modify fetchGPS function)

```typescript
import {
  PermissionDeniedError,
  LocationUnavailableError,
  PositionTimeoutError,
  toAppError
} from './src/utils/errors';
import { showErrorAlert, openDeviceSettings } from './src/components/ErrorAlert/ErrorAlert';

// Add state
const [gpsError, setGpsError] = useState<AppError | null>(null);

// Update fetchGPS function
useEffect(() => {
  const fetchGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        const error = new PermissionDeniedError();
        setGpsError(error);

        showErrorAlert({
          error,
          onOpenSettings: openDeviceSettings,
          onDismiss: () => setGpsError(null),
        });

        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000, // 10 second timeout
      });

      const locationInfo = await Location.reverseGeocodeAsync(location.coords);

      // Extract clean city/town name
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

      setGpsError(null); // Clear any previous errors

    } catch (error: any) {
      let appError: AppError;

      // Map specific location errors
      if (error.code === 'E_LOCATION_UNAVAILABLE') {
        appError = new LocationUnavailableError();
      } else if (error.code === 'E_LOCATION_TIMEOUT') {
        appError = new PositionTimeoutError();
      } else {
        appError = toAppError(error);
      }

      setGpsError(appError);

      showErrorAlert({
        error: appError,
        onRetry: fetchGPS,
        onDismiss: () => setGpsError(null),
      });
    }
  };

  fetchGPS();
}, []);
```

### Step 4: Update Geocoding Error Handling

**File**: `src/utils/geocoding.ts`

```typescript
import {
  ApiError,
  ServerError,
  NotFoundError,
  BadRequestError,
  NetworkError,
  toAppError
} from './errors';

export const searchCities = async (query: string): Promise<CityResult[]> => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(
      `${base_url}search-cities?q=${encodeURIComponent(query.trim())}&limit=5`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Map HTTP status codes to specific errors
      if (response.status === 400) {
        throw new BadRequestError('Invalid search query');
      }
      if (response.status === 404) {
        throw new NotFoundError('Location');
      }
      if (response.status >= 500) {
        throw new ServerError(response.status);
      }

      throw new ApiError(`Search failed: ${response.status}`, response.status);
    }

    const data = await response.json();
    return data as CityResult[];

  } catch (error: any) {
    // Handle abort/timeout
    if (error.name === 'AbortError') {
      throw new TimeoutError();
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new NetworkError('Network request failed');
    }

    // Re-throw AppErrors as-is
    if (error instanceof AppError) {
      throw error;
    }

    // Convert unknown errors
    throw toAppError(error);
  }
};
```

### Step 5: Update AddLocationScreen Error Display

**File**: `src/screens/AddLocationScreen.tsx`

```typescript
import { AppError, toAppError } from '../utils/errors';
import { ErrorBanner } from '../components/ErrorAlert/ErrorBanner';

// Update state
const [error, setError] = useState<AppError | null>(null);

// Update search effect error handling
catch (err) {
  const appError = toAppError(err);
  setError(appError);
  setSearchResults([]);
}

// Update render to show ErrorBanner
const renderContent = () => {
  if (error) {
    return (
      <>
        <ErrorBanner
          error={error}
          onRetry={() => {
            setError(null);
            // Trigger search again
            setSearchQuery(searchQuery + ' '); // Hack to retrigger
            setTimeout(() => setSearchQuery(searchQuery.trim()), 0);
          }}
          onDismiss={() => setError(null)}
        />
        {/* Still show search results if available */}
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            renderItem={renderCityItem}
            {...otherProps}
          />
        )}
      </>
    );
  }

  // ... rest of render logic
};
```

### Step 6: Add Translations

**Files**: `src/localization/*.ts` (all languages)

Add to all translation files:
```typescript
// Error messages
Error: "Error",
Retry: "Retry",
OpenSettings: "Open Settings",
OK: "OK",

// Specific errors (for reference, not all used in alerts)
NoConnection: "No internet connection",
Timeout: "Request timed out",
PermissionDenied: "Location permission denied",
LocationUnavailable: "Location unavailable",
ServerError: "Server error",
DuplicateLocation: "Location already added",
```

### Step 7: Add Error Logging (Optional)

**File**: `src/utils/errorLogger.ts`

```typescript
import { AppError } from './errors';

/**
 * Log errors to console (dev) or analytics (production)
 */
export const logError = (error: AppError, context?: Record<string, any>) => {
  if (__DEV__) {
    console.error('[Error]', {
      name: error.name,
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      recoverable: error.recoverable,
      context,
      stack: error.stack,
    });
  } else {
    // In production, send to analytics
    // Example: Sentry.captureException(error, { extra: context });
  }
};
```

Use in error handlers:
```typescript
} catch (error) {
  const appError = toAppError(error);
  logError(appError, { location: 'AddLocationScreen', action: 'search' });
  setError(appError);
}
```

## Testing Strategy

### Unit Tests

**`src/utils/__tests__/errors.test.ts`**
- Each error class instantiation
- Error hierarchy (instanceof checks)
- toAppError conversion logic
- Error messages and codes

### Integration Tests

**`src/components/__tests__/ErrorAlert.test.tsx`**
- Alert shown with correct message
- Retry button appears for recoverable errors
- Settings button for permission errors
- Dismiss button always present

**`App.test.tsx`** (GPS error handling)
- Permission denied shows alert
- Location timeout retries
- Successful GPS updates state

**`AddLocationScreen.test.tsx`** (Search error handling)
- Network error shows banner
- Server error shows retry option
- Rate limit error displays correctly

### Manual Testing Checklist

- [ ] Deny location permission → See alert with "Open Settings" button
- [ ] Turn off GPS → See "Location unavailable" message
- [ ] Disconnect internet → Search shows "No connection" error
- [ ] Trigger API 500 error → See "Server error" with retry
- [ ] Add duplicate location → See "Already added" message
- [ ] Search invalid query → See appropriate error
- [ ] Retry after error → Should re-attempt operation

## Success Criteria

- [ ] All silent failures have user-facing messages
- [ ] Permission errors offer "Open Settings" option
- [ ] Network errors suggest retry
- [ ] Error messages are specific and actionable
- [ ] Errors are logged for debugging
- [ ] All error scenarios tested
- [ ] Translations added for all messages

## Estimated Effort
**4-6 hours**
- 2 hours: Create error classes and utilities
- 1 hour: Update GPS handling
- 1 hour: Update geocoding + AddLocationScreen
- 1 hour: Create ErrorAlert components
- 1 hour: Testing and translations

## Files to Create/Modify

**New Files**:
- `src/utils/errors.ts`
- `src/utils/errorLogger.ts`
- `src/utils/__tests__/errors.test.ts`
- `src/components/ErrorAlert/ErrorAlert.tsx`
- `src/components/ErrorAlert/ErrorBanner.tsx`
- `src/components/__tests__/ErrorAlert.test.tsx`

**Modified Files**:
- `App.tsx`
- `src/utils/geocoding.ts`
- `src/screens/AddLocationScreen.tsx`
- `src/localization/en.ts` (and all other language files)

## Dependencies
- None - uses built-in React Native features
- Optional: Sentry for error tracking in production

## Benefits

### User Experience
- Clear understanding of what went wrong
- Actionable steps to resolve issues
- Ability to retry failed operations
- No silent failures

### Developer Experience
- Consistent error handling patterns
- Type-safe error handling
- Easy to add new error types
- Better debugging with structured errors

### Maintainability
- Single source of truth for error messages
- Easy to update error copy
- Centralized error logging
- Testable error scenarios
