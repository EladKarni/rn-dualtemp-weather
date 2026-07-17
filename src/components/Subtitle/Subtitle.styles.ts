import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";

export const SubTitleStyles = StyleSheet.create({
  subtitle: {
    fontSize: 24,
    marginVertical: 12,
    color: palette.textColor,
    textAlign: "left",
  },
  subtitleRTL: {
    textAlign: "right",
  },
});
