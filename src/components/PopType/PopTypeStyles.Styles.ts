import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";

export const PopTypeStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 2,
  },
  PopStyles: {
    color: palette.textColor,
    fontSize: 12,
    textAlign: "center",
  },
  amountStyles: {
    color: palette.textColor,
    textAlign: "center",
    fontSize: 10,
  },
});
