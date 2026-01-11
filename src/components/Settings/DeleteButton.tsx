import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { styles } from "./DeleteButton.styles";

interface DeleteButtonProps {
  onPress: () => void;
  size?: "small" | "medium" | "large";
  style?: any;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  onPress,
  size = "medium",
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.deleteButton, styles[`deleteButton_${size}`], style]}
      onPress={onPress}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      activeOpacity={0.7}
    >
      <View style={styles.deleteIcon}>
        <Text style={[styles.deleteIconText, styles[`deleteIconText_${size}`]]}>
          ✕
        </Text>
      </View>
    </TouchableOpacity>
  );
};
