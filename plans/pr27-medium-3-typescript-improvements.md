# Plan: TypeScript Type Safety Improvements

## Overview
Replace `any` types with proper TypeScript interfaces and strengthen type safety across the codebase.

## Priority
**Medium** - Improves type safety and prevents runtime errors

## Current Issues

### 1. Modal Data Type Safety
**File**: `src/store/useModalStore.ts:7`

```typescript
interface ModalState {
  activeModal: ModalType;
  modalData?: any; // ❌ Unsafe - no type checking

  openLocationDropdown: () => void;
  openSettings: () => void;
  openAddLocation: (data?: any) => void; // ❌ Unsafe parameter
  closeModal: () => void;
}
```

**Problems**:
- `modalData` can be any shape
- No compile-time checks when accessing modal data
- Easy to pass wrong data shape
- No autocomplete for modal data fields

### 2. Potential Other `any` Usage

Need to search for other instances:
```bash
grep -r ": any" src/ --include="*.ts" --include="*.tsx"
grep -r "as any" src/ --include="*.ts" --include="*.tsx"
```

## Solution

### Type-Safe Modal Data with Discriminated Unions

Use TypeScript discriminated unions to enforce type safety based on modal type.

## Implementation Plan

### Step 1: Define Modal Data Types

**File**: `src/store/useModalStore.ts`

```typescript
/**
 * Data types for each modal
 */
interface LocationDropdownData {
  // Currently no data needed, but prepared for future
  highlightLocationId?: string;
}

interface SettingsScreenData {
  // Currently no data needed, but prepared for future
  openToSection?: 'units' | 'language' | 'locations';
}

interface AddLocationScreenData {
  // Could pre-fill search query or suggest location
  suggestedQuery?: string;
  source?: 'settings' | 'header' | 'empty-state';
}

/**
 * Discriminated union for modal state
 * Each modal type has its associated data type
 */
type ModalState =
  | { activeModal: null; modalData: undefined }
  | { activeModal: 'location'; modalData?: LocationDropdownData }
  | { activeModal: 'settings'; modalData?: SettingsScreenData }
  | { activeModal: 'addLocation'; modalData?: AddLocationScreenData };

/**
 * Type-safe actions
 */
interface ModalActions {
  openLocationDropdown: (data?: LocationDropdownData) => void;
  openSettings: (data?: SettingsScreenData) => void;
  openAddLocation: (data?: AddLocationScreenData) => void;
  closeModal: () => void;
}

/**
 * Combined store type
 */
type ModalStore = ModalState & ModalActions;
```

### Step 2: Update Store Implementation

**File**: `src/store/useModalStore.ts` (full implementation)

```typescript
import { create } from "zustand";

// Types defined above...

export const useModalStore = create<ModalStore>((set) => ({
  // Initial state
  activeModal: null,
  modalData: undefined,

  // Type-safe actions
  openLocationDropdown: (data) =>
    set({
      activeModal: 'location',
      modalData: data
    } as ModalState),

  openSettings: (data) =>
    set({
      activeModal: 'settings',
      modalData: data
    } as ModalState),

  openAddLocation: (data) =>
    set({
      activeModal: 'addLocation',
      modalData: data
    } as ModalState),

  closeModal: () =>
    set({
      activeModal: null,
      modalData: undefined
    } as ModalState),
}));
```

### Step 3: Create Type-Safe Hooks (Optional but Recommended)

**File**: `src/store/useModalStore.ts` (add at bottom)

```typescript
/**
 * Type-safe hook to get current modal data
 * Automatically narrows the type based on active modal
 */
export function useModalData<T extends ModalState['activeModal']>(
  modalType: T
): Extract<ModalState, { activeModal: T }>['modalData'] | undefined {
  return useModalStore((state) => {
    if (state.activeModal === modalType) {
      return state.modalData as Extract<ModalState, { activeModal: T }>['modalData'];
    }
    return undefined;
  });
}

/**
 * Example usage:
 *
 * // In AddLocationScreen component:
 * const data = useModalData('addLocation');
 * // data is typed as AddLocationScreenData | undefined
 * // TypeScript knows the shape!
 *
 * console.log(data?.suggestedQuery); // ✅ Autocomplete works
 * console.log(data?.invalidField);   // ❌ TypeScript error
 */
```

### Step 4: Update Component Usage

**File**: `src/screens/AddLocationScreen.tsx`

**Before**:
```typescript
type AddLocationScreenProps = {
  visible: boolean;
  onClose: () => void;
};

const AddLocationScreen = ({ visible, onClose }: AddLocationScreenProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  // No way to receive modal data
```

