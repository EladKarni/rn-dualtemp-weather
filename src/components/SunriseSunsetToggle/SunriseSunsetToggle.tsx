import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSettingsStore } from "../../store/useSettingsStore";
import { i18n } from "../../localization/i18n";
import { styles } from "./SunriseSunsetToggle.Styles";

export const SunriseSunsetToggle = () => {
  const showSunriseSunset = useSettingsStore((state) => state.showSunriseSunset);
  const setShowSunriseSunset = useSettingsStore((state) => state.setShowSunriseSunset);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, showSunriseSunset && styles.buttonActive]}
        onPress={() => setShowSunriseSunset(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            showSunriseSunset && styles.buttonTextActive,
          ]}
        >
          {i18n.t("Show")}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.button, !showSunriseSunset && styles.buttonActive]}
        onPress={() => setShowSunriseSunset(false)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            !showSunriseSunset && styles.buttonTextActive,
          ]}
        >
          {i18n.t("Hide")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};