import { StyleSheet, Platform } from "react-native";
import { palette } from "../../styles/Palette";

const webShadow = (radius: number) =>
  Platform.OS === 'web' ? { boxShadow: `0px 4px ${radius}px rgba(113, 94, 245, 0.31)` } : {};

export const CardStyles = StyleSheet.create({
  card: {
    justifyContent: "space-between",
    marginBottom: 25,
    shadowColor: palette.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.31,
    shadowRadius: 30,
    elevation: 10,
    ...webShadow(30),
  },
  cardMain: {
    borderRadius: 26,
    marginHorizontal: 20,
    padding: 18,
  },
  cardHourly: {
    justifyContent: "space-between",
    // A fixed width, not a minimum. As a minimum the card grew to whatever the
    // time string needed, so a long meridiem had nothing to wrap against and
    // ran outside the card — "1:00 לפנות בוקר" spilled past the rounded edge.
    // With a real width the text engine decides per string and per locale with
    // no branching here: "3:00 AM" stays beside the hour, "3:00 לפנה״צ" wraps
    // to a second line. Wide enough for the longest English time and the
    // "12 km/h" wind row, narrow enough that a Hebrew meridiem wraps.
    width: 92,
    // Sized for the two-line case so a wrap has somewhere to go. The one-line
    // case simply distributes the slack, since the column is space-between.
    height: 196,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 32,
    margin: 7.5,
    shadowRadius: 15,
    ...webShadow(15),
  },
  cardDaily: {
    height: 50,
    paddingVertical: 7.5,
    borderRadius: 15,
    marginVertical: 7.5,
    shadowRadius: 10,
    ...webShadow(10),
  },
  cardDailyExpanded: {
    paddingVertical: 7.5,
    borderRadius: 15,
    marginVertical: 7.5,
    shadowRadius: 10,
    ...webShadow(10),
  },
});
