import { StyleSheet } from "react-native";
import { palette } from "../../Styles/Palette";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.primaryLight,
    overflow: "hidden",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  buttonActive: {
    backgroundColor: palette.primaryLight,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textColor,
  },
  buttonTextActive: {
    color: palette.textColor,
  },
  divider: {
    width: 2,
    backgroundColor: palette.primaryLight,
  },
});