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
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.container}>
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
