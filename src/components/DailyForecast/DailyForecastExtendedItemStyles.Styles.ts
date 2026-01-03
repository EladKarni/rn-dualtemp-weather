import { StyleSheet } from "react-native";
import { palette } from "../../Styles/Palette";

export const DailyForecastExtendedItemStyles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
  },
  containerRTL: {
    flexDirection: "row",
  },
  InfoSectionContainer: {
    flex: 1,
    marginRight: 10,
    maxWidth: 125,
  },
  InfoSectionTextUnit: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  InfoSectionTextRTL: {
    flexDirection: "row-reverse",
  },
  InfoSectionText: {
    color: palette.textColor,
    alignContent: "center",
    fontSize: 16,
  },
  InfoSectionTextLG: {
    color: palette.textColor,
    alignContent: "center",
    fontSize: 18,
  },
  infoFeelTitle: {
    color: palette.textColor,
    paddingVertical: 5,
    textAlign: "left",
    textDecorationLine: "underline",
    fontSize: 20,
  },
  infoFeelTitleRTL: {
    textAlign: "right",
  },
  infoFeelTime: {
    color: palette.textColor,
    textAlign: "left",
    alignContent: "center",
    fontSize: 14,
    lineHeight: 14,
  },
  tempContainer: {
    textAlignVertical: "bottom",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  horizontalText: {
    width: 60,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
