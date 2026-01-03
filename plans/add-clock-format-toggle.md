# Plan: Add 12/24-Hour Clock Format Toggle

## Goal
Add a toggle button in settings to switch between 12 and 24-hour clock formats with device auto-detection.

## Context & Current Architecture Analysis

### Existing Components Found:
- **Settings Store** (`useSettingsStore.ts`): Zustand with persist, stores `tempScale: "C" | "F"`
- **Settings Screen**: Modal with sections (Units, Language, Locations), uses `SettingItem` wrapper
- **TempUnitSelector**: Toggle button pattern with active state styling
- **Time Formatting**: `formatTime()` and `formatSunTime()` use moment `'LT'` format
- **Device Detection**: `fetchLocale.ts` already imports `uses24HourClock()` but doesn't use it
- **Time Display Locations**: `HourlyForecastItem.tsx`, `DailyForecastExpanded.tsx` (via new `SunInfo` component)

## Phase 1: Foundation Setup

### 1.1 Add Localization Keys
**Files**: `src/localization/{en,es,fr,he,ar,zh}.ts`

Add these keys to all language files:
```typescript
TimeFormat: "Time Format",
Format12Hour: "12 Hour", 
Format24Hour: "24 Hour",
AutoFormat: "Auto"
```

### 1.2 Update Settings Store
**File**: `src/store/useSettingsStore.ts`

```typescript
interface SettingsState {
  tempScale: "C" | "F";
  clockFormat: "12hour" | "24hour" | "auto";  // NEW
  setTempScale: (scale: "C" | "F") => void;
  setClockFormat: (format: "12hour" | "24hour" | "auto") => void;  // NEW
  isHydrated: boolean;
  setHydrated: () => void;
  getEffectiveClockFormat: () => "12hour" | "24hour";  // NEW
}

// Update persist config:
{
  name: "@settings_preferences",  // Rename from temp-only
  partialize: (state) => ({ 
    tempScale: state.tempScale, 
    clockFormat: state.clockFormat 
  }),
}
```

### 1.3 Create ClockFormatSelector Component
**Files**: 
- `src/components/ClockFormatSelector/ClockFormatSelector.tsx`
- `src/components/ClockFormatSelector/ClockFormatSelector.Styles.ts`

Copy `TempUnitSelector` pattern with 3 buttons:
```typescript
type ClockFormatOptions = "12hour" | "24hour" | "auto";

const ClockFormatSelector = () => {
  const clockFormat = useSettingsStore(state => state.clockFormat);
  const setClockFormat = useSettingsStore(state => state.setClockFormat);

  return (
    <View style={styles.container}>
      {/* 12 Hour Button */}
      <TouchableOpacity
        style={[styles.button, clockFormat === "12hour" && styles.buttonActive]}
        onPress={() => setClockFormat("12hour")}
      >
        <Text style={[styles.buttonText, clockFormat === "12hour" && styles.buttonTextActive]}>
          {i18n.t("Format12Hour")}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.divider} />
      
      {/* 24 Hour Button */}
      <TouchableOpacity
        style={[styles.button, clockFormat === "24hour" && styles.buttonActive]}
        onPress={() => setClockFormat("24hour")}
      >
        <Text style={[styles.buttonText, clockFormat === "24hour" && styles.buttonTextActive]}>
          {i18n.t("Format24Hour")}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.divider} />
      
      {/* Auto Button */}
      <TouchableOpacity
        style={[styles.button, clockFormat === "auto" && styles.buttonActive]}
        onPress={() => setClockFormat("auto")}
      >
        <Text style={[styles.buttonText, clockFormat === "auto" && styles.buttonTextActive]}>
          {i18n.t("AutoFormat")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Phase 2: Time Formatting Logic

### 2.1 Enhanced Date Formatting Utilities
**File**: `src/utils/dateFormatting.ts`

```typescript
import { uses24HourClock } from "react-native-localize";

// New helper function
const getTimeFormatString = (clockFormat?: "12hour" | "24hour" | "auto"): string => {
  switch (clockFormat) {
    case "12hour": return "h:mm A";
    case "24hour": return "HH:mm";
    case "auto":
    default:
      return uses24HourClock() ? "HH:mm" : "h:mm A";
  }
};

// Enhanced formatTime function
export const formatTime = (
  timestamp: number, 
  clockFormat?: "12hour" | "24hour" | "auto"
): string => {
  const format = getTimeFormatString(clockFormat);
  return safeMomentFormat(timestamp, format, '--:--').toUpperCase();
};

// Enhanced formatSunTime function
export const formatSunTime = (
  timestamp: number, 
  clockFormat?: "12hour" | "24hour" | "auto"
): string => {
  const format = getTimeFormatString(clockFormat);
  return safeMomentFormat(timestamp, format, '--:--');
};

// New reactive hook
export const useTimeFormatting = () => {
  const clockFormat = useSettingsStore(state => state.clockFormat);
  
  const formatTime = (timestamp: number): string => {
    return formatTime(timestamp, clockFormat);
  };
  
  const formatSunTime = (timestamp: number): string => {
    return formatSunTime(timestamp, clockFormat);
  };
  
  return { formatTime, formatSunTime };
};
```

### 2.2 Update Time Display Components
**File**: `src/components/HourlyForecast/HourlyForecastItem.tsx`

```typescript
// Add import
import { useTimeFormatting } from "../../utils/dateFormatting";

