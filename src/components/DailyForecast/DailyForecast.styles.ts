import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";

export const DailyForecastStyles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
  },
});

export const DailyForecastItemStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
  },
  dailyItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dailyItemHeaderRTL: {
    flexDirection: "row-reverse",
  },
  dailyItemExpanded: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  dayText: {
    color: palette.textColor,
    textAlign: "center",
    alignContent: "center",
    fontSize: 18,
  },
  popText: {
    color: palette.textColor,
    textAlign: "center",
    alignContent: "center",
    fontSize: 18,
    marginRight: 10,
  },
  tempIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tempIconContainerRTL: {
    flexDirection: "row-reverse",
  },
  /**
   * Fixed-width columns, so the rows line up down the list.
   *
   * Every column here used to be content-sized inside a right-anchored group,
   * which meant each row placed its own columns wherever its own text happened
   * to end: a one-digit "6%" pulled the temperatures right of every other row,
   * and a shorter reading did it again. Sizing each column for its widest
   * content makes the position depend on the column rather than on the day.
   *
   * Widths are for the worst realistic case — "💧 100%" and a sub-zero dual
   * reading like "-29°C | -20°F" — not for the values that happen to be on
   * screen today.
   */
  popColumn: {
    width: 60,
    // Pinned to the leading edge rather than centred. Centring still let the
    // droplet drift, because a narrower "6%" centres its whole group and takes
    // the icon with it; anchoring the group puts every droplet on one line and
    // moves the slack to the gap before the temperatures, which is padding.
    alignItems: "flex-start",
  },
  popColumnRTL: {
    alignItems: "flex-end",
  },
  tempContainer: {
    flexDirection: "row",
    height: 17.5,
    paddingHorizontal: 10,
    width: 112,
    justifyContent: "center",
  },
  tempDivider: {
    fontStyle: "italic",
    lineHeight: 17.5,
    color: palette.textColor,
  },
  tempDividerXL: {
    fontStyle: "italic",
    lineHeight: 14,
    color: palette.textColor,
  },
  descriptionText: {
    color: palette.textColor,
    textTransform: "capitalize",
    fontSize: 12,
  },
  rainChancesText: {
    color: palette.textColor,
    fontSize: 12,
  },
  expandedTempAreaContainer: {
    height: "100%",
    justifyContent: "space-between",
  },
  sideBySideTempContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  sideBySideTempText: {
    color: palette.textColor,
    paddingRight: 5,
  },
  sunCycleContainer: {
    justifyContent: "flex-start",
  },
  sunCycleText: {
    color: palette.textColor,
    fontSize: 16,
  },
  dividerLine: {
    borderBottomColor: palette.textColor,
    borderBottomWidth: 1,
    paddingVertical: 2,
    marginHorizontal: 15,
  },
});