**After**:
```typescript
import { useModalData } from '../store/useModalStore';

type AddLocationScreenProps = {
  visible: boolean;
  onClose: () => void;
};

const AddLocationScreen = ({ visible, onClose }: AddLocationScreenProps) => {
  const modalData = useModalData('addLocation');

  const [searchQuery, setSearchQuery] = useState(
    modalData?.suggestedQuery || ""  // ✅ Type-safe access
  );

  // Log source for analytics
  useEffect(() => {
    if (visible && modalData?.source) {
      console.log('Add Location opened from:', modalData.source);
    }
  }, [visible, modalData]);

  // Rest of component...
```

**File**: `src/screens/SettingsScreen.tsx`

```typescript
import { useModalData } from '../store/useModalStore';
import { useRef, useEffect } from 'react';

const SettingsScreen = ({ visible, onClose, onAddLocationPress }: SettingsScreenProps) => {
  const modalData = useModalData('settings');
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to specific section if requested
  useEffect(() => {
    if (visible && modalData?.openToSection) {
      // Scroll to the requested section
      setTimeout(() => {
        // Implementation depends on layout
        // Could use refs to measure section positions
      }, 300);
    }
  }, [visible, modalData]);

  // Rest of component...
```

### Step 5: Update Callers to Use Type-Safe Data

**File**: `App.tsx`

**Before**:
```typescript
<AppHeader
  location={activeLocation?.name || "Loading..."}
  onLocationPress={openLocationDropdown}
  hasMultipleLocations={savedLocations.length > 0}
  onSettingsPress={openSettings}
/>
```

**After** (example with data):
```typescript
<AppHeader
  location={activeLocation?.name || "Loading..."}
  onLocationPress={() => openLocationDropdown({
    highlightLocationId: activeLocationId
  })}
  hasMultipleLocations={savedLocations.length > 0}
  onSettingsPress={() => openSettings({
    openToSection: 'units'
  })}
/>

{/* In some error state or empty state: */}
<Button
  onPress={() => openAddLocation({
    suggestedQuery: 'New York',
    source: 'empty-state'
  })}
>
  Add Your First Location
</Button>
```

### Step 6: Add Generic Type Utilities

**File**: `src/types/utils.ts` (new file)

```typescript
/**
 * Make specific keys required in a type
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make all properties optional except specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Extract non-nullable type
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Example usage:
 * type LocationWithCoords = RequireKeys<SavedLocation, 'latitude' | 'longitude'>;
 */
```

### Step 7: Strengthen Geocoding Types

**File**: `src/utils/geocoding.ts`

**Before**:
```typescript
export interface CityResult {
  name: string;
  local_names?: { [key: string]: string };
  lat: number;
  lon: number;
  country: string;
  state?: string;
}
```

**After** (add validation):
```typescript
export interface CityResult {
  name: string;
  local_names?: Record<string, string>; // More explicit than { [key: string]: string }
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

/**
 * Type guard to validate CityResult structure
 */
export function isCityResult(obj: unknown): obj is CityResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    typeof (obj as any).name === 'string' &&
    'lat' in obj &&
    typeof (obj as any).lat === 'number' &&
    'lon' in obj &&
    typeof (obj as any).lon === 'number' &&
    'country' in obj &&
    typeof (obj as any).country === 'string'
  );
}

/**
 * Runtime validation for API response
 */
export function validateCityResults(data: unknown): CityResult[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid response: expected array');
  }

  return data.filter(isCityResult);
}

// Use in searchCities:
const data = await response.json();
return validateCityResults(data); // ✅ Runtime validation
```

### Step 8: Add Strict TypeScript Config (Optional)

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    // Already enabled in most React Native projects:
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-native"
  }
}
```

**Note**: Enabling strict mode may require fixing existing code. Do incrementally.

### Step 9: Search and Fix Other `any` Types

Run audit:
```bash
# Find all 'any' usage
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" > any-audit.txt
grep -rn "as any" src/ --include="*.ts" --include="*.tsx" >> any-audit.txt

# Review each occurrence and replace with proper types
```

Common patterns to fix:

**Event handlers**:
```typescript
// ❌ Before
const handlePress = (e: any) => { ... }

// ✅ After
import { GestureResponderEvent } from 'react-native';
const handlePress = (e: GestureResponderEvent) => { ... }
```

**API responses**:
```typescript
// ❌ Before
const data: any = await response.json();

// ✅ After
interface ApiResponse {
  results: CityResult[];
}
const data: ApiResponse = await response.json();
```

**React refs**:
```typescript
// ❌ Before
const ref = useRef<any>(null);

// ✅ After
const ref = useRef<TextInput>(null);
```

## Testing Strategy

### Type Tests

**File**: `src/types/__tests__/modalStore.types.test.ts`

```typescript
/**
 * Type-level tests (compile-time checks)
 * These tests don't run, they just verify types compile correctly
 */

