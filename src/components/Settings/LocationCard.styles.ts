import { StyleSheet } from 'react-native';
import { palette } from '../../Styles/Palette';
import { spacing } from '../../Styles/Spacing';
import { shadowProp } from '../../Styles/BoxShadow';

export const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    ...shadowProp,
  },
  gradientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    minHeight: 64,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textColor,
    letterSpacing: 0.2,
  },
  locationSubtitle: {
    fontSize: 12,
    color: palette.textColorSecondary,
    marginTop: spacing.xs / 2,
    opacity: 0.8,
  },
});