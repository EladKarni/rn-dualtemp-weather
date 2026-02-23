import { StyleSheet } from "react-native";
import { palette } from "../../styles/Palette";

export const CardStyles = StyleSheet.create({
  card: {
    justifyContent: "space-between",
    marginBottom: 25,
    shadowColor: palette.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.31,
    shadowRadius: 30,
    elevation: 10,
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
  },
  cardDaily: {
    display: "flex",
    justifyContent: "center",
    height: 75,
    paddingVertical: 7.5,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginVertical: 7.5,
    shadowRadius: 10,
    overflow: "hidden",
  },
  cardDailyExpanded: {
    paddingVertical: 7.5,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginVertical: 7.5,
    shadowRadius: 10,
    overflow: "hidden",
  },
});