// Update component
const HourlyForecastItem = ({ dt, weather, temp, pop, wind_speed, percType }: HourlyForecastItemProps) => {
  const { formatTime } = useTimeFormatting();
  
  // ... rest of component
  
  return (
    <Card cardType={CardStyleTypes.HOURLY}>
      <View style={HourlyForecastItemStyles.HourlyItem}>
        <Text style={HourlyForecastItemStyles.HourText}>
          {formatTime(dt)}  // Use reactive formatTime
        </Text>
        {/* ... rest of component */}
      </View>
    </Card>
  );
};
```

**File**: `src/components/DailyForecast/SunInfo.tsx`

```typescript
// Add import
import { useTimeFormatting } from "../../utils/dateFormatting";

// Update component
const SunInfo = ({ time, type }: SunInfoProps) => {
  const { formatSunTime } = useTimeFormatting();
  const iconType = type === 'sunrise' ? '01d' : 'sunset';
  const translationKey = type.charAt(0).toUpperCase() + type.slice(1);
  
  return (
    <View style={DailyForecastExtendedItemStyles.InfoSectionTextUnit}>
      <WeatherIcon
        icon={displayWeatherIcon(iconType)}
        iconSize={IconSizeTypes.TINY}
      />
      <Text
        style={DailyForecastExtendedItemStyles.InfoSectionTextLG}
        allowFontScaling={false}
      >
        {i18n.t(translationKey)}
      </Text>
      <Text
        style={DailyForecastExtendedItemStyles.InfoSectionTextLG}
        allowFontScaling={false}
      >
        {formatSunTime(time)}  // Use reactive formatSunTime
      </Text>
    </View>
  );
};
```

## Phase 3: UI Integration

### 3.1 Update Settings Screen
**File**: `src/screens/SettingsScreen.tsx`

```typescript
// Add import
import { ClockFormatSelector } from "../components/ClockFormatSelector/ClockFormatSelector";

// Update Units section
<View style={styles.section}>
  <Text style={styles.sectionTitle}>{i18n.t("Units")}</Text>
  <SettingItem label={i18n.t("TemperatureUnit")}>
    <TempUnitSelector />
  </SettingItem>
  <SettingItem label={i18n.t("TimeFormat")}>  // NEW
    <ClockFormatSelector />                  // NEW
  </SettingItem>
</View>
```

## Phase 4: Implementation Strategy & Edge Cases

### 4.1 Device Auto-Detection Strategy
- Default `clockFormat` to `"auto"` in store
- Resolve format during formatting calls (not during hydration)
- Use `uses24HourClock()` from `react-native-localize` on-the-fly
- Keeps device preference always current if user changes system settings

### 4.2 Hydration Timing Solution
- Store only user preference (`"12hour"`, `"24hour"`, or `"auto"`)
- Don't resolve "auto" during store hydration
- Resolve format in `getTimeFormatString()` during each formatting call
- Prevents stale device preference and timing issues

### 4.3 Reactivity Implementation
- Use `useTimeFormatting()` hook in time-displaying components
- Hook automatically re-runs when `clockFormat` setting changes
- Components update without manual re-renders
- Leveraging Zustand's reactive selectors

### 4.4 Moment.js Format Strategy
- Current: `'LT'` (locale-dependent time)
- 12-hour: `'h:mm A'` (e.g., "3:30 PM")
- 24-hour: `'HH:mm'` (e.g., "15:30")
- Auto: Uses `uses24HourClock()` to determine format

## Phase 5: Testing & Validation

### 5.1 Test Scenarios
1. **First App Launch**: Default to "auto", shows device preference
2. **Manual Selection**: Toggle between 12/24/auto formats
3. **Persistence**: Settings survive app restart
4. **Reactivity**: Time displays update immediately when setting changes
5. **System Change**: If user changes device 12/24 setting, "auto" reflects it

### 5.2 Validation Steps
1. Test all three format options in settings
2. Verify time display in hourly forecast updates
3. Verify sunrise/sunset times in daily forecast update
4. Test app restart persistence
5. Test on devices with different system clock settings

## Critical Files Summary

**New Files:**
- `src/components/ClockFormatSelector/ClockFormatSelector.tsx`
- `src/components/ClockFormatSelector/ClockFormatSelector.Styles.ts`

**Modified Files:**
- `src/store/useSettingsStore.ts` - Add clock format state
- `src/screens/SettingsScreen.tsx` - Add ClockFormatSelector to Units section
- `src/utils/dateFormatting.ts` - Enhanced format functions + useTimeFormatting hook
- `src/components/HourlyForecast/HourlyForecastItem.tsx` - Use reactive formatting
- `src/components/DailyForecast/SunInfo.tsx` - Use reactive formatting
- `src/localization/{en,es,fr,he,ar,zh}.ts` - Add time format translation keys

## Implementation Trade-offs & Decisions

**Resolved: Auto-format resolution timing**
- **Chosen**: Resolve during formatting calls (not during hydration)
- **Benefits**: Always current device preference, no timing issues
- **Cost**: Minimal performance impact (negligible)

**Resolved: Component structure**  
- **Chosen**: Follow TempUnitSelector pattern exactly
- **Benefits**: Consistency, maintainability, reuse existing styling

**Resolved: Reactivity approach**
- **Chosen**: useTimeFormatting hook with Zustand selectors
- **Benefits**: Automatic updates, minimal component changes

This plan maintains architectural consistency while adding robust clock format functionality with auto-detection and reactive updates.