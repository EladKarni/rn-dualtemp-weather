import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: palette.primaryDark,
  },
  label: {
    fontSize: 16,
    color: palette.textColor,
    marginBottom: 12,
    fontWeight: "500",
  },
});
