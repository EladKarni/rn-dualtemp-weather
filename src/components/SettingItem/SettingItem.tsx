import React, { ReactNode } from "react";
import { View, Text } from "react-native";
import { useLanguageStore } from "../../store/useLanguageStore";
import { styles } from "./SettingItem.styles";

type SettingItemProps = {
  label: string;
  children: ReactNode;
};

const SettingItem = ({ label, children }: SettingItemProps) => {
  const isRTL = useLanguageStore((state) => state.isRTL);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, isRTL && styles.labelRTL]}>{label}</Text>
      {children}
    </View>
  );
};

export default SettingItem;
