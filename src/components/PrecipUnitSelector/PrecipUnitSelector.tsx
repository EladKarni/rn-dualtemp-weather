import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSettingsStore } from "../../store/useSettingsStore";
import { i18n } from "../../localization/i18n";
import { styles } from "./PrecipUnitSelector.Styles";

export const PrecipUnitSelector = () => {
  const precipUnit = useSettingsStore((state) => state.precipUnit);
  const setPrecipUnit = useSettingsStore((state) => state.setPrecipUnit);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, precipUnit === "auto" && styles.buttonActive]}
        onPress={() => setPrecipUnit("auto")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            precipUnit === "auto" && styles.buttonTextActive,
          ]}
        >
          {i18n.t("Auto")}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.button, precipUnit === "mm" && styles.buttonActive]}
        onPress={() => setPrecipUnit("mm")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            precipUnit === "mm" && styles.buttonTextActive,
          ]}
        >
          mm
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.button, precipUnit === "in" && styles.buttonActive]}
        onPress={() => setPrecipUnit("in")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            precipUnit === "in" && styles.buttonTextActive,
          ]}
        >
          in
        </Text>
      </TouchableOpacity>
    </View>
  );
};
