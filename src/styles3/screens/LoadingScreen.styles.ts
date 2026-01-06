import { StyleSheet } from "react-native";
import { palette } from "../Palette";

export const loadingScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryDark,
  },
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: palette.textColor,
    marginBottom: 8,
    textAlign: "center",
  },
  loadingMessage: {
    fontSize: 14,
    color: palette.highlightColor,
    textAlign: "center",
  },
});
