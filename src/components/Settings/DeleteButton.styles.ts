import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";

export const styles = StyleSheet.create({
  deleteButton: {
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton_small: {
    width: 28,
    height: 28,
  },
  deleteButton_medium: {
    width: 32,
    height: 32,
  },
  deleteButton_large: {
    width: 36,
    height: 36,
  },
  deleteIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconText: {
    fontWeight: "300",
    color: palette.textColor,
    textAlign: "center",
  },
  deleteIconText_small: {
    fontSize: 16,
    lineHeight: 18,
  },
  deleteIconText_medium: {
    fontSize: 18,
    lineHeight: 20,
  },
  deleteIconText_large: {
    fontSize: 20,
    lineHeight: 22,
  },
});
