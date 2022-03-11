import { StyleSheet } from 'react-native';
import { headerText } from '../../Styles/Typography'

export const cardHeaderStyles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  todayText: {
    ...headerText,
    fontSize: 22,
  },
  dateText: {
    ...headerText,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
  },
});