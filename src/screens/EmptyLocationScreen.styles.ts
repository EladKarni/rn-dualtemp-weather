import { StyleSheet } from "react-native";
import { palette } from "../styles/Palette";
import { spacing } from "../styles/Spacing";

export const emptyLocationScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryDark,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  title: {
    color: palette.textColor,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    color: palette.highlightColor,
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.xxl,
  },
  addButton: {
    backgroundColor: palette.primaryLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: 12,
  },
  addButtonText: {
    color: palette.textColor,
    fontSize: 16,
    fontWeight: "600",
  },
});
