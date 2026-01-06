import { StyleSheet } from 'react-native';
import { palette } from './Palette';

export const typography = StyleSheet.create({
  headerText: {
    fontFamily: 'DMSans_500Medium',
    lineHeight: 29,
    color: palette.textColor,
  },
  footerText: {
    fontFamily: 'DMSans_500Medium',
    lineHeight: 22,
    color: palette.textColorSecondary,
  }
})