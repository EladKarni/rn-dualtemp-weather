import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";
import { spacing } from "../../styles/Spacing";
import { shadowProp } from "../../styles/BoxShadow";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  locationsContainer: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  addLocationButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.highlightColor,
    ...shadowProp,
  },
  addLocationButtonDisabled: {
    opacity: 0.6,
  },
  addLocationButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    borderRadius: 16,
  },
  addLocationButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.primaryColor,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  addLocationButtonTextDisabled: {
    color: palette.textColorSecondary,
  },
});
