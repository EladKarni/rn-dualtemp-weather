import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";

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
  HourText: {
    color: palette.textColor,
    textAlign: "center",
  },
  /**
   * The time reads "3:00 AM" in English and "3:00 בלילה" in Hebrew, and the
   * meridiem's width varies enough between locales that no single layout suits
   * both. The card's fixed width lets the text engine decide per string: a
   * short meridiem stays beside the hour, a long one wraps to a second line.
   *
   * The vertical margin is what makes the wrap land cleanly — it reserves the
   * second line's room whether or not a given string uses it, so the columns
   * keep a shared rhythm instead of the icons shifting row to row.
   */
  HourTimeText: {
    color: palette.textColor,
    textAlign: "center",
    marginVertical: 4,
  },
  HourWindInfo: {
    display: "flex",
    flexDirection: "row",
    marginHorizontal: "auto",
    justifyContent: "center",
    gap: 3,
  },
});
