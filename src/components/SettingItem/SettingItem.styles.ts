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
  // The label stretches the row's full width, so without this it stays pinned
  // left in Hebrew — `textAlign: "auto"` follows the app's layout direction,
  // which is LTR because native RTL is disabled in app.json (`supportsRTL` /
  // `ExpoLocalization_supportsRTL`). See SettingsScreen.styles.ts for why those
  // must stay false.
  labelRTL: {
    textAlign: "right",
  },
});
