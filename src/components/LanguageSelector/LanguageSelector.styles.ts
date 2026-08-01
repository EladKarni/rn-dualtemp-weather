import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";

export const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.primaryLight,
    backgroundColor: "transparent",
  },
  // The list rows already mirrored; the button above them did not.
  dropdownButtonRTL: {
    flexDirection: "row-reverse",
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textColor,
    flex: 1,
  },
  // flex: 1 makes this fill the row, so it needs telling which end to sit at.
  dropdownButtonTextRTL: {
    textAlign: "right",
  },
  dropdownArrow: {
    fontSize: 12,
    color: palette.highlightColor,
    marginLeft: 8,
  },
  // The gap belongs between the arrow and the label, which is now on the other
  // side; left unreset it would push the arrow off the row's edge instead.
  dropdownArrowRTL: {
    marginLeft: 0,
    marginRight: 8,
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.primaryLight,
    overflow: "hidden",
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: palette.primaryLight,
  },
  selectedOption: {
    backgroundColor: palette.primaryLight,
  },
  languageInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageInfoRTL: {
    flexDirection: "row-reverse",
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "bold",
    color: palette.textColor,
    marginRight: 12,
    width: 20,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textColor,
  },
  lastOption: {
    borderBottomWidth: 0,
  },
});
