import { StyleSheet } from "react-native";
import { palette } from "../styles/Palette";

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: palette.primaryDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: "50%",
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.primaryLight,
  },
  /**
   * This app mirrors BY HAND, and that only works because native RTL is turned
   * off: `extra.supportsRTL` and `ios.infoPlist.ExpoLocalization_supportsRTL`
   * are both false in app.json, so React Native lays out left-to-right whatever
   * the device language and each component opts into mirroring itself.
   *
   * Do not flip those flags back on. With native RTL active, `row` already
   * renders right-to-left, so this `row-reverse` flips the row BACK to LTR
   * while RN independently swaps every directional margin and offset — the app
   * ends up double-mirrored, with Hebrew headings clipped off the screen edge.
   * Grepping for I18nManager is not enough to rule this out: expo-localization
   * sets it natively from those app.json keys, so the JS can be clean while the
   * shipped binary is RTL.
   */
  headerRTL: {
    flexDirection: "row-reverse",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.textColor,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
    color: palette.textColor,
    fontWeight: "300",
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.highlightColor,
    paddingHorizontal: 20,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  /**
   * Explicit rather than relying on `textAlign: "auto"`. Auto resolves against
   * the app's layout direction, which stays LTR here because forceRTL is never
   * called — so Hebrew headings sit on the left until told otherwise.
   *
   * The tracking is also dropped. Arabic is cursive: its letters join, and
   * positive letterSpacing pulls them apart, stretching or breaking the
   * connecting strokes so a heading reads as coming unstitched. Hebrew does not
   * join and is unharmed either way, so zeroing it for both RTL scripts costs
   * nothing and fixes Arabic.
   */
  textRTL: {
    textAlign: "right",
    letterSpacing: 0,
  },
});
