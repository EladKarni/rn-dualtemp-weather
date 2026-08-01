import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.primaryLight,
    overflow: "hidden",
  },
  // Puts the first segment at the reading edge in Hebrew and Arabic. Safe to
  // flip because the rounded ends belong to this container, not to the end
  // segments, and the dividers sit between children either way.
  containerRTL: {
    flexDirection: "row-reverse",
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
