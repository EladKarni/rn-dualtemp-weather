import React, { ReactNode } from "react";
import { View, Text } from "react-native";
import { styles } from "./SettingItem.Styles";

type SettingItemProps = {
  label: string;
  children: ReactNode;
};

const SettingItem = ({ label, children }: SettingItemProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
};

export default SettingItem;
