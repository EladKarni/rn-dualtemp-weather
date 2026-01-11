import { StyleSheet } from "react-native";
import { palette } from "../Palette";

export const errorScreenStyles = StyleSheet.create({
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
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.textColor,
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: palette.highlightColor,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: palette.primaryColor,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: palette.textColor,
    fontSize: 16,
    fontWeight: "600",
  },
  supportText: {
    fontSize: 12,
    color: palette.highlightColor,
    textAlign: "center",
    marginTop: 32,
    opacity: 0.7,
  },
  supportEmail: {
    color: palette.primaryColor,
    fontWeight: "500",
  },
});
