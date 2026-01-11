import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSettingsStore } from "../../store/useSettingsStore";
import { i18n } from "../../localization/i18n";
import { styles } from "./TempUnitSelector.Styles";
import { updateAllWeatherWidgets } from "../../utils/widgetUpdater";

export const TempUnitSelector = () => {
  const tempScale = useSettingsStore((state) => state.tempScale);
  const setTempScale = useSettingsStore((state) => state.setTempScale);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, tempScale === "C" && styles.buttonActive]}
        onPress={async () => {
          setTempScale("C");
          await updateAllWeatherWidgets();
        }}
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
        onPress={async () => {
          setTempScale("F");
          await updateAllWeatherWidgets();
        }}
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
