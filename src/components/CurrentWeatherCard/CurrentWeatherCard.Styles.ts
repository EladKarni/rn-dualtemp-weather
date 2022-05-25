import { StyleSheet } from 'react-native';

export const CurrentWeatherStyles = StyleSheet.create({
  mainArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempArea: {
    textAlign: 'right',
    flexDirection: "column",
    alignContent: "flex-end",
  },
  tempLastLetterC: {
    fontSize: 60/2,
    textAlignVertical: 'top',
    paddingHorizontal: 2,
  },
  tempLastLetterF: {
    fontSize: 30/2,
    textAlignVertical: 'top',
    paddingHorizontal: 2,
  },
});