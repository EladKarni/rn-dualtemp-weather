import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSettingsStore } from "../../store/useSettingsStore";
import { i18n } from "../../localization/i18n";
import { styles } from "./ClockFormatSelector.Styles";

export const ClockFormatSelector = () => {
  const clockFormat = useSettingsStore((state) => state.clockFormat);
  const setClockFormat = useSettingsStore((state) => state.setClockFormat);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, clockFormat === "12hour" && styles.buttonActive]}
        onPress={() => setClockFormat("12hour")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            clockFormat === "12hour" && styles.buttonTextActive,
          ]}
        >
          {i18n.t("Format12Hour")}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.button, clockFormat === "24hour" && styles.buttonActive]}
        onPress={() => setClockFormat("24hour")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            clockFormat === "24hour" && styles.buttonTextActive,
          ]}
        >
          {i18n.t("Format24Hour")}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.button, clockFormat === "auto" && styles.buttonActive]}
        onPress={() => setClockFormat("auto")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            clockFormat === "auto" && styles.buttonTextActive,
          ]}
        >
          {i18n.t("AutoFormat")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
