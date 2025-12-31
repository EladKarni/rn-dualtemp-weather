import { StyleSheet } from "react-native";
import { palette } from "../../Styles/Palette";

export const styles = StyleSheet.create({
  container: {
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
