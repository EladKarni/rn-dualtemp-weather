import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";
import { spacing } from "../../styles/Spacing";

export const HourlyForecastStyles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
  },
});

export const HourlyForecastItemStyles = StyleSheet.create({
  HourlyItem: {
    justifyContent: "space-between",
    height: "100%",
    alignContent: "center",
  },
  HourlyItemExpanded: {
    flexDirection: "row",
    height: "100%",
  },
  HourlyItemExpandedRTL: {
    flexDirection: "row-reverse",
  },
  HourlyItemLeft: {
    width: 66,
    justifyContent: "space-between",
    height: "100%",
    alignItems: "center",
  },
  HourText: {
    color: palette.textColor,
    textAlign: "center",
  },
  HourWindInfo: {
    display: "flex",
    flexDirection: "row",
    marginHorizontal: "auto",
    justifyContent: "center",
    gap: 3,
  },
});

export const HourlyExpandedStyles = StyleSheet.create({
  container: {
    justifyContent: "center",
    paddingLeft: spacing.md,
    gap: spacing.sm,
  },
  containerRTL: {
    paddingLeft: 0,
    paddingRight: spacing.md,
  },
  label: {
    color: palette.textColorSecondary,
    fontSize: 11,
    textAlign: "center",
  },
  value: {
    color: palette.textColor,
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    textAlign: "center",
  },
  infoRow: {
    alignItems: "center",
    gap: 2,
  },
  windRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 3,
  },
});
