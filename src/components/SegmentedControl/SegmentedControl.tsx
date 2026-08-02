import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./SegmentedControl.styles";

export interface SegmentOption<T> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T> {
  /** The selectable segments, rendered left-to-right with dividers between. */
  options: SegmentOption<T>[];
  /** The currently-selected value (compared with `===`). */
  value: T;
  /** Called with the pressed segment's value. */
  onChange: (value: T) => void;
  /**
   * Optional side effect run after `onChange` (e.g. TempUnitSelector needs to
   * push the new unit to the home-screen widgets via updateAllWeatherWidgets()).
   * Awaited so async side effects complete before the press handler resolves.
   */
  onAfterChange?: (value: T) => void | Promise<void>;
  /**
   * Lay the segments out right-to-left, putting `options[0]` at the right.
   * Callers pass their RTL flag here.
   *
   * Taken as a prop rather than read from the language store so this stays a
   * pure presentational component — its test asserts exactly that by needing no
   * module mocks, and a store import would drag AsyncStorage into it.
   */
  reversed?: boolean;
}

/**
 * Generic single-select segmented control. Replaces the byte-identical bodies of
 * ClockFormatSelector / TempUnitSelector / SunriseSunsetToggle.
 */
export function SegmentedControl<T>({
  options,
  value,
  onChange,
  onAfterChange,
  reversed = false,
}: SegmentedControlProps<T>) {
  return (
    // Flipped with row-reverse rather than by reversing the options array: the
    // array order is the control's semantic order, and the rounded ends come
    // from this container's own borderRadius + overflow rather than from
    // per-segment corners, so changing direction cannot leave a square end cap.
    <View style={[styles.container, reversed && styles.containerRTL]}>
      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <React.Fragment key={String(option.value)}>
            {index > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              style={[styles.button, isActive && styles.buttonActive]}
              onPress={async () => {
                onChange(option.value);
                await onAfterChange?.(option.value);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  isActive && styles.buttonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default SegmentedControl;