import { useModalStore, useModalData } from '../../store/useModalStore';

// ✅ Should allow valid modal data
const testValidData = () => {
  const { openAddLocation } = useModalStore.getState();

  openAddLocation({ suggestedQuery: 'Tokyo', source: 'settings' });
  openAddLocation({ suggestedQuery: 'Tokyo' });
  openAddLocation({ source: 'header' });
  openAddLocation();
};

// ❌ Should reject invalid modal data
const testInvalidData = () => {
  const { openAddLocation } = useModalStore.getState();

  // @ts-expect-error - invalid field
  openAddLocation({ invalidField: 'test' });

  // @ts-expect-error - wrong type
  openAddLocation({ suggestedQuery: 123 });

  // @ts-expect-error - invalid source value
  openAddLocation({ source: 'invalid' });
};

// ✅ Should narrow types correctly
const testTypeNarrowing = () => {
  const data = useModalData('addLocation');

  if (data) {
    // ✅ TypeScript knows these fields exist
    const query: string | undefined = data.suggestedQuery;
    const source: 'settings' | 'header' | 'empty-state' | undefined = data.source;

    // @ts-expect-error - field doesn't exist
    const invalid = data.invalidField;
  }
};
```

### Runtime Tests

**File**: `src/store/__tests__/useModalStore.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useModalStore } from '../useModalStore';

describe('useModalStore', () => {
  beforeEach(() => {
    // Reset store
    act(() => {
      useModalStore.getState().closeModal();
    });
  });

  it('should open add location with typed data', () => {
    const { result } = renderHook(() => useModalStore());

    act(() => {
      result.current.openAddLocation({
        suggestedQuery: 'Paris',
        source: 'settings'
      });
    });

    expect(result.current.activeModal).toBe('addLocation');
    expect(result.current.modalData).toEqual({
      suggestedQuery: 'Paris',
      source: 'settings',
    });
  });

  it('should handle modal data correctly', () => {
    const { result } = renderHook(() => useModalStore());

    act(() => {
      result.current.openSettings({ openToSection: 'language' });
    });

    expect(result.current.activeModal).toBe('settings');
    expect(result.current.modalData?.openToSection).toBe('language');
  });

  it('should clear data on close', () => {
    const { result } = renderHook(() => useModalStore());

    act(() => {
      result.current.openAddLocation({ suggestedQuery: 'Test' });
    });

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.activeModal).toBe(null);
    expect(result.current.modalData).toBeUndefined();
  });
});
```

## Benefits

### Compile-Time Safety
- Catch bugs before runtime
- Autocomplete for modal data fields
- Refactoring is safer (rename fields, TypeScript finds all usages)

### Developer Experience
- IntelliSense shows available fields
- Clear documentation of data shapes
- Self-documenting code

### Maintainability
- Easy to add new modal types
- Type errors guide you when making changes
- Less need for runtime checks

## Migration Strategy

### Phase 1: Modal Store (High Impact)
- Update `useModalStore.ts` with discriminated unions
- Add type-safe hooks
- Minimal breaking changes (data is optional)

### Phase 2: API Types (Medium Impact)
- Add runtime validation to geocoding
- Create type guards for API responses
- Strengthen existing interfaces

### Phase 3: Component Props (Low Impact)
- Replace `any` in event handlers
- Strengthen ref types
- Add generic constraints where needed

### Phase 4: Strict Mode (Optional)
- Enable strict TypeScript flags incrementally
- Fix violations one file at a time
- Add to CI to prevent regressions

## Success Criteria

- [ ] No `any` types in modal store
- [ ] Discriminated unions for modal data
- [ ] Type-safe hooks for modal data access
- [ ] Runtime validation for API responses
- [ ] All type tests pass
- [ ] No regression in functionality
- [ ] Better autocomplete in IDE

## Estimated Effort
**3-4 hours**
- 1 hour: Redesign modal store types
- 1 hour: Update component usage
- 1 hour: Add type guards and validation
- 30 min: Search and fix other `any` types
- 30 min: Write type tests

## Files to Create/Modify

**New Files**:
- `src/types/utils.ts`
- `src/types/__tests__/modalStore.types.test.ts`

**Modified Files**:
- `src/store/useModalStore.ts`
- `src/screens/AddLocationScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/components/LocationDropdown/LocationDropdown.tsx`
- `src/utils/geocoding.ts`
- `App.tsx`
- `tsconfig.json` (optional)

## Dependencies
None - uses TypeScript built-in features

## Backward Compatibility
- Fully backward compatible
- Modal data is optional, so existing code works
- Gradual adoption possible
