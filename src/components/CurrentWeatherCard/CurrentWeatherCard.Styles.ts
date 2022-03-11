import { StyleSheet } from 'react-native';
import { headerText } from '../../Styles/Typography';

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
  tempC: {
    ...headerText,
    fontSize: 60,
    lineHeight: 78,
    textAlign: "right",
  },
  tempF: {
    ...headerText,
    fontSize: 30,
    lineHeight: 39,
    textAlign: "right",
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