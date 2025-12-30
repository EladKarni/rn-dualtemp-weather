import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSettingsStore } from "../../store/useSettingsStore";
import { i18n } from "../../localization/i18n";
import { styles } from "./TempUnitSelector.Styles";

export const TempUnitSelector = () => {
  const tempScale = useSettingsStore((state) => state.tempScale);
  const setTempScale = useSettingsStore((state) => state.setTempScale);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, tempScale === "C" && styles.buttonActive]}
        onPress={() => setTempScale("C")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            tempScale === "C" && styles.buttonTextActive,
          ]}
        >
          {i18n.t("Celsius")} (°C)
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.button, tempScale === "F" && styles.buttonActive]}
        onPress={() => setTempScale("F")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            tempScale === "F" && styles.buttonTextActive,
          ]}
        >
          {i18n.t("Fahrenheit")} (°F)
        </Text>
      </TouchableOpacity>
    </View>
  );
};
