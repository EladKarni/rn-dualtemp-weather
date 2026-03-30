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
    minWidth: 90,
    height: 170,
    paddingVertical: 12,
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
