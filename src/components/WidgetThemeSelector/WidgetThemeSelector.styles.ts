import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";
import { spacing } from "../../styles/Spacing";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: spacing.sm,
    // The presets are all dark and the settings sheet is primaryDark — which is
    // exactly the indigo preset, so without a lighter well behind the row that
    // swatch renders invisible and the default option looks like an empty ring.
    // A translucent white lift keeps the strip subtle while separating every
    // swatch from the sheet.
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 24,
  },
  /**
   * Both properties are needed, and they fight each other if only one changes.
   * The LTR row is `row` + `flex-end`, which packs the swatches against the
   * right. Under `row-reverse` the main axis runs right-to-left, so `flex-end`
   * would pack them against the LEFT — the opposite of the reading edge. Moving
   * to `flex-start` keeps them packed right while the first preset now sits
   * rightmost, which is where a Hebrew reader starts.
   */
  containerRTL: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
  },
  // The tap target is deliberately larger than the swatch it draws, so six of
  // them stay comfortably tappable on a phone-width settings row.
  swatchTarget: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  swatchTargetActive: {
    borderWidth: 2,
    borderColor: palette.highlightColor,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    // The presets are all dark; without an outline they'd read as one blob
    // against the settings sheet.
    borderWidth: 1,
    borderColor: palette.primaryLight,
  },
});
