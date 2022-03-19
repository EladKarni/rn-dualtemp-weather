import { StyleSheet } from 'react-native';
import { headerText } from '../../Styles/Typography'

export const CardFooterStyles = StyleSheet.create({
  cardFooter: {
    marginVertical: 5,
    flexDirection: "row"
  },
  footerText: {
    ...headerText,
    fontSize: 14,
  },
  locationIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  }
});